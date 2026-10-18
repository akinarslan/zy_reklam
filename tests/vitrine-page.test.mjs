import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base='http://127.0.0.1:4196';
let server,browser;
const measurements=[];
before(async()=>{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:'ignore',windowsHide:true});
 for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('Vitrine preview failed');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 await mkdir('docs/evidence/vitrine-page',{recursive:true});
});
after(async()=>{await browser?.close();server?.kill();await writeFile('docs/evidence/vitrine-page/measurements.json',JSON.stringify(measurements,null,2));});

test('Standalone /3d-vitrin/: direct production asset, shared navigation, metadata and nine responsive sizes',async()=>{
 const response=await fetch(base+'/3d-vitrin/');assert.equal(response.status,200);
 const html=await response.text();assert.ok(html.includes('<h1 id="showroom-title">3D Vitrin'));assert.ok(html.includes('rel="canonical" href="https://zyreklamdijital.com.tr/3d-vitrin/"'));
 assert.ok((await readFile("public/sitemap.xml","utf8")).includes("<loc>https://zyreklamdijital.com.tr/3d-vitrin/</loc>"));
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[390,844],[768,1024],[820,1180],[1024,768],[1366,768],[1920,1080],[2560,1440],[3440,1440],[3840,2160]]){
  await page.setViewportSize({width,height});await page.goto(base+'/3d-vitrin/');
  await page.locator('[data-showroom-stage]').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
  const m=await page.evaluate(()=>{
   const stage=document.querySelector('[data-showroom-stage]'),r=stage.getBoundingClientRect();
   return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,canvas:document.querySelectorAll('canvas').length,hero:document.querySelectorAll('[data-hero-stage]').length,stage:{width:r.width,height:r.height,left:r.left,right:r.right},state:{...stage.dataset}};
  });
  measurements.push(m);assert.ok(m.documentWidth<=width,JSON.stringify(m));assert.equal(m.canvas,1);assert.equal(m.hero,0);assert.ok(m.stage.left>=0&&m.stage.right<=width);
  assert.ok(Number(m.state.triangles)>10000);assert.equal(m.state.chrome,'true');assert.equal(m.state.lightPalette.split(',').length,5);
  const link=page.locator('#main-nav .nav-vitrin-link');assert.equal(await link.getAttribute('href'),'/3d-vitrin/');assert.equal(await link.getAttribute('aria-current'),'page');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'docs/evidence/vitrine-page/vitrine-'+width+'.png'});
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.locator('[data-nav-toggle]').click();await page.locator('#main-nav .nav-vitrin-link').click();await page.waitForURL('**/3d-vitrin/');
 assert.deepEqual(errors,[]);await page.close();
 for(const path of ['/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/']){
  const doc=await (await fetch(base+path)).text();assert.ok(doc.includes('href="/3d-vitrin/" class="nav-vitrin-link">3D Vitrin'));
 }
});

test('Standalone showroom preserves all three products, keyboard/touch lighting and idle/offscreen cleanup',async()=>{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width<640,isMobile:width<640});
  await page.goto(base+'/3d-vitrin/');await page.locator('[data-showroom-stage]').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
  for(const id of ['upper','lower','totem']){
   const button=page.locator('[data-showroom-select='+id+']');if(width<640)await button.tap();else await button.focus();
   assert.equal(await button.getAttribute('aria-pressed'),'true',JSON.stringify({width,id,state:await page.locator('[data-showroom-stage]').evaluate(e=>({...e.dataset}))}));
   await page.waitForFunction(id=>document.querySelector('[data-showroom-stage]').dataset[id+'Active']==='true',id);
   await page.waitForFunction(id=>{
    const state=document.querySelector('[data-showroom-stage]').dataset;
    return state[id+'Active']==='true'&&['upper','lower','totem'].filter(x=>x!==id).every(other=>state[other+'Active']==='false');
   },id).catch(async error=>{throw new Error(JSON.stringify({width,id,state:await page.locator('[data-showroom-stage]').evaluate(e=>({...e.dataset}))}),{cause:error});});
   // Each touch response is transient. Let it finish before checking the next product independently.
   if(width<640){await page.waitForFunction(()=>{const s=document.querySelector('[data-showroom-stage]').dataset;return s.selected===''&&s.loop==='idle'&&['upper','lower','totem'].every(id=>s[id+'Active']==='false');});assert.equal(await button.getAttribute('aria-pressed'),'false');}
  }
  await page.locator('.showroom-stage-wrapper').evaluate(e=>{e.tabIndex=-1;e.focus({preventScroll:true});});await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.loop==='idle');
  const frames=await page.locator('[data-showroom-stage]').getAttribute('data-frames');await page.waitForTimeout(200);assert.equal(await page.locator('[data-showroom-stage]').getAttribute('data-frames'),frames);
  await page.setViewportSize({width,height:500});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').getBoundingClientRect().bottom<=0);
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.loop==='stopped');
  await page.close();
 }
});

test('Standalone showroom keeps reduced-motion, module/context failure and JavaScript-free poster/links',async()=>{
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await reduced.goto(base+'/3d-vitrin/');await reduced.locator('[data-showroom-stage]').scrollIntoViewIfNeeded();await reduced.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
 const pose=await reduced.locator('[data-showroom-stage]').getAttribute('data-totem-pose');
 await reduced.locator('[data-showroom-select=totem]').focus();await reduced.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.totemActive==='true');
 assert.equal(await reduced.locator('[data-showroom-stage]').getAttribute('data-totem-pose'),pose);await reduced.close();
 const failed=await browser.newPage({viewport:{width:1440,height:900}});
 await failed.route('**/assets/renderer-*.js',r=>r.abort());await failed.route('**/assets/letter-outlines.json',r=>r.abort());
 // Abort the immutable source outlines path regardless of the bundler chunk name.
 await failed.route('**/assets/showroom/letter-outlines.json',r=>r.abort());
 await failed.goto(base+'/3d-vitrin/');await failed.locator('[data-showroom-stage]').scrollIntoViewIfNeeded();await failed.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='fallback');
 assert.equal(await failed.locator('.showroom-fallback img').evaluate(e=>e.complete&&e.naturalWidth>0),true);assert.equal(await failed.locator('canvas').count(),0);await failed.close();
 const lost=await browser.newPage({viewport:{width:1440,height:900}});await lost.goto(base+'/3d-vitrin/');await lost.locator('[data-showroom-stage]').scrollIntoViewIfNeeded();await lost.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
 await lost.locator('canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await lost.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='fallback');assert.equal(await lost.locator('canvas').count(),0);await lost.close();
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base+'/3d-vitrin/');
 assert.equal(await nojs.locator('.showroom-fallback img').evaluate(e=>e.complete&&e.naturalWidth>0),true);assert.equal(await nojs.locator('canvas').count(),0);assert.equal(await nojs.locator('a[href="/#iletisim"]').first().isVisible(),true);assert.ok(await nojs.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await nojs.close();
});
