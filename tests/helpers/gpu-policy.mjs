import {test} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const events=new WeakMap();
export function observeGpuPage(page){
 const errors=[];events.set(page,errors);
 page.on('pageerror',e=>errors.push(String(e)));page.on('crash',()=>errors.push('page crash'));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('requestfailed',r=>errors.push(r.url()+':'+r.failure()?.errorText));
}
export function assertGpuEvents(page){assert.deepEqual(events.get(page),[],'Crash, pageerror, console or network errors are functional failures');}
export function isHardwareTiming(error,health,phase){
 const timeout=error?.name==='TimeoutError'||phase==='png-readback'&&error?.message==='Active Matrix PNG capture exceeded 30s budget';
 const knownPhase=phase==='measurement'||['hero-idle','png-readback'].includes(phase)&&health?.width>=2560;
 return Boolean(timeout&&knownPhase&&health?.state==='ready'&&health.canvasCount===1&&health.webgl&&health.identity===true&&health.matrixRunning===true&&health.matrixCanvas===1&&!health.contextLost&&!health.overflow&&health.errors?.length===0);
}
export async function gpuTimingFailure(error,page,phase){
 let health;
 try{
  let frame=page.mainFrame();for(const candidate of page.frames())if(await candidate.locator('[data-hero-stage]').count()){frame=candidate;break;}
  health=await frame.evaluate(()=>{
   const s=document.querySelector('[data-hero-stage]'),canvases=s?.querySelectorAll('canvas'),gl=canvases?.[0]?.getContext('webgl2');
   const original=window.heroCanvas||window.gpuProbeCanvas;
   const matrix=JSON.parse(document.querySelector('.hero')?.dataset.matrixState||'{}');
   return{width:innerWidth,state:s?.dataset.sceneState,reason:s?.dataset.sceneReason,loop:s?.dataset.renderLoop,renderCount:s?.dataset.renderCount,canvasCount:canvases?.length,webgl:Boolean(gl),identity:!original||original===canvases?.[0],matrixRunning:matrix.running===true,matrixCanvas:document.querySelectorAll('[data-matrix-rain]').length,contextLost:gl?.isContextLost(),overflow:document.documentElement.scrollWidth>innerWidth};
  });health.errors=events.get(page)||['GPU health was not observed'];
 }catch{health={errors:['page/frame unavailable or crashed']};}
 if(isHardwareTiming(error,health,phase))Object.assign(error,{gpuCategory:'hardware-timing',gpuHealth:health,gpuPhase:phase});
 throw error;
}
export function diagnosticTest(name,run){
 return test(name,async context=>{
  const record={name,at:new Date().toISOString(),passed:false,category:'critical'};
  try{await run(context);record.passed=true;record.category='pass';}
  catch(error){Object.assign(record,{category:error.gpuCategory||'critical',error:String(error),stack:error.stack,phase:error.gpuPhase,health:error.gpuHealth});throw error;}
  finally{await mkdir('docs/evidence/gpu-diagnostics/results',{recursive:true});await writeFile('docs/evidence/gpu-diagnostics/results/'+createHash('sha256').update(name).digest('hex').slice(0,12)+'.json',JSON.stringify(record,null,2));}
 });
}
export function diagnosticExit(testExit,records,failedTests){
 if(testExit===0)return records.length>0&&records.every(r=>r.passed)?0:1;
 const failures=records.filter(r=>!r.passed);
 return testExit===1&&failures.length>0&&failures.length===failedTests&&failures.every(r=>r.category==='hardware-timing')?0:1;
}
