import {test} from 'node:test';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {chromium} from 'playwright';
import {verifyPublicNavigation} from './helpers/public-navigation.mjs';

test('Shared public navigation: sticky scroll, equal labels, anchors and mobile/mega menus on Home and 3D Vitrin',async()=>{
 const port=await new Promise(resolve=>{
  const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});
 });
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore',windowsHide:true});
 let browser;
 try{
  const base=`http://127.0.0.1:${port}`;
  for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined});
  const records=await verifyPublicNavigation(browser,base,'docs/evidence/public-navigation/local');
  console.log('Public navigation acceptance:',records.length,'page/viewport combinations PASS');
 }finally{await browser?.close();server.kill();}
});
