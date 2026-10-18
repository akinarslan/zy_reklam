import {sections,validManifest,validSnapshot,type Manifest,type Snapshot} from './protocol.js';
import {applySnapshots} from './patch';
import {interactionGuard} from './guard';

const digest=async(text:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),byte=>byte.toString(16).padStart(2,'0')).join('');
export function setupLiveContent():()=>void {
  const baseline=document.getElementById('live-content-baseline');
  if(!baseline||location.pathname.startsWith('/admin'))return()=>{};
  let active:Manifest;
  try {const value:unknown=JSON.parse(baseline.textContent??'');if(!validManifest(value))return()=>{};active=value;}catch{return()=>{};}
  let latest=active,pending:{manifest:Manifest;snapshots:Snapshot[]}|undefined;
  let timer:ReturnType<typeof setTimeout>|undefined,request:AbortController|undefined,stopped=false,sequence=0;
  const apply=()=>{
    if(stopped||document.visibilityState==='hidden'||!pending||guard.busy())return;
    try {applySnapshots(pending.snapshots);active=pending.manifest;pending=undefined;}catch{/* Keep the current snapshot when target validation fails. */}
  };
  const guard=interactionGuard(apply);
  const read=async(url:string,limit:number,signal:AbortSignal)=>{
    const response=await fetch(url,{cache:url==='/content-version.json'?'no-store':'default',credentials:'omit',signal,redirect:'error'});
    if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('Invalid live response');
    const declared=Number(response.headers.get('content-length'));if(declared>limit)throw Error('Live response too large');
    const reader=response.body?.getReader();if(!reader)throw Error('Missing live body');
    let size=0;const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Live response too large');}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  };
  const schedule=()=>{clearTimeout(timer);if(!stopped&&document.visibilityState!=='hidden')timer=setTimeout(check,45000);};
  async function check() {
    if(stopped||document.visibilityState==='hidden')return;
    // A new visibility cycle cancels stale in-flight work; old replies cannot
    // publish over the most recently observed snapshot.
    request?.abort();const controller=new AbortController();request=controller;const ticket=++sequence;
    const timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const manifest:unknown=JSON.parse(await read('/content-version.json',16384,controller.signal));
      if(!validManifest(manifest))throw Error('Unsupported live schema');
      if(ticket!==sequence)return;
      latest=manifest;
      const changed=sections.filter(section=>manifest.sections[section].hash!==active.sections[section].hash);
      if(!changed.length){pending=undefined;active=manifest;return;}
      if(pending&&pending.manifest.revision===manifest.revision&&sections.every(section=>pending!.manifest.sections[section].hash===manifest.sections[section].hash)){apply();return;}
      const snapshots=await Promise.all(changed.map(async section=>{
        const entry=manifest.sections[section],text=await read(entry.url,2000000,controller.signal);
        if(await digest(text)!==entry.hash)throw Error('Snapshot hash mismatch');
        const value:unknown=JSON.parse(text);if(!validSnapshot(value,section))throw Error('Invalid snapshot');return value;
      }));
      if(ticket!==sequence||latest!==manifest)return;
      pending={manifest,snapshots};apply();
    }catch{ // Failed requests never clear the last successfully prepared snapshot.
    }finally{clearTimeout(timeout);if(ticket===sequence){request=undefined;schedule();}}
  }
  const visible=()=>{
    clearTimeout(timer);sequence++;request?.abort();request=undefined;
    if(document.visibilityState!=='hidden'){apply();void check();}
  };
  document.addEventListener('visibilitychange',visible);
  schedule();
  return()=>{stopped=true;sequence++;clearTimeout(timer);request?.abort();guard.cleanup();document.removeEventListener('visibilitychange',visible);};
}
