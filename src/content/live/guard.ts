export function interactionGuard(onSafe:()=>void) {
  const abort=new AbortController(),options={signal:abort.signal,capture:true};
  const pointers=new Set<number>();
  const dirty=new Set<HTMLFormElement>();
  let lastActivity=0,timer:ReturnType<typeof setTimeout>|undefined;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(onSafe,800);};
  const scene=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('[data-scene], .sign-stage, .showroom-stage-wrapper, [data-showroom]');
  document.addEventListener('pointerdown',event=>{if(scene(event.target))pointers.add(event.pointerId);lastActivity=Date.now();},options);
  for(const type of ['pointerup','pointercancel'] as const)document.addEventListener(type,event=>{pointers.delete(event.pointerId);lastActivity=Date.now();schedule();},options);
  document.addEventListener('pointermove',event=>{if(scene(event.target)){lastActivity=Date.now();schedule();}},options);
  document.addEventListener('keydown',event=>{if(scene(event.target)){lastActivity=Date.now();schedule();}},options);
  document.addEventListener('input',event=>{if(event.target instanceof HTMLElement){const form=event.target.closest('form');if(form)dirty.add(form);}lastActivity=Date.now();},options);
  // Unsaved forms stay protected after blur. Reset or an explicit form submit
  // releases the dirty lock; focus remains a separate guard.
  for(const type of ['reset','submit'] as const)document.addEventListener(type,event=>{if(event.target instanceof HTMLFormElement)dirty.delete(event.target);schedule();},options);
  for(const type of ['focusout','toggle','close','click','ended','pause','scroll'])document.addEventListener(type,()=>{lastActivity=Date.now();schedule();},options);
  return {
    busy:()=>pointers.size>0||dirty.size>0||Date.now()-lastActivity<750
      || document.activeElement instanceof HTMLElement&&!!document.activeElement.closest('form, .showroom-stage-wrapper, .sign-stage')
      || !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], #main-nav[data-open="true"], .header details[open]')
      || [...document.querySelectorAll('video')].some(video=>!video.paused&&!video.ended),
    cleanup:()=>{abort.abort();clearTimeout(timer);}
  };
}
