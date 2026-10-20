import assert from 'node:assert/strict';
import {browserDiagnostics,activeSceneReady,captureActiveMatrixFrame} from './browser-ready.mjs';
import {gpuTimingFailure,observeGpuPage,assertGpuEvents} from './gpu-policy.mjs';
const stats=p=>p.locator('.hero').evaluate(e=>JSON.parse(e.dataset.matrixState));
const key=async(p,k)=>{await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press(k);};
export async function verifyMatrixResponsive(browser,base,out,evidence,{stress=false}={}) {
 const ready=async p=>{await p.goto(base);await p.waitForFunction(()=>document.querySelector('.hero')?.dataset.matrixState);};
const p=await browser.newPage();observeGpuPage(p);const errors=[];const diagnostic=browserDiagnostics(p);p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()));
 try{
 const capture=async path=>{try{return await captureActiveMatrixFrame(p,path);}catch(error){await gpuTimingFailure(error,p,'png-readback');throw error;}};
 const shots=new Set([390,768,1366,1920,2560,3840]);
 for(const [width,height] of [[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]]) {
  await p.setViewportSize({width,height});await ready(p);await p.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='ready');
  await p.evaluate(()=>window.gpuProbeCanvas=document.querySelector('[data-hero-stage] canvas'));
  const row=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{width:innerWidth,height:innerHeight,hero:r('.hero'),layer:r('.matrix-rain-layer'),heading:r('#hero-title'),stage:r('[data-hero-stage]'),bottom:r('.hero-bottom'),next:r('.brand-showcase'),overflow:document.documentElement.scrollWidth>innerWidth,matrix:document.querySelectorAll('[data-matrix-rain]').length,webgl:document.querySelectorAll('[data-hero-stage] canvas').length,pointer:getComputedStyle(document.querySelector('[data-matrix-rain]')).pointerEvents};});
  assert.equal(row.overflow,false);assert.equal(row.matrix,1);assert.equal(row.webgl,1);assert.equal(row.pointer,'none');
  for(const field of ['x','y','width','height'])assert.ok(Math.abs(row.hero[field]-row.layer[field])<1);
  assert.ok(row.next.top>=height-1);assert.ok(row.hero.bottom<=height+1);assert.ok(row.heading.top>=row.hero.top);assert.ok(row.bottom.bottom<=height);
  const ui=await p.evaluate(()=>{const r=e=>e.getBoundingClientRect().toJSON();return{hud:r(document.querySelector('.matrix-rain-hud')),obstacles:[...document.querySelectorAll('.hero-content,.sign-stage,.object-caption,.hero-bottom > *,.instagram-float,.whatsapp-float')].map(r)};});
  assert.ok(ui.obstacles.every(r=>r.bottom<=ui.hud.top||r.top>=ui.hud.bottom||r.right<=ui.hud.left||r.left>=ui.hud.right),'Matrix HUD must clear existing content/controls');
  assert.equal(await p.locator('.hero .actions').count(),0,'intentional main CTA removal is preserved');assert.ok(await p.locator('.whatsapp-float').isVisible(),'contact remains available');
  if(stress&&shots.has(width))evidence.captures.push(await capture(`${out}/matrix-fly-${width}.png`));
  await key(p,'m');assert.equal((await stats(p)).mode,'classic');if(stress&&shots.has(width))evidence.captures.push(await capture(`${out}/matrix-classic-${width}.png`));
  evidence.responsive.push({...row,passed:true});
 }
 assertGpuEvents(p);await p.close();
 for(const path of ['/3d-vitrin/','/admin/','/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/']) {
  // Isolate route absence from the 4K GPU allocation retained by the preceding
  // responsive navigation. The page must actually boot, not merely return HTML.
  const routePage=await browser.newPage();const routeDiagnostic=browserDiagnostics(routePage);
  const responses=[];routePage.on('request',r=>responses.push(r.url()));
  routePage.on('pageerror',e=>errors.push(e.message));routePage.on('requestfailed',r=>errors.push(r.url()));
  try{
   const response=await routePage.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   if(path==='/admin/')await routePage.locator('#login-form button[type="submit"]').waitFor({state:'visible'});
   else if(path==='/3d-vitrin/')await activeSceneReady(routePage);
   else await routePage.locator('main h1').waitFor({state:'visible'});
   // Wait for the entry module too: no-Matrix before module execution is vacuous.
   await routePage.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.initiatorType==='script'));
   assert.equal(await routePage.locator('[data-matrix-rain],.matrix-rain-hud').count(),0);assert.ok(!responses.some(url=>/\/controller-[^/]+\.js/.test(url)));
  }catch(error){await routeDiagnostic('matrix-route-'+path.split('/').filter(Boolean).join('-'),error);throw error;}
  finally{await routePage.close();}
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base);assert.ok(await nojs.locator('#hero-title').isVisible());assert.ok(await nojs.locator('#brand-showcase-title').count());assert.equal(await nojs.locator('[data-matrix-rain]').count(),0);await nojs.close();
 assert.deepEqual(errors,[]);evidence.errors.push(...errors);
 }catch(error){await diagnostic('matrix-responsive',error);throw error;}finally{await p.close();}
}
