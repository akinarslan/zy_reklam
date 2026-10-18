import {test} from 'node:test';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {chromium} from 'playwright';
import {verifyHeroFold} from './helpers/hero-fold.mjs';

test('Home first fold: complete hero at 18 mobile/tablet/desktop sizes; next section retained and visible after scrolling',async()=>{
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore',windowsHide:true});
 let browser;
 try{
  const base=`http://127.0.0.1:${port}`;
  for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  await verifyHeroFold(browser,base,'docs/evidence/hero-fold/local');
 }finally{await browser?.close();server.kill();}
});
