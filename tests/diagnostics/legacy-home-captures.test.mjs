import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {verifyHeroFold} from '../helpers/hero-fold.mjs';
import {diagnosticTest,gpuTimingFailure,observeGpuPage,assertGpuEvents} from '../helpers/gpu-policy.mjs';
diagnosticTest('GPU stress: retained high-resolution first-fold and responsive Home PNG artifacts',async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4214','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 const sizes=[[2560,1440],[3440,1440],[3840,2160]];
 try{
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch('http://127.0.0.1:4214')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  await verifyHeroFold(browser,'http://127.0.0.1:4214','docs/evidence/gpu-diagnostics/first-fold',{stress:true,viewports:sizes});
  const page=await browser.newPage();observeGpuPage(page);await mkdir('docs/evidence/responsive',{recursive:true});
  try{for(const [width,height]of sizes){
   await page.setViewportSize({width,height});assert.equal((await page.goto('http://127.0.0.1:4214/')).status(),200);
   await page.waitForFunction(()=>document.querySelector('[data-hero-stage]').dataset.sceneState==='ready',null,{polling:100});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.evaluate(()=>window.gpuProbeCanvas=document.querySelector('[data-hero-stage] canvas'));
   try{await page.screenshot({path:`docs/evidence/responsive/site-${width}.png`});}catch(error){await gpuTimingFailure(error,page,'png-readback');throw error;}
  }assertGpuEvents(page);}finally{await page.close();}
 }finally{await browser?.close();server.kill();}
});
