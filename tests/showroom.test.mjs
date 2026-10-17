import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

test('Retired showroom never boots; one hero canvas survives scrolling without duplicate renderers',async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4195','--strictPort'],{stdio:'ignore',windowsHide:true});
 let browser;
 try{
  const base='http://127.0.0.1:4195';
  for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('Preview failed');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:2560,height:1440}}),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='ready');
  const canvas=await page.locator('[data-hero-3d] canvas').elementHandle();
  assert.equal(await page.locator('#vitrin,[data-showroom-stage]').count(),0);
  assert.equal(await page.locator('canvas').count(),1);
  assert.equal(await page.locator('.real-lightbox').count(),1);
  for(let i=0;i<2;i++){
   await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(150);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);
  }
  assert.equal(await page.locator('canvas').count(),1);
  assert.equal(await canvas.evaluate(c=>c===document.querySelector('[data-hero-stage] canvas')),true);
  assert.equal(requests.some(u=>u.includes('/showroom/')||u.includes('showroom-')),false);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill();}
});
