import {test} from 'node:test';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {verifyHeroRotation} from './helpers/hero-rotation.mjs';
test('Hero 360: mouse/touch/keyboard, rear hardware, lifecycle and eleven responsive viewports',async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch('http://127.0.0.1:4196')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  // Keep real SwiftShader WebGL and Canvas2D, but avoid placing 4K screenshot
  // readback behind an invalidating GPU surface during functional rotation QA.
  browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-compositing']});
  const graphics=await browser.newBrowserCDPSession();
  const gpu=(await graphics.send('SystemInfo.getInfo')).gpu.featureStatus;
  const assert=(await import('node:assert/strict')).default;
  assert.equal(gpu.gpu_compositing,'disabled_software');assert.match(gpu.webgl,/enabled/);assert.match(gpu['2d_canvas'],/enabled/);
  console.log('HERO_FUNCTIONAL_GRAPHICS',JSON.stringify(gpu));await graphics.detach();
  console.log(await verifyHeroRotation(browser,'http://127.0.0.1:4196','docs/evidence/hero-rotation/local'));
 }finally{await browser?.close();server.kill();}
});
