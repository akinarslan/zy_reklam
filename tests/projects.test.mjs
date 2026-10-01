import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
const {categories}=JSON.parse(await readFile('src/content/projects.json','utf8'));
const base='http://127.0.0.1:4192';let server,browser;const checks=[];
before(async()=>{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4192','--strictPort'],{stdio:'ignore'});
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{} if(i===99)throw Error('Preview timeout');await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
});
after(async()=>{await browser?.close();server?.kill();await writeFile('docs/evidence/P2_PROJECTS_VERIFICATION.json',JSON.stringify({date:new Date().toISOString(),stage:'P2.8',checks},null,2)+'\n');});
test('İki mega menü: beş proje kartı, karşılıklı kapanma, klavye ve mobil dokunma',async()=>{
 for(const width of [360,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===360,isMobile:width===360,reducedMotion:'reduce'});await page.goto(base);
  const project=page.locator('[data-project-menu]'),promo=page.locator('[data-promo-menu]');
  if(width===360)await page.locator('[data-nav-toggle]').tap();
  await project.locator('summary')[width===360?'click':'hover']();assert.equal(await project.locator('.promo-menu-card').count(),5);
  await project.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width!==360) assert.equal(await project.locator('.project-menu-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),5);
  if(width===1440||width===360)await page.screenshot({path:`docs/evidence/projects-menu-${width}.png`});
  await page.keyboard.press('Escape');assert.equal(await project.locator('summary').evaluate(e=>document.activeElement===e),true);
  await page.keyboard.press('ArrowDown');assert.equal(await project.locator('a').first().evaluate(e=>document.activeElement===e),true);
  await promo.locator('summary')[width===360?'click':'hover']();assert.equal(await project.evaluate(e=>e.open),false);assert.equal(await promo.evaluate(e=>e.open),true);
  await project.locator('summary')[width===360?'click':'hover']();assert.equal(await promo.evaluate(e=>e.open),false);
  if(width===360){await project.locator('.promo-menu-card').nth(1).tap();await page.waitForURL('**/projeler/totem/');}
  else {await project.locator('summary').hover();assert.equal(await project.evaluate(e=>e.open),true);await project.locator('.promo-menu-card').first().click();await page.waitForURL('**/projeler/tabela/');}
  checks.push({check:'dual-menu',width,passed:true});await page.close();
 }
});
test('Beş proje sayfası: gerçek URL, tüm görseller, SEO, mobil düzen ve isteğe bağlı video',async()=>{
 for(const width of [360,1440])for(const cat of categories){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[],videos=[],renderers=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('.mp4'))videos.push(r.url());if(/renderer-.*\.js/.test(r.url()))renderers.push(r.url());});
  assert.equal((await page.goto(base+cat.href)).status(),200);assert.equal(await page.locator('h1').textContent(),cat.title);assert.equal(await page.locator('[aria-current="page"]').count(),1);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://zyreklamdijital.com.tr'+cat.href);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>{i.loading='eager';return i.decode();})));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);assert.deepEqual(renderers,[]);assert.deepEqual(videos,[]);
  assert.ok(await page.locator('.project-disclaimer').isVisible());
  if(await page.locator('video').count()){
   const v=page.locator('video');assert.equal(await v.getAttribute('preload'),'none');assert.equal(await v.getAttribute('autoplay'),null);
   await v.evaluate(e=>{e.load();});await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
   assert.ok(await v.evaluate(e=>e.duration>14&&e.duration<16));await v.evaluate(e=>e.play());await page.waitForFunction(()=>document.querySelector('video').currentTime>0.1);await v.evaluate(e=>e.pause());
   if(width===1440)await page.screenshot({path:`docs/evidence/projects-${cat.id}-1440.png`,fullPage:true});
  }
  checks.push({check:'direct-page',category:cat.id,width,passed:true});await page.close();
 }
});
test('JavaScript olmadan proje ve promosyon kategorileri arasında gezinme',async()=>{
 const p=await browser.newPage({javaScriptEnabled:false,viewport:{width:360,height:1000}});await p.goto(base);await p.locator('[data-project-menu] summary').click();await p.locator('[data-project-menu] .promo-menu-card').nth(4).click();await p.waitForURL('**/projeler/ozel-uretim/');assert.equal(await p.locator('h1').textContent(),'Özel Üretim');await p.locator('[data-promo-menu] summary').click();await p.locator('[data-promo-menu] .promo-menu-card').first().click();await p.waitForURL('**/promosyonlar/tekstil-giyim/');const sitemap=await(await p.request.get(base+'/sitemap.xml')).text();for(const c of categories)assert.ok(sitemap.includes(c.href));await p.close();checks.push({check:'no-js-cross-collection',passed:true});
});
