import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
export const stageViewports=[[360,800],[390,844],[412,915],[768,1024],[820,1180],[834,1194],[1024,768],[1024,1366],[1280,720],[1366,768],[1440,900],[1600,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]];
export async function verifyShowroomStage(browser,base,output){
 await mkdir(output,{recursive:true});const page=await browser.newPage(),rows=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const within=b=>b.left>=-1&&b.right<=1&&b.bottom>=-1&&b.top<=1&&b.near>=-1&&b.far<=1;
 for(const [width,height] of stageViewports){
  await page.setViewportSize({width,height});assert.equal((await page.goto(base+'/3d-vitrin/')).status(),200);
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');await page.evaluate(()=>document.fonts.ready);
  const m=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};return {viewportWidth:innerWidth,viewportHeight:innerHeight,headerHeight:rect('.header').height,header:rect('.header'),wrapper:rect('.showroom-stage-wrapper'),stage:rect('.showroom-stage'),canvas:rect('canvas'),heading:rect('.showroom-heading'),controls:rect('.showroom-controls'),instagram:rect('.instagram-float'),whatsapp:rect('.whatsapp-float'),projected:JSON.parse(document.querySelector('[data-showroom-stage]').dataset.projectedBounds),documentWidth:document.documentElement.scrollWidth,touchAction:getComputedStyle(document.querySelector('canvas')).touchAction};});
  assert.equal(m.wrapper.top,m.headerHeight);assert.ok(Math.abs(m.wrapper.bottom-height)<2);assert.ok(m.heading.top>=height);assert.ok(m.documentWidth<=width);assert.equal(m.touchAction,'pan-y');
  assert.ok(m.canvas.top>=m.header.bottom&&m.canvas.bottom<=height);assert.ok(m.controls.bottom<=height&&m.controls.top>=m.canvas.bottom);
  assert.equal(m.projected.length,3);m.projected.forEach(b=>assert.ok(within(b),JSON.stringify(m)));
  const separated=(a,b)=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top;
  for(const s of [m.instagram,m.whatsapp]){assert.ok(separated(s,m.canvas));assert.ok(separated(s,m.controls));}
  assert.ok(separated(m.instagram,m.whatsapp));
  // Bounding boxes are conservative, but distinct products must still occupy distinct screen areas.
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const x=m.projected[a],y=m.projected[b];assert.ok(x.right<=y.left||y.right<=x.left||x.top<=y.bottom||y.top<=x.bottom,JSON.stringify(m));}
  const suffix=width===1024?(height<width?'1024-landscape':'1024-portrait'):width;
  await page.mouse.move(0,0);await page.screenshot({path:output+'/3d-vitrin-'+suffix+'.png'});rows.push(m);
  await page.locator('#showroom-title').scrollIntoViewIfNeeded();assert.ok(await page.locator('#showroom-title').isVisible());assert.ok(Math.abs(await page.locator('.header').evaluate(e=>e.getBoundingClientRect().top))<1);
  console.log('FULL_STAGE_PASS',width,height);
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/3d-vitrin/');await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
 for(const [i,id] of ['upper','lower','totem'].entries()){
  const s=await page.locator('[data-showroom-stage]').boundingBox(),b=JSON.parse(await page.locator('[data-showroom-stage]').getAttribute('data-projected-bounds'))[i];
  await page.mouse.move(s.x+(1+(b.left+b.right)/2)*s.width/2,s.y+(1-(b.top+b.bottom)/2)*s.height/2);
  await page.waitForFunction(id=>document.querySelector('[data-showroom-stage]').dataset[id+'Active']==='true',id);
  await page.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.loop==='idle');
  JSON.parse(await page.locator('[data-showroom-stage]').getAttribute('data-projected-bounds')).forEach(b=>assert.ok(within(b),'Hover crops product'));
 }
 await page.close();
 const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await touch.goto(base+'/3d-vitrin/');await touch.waitForFunction(()=>document.querySelector('[data-showroom-stage]').dataset.state==='ready');
 const cdp=await touch.context().newCDPSession(touch);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:590}]});
 for(let y=550;y>=250;y-=50)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForFunction(()=>scrollY>50);await touch.close();
 assert.deepEqual(errors,[]);await writeFile(output+'/acceptance.json',JSON.stringify({base,rows,mouse:true,touchScroll:true,errors},null,2));
}
export async function verifySocialCube(browser,base,output){
 const rows=[];const page=await browser.newPage();
 for(const [width,height] of stageViewports){for(const path of ['/','/3d-vitrin/']){
  await page.setViewportSize({width,height});await page.goto(base+path);
  const link=page.locator('.instagram-float');assert.equal(await link.count(),1);assert.equal(await link.getAttribute('href'),'https://www.instagram.com/zy.reklam/');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await link.getAttribute('aria-label'),'ZY Reklam Instagram hesabını aç');
  const m=await link.evaluate(e=>{const r=e.getBoundingClientRect(),w=document.querySelector('.whatsapp-float').getBoundingClientRect(),s=getComputedStyle(e.querySelector('span'));return {width:innerWidth,height:innerHeight,left:r.left,right:r.right,top:r.top,bottom:r.bottom,size:r.width,waTop:w.top,waSize:w.width,animation:s.animationName,duration:s.animationDuration,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(m.left>=0&&m.right<=width&&m.top>=0&&m.bottom+10<=m.waTop&&!m.overflow);assert.equal(m.waSize,width<768?56:58);assert.equal(m.animation,'instagram-float');assert.equal(m.duration,'6s');
  if(path==='/')assert.ok(await page.evaluate(()=>{const ig=document.querySelector('.instagram-float').getBoundingClientRect();return [...document.querySelectorAll('#hero-title,.hero-intro,.hero .actions,.object-caption > *,.hero-bottom .motion-button')].every(e=>{const r=e.getBoundingClientRect();return r.right<=ig.left||r.left>=ig.right||r.bottom<=ig.top-4||r.top>=ig.bottom+4;});}),'Instagram obscures home content '+width+'x'+height);
  await link.focus();assert.equal(await link.evaluate(e=>document.activeElement===e),true);await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.equal(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');rows.push({path,...m});
 }}
 for(const path of ['/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/']){await page.goto(base+path);assert.equal(await page.locator('.instagram-float').count(),1);}
 await page.goto(base+'/');await page.locator('.instagram-float').hover();assert.equal(await page.locator('.instagram-cube').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.context().route('https://www.instagram.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'Instagram navigation test'}));
 const popup=page.waitForEvent('popup');await page.locator('.instagram-float').click();const opened=await popup;await opened.waitForLoadState();assert.ok(opened.url().startsWith('https://www.instagram.com/zy.reklam/'));await opened.close();
 await page.mouse.move(0,0);await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.instagram-cube')).animationName==='none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.documentElement.dataset.motion==='full');await page.locator('[data-motion-toggle]').click();assert.equal(await page.locator('.instagram-cube').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.close();const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base+'/');assert.ok(await nojs.locator('.instagram-float').isVisible());await nojs.close();
 await mkdir(output,{recursive:true});await writeFile(output+'/social.json',JSON.stringify({base,rows,reducedMotion:true,manualReducedMotion:true,noJavaScript:true},null,2));
}
