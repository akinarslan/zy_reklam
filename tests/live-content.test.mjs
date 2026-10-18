import {test} from 'node:test';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {chromium} from 'playwright';
import {verifyLiveContent} from './helpers/live-content.mjs';
test('B: live content A/B, failures/races, visibility and protected DOM identities',async()=>{
 const port=await new Promise(resolve=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore',windowsHide:true});let browser;
 try{const base=`http://127.0.0.1:${port}`;for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined});const records=await verifyLiveContent(browser,base,'docs/evidence/live-content/local');console.log(records);
 }finally{await browser?.close();server.kill();}
});
