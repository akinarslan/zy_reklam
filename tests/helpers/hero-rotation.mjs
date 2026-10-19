import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {browserDiagnostics} from './browser-ready.mjs';

export const rotationViewports=[[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]];
const stageSelector='[data-hero-stage]';
const idle=async page=>{
 await page.waitForFunction(()=>{
  const s=document.querySelector('[data-hero-stage]');
  return s?.dataset.renderLoop==='idle'||['fallback','reduced','error'].includes(s?.dataset.sceneState);
 },null,{polling:100});
 const state=await page.locator(stageSelector).evaluate(s=>({state:s.dataset.sceneState,reason:s.dataset.sceneReason,loop:s.dataset.renderLoop,frames:Number(s.dataset.renderCount),canvas:s.querySelectorAll('canvas').length}));
 assert.equal(state.state,'ready',JSON.stringify(state));assert.equal(state.loop,'idle');assert.equal(state.canvas,1);assert.ok(state.frames>0);
};
const yaw=page=>page.locator(stageSelector).evaluate(el=>Number(el.dataset.rotationY));
const ready=async(page,base)=>{await page.goto(base+'/');await page.waitForFunction(()=>document.querySelector('[data-hero-stage]')?.dataset.sceneState==='ready',null,{timeout:20000});await idle(page);};
async function inside(page) {
 const data=await page.locator(stageSelector).evaluate(el=>({bounds:JSON.parse(el.dataset.projectedBounds),mounts:el.dataset.backMounts,rails:el.dataset.backRails,count:document.querySelectorAll('[data-hero-stage] canvas').length,matrix:document.querySelectorAll('[data-matrix-rain]').length,overflow:document.documentElement.scrollWidth>innerWidth,heroBottom:document.querySelector('.hero').getBoundingClientRect().bottom,next:document.querySelector('.brand-showcase').getBoundingClientRect().top,height:innerHeight}));
 assert.equal(data.matrix,1);
 assert.equal(data.count,1);assert.equal(data.overflow,false);assert.equal(data.mounts,'4');assert.equal(data.rails,'2');
 for(const [name,value]of Object.entries(data.bounds))assert.ok(value>=-1&&value<=1,`${name}: ${value}`);
 assert.ok(Math.abs(data.heroBottom-data.height)<2);assert.ok(data.next>=data.height-1);
 return data;
}
async function drag(page,fraction) {
 const b=await page.locator(stageSelector).boundingBox();
 const start=fraction>0?.08:.92;
 await page.mouse.move(b.x+b.width*start,b.y+b.height/2);
 await page.mouse.down();
 await page.mouse.move(b.x+b.width*(start+fraction),b.y+b.height/2,{steps:12});
 await page.mouse.up();await page.mouse.move(0,0);await idle(page);
}
export async function verifyHeroRotation(browser,base,output) {
 await mkdir(output,{recursive:true});const rows=[],checks=[],shots=new Set([390,768,1366,1920,2560,3840]);
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const diagnostic=browserDiagnostics(page);
 await page.addInitScript(()=>{
  window.heroContexts=[];
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   const context=original.call(this,type,...args);
   if(type==='webgl2'&&context&&!window.heroContexts.includes(context))window.heroContexts.push(context);
   return context;
  };
 });
 try {
  for(const [width,height]of rotationViewports) {
   await page.setViewportSize({width,height});await ready(page,base);
   await page.evaluate(()=>{window.heroCanvas=document.querySelector('[data-hero-stage] canvas');window.heroLoads=performance.getEntriesByType('navigation').length;});
   assert.ok(Math.abs(await yaw(page))<.32);
   const front=await inside(page);
   if(shots.has(width))await page.screenshot({path:`${output}/hero-front-${width}.png`});
   await drag(page,.5);assert.ok(Math.abs(await yaw(page)-Math.PI)<.001);
   assert.equal(await page.locator(stageSelector).evaluate(el=>document.activeElement===el),false,'pointer drag must not acquire persistent keyboard focus');
   const back=await inside(page);
   if(shots.has(width))await page.screenshot({path:`${output}/hero-back-${width}.png`});
   await drag(page,.5);assert.ok(Math.abs(await yaw(page)-Math.PI*2)<.001);
   const returned=await inside(page);
   assert.ok(await page.evaluate(()=>window.heroCanvas===document.querySelector('[data-hero-stage] canvas')&&performance.getEntriesByType('navigation').length===heroLoads&&heroContexts.length===1&&heroContexts[0]===heroCanvas.getContext('webgl2')));
   rows.push({width,height,front,back,returned,yaw:await yaw(page),passed:true});
  }
  checks.push('11 viewport front/back/front projected bounds; first fold; no overflow; same canvas/context; no duplicate renderer context; mouse 180/360');
  // A full sweep remains free while held; explicit release snaps to the nearest face.
  await page.setViewportSize({width:1440,height:900});await ready(page,base);
  await page.evaluate(()=>window.heroCanvas=document.querySelector('[data-hero-stage] canvas'));
  const b=await page.locator(stageSelector).boundingBox();
  await page.mouse.move(b.x+b.width*.1,b.y+b.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width*.92,b.y+b.height/2,{steps:16});
  await page.waitForTimeout(650);assert.ok(await yaw(page)>4.5);
  await page.locator('[data-hero-stage] canvas').evaluate(c=>c.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,pointerType:'mouse'})));
  await page.mouse.up();await page.mouse.move(0,0);await idle(page);assert.equal(await page.locator(stageSelector).getAttribute('data-dragging'),'false');
  await page.mouse.move(b.x+b.width*.1,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.6,b.y+b.height/2,{steps:8});
  await page.locator('[data-hero-stage] canvas').evaluate(c=>{if(c.hasPointerCapture(1))c.releasePointerCapture(1);});
  await page.mouse.up();await page.mouse.move(0,0);await idle(page);assert.equal(await page.locator(stageSelector).getAttribute('data-dragging'),'false');
  checks.push('unclamped held sweep; pointercancel; lostpointercapture; no stuck drag');
  await page.locator(stageSelector).focus();const before=await yaw(page);await page.keyboard.press('ArrowRight');await idle(page);assert.ok(Math.abs(await yaw(page)-before-Math.PI)<.001);
  await page.keyboard.press('ArrowLeft');await idle(page);assert.ok(Math.abs(await yaw(page)-before)<.001);
  assert.ok(await page.locator(stageSelector).evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
  checks.push('keyboard left/right 180 and visible focus');
  const frames=await page.locator(stageSelector).getAttribute('data-render-count');const shadows=await page.locator(stageSelector).getAttribute('data-shadow-count');await page.waitForTimeout(300);
  assert.equal(await page.locator(stageSelector).getAttribute('data-render-count'),frames);assert.equal(await page.locator(stageSelector).getAttribute('data-shadow-count'),shadows);
  assert.equal(await page.locator(stageSelector).getAttribute('data-shadow-rotation-y'),await page.locator(stageSelector).getAttribute('data-rotation-y'));
  checks.push('idle RAF/shadow stopped; final shadow matches snapped pose');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal(await page.locator(stageSelector).getAttribute('data-render-loop'),'stopped');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await idle(page);
  assert.ok(await page.evaluate(()=>heroCanvas===document.querySelector('[data-hero-stage] canvas')));checks.push('BFCache pagehide/show same canvas');
  await page.locator('[data-motion-toggle]').click();assert.equal(await page.locator('[data-hero-stage] canvas').count(),0);assert.equal(await page.locator(stageSelector).getAttribute('data-scene-state'),'reduced');
  checks.push('site reduced motion stops and disposes 3D; poster retained');
  await page.locator('[data-motion-toggle]').click();await page.waitForSelector('[data-hero-stage] canvas');await idle(page);
  await page.locator('[data-hero-stage] canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='fallback');assert.equal(await page.locator('[data-hero-stage] canvas').count(),0);checks.push('real context loss safe poster');
  assert.deepEqual(errors,[]);
 } catch(error){await diagnostic('hero-rotation',error);throw error;} finally {await page.close();}
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try {
  await ready(mobile,base);const b=await mobile.locator(stageSelector).boundingBox(),cdp=await mobile.context().newCDPSession(mobile),y=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.12,y}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*(.12+.5*i/12),y}]});await mobile.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await idle(mobile);assert.ok(Math.abs(await yaw(mobile)-Math.PI)<.001);
  const scroll=await mobile.evaluate(()=>scrollY);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y}]});
  for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:y-i*22}]});await mobile.waitForTimeout(25);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(300);assert.ok(await mobile.evaluate(()=>scrollY)>scroll+40);
  checks.push('real CDP touch 180; touch-action pan-y vertical scroll');
 }finally{await mobile.close();}
 await writeFile(`${output}/acceptance.json`,JSON.stringify({rows,checks,passed:true,caveat:'Chromium viewport / software GPU, not physical device acceptance'},null,2)+'\n');return {rows:rows.length,checks};
}
