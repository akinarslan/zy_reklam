/** Photographic vehicle lighting, independent of the lightbox. */
function setupCarLight():()=>void {
  const car=document.querySelector<HTMLButtonElement>('[data-car-light]');
  if(!car)return()=>{};
  const abort=new AbortController();
  let pinned=false,hovered=false;
  const sync=()=>{car.dataset.lit=String(pinned||hovered);car.setAttribute('aria-pressed',String(pinned));car.setAttribute('aria-label',pinned?'Araç aydınlatmasını kapat':'Araç kaplamasını aydınlat');};
  car.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}},{signal:abort.signal});
  car.addEventListener('pointerleave',()=>{hovered=false;sync();},{signal:abort.signal});
  car.addEventListener('click',()=>{pinned=!pinned;sync();},{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hovered=false;sync();}},{signal:abort.signal});
  sync();return()=>abort.abort();
}

/** Photographic lightbox illumination. */
export function setupShowcase():()=>void {
  const cleanupCar=setupCarLight();
  const lightbox=document.querySelector<HTMLElement>('[data-real-lightbox]');
  const button=document.querySelector<HTMLButtonElement>('[data-box-light]');
  if(!lightbox||!button)return cleanupCar;
  const abort=new AbortController();
  let pinned=false,hovered=false,focused=false;
  const sync=()=>{const lit=pinned||hovered||focused;lightbox.dataset.lit=String(lit);button.setAttribute('aria-pressed',String(pinned));button.textContent=pinned?'Işığı kapat':'Işığı aç';};
  lightbox.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}},{signal:abort.signal});
  lightbox.addEventListener('pointerleave',()=>{hovered=false;sync();},{signal:abort.signal});
  button.addEventListener('focus',()=>{focused=true;sync();},{signal:abort.signal});
  button.addEventListener('blur',()=>{focused=false;sync();},{signal:abort.signal});
  button.addEventListener('click',()=>{pinned=!pinned;sync();},{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hovered=false;focused=false;sync();}},{signal:abort.signal});
 sync();return()=>{abort.abort();cleanupCar();};
}
