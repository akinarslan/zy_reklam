import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

// Keep failure evidence next to the browser artifact, rather than losing the
// application's terminal state behind a generic selector/load timeout.
export function browserDiagnostics(page) {
 const started=Date.now(),events={console:[],pageerror:[],requestfailed:[]};
 page.on('console',m=>{if(m.type()==='error')events.console.push(m.text());});
 page.on('pageerror',e=>events.pageerror.push(e.message));
 page.on('requestfailed',r=>events.requestfailed.push({url:r.url(),error:r.failure()?.errorText}));
 return async(label,error)=>{
  const frames=[];
  for(const frame of page.frames())try{frames.push(await frame.evaluate(()=>({url:location.href,readyState:document.readyState,viewport:[innerWidth,innerHeight],hidden:document.hidden,motion:document.documentElement.dataset.motion,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,canvases:document.querySelectorAll('canvas').length,hero:[...document.querySelectorAll('[data-hero-stage]')].map(e=>({...e.dataset,rect:e.getBoundingClientRect().toJSON(),posterVisible:!!e.querySelector('img')?.getBoundingClientRect().height})),showroom:[...document.querySelectorAll('[data-showroom-stage]')].map(e=>({...e.dataset})),matrix:document.querySelector('.hero')?.dataset.matrixState,status:document.querySelector('#status')?.textContent,progress:document.querySelector('#progress')?.textContent})));}catch{}
  const record={label,elapsedMs:Date.now()-started,error:String(error),events,frames};
  await mkdir('docs/evidence/matrix/ci-release',{recursive:true});
  await writeFile(`docs/evidence/matrix/ci-release/${label}-failure.json`,JSON.stringify(record,null,2));
  console.error('Browser readiness diagnostic:',JSON.stringify(record));
 };
}

export async function activeSceneReady(page,{timeout=20000}={}) {
 await page.locator('[data-hero-stage],[data-showroom-stage]').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{
  const stage=document.querySelector('[data-hero-stage],[data-showroom-stage]');
  const state=stage?.dataset.sceneState??stage?.dataset.state;
  return ['ready','fallback','reduced','disposed'].includes(state);
 },null,{timeout,polling:100});
 const scene=await page.locator('[data-hero-stage],[data-showroom-stage]').evaluate(e=>({state:e.dataset.sceneState??e.dataset.state,reason:e.dataset.sceneReason,canvases:e.querySelectorAll('canvas').length}));
 assert.equal(scene.state,'ready',`Active WebGL required: ${JSON.stringify(scene)}`);
 assert.equal(scene.canvases,1,'Exactly one active scene canvas is required');
 await page.locator('[data-hero-stage] canvas,[data-showroom-stage] canvas').waitFor({state:'visible',timeout});
 await page.waitForFunction(()=>{const e=document.querySelector('[data-hero-stage],[data-showroom-stage]');return Number(e.dataset.renderCount??e.dataset.frames)>0;},null,{timeout,polling:100});
}
