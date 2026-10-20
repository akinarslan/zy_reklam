import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {verifyMatrixResponsive} from '../helpers/matrix-responsive.mjs';
import {diagnosticTest} from '../helpers/gpu-policy.mjs';
diagnosticTest('GPU stress: original Matrix full-resolution PNG readback and frame/identity assertions',async()=>{
 const out='docs/evidence/gpu-diagnostics/matrix';await mkdir(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4212','--strictPort'],{stdio:'ignore',windowsHide:true});let browser;const evidence={captures:[],responsive:[],errors:[]};
 try{
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch('http://127.0.0.1:4212')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  await verifyMatrixResponsive(browser,'http://127.0.0.1:4212',out,evidence,{stress:true});
 }finally{await browser?.close();server.kill();await writeFile(out+'/acceptance.json',JSON.stringify(evidence,null,2));}
});
