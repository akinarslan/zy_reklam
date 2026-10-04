/** Real reference photographs. Continuous vehicle rotation awaits the actual GLB. */
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
  sync();return()=>abort.abort();
}
