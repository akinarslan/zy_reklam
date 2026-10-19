import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {verifyHeroRotation} from '../helpers/hero-rotation.mjs';
import {diagnosticTest} from '../helpers/gpu-policy.mjs';
diagnosticTest('GPU stress: original eleven-viewport Hero sweeps, 4K PNG readback and idle timing',async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4211','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch('http://127.0.0.1:4211')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  console.log(await verifyHeroRotation(browser,'http://127.0.0.1:4211','docs/evidence/gpu-diagnostics/hero',{stress:true}));
 }finally{await browser?.close();server.kill();}
});
