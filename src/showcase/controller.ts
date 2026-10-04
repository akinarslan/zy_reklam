export function setupShowcase(){
 const stage=document.querySelector<HTMLElement>('[data-showcase-stage]');if(!stage)return()=>{};
 let instance:ReturnType<typeof import('./renderer').createShowcase>|undefined,loading=false,failed=false,destroyed=false,near=false;let timeout:ReturnType<typeof setTimeout>|undefined;const abort=new AbortController();
 const visible=()=>{const r=stage.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&!document.hidden;};
 function fallback(){failed=true;instance?.dispose();instance=undefined;stage!.dataset.state='fallback';stage!.closest('section')!.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);}
 async function load(){if(loading||instance||failed||destroyed||!near||document.hidden)return;loading=true;timeout=setTimeout(fallback,10000);try{const module=await import('./renderer');if(destroyed||failed)return;instance=module.createShowcase(stage!,fallback);stage!.dataset.state='ready';instance.setVisible(visible());}catch{if(!destroyed)fallback();}finally{clearTimeout(timeout);loading=false;}}
 function sync(){instance?.setVisible(visible());if(near)void load();}
 const observer=new IntersectionObserver(e=>{near=e.some(x=>x.isIntersecting);sync();},{rootMargin:'180px'});observer.observe(stage);
 window.addEventListener('scroll',sync,{passive:true,signal:abort.signal});window.addEventListener('resize',sync,{signal:abort.signal});document.addEventListener('visibilitychange',sync,{signal:abort.signal});window.addEventListener('pageshow',sync,{signal:abort.signal});window.addEventListener('pagehide',()=>instance?.setVisible(false),{signal:abort.signal});
 return()=>{destroyed=true;abort.abort();clearTimeout(timeout);observer.disconnect();instance?.dispose();};
}
