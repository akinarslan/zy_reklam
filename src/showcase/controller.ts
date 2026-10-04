/** Photographic lightbox and explicit-load real Nissan viewer. */
export function setupShowcase():()=>void {
  const lightbox=document.querySelector<HTMLElement>('[data-real-lightbox]');
  const button=document.querySelector<HTMLButtonElement>('[data-box-light]');
  if(!lightbox||!button)return()=>{};
  const abort=new AbortController();
  let pinned=false,hovered=false,focused=false;
  const sync=()=>{const lit=pinned||hovered||focused;lightbox.dataset.lit=String(lit);button.setAttribute('aria-pressed',String(pinned));button.textContent=pinned?'Işığı kapat':'Işığı aç';};
  lightbox.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}},{signal:abort.signal});
  lightbox.addEventListener('pointerleave',()=>{hovered=false;sync();},{signal:abort.signal});
  button.addEventListener('focus',()=>{focused=true;sync();},{signal:abort.signal});
  button.addEventListener('blur',()=>{focused=false;sync();},{signal:abort.signal});
  button.addEventListener('click',()=>{pinned=!pinned;sync();},{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hovered=false;focused=false;sync();}},{signal:abort.signal});
  const stage=document.querySelector<HTMLElement>('[data-vehicle-stage]'),load=document.querySelector<HTMLButtonElement>('[data-vehicle-load]');
  let vehicle:{setVisible(v:boolean):void;dispose():void}|undefined,closed=false;
  const observer=new IntersectionObserver(entries=>vehicle?.setVisible(entries[0].isIntersecting));if(stage)observer.observe(stage);
  load?.addEventListener('click',async()=>{if(!stage||load.disabled)return;load.disabled=true;load.textContent='Gerçek model yükleniyor…';stage.dataset.state='loading';
    const failed=()=>{stage.closest('section')?.querySelectorAll<HTMLButtonElement>('[data-van-turn],[data-van-reset]').forEach(b=>b.disabled=true);stage.dataset.state='poster';load.disabled=false;load.textContent='360° görünümü tekrar aç';};
    try{const module=await import('./vehicle');const next=await module.createVehicle(stage,failed,abort.signal);if(closed){next.dispose();return;}vehicle=next;stage.closest('section')?.querySelectorAll<HTMLButtonElement>('[data-van-turn],[data-van-reset]').forEach(b=>b.disabled=false);vehicle.setVisible(stage.getBoundingClientRect().bottom>0&&stage.getBoundingClientRect().top<innerHeight);}
    catch{if(!closed)failed();}
  },{signal:abort.signal});
  sync();return()=>{closed=true;abort.abort();observer.disconnect();vehicle?.dispose();};
}
