import {verifyMatrixResponsive} from './helpers/matrix-responsive.mjs';
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {browserDiagnostics,activeSceneReady,captureActiveMatrixFrame} from './helpers/browser-ready.mjs';
const base='http://127.0.0.1:4208',out='docs/evidence/matrix/local';
let browser,server;const evidence={core:[],advanced:[],responsive:[],touch:[],errors:[],captures:[]};
before(async()=>{
 await mkdir(out,{recursive:true});
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4208','--strictPort'],{stdio:'ignore',windowsHide:true});
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 // Keep Canvas 2D and actual SwiftShader WebGL enabled; software compositing
 // avoids queuing 4K snapshot readback behind a continuously invalidated GPU surface.
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-compositing']});
 const graphics=await browser.newBrowserCDPSession();const info=await graphics.send('SystemInfo.getInfo');evidence.graphics=info.gpu.featureStatus;evidence.chromiumVersion=browser.version();await graphics.detach();
});
after(async()=>{await browser?.close();server?.kill();await writeFile(`${out}/acceptance.json`,JSON.stringify(evidence,null,2));});
const stats=p=>p.locator('.hero').evaluate(e=>JSON.parse(e.dataset.matrixState));
async function ready(p,path='/') {await p.goto(base+path);await p.waitForFunction(()=>document.querySelector('.hero')?.dataset.matrixState);}
async function state(p,key,value) {
 await p.evaluate(({key,value})=>{const input=document.querySelector(`[data-matrix-setting="${key}"]`);if(input.type==='checkbox')input.checked=value;else input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));},{key,value});
}
async function key(p,k) {await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press(k);}
test('Matrix controls, capabilities, shortcut safety, lifecycle and same canvas',async()=>{
 const p=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+':'+r.failure()?.errorText));
 try{
 await ready(p);await p.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='ready');
 assert.equal(await p.locator('[data-matrix-rain]').count(),1);assert.equal(await p.locator('[data-hero-stage] canvas').count(),1);
 await p.evaluate(()=>{window.matrixIdentity=document.querySelector('[data-matrix-rain]');window.signIdentity=document.querySelector('[data-hero-stage] canvas');});
 assert.equal((await stats(p)).mode,'fly');assert.equal((await stats(p)).palette,'green');assert.equal((await stats(p)).speed,2,'user-approved cruise speed');
 await key(p,'w');assert.equal((await stats(p)).speed,4);await key(p,'s');assert.equal((await stats(p)).speed,2);
 await key(p,'ArrowUp');assert.equal((await stats(p)).speed,4);await key(p,'ArrowDown');assert.equal((await stats(p)).speed,2);
 await p.mouse.move(120,150);await p.waitForTimeout(300);assert.notEqual((await stats(p)).cameraX,0);
 await p.mouse.wheel(0,65);await p.waitForTimeout(300);assert.ok(await p.evaluate(()=>scrollY>0));assert.ok((await stats(p)).speed<2);
 await p.evaluate(()=>scrollTo(0,0));await key(p,'Space');assert.equal((await stats(p)).speed,45);
 await p.screenshot({path:`${out}/matrix-warp-1920.png`});await p.waitForTimeout(1600);assert.ok((await stats(p)).speed<45);
 await key(p,'m');assert.equal((await stats(p)).mode,'classic');await key(p,'m');assert.equal((await stats(p)).mode,'fly');
 await p.locator('[data-motion-toggle]').focus();await p.keyboard.press('m');assert.equal((await stats(p)).mode,'classic');await p.keyboard.press('m');assert.equal((await stats(p)).mode,'fly');
 for(const name of ['amber','ice','magenta','blood','gold','seed','auto','green']) {await key(p,'c');assert.equal((await stats(p)).palette,name);}
 await key(p,'Shift+C');assert.equal((await stats(p)).palette,'auto');
 const seed=(await stats(p)).seed;await key(p,'r');assert.notEqual((await stats(p)).seed,seed);
 const before=await stats(p);await key(p,'v');assert.equal((await stats(p)).effects,!before.effects);await key(p,'b');assert.equal((await stats(p)).bloom,0);
 assert.ok(await p.evaluate(()=>matrixIdentity===document.querySelector('[data-matrix-rain]')&&signIdentity===document.querySelector('[data-hero-stage] canvas')));
 await key(p,'h');assert.equal(await p.locator('.matrix-rain-hud').isVisible(),false);assert.ok(await p.locator('#hero-title').isVisible());assert.ok(await p.locator('[data-motion-toggle]').isVisible());await key(p,'h');
 await key(p,'?');assert.equal(await p.locator('.matrix-rain-help').getAttribute('open'),'');assert.equal(await p.locator('[data-matrix-action="?"]').getAttribute('aria-expanded'),'true');
 await p.screenshot({path:`${out}/matrix-help-1920.png`});await p.keyboard.press('Escape');assert.equal(await p.locator('.matrix-rain-help').getAttribute('open'),null);
 // Real native input targets must keep browser/form keyboard behavior.
 for(const tag of ['input','textarea','select','div']) {
  await p.evaluate(tag=>{const e=document.createElement(tag);if(tag==='div')e.contentEditable='true';e.id='matrix-test-input';e.style.cssText='position:fixed;top:110px;left:5px;z-index:80';document.body.append(e);e.focus();},tag);
  const before=await stats(p);await p.keyboard.press('m');await p.keyboard.press('Space');await p.keyboard.press('r');
  assert.equal((await stats(p)).mode,before.mode);assert.equal((await stats(p)).seed,before.seed);assert.equal((await stats(p)).speed,before.speed);
  await p.locator('#matrix-test-input').evaluate(e=>e.remove());
 }
 const seed2=(await stats(p)).seed;await key(p,'Control+r'); // browser reload is native; settle and compare restored state
 await p.waitForFunction(()=>document.querySelector('.hero')?.dataset.matrixState);assert.equal((await stats(p)).seed,seed2);
 const mode=(await stats(p)).mode;await key(p,'Alt+m');await key(p,'Meta+m');assert.equal((await stats(p)).mode,mode);
 await p.locator('[data-motion-toggle]').focus();await p.keyboard.press('Space');await p.waitForFunction(()=>document.documentElement.dataset.motion==='reduced');assert.equal((await stats(p)).mode,'classic');
 await p.locator('[data-motion-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.motion==='full');
 // Unsupported paths explicitly report failures, never success.
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await key(p,'l');assert.match(await p.locator('.matrix-rain-toast').textContent(),/kopyalama kullanılamıyor/);
 await p.evaluate(()=>{window.copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copied=t;}}});});
 await key(p,'l');await p.waitForFunction(()=>document.querySelector('.matrix-rain-toast').textContent==='Bağlantı kopyalandı');assert.ok(await p.evaluate(()=>copied.includes('mxSeed=')));
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));await key(p,'l');await p.waitForFunction(()=>document.querySelector('.matrix-rain-toast').textContent.includes('kopyalama kullanılamıyor'));
 const download=p.waitForEvent('download');await key(p,'p');const dl=await download;assert.match(dl.suggestedFilename(),/^matrix-.*\.png$/);assert.ok((await dl.path()));
 await p.evaluate(()=>HTMLCanvasElement.prototype.toBlob=undefined);await key(p,'p');assert.match(await p.locator('.matrix-rain-toast').textContent(),/PNG kaydetme desteklenmiyor/);
 await key(p,'f');await p.waitForTimeout(250);assert.ok(await p.evaluate(()=>document.fullscreenElement===document.querySelector('.hero')));await p.evaluate(()=>document.exitFullscreen());
 await p.evaluate(()=>Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false}));await key(p,'f');assert.match(await p.locator('.matrix-rain-toast').textContent(),/tam ekran kullanılamıyor/);
 // Scroll and hidden visibility pause the single owned scheduler.
 await p.locator('#iletisim').scrollIntoViewIfNeeded();await p.waitForFunction(()=>!JSON.parse(document.querySelector('.hero').dataset.matrixState).running);
 const stopped=(await stats(p)).frames;await p.waitForTimeout(350);assert.equal((await stats(p)).frames,stopped);
 const dormant=(await stats(p)).mode;await key(p,'m');assert.equal((await stats(p)).mode,dormant);
 await p.evaluate(()=>scrollTo(0,0));await p.waitForFunction(()=>JSON.parse(document.querySelector('.hero').dataset.matrixState).running);
 await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=(await stats(p)).frames;await p.waitForTimeout(350);assert.equal((await stats(p)).frames,hidden);
 await p.evaluate(()=>{delete document.visibilityState;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await p.waitForFunction(()=>JSON.parse(document.querySelector('.hero').dataset.matrixState).running);
 evidence.core.push('all keyboard/actions, passive wheel scroll, form targets/native Space/modifiers, capabilities success/denial, offscreen/hidden pause');
 assert.deepEqual(errors,[]);evidence.errors.push(...errors);
 }finally{await p.close();}
});
test('Matrix advanced deterministic state, URL restore, reduced motion, quality and anchors',async()=>{
 const context=await browser.newContext({viewport:{width:1366,height:768}});const p=await context.newPage();const diagnostic=browserDiagnostics(p);
 try{
 await ready(p,'/?mxSeed=shared&mxPalette=gold&mxMode=classic&mxDensity=123&mxMsg=WAKE+UP&mxGlyphs=AB01&mxBloom=.75&mxHalo=0&mxRamp=0&mxP3=0&mxIdle=1#hizmetler');
 await p.evaluate(()=>scrollTo(0,0));const a=await stats(p);assert.equal(a.density,123);assert.equal(a.mode,'classic');assert.equal(a.p3Active,false);assert.match(a.glyphSet,/^[AB01]+$/);assert.ok(a.messageStrands>0);
 await state(p,'seed','shared');const fingerprint=(await stats(p)).fingerprint;
 await p.locator('[data-matrix-debug]').evaluate(e=>{e.checked=true;e.dispatchEvent(new Event('change'));});assert.equal(await p.locator('.matrix-rain-debug').getAttribute('hidden'),null);
 await state(p,'seed','other');assert.notEqual((await stats(p)).fingerprint,fingerprint);await state(p,'seed','shared');assert.equal((await stats(p)).fingerprint,fingerprint);
 for(const [key,value] of [['density',900],['density',40],['density',123],['bloom',.25],['halo',true],['ramp',true],['p3','1'],['idle',true],['glyphs','XYZ01'],['msg','ZY REKLAM']]) await state(p,key,value);
 const share=await p.evaluate(()=>location.href);assert.equal(new URL(share).hash,'#hizmetler');
 const newContext=await browser.newContext({viewport:{width:1366,height:768}});const other=await newContext.newPage();await other.goto(share);await other.waitForFunction(()=>document.querySelector('.hero')?.dataset.matrixState);
 const original=await stats(p),restored=await stats(other);
 for(const key of ['seed','palette','density','msg','glyphs','mode','bloom','halo','ramp','p3','idle','fingerprint']) assert.equal(restored[key],original[key],key);
 await newContext.close();await p.setViewportSize({width:1920,height:1080});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`${out}/matrix-palette-1920.png`});
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await state(p,'idle',true);
 await p.waitForFunction(()=>{const s=JSON.parse(document.querySelector('.hero').dataset.matrixState);return s.running&&Math.abs(s.cameraX)>1;},null,{timeout:10000,polling:100});assert.ok(Math.abs((await stats(p)).cameraX)>1);
 // Drive the retained upstream governor with costly work; no fixed FPS cap is installed.
 await p.evaluate(()=>{let until=performance.now()+2200;function busy(){const end=performance.now()+30;while(performance.now()<end){}if(performance.now()<until)requestAnimationFrame(busy);}requestAnimationFrame(busy);});
 await p.waitForFunction(()=>JSON.parse(document.querySelector('.hero').dataset.matrixState).quality<1,null,{timeout:10000});assert.equal((await stats(p)).bloomActive,false);
 const adapted=await stats(p);assert.equal(adapted.density,123);await p.waitForFunction(frames=>JSON.parse(document.querySelector('.hero').dataset.matrixState).frames>frames,adapted.frames,{polling:100});assert.match(await p.locator('.matrix-rain-debug').textContent(),/[1-9][0-9]* glyph/);
 for(const anchor of ['#projeler','#iletisim','#hizmetler','#hakkinda']) {await p.evaluate(a=>{location.hash=a;},anchor);await p.waitForTimeout(100);assert.equal(new URL(p.url()).hash,anchor);assert.equal(await p.locator('[data-matrix-rain]').count(),1);}
 const reducedPage=await browser.newPage({reducedMotion:'reduce'});await ready(reducedPage);assert.equal((await stats(reducedPage)).mode,'classic');assert.equal((await stats(reducedPage)).reduced,true);assert.equal(await reducedPage.locator('[data-matrix-action="m"]').textContent(),'Klasik');await state(reducedPage,'motion',true);assert.equal((await stats(reducedPage)).mode,'fly');assert.equal(await reducedPage.locator('[data-matrix-action="m"]').textContent(),'Fly');await reducedPage.close();
 evidence.advanced.push('seed determinism, 40–900 density, glyph/message strands, bloom/halo/ramp/P3, idle, adaptive quality/bloom disable, new-context URL roundtrip, native anchors, OS/site motion policy');
 }catch(error){await diagnostic('matrix-advanced',error);throw error;}finally{await context.close();}
});
test('Matrix owns one RAF and disposes completely; optional Canvas 2D failure preserves hero',async()=>{
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.addInitScript(()=>{
  const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);window.pendingFrames=new Set();
  window.requestAnimationFrame=cb=>{let id=request(time=>{pendingFrames.delete(id);cb(time);});pendingFrames.add(id);return id;};
  window.cancelAnimationFrame=id=>{pendingFrames.delete(id);cancel(id);};
 });
 await ready(p);await p.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.renderLoop==='idle');
 assert.equal(await p.evaluate(()=>pendingFrames.size),1,'only the continuous Matrix scheduler remains after sign idle');
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
 assert.equal(await p.evaluate(()=>pendingFrames.size),0);assert.equal(await p.locator('[data-matrix-rain],.matrix-rain-help,.matrix-rain-hud').count(),0);
 await p.keyboard.press('m');await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>pendingFrames.size),0);
 assert.deepEqual(errors,[]);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='2d'&&this.hasAttribute('data-matrix-rain'))return null;return original.call(this,type,...args);};});
 await fallback.goto(base);await fallback.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='ready');assert.equal(await fallback.locator('[data-matrix-rain]').count(),0);assert.ok(await fallback.locator('#hero-title').isVisible());await fallback.close();
 evidence.core.push('one RAF after sign idle; nonpersisted pagehide removes all Matrix UI/RAF; no resurrection; unavailable Canvas 2D leaves static/3D hero');
 }finally{await p.close();}
});
test('Matrix full hero bounds and readable controls at eleven viewports; other pages and no-JS stay static',async()=>{await verifyMatrixResponsive(browser,base,out,evidence);});
test('Matrix missing kana and unsupported P3 use font and sRGB fallbacks',async()=>{
 const p=await browser.newPage();
 try{
 await p.addInitScript(()=>{
  const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return get.call(this,type,...(type==='2d'?[]:args));};
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/[\uff61-\uff9f]/.test(text)&&this.canvas.width===24)return;return fill.call(this,text,...args);};
 });
 await ready(p,'/?mxP3=1');const s=await stats(p);assert.equal(s.p3Active,false);assert.doesNotMatch(s.glyphSet,/[\uff61-\uff9f]/);assert.ok(s.glyphSet.includes('A'));evidence.advanced.push('missing Japanese font removes tofu; forced unsupported P3 falls back to sRGB');
 }finally{await p.close();}
});
test('Matrix real CDP touch: steering, vertical scroll, two-finger speed, double tap and mobile pad',async()=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await context.newPage();
 try{
 await ready(p);assert.ok(await p.locator('.matrix-rain-pad').isVisible());assert.equal(await p.locator('.matrix-rain-hint').isVisible(),false);
 const cdp=await context.newCDPSession(p);const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id=1])=>({x,y,id,radiusX:3,radiusY:3,force:1}))});
 await touch('touchStart',[[40,250]]);await touch('touchMove',[[90,230]]);await p.waitForTimeout(150);assert.notEqual((await stats(p)).cameraX,0);await touch('touchEnd',[]);
 await p.evaluate(()=>scrollTo(0,0));await touch('touchStart',[[40,400]]);for(let y=380;y>=240;y-=20){await touch('touchMove',[[40,y]]);await p.waitForTimeout(20);}await touch('touchEnd',[]);await p.waitForTimeout(200);assert.ok(await p.evaluate(()=>scrollY>30));
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(200);
 const speedBeforeTwoFingers=(await stats(p)).speed;await touch('touchStart',[[35,240,1],[95,240,2]]);await touch('touchMove',[[35,210,1],[95,210,2]]);await touch('touchEnd',[]);await p.waitForFunction(before=>Math.abs(JSON.parse(document.querySelector('.hero').dataset.matrixState).speed-before-3.6)<.0001,speedBeforeTwoFingers,{polling:100});assert.ok(Math.abs((await stats(p)).speed-speedBeforeTwoFingers-3.6)<.0001);
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(200);
 await touch('touchStart',[[40,250]]);await touch('touchEnd',[]);await p.waitForTimeout(100);await touch('touchStart',[[40,250]]);await touch('touchEnd',[]);assert.equal((await stats(p)).speed,45);
 await p.locator('[data-matrix-action="c"]').tap();assert.equal((await stats(p)).palette,'amber');await p.locator('[data-matrix-action="m"]').tap();assert.equal((await stats(p)).mode,'classic');
 await p.locator('[data-matrix-action="?"]').tap();assert.ok(await p.locator('.matrix-rain-help').isVisible());await p.getByRole('button',{name:'Kapat',exact:true}).click();
 await p.locator('[data-matrix-action="h"]').tap();assert.equal(await p.locator('.matrix-rain-pad').isVisible(),false);
 await touch('touchStart',[[40,250]]);await p.waitForTimeout(700);await touch('touchEnd',[]);assert.ok(await p.locator('.matrix-rain-pad').isVisible());
 assert.ok((await stats(p)).dpr<=1.5);evidence.touch.push('real CDP one/two fingers, scroll retained, doubletap temporary warp, coarse pad mode/palette/help/hide/longpress restore, DPR cap');
 }finally{await context.close();}
});
