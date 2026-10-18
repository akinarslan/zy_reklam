import {test,before,after} from 'node:test';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {chromium} from 'playwright';
import {verifyShowroomStage,verifySocialCube} from './helpers/showroom-stage.mjs';
let browser,server,base;
before(async()=>{
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});base=`http://127.0.0.1:${port}`;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore',windowsHide:true});
 for(let n=0;n<100;n++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
});
after(async()=>{await browser?.close();server?.kill();});
test('Full showroom first viewport: 16 sizes, projected geometry bounds, retained copy and accessible controls',()=>verifyShowroomStage(browser,base,'docs/evidence/showroom-stage/local'));
test('Instagram cube: 32 page/viewport combinations, safe link, keyboard, motion and WhatsApp spacing',()=>verifySocialCube(browser,base,'docs/evidence/showroom-stage/local'));
