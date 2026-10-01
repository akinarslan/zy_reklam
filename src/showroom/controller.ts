import type { ShowroomRenderer } from './renderer';
export function setupShowroom():()=>void {
  const stage=document.querySelector<HTMLElement>('[data-showroom-stage]'),mount=document.querySelector<HTMLElement>('[data-showroom-mount]');if(!stage||!mount)return()=>{};
  let instance:ShowroomRenderer|undefined,near=false,loading=false,failed=false,destroyed=false;const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let responseTimer:ReturnType<typeof setTimeout>|undefined;
  const reduced=()=>document.documentElement.dataset.motion==='reduced'||(!document.documentElement.dataset.motion&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const active=()=>{const r=stage.getBoundingClientRect();const hero=document.querySelector('[data-hero-stage]')?.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&!document.hidden&&!(hero&&hero.bottom>0&&hero.top<innerHeight);};
  const fallback=()=>{failed=true;clearTimeout(timer);instance?.dispose();instance=undefined;stage.dataset.state='fallback';};
  async function load(){if(loading||instance||failed||destroyed||!near||document.hidden)return;loading=true;stage!.dataset.state='loading';timer=setTimeout(fallback,10000);
    try{const [module,response]=await Promise.all([import('./renderer'),fetch('/assets/showroom/letter-outlines.json',{signal:abort.signal})]);if(!response.ok)throw Error('outlines');const outlines=await response.json();if(destroyed||failed)return;instance=module.createShowroomRenderer(stage!,mount!,outlines,fallback);instance.setReduced(reduced());instance.setVisible(active());stage!.dataset.state='ready';}
    catch{if(!destroyed)fallback();}finally{clearTimeout(timer);loading=false;}}
  function sync(){if(destroyed)return;instance?.setReduced(reduced());instance?.setVisible(active());if(near)void load();}
  const observer=new IntersectionObserver(e=>{near=e.some(x=>x.isIntersecting);sync();},{rootMargin:'180px 0px'});observer.observe(stage);
  window.addEventListener('scroll',sync,{passive:true,signal:abort.signal});window.addEventListener('resize',sync,{signal:abort.signal});window.addEventListener('zy:motion',sync,{signal:abort.signal});document.addEventListener('visibilitychange',sync,{signal:abort.signal});
  const buttons=document.querySelectorAll<HTMLButtonElement>('[data-showroom-select]');buttons.forEach(button=>{const select=()=>{instance?.select(button.dataset.showroomSelect??null);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};button.addEventListener('focus',select,{signal:abort.signal});button.addEventListener('pointerdown',select,{signal:abort.signal});button.addEventListener('click',()=>{select();clearTimeout(responseTimer);responseTimer=setTimeout(()=>{instance?.select(null);buttons.forEach(b=>b.setAttribute('aria-pressed','false'));},1000);},{signal:abort.signal});button.addEventListener('blur',()=>{instance?.select(null);button.setAttribute('aria-pressed','false');},{signal:abort.signal});});
  window.addEventListener('pageshow',sync,{signal:abort.signal});window.addEventListener('pagehide',()=>instance?.setVisible(false),{signal:abort.signal});
  return()=>{destroyed=true;abort.abort();clearTimeout(timer);clearTimeout(responseTimer);observer.disconnect();instance?.dispose();};
}
