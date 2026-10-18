import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { chromium } from 'playwright';
import { viewports, mockAdmin, adminMetrics } from './helpers/admin-responsive.mjs';
import { verifyAdminLogin } from './helpers/admin-login.mjs';

let server,browser,base;
const measurements=[];
before(async()=>{
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 base='http://127.0.0.1:'+port;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore',windowsHide:true});
 for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('Admin preview failed');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await mkdir('docs/evidence/responsive',{recursive:true});
 browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
});
after(async()=>{await browser?.close();server?.kill();await writeFile('docs/evidence/responsive/admin-measurements.json',JSON.stringify(measurements,null,2));console.log('Admin responsive measurements: '+JSON.stringify(measurements));});

test('Mocked admin: aligned shell, bounded forms/media, menu and publishing across 15 viewports',async()=>{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const requests=await mockAdmin(page);
 await page.goto(base+'/admin/');
 await page.locator('#dashboard-panel').waitFor();
 for(const viewport of viewports){
  await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));await page.evaluate(()=>scrollTo(0,0));
  const m=await adminMetrics(page);measurements.push(m);
  assert.ok(m.documentWidth<=viewport.width,JSON.stringify(m));
  assert.equal(m.fieldOverflow,false,JSON.stringify(m));
  assert.ok(m.textWidth<=1201&&m.wideWidth<=1201,JSON.stringify(m));
  assert.ok(m.formColumns<=4&&m.miniColumns<=4,JSON.stringify(m));
  if(viewport.width>=1920)assert.equal(m.formColumns,viewport.width>=2560?4:3,JSON.stringify(m));
  assert.ok(m.maxStatWidth<=560,JSON.stringify(m));
  for(const shell of [m.content,m.topbar])assert.ok(shell.left>=0&&shell.right<=viewport.width,JSON.stringify(m));
  if(viewport.width>=1920){
   const expected=viewport.width>=3440?2560:viewport.width>=2560?2240:1800;
   for(const shell of [m.content,m.topbar,m.nav])assert.ok(Math.abs(shell.width-expected)<=1,JSON.stringify(m));
   assert.ok(Math.abs(m.content.left-m.topbar.left)<=1&&Math.abs(m.content.left-m.nav.left)<=1);
  }
  const range=viewport.width>=3440?[8,10]:viewport.width>=2560?[6,8]:viewport.width>=1920?[5,6]:viewport.width>=1440?[4,5]:null;
  if(range)assert.ok(m.mediaColumns>=range[0]&&m.mediaColumns<=range[1],JSON.stringify(m));
  assert.equal(m.dashboardColumns,viewport.width<=600?1:viewport.width<=1023?2:4);
  if(viewport.width<=1100){
   await page.locator('.menu-toggle').click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   const nav=await page.locator('.admin-nav').boundingBox();assert.ok(nav.x>=0&&nav.x+nav.width<=viewport.width);
   assert.ok((await page.locator('.admin-nav button').first().boundingBox()).height>=44);
   if([390,768].includes(viewport.width))await page.screenshot({path:'docs/evidence/responsive/admin-'+viewport.width+'-menu.png'});
   await page.locator('[data-target="services"]').click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   const panel=await page.locator('#services-panel').boundingBox();assert.ok(panel.y>=m.header.bottom-1);
  }else{assert.equal(await page.locator('.admin-nav').isVisible(),true);assert.equal(await page.locator('.admin-nav button').count(),12);}
  if([390,768,1440,1920,2560,3440,3840].includes(viewport.width)){
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'docs/evidence/responsive/admin-'+viewport.width+'.png'});
  }
  if([390,768,2560].includes(viewport.width)){
   for(const section of ['dashboard','services','media','publishing']){
    await page.locator('#'+section+'-panel').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-document.querySelector('.admin-header').getBoundingClientRect().height-20));
    await page.screenshot({path:'docs/evidence/responsive/admin-'+viewport.width+'-'+section+'.png'});
   }
   await page.locator('#media-file').setInputFiles({name:'responsive.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64')});
   await page.waitForFunction(()=>document.querySelector('#media-width').value==='1');
   await page.locator('#media-upload-form').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-document.querySelector('.admin-header').getBoundingClientRect().height-20));
   const preview=await page.locator('#upload-preview img').boundingBox();
   assert.ok(preview.x>=0&&preview.x+preview.width<=viewport.width);
   await page.screenshot({path:'docs/evidence/responsive/admin-'+viewport.width+'-upload.png'});
   await page.locator('[data-action="publish"]').click();
   const dialog=page.locator('#publish-dialog[open]');await dialog.waitFor();
   const b=await dialog.boundingBox();assert.ok(b.x>=0&&b.x+b.width<=viewport.width&&b.height<=viewport.height*.9);
   const bounds=await dialog.evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert.ok(bounds.scroll<=bounds.client);
   await page.screenshot({path:'docs/evidence/responsive/admin-'+viewport.width+'-dialog.png'});
   await page.locator('[data-action="close-publish"]').click();
  }
 }
 assert.deepEqual(errors,[]);
 assert.equal(requests.some(r=>r.path.endsWith('/publish')),false,'Responsive test must never publish');
 await page.close();
});

test('Admin login stays single-column with full-width controls across nine viewports',async()=>{
 await verifyAdminLogin(browser,base,'docs/evidence/admin-login/local',{mockSession:true});
});
