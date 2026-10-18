import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {canonical} from '../../src/content/live/protocol.js';
const hash=text=>createHash('sha256').update(text).digest('hex');
const changed=(manifest,section,value,revision)=>{
 const text=canonical(value),digest=hash(text),next=structuredClone(manifest);
 next.revision=revision.repeat(40);next.sections[section]={hash:digest,url:`/live-content/${section}.${digest}.json`};
 return {manifest:next,text,url:next.sections[section].url};
};
function replaceText(value,oldText,newText) {
 if(typeof value==='string')return value.replaceAll(oldText,newText);
 if(Array.isArray(value))return value.map(item=>replaceText(item,oldText,newText));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='key'?item:replaceText(item,oldText,newText)]));
 return value;
}
export async function verifyLiveContent(browser,base,output) {
 const baseline=await (await fetch(base+'/content-version.json')).json();
 const originals=Object.fromEntries(await Promise.all(Object.entries(baseline.sections).map(async([section,entry])=>[section,await(await fetch(base+entry.url)).json()])));
 const originalTitle=originals.services.pages['/'][0].children.find(item=>typeof item!=='string').children.find(item=>typeof item!=='string'&&item.tag==='div').children.find(item=>typeof item!=='string'&&item.tag==='h3').children.join('');
 const serviceB=replaceText(originals.services,originalTitle,'Live service B');
 const B=changed(baseline,'services',serviceB,'b');
 const C=changed(baseline,'services',replaceText(originals.services,originalTitle,'Live service C'),'c');
 const pages=[],records=[];
 async function fixture(path='/',options={}) {
  const page=await browser.newPage({reducedMotion:options.webgl?'no-preference':'reduce',viewport:{width:options.mobile?390:1440,height:900},hasTouch:!!options.mobile});pages.push(page);
  const state={manifest:baseline,manifestError:null,jsonError:null,calls:[],jsonCalls:[],slow:null};
  await page.route('**/content-version.json',async route=>{
   state.calls.push(route.request().url());
   if(state.manifestError==='offline')return route.abort('internetdisconnected');
   if(state.manifestError==='404')return route.fulfill({status:404,body:'missing'});
   if(state.manifestError==='json')return route.fulfill({contentType:'application/json',body:'{'});
   await route.fulfill({contentType:'application/json',body:canonical(state.manifest)});
  });
  await page.route('**/live-content/*.json',async route=>{
   const path=new URL(route.request().url()).pathname;state.jsonCalls.push(path);
   if(state.slow&&path===state.slow.url){const slow=state.slow;state.slow=null;await slow.wait;try{await route.fulfill({contentType:'application/json',body:slow.text});}catch{}return;}
   if(state.jsonError==='404')return route.fulfill({status:404,body:'missing'});
   if(state.jsonError==='json')return route.fulfill({contentType:'application/json',body:'{'});
   const text=state.snapshots?.[path]??(path===B.url?B.text:path===C.url?C.text:null);
   if(text)return route.fulfill({contentType:'application/json',body:text});
   return route.continue();
  });
  await page.clock.install();
  await page.goto(base+path);
  if(options.webgl)await page.waitForSelector('canvas',{timeout:20000});
  await page.evaluate(()=>{
   window.liveIdentity={form:document.querySelector('form'),canvas:document.querySelector('canvas'),hero:document.querySelector('.hero'),nav:document.querySelector('#main-nav')};
   window.liveNavigations=0;window.addEventListener('beforeunload',()=>window.liveNavigations++);
  });
  const tick=async(ms=45001)=>{await page.clock.fastForward(ms);await page.waitForTimeout(100);};
  const title=()=>page.locator('[data-service-menu] h3').first().textContent();
  return {page,state,tick,title};
 }
 try {
  // Same version produces just the small check; no JSON. Then only services
  // changes and the same keyed anchor is patched without navigation.
  const f=await fixture();
  await f.tick();assert.equal(f.state.calls.length,1);assert.equal(f.state.jsonCalls.length,0);
  await f.page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,500);window.liveIdentity.card=document.querySelector('[data-service-menu] .service-menu-card');window.liveScroll=scrollY;});
  f.state.manifest=B.manifest;await f.tick();
  await f.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');
  assert.deepEqual(f.state.jsonCalls,[B.url]);
  assert.ok(await f.page.evaluate(()=>liveIdentity.form===document.querySelector('form')&&liveIdentity.hero===document.querySelector('.hero')&&liveIdentity.card===document.querySelector('[data-service-menu] .service-menu-card')&&scrollY===liveScroll&&liveNavigations===0));
  await f.tick();assert.equal(f.state.jsonCalls.length,1);records.push('A→B; same version/hash; section-only fetch; keyed identity; scroll; no reload');

  // Every failure preserves A; a valid retry then applies B.
  for(const error of ['offline','404','json','schema','json404','jsonBroken','unsafe','hash']) {
   const f=await fixture();f.state.manifest=B.manifest;
   if(['offline','404','json'].includes(error))f.state.manifestError=error;
   if(error==='schema')f.state.manifest={...B.manifest,schemaVersion:2};
   if(error==='json404')f.state.jsonError='404';
   if(error==='jsonBroken')f.state.jsonError='json';
   if(error==='hash')f.state.snapshots={[B.url]:B.text+' '};
   if(error==='unsafe') {
    const unsafe=structuredClone(serviceB);unsafe.pages['/'][0].children.find(item=>typeof item!=='string').attrs.href='javascript:alert(1)';
    const bad=changed(baseline,'services',unsafe,'d');f.state.manifest=bad.manifest;f.state.snapshots={[bad.url]:bad.text};
   }
   await f.tick();assert.equal(await f.title(),originalTitle,error);
   f.state.manifest=B.manifest;f.state.manifestError=null;f.state.jsonError=null;f.state.snapshots={};await f.tick();
   await f.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');
   await f.page.close();records.push(error+' preserves DOM and retry recovers');
  }

  // Dirty forms stay protected even after blur. Reset explicitly releases
  // that lock without replacing the form or losing a focused caret.
  const form=await fixture();
  const input=form.page.locator('#contact-name');await input.fill('Özel müşteri');
  await input.evaluate(element=>element.setSelectionRange(2,6));
  form.state.manifest=B.manifest;await form.tick();assert.equal(await form.title(),originalTitle);
  assert.equal(await input.inputValue(),'Özel müşteri');
  assert.deepEqual(await input.evaluate(element=>[element.selectionStart,element.selectionEnd]),[2,6]);
  form.state.manifest=C.manifest;await form.tick();assert.equal(await form.title(),originalTitle);
  await input.blur();await form.tick();assert.equal(await form.title(),originalTitle);
  await form.page.locator('form').evaluate(element=>element.reset());await form.tick(1000);
  await form.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service C');
  assert.ok(await form.page.evaluate(()=>liveIdentity.form===document.querySelector('form')));records.push('dirty form, focus/caret, blur protection, reset release');

  const menu=await fixture('/',{mobile:true});await menu.page.locator('[data-nav-toggle]').click();
  menu.state.manifest=B.manifest;await menu.tick();assert.equal(await menu.title(),originalTitle);
  assert.equal(await menu.page.locator('[data-nav-toggle]').getAttribute('aria-expanded'),'true');
  await menu.page.locator('[data-nav-toggle]').click();await menu.tick(1000);
  await menu.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');records.push('mobile menu state and deferred apply');

  const dialog=await fixture();await dialog.page.evaluate(()=>{const d=document.createElement('dialog');d.id='live-test-dialog';d.textContent='Open dialog';document.body.appendChild(d);d.showModal();window.liveIdentity.dialog=d;});
  dialog.state.manifest=B.manifest;await dialog.tick();assert.equal(await dialog.title(),originalTitle);
  assert.ok(await dialog.page.evaluate(()=>liveIdentity.dialog===document.querySelector('dialog')&&liveIdentity.dialog.open));
  await dialog.page.locator('dialog').evaluate(element=>element.close());await dialog.tick(1000);
  await dialog.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');records.push('open dialog identity and deferred apply');

  const visibility=await fixture();
  await visibility.page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.testVisibility??'visible'});window.testVisibility='hidden';document.dispatchEvent(new Event('visibilitychange'));});
  await visibility.tick(180000);assert.equal(visibility.state.calls.length,0);
  visibility.state.manifest=B.manifest;
  await visibility.page.evaluate(()=>{window.testVisibility='visible';document.dispatchEvent(new Event('visibilitychange'));});
  await visibility.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');
  assert.equal(visibility.state.calls.length,1);records.push('hidden pause; visible immediate single check');

  const race=await fixture();let release;const wait=new Promise(resolve=>release=resolve);
  race.state.manifest=B.manifest;race.state.slow={url:B.url,text:B.text,wait};await race.tick();
  race.state.manifest=C.manifest;
  await race.page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.testVisibility??'visible'});window.testVisibility='hidden';document.dispatchEvent(new Event('visibilitychange'));window.testVisibility='visible';document.dispatchEvent(new Event('visibilitychange'));});
  await race.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service C');
  release();await race.page.waitForTimeout(200);assert.equal(await race.title(),'Live service C');records.push('late B cannot overwrite C');

  const canvas=await fixture('/3d-vitrin/',{webgl:true});
  const box=await canvas.page.locator('canvas').boundingBox();
  await canvas.page.mouse.move(box.x+box.width/2,box.y+box.height/2);await canvas.page.mouse.down();
  canvas.state.manifest=B.manifest;await canvas.tick();assert.equal(await canvas.title(),originalTitle);
  await canvas.page.mouse.up();await canvas.page.mouse.move(5,200);await canvas.tick(1000);
  await canvas.page.waitForFunction(()=>document.querySelector('[data-service-menu] h3').textContent==='Live service B');
  assert.ok(await canvas.page.evaluate(()=>liveIdentity.canvas===document.querySelector('canvas')&&liveNavigations===0));records.push('real WebGL canvas identity and pointer deferral');

  for(const [section,path,titleSelector] of [
    ['services','/hizmetler/tabela-yonlendirme/','.service-category-hero h1'],
    ['projects','/projeler/tabela/','.promo-category-intro h1'],
    ['promotions','/promosyonlar/ofis-kirtasiye/','.promo-category-intro h1']
  ]) {
    const category=await fixture(path);
    const title=await category.page.locator(titleSelector).textContent();
    const text='Live <img src=x onerror=alert(1)> '+section;
    const update=changed(baseline,section,replaceText(originals[section],title,text),'e');
    category.state.manifest=update.manifest;category.state.snapshots={[update.url]:update.text};await category.tick();
    await category.page.waitForFunction(({selector,text})=>document.querySelector(selector).textContent===text,{selector:titleSelector,text});
    assert.equal(await category.page.locator(titleSelector+' img').count(),0);
    assert.deepEqual(category.state.jsonCalls,[update.url]);records.push(section+' category title/text; literal text sanitation');
  }
  const contact=await fixture();
  const contactData=structuredClone(originals.site);contactData.data={phone:'+905551112233',address:'New public address',instagram:'https://www.instagram.com/zy.reklam/',footerText:'New footer'};
  const contactUpdate=changed(baseline,'site',contactData,'f');contact.state.manifest=contactUpdate.manifest;contact.state.snapshots={[contactUpdate.url]:contactUpdate.text};await contact.tick();
  await contact.page.waitForFunction(()=>document.querySelector('.footer address').textContent==='New public address');
  assert.equal(await contact.page.locator('.contact-phone').getAttribute('href'),'tel:+905551112233');
  assert.equal(await contact.page.locator('.footer-bottom>p').first().textContent(),'New footer');
  assert.ok(await contact.page.evaluate(()=>liveIdentity.form===document.querySelector('form')));
  assert.deepEqual(contact.state.jsonCalls,[contactUpdate.url]);records.push('site contact/address/footer/WhatsApp target; only site fetched');

  const video=await fixture('/projeler/totem/');
  const player=video.page.locator('video').first();
  await player.evaluate(async element=>{window.liveIdentity.video=element;element.muted=true;await element.play();});
  const projectUpdate=changed(baseline,'projects',replaceText(originals.projects,'Tasarım ve uygulama örneği','New project label'),'e');
  video.state.manifest=projectUpdate.manifest;video.state.snapshots={[projectUpdate.url]:projectUpdate.text};await video.tick();
  assert.equal(await video.page.locator('.project-example-label').first().textContent(),'Tasarım ve uygulama örneği');
  const playbackTime=await player.evaluate(element=>{element.pause();return element.currentTime;});await video.tick(1000);
  await video.page.waitForFunction(()=>document.querySelector('.project-example-label').textContent==='New project label');
  assert.ok(await video.page.evaluate(()=>liveIdentity.video===document.querySelector('video')));
  assert.ok(Math.abs(await player.evaluate(element=>element.currentTime)-playbackTime)<.1);records.push('playing video deferred; paused video identity/time retained');

  // Full, indexed static content stays usable without JavaScript.
  const nojs=await browser.newPage({javaScriptEnabled:false});pages.push(nojs);
  for(const path of ['/','/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/']) {
   await nojs.goto(base+path);assert.ok(await nojs.locator('h1').textContent());assert.ok(await nojs.locator('link[rel="canonical"]').getAttribute('href'));assert.ok(await nojs.locator('.header-sign').isVisible());
  }
  records.push('JS disabled initial HTML/SEO');
  await mkdir(output,{recursive:true});await writeFile(output+'/acceptance.json',JSON.stringify({base,records,pass:true},null,2));
  return records;
 }finally{for(const page of pages)await page.close();}
}
