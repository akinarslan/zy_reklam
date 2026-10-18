import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

export const navViewports = [[360,800],[390,844],[412,915],[768,1024],[820,1180],[834,1194],[1024,768],[1024,1366],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]];

export async function verifyPublicNavigation(browser, base, output) {
  await mkdir(output, {recursive:true});
  const records = [], errors = [];
  for (const path of ['/', '/3d-vitrin/']) {
    const page = await browser.newPage({reducedMotion:'reduce'});
    page.on('pageerror', error => errors.push(error.message));
    for (const [width,height] of navViewports) {
      await page.setViewportSize({width,height});
      assert.equal((await page.goto(base + path)).status(), 200);
      await page.evaluate(() => document.fonts.ready);
      const mobile = width < 1024;
      const toggle = page.locator('[data-nav-toggle]');
      assert.equal(await toggle.isVisible(), mobile);
      if (mobile) await toggle.click();
      const measurement = await page.evaluate(() => {
        const read = selector => {
          const e=document.querySelector(selector), s=getComputedStyle(e), r=e.getBoundingClientRect();
          return {fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,padding:s.padding,height:r.height,fontFamily:s.fontFamily};
        };
        const header=document.querySelector('.header'), r=header.getBoundingClientRect();
        return {width:innerWidth,workshop:read('.nav-workshop-link'),services:read('[data-service-menu]>summary'),projects:read('[data-project-menu]>summary'),promotions:read('[data-promo-menu]>summary'),header:{height:r.height,top:r.top,position:getComputedStyle(header).position},scrollPadding:parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),documentWidth:document.documentElement.scrollWidth};
      });
      assert.deepEqual(measurement.workshop, measurement.services, JSON.stringify(measurement));
      assert.deepEqual(measurement.workshop, measurement.projects, JSON.stringify(measurement));
      assert.deepEqual(measurement.workshop, measurement.promotions, JSON.stringify(measurement));
      assert.equal(measurement.workshop.fontWeight, '400');
      assert.equal(measurement.workshop.fontSize, mobile?'19px':'17px');
      assert.equal(measurement.header.position, 'sticky');
      assert.ok(measurement.scrollPadding >= measurement.header.height + 16);
      assert.ok(measurement.documentWidth <= width);
      // Capture the actual text alongside the dropdown labels, before scrolling.
      await page.screenshot({path:`${output}/${path==='/'?'home':'vitrine'}-${width}.png`});
      if (mobile) await toggle.click();

      const positions=[];
      for (const position of ['start','middle','footer']) {
        await page.evaluate(position => {
          const max=document.documentElement.scrollHeight-innerHeight;
          scrollTo({top:position==='start'?0:position==='middle'?max/2:max,behavior:'instant'});
        }, position);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const m=await page.locator('.header').evaluate(e => {
          const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,scrollY};
        });
        assert.ok(Math.abs(m.top)<1 && m.bottom>0 && m.bottom<=height, JSON.stringify(m));
        positions.push({position,...m});
      }
      if (mobile) {
        await toggle.click();
        for (const y of [800,1200]) {
          await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
          const m=await page.locator('#main-nav').evaluate(e=>{
            const r=e.getBoundingClientRect(),h=document.querySelector('.header').getBoundingClientRect();
            return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,headerTop:h.top,headerBottom:h.bottom};
          });
          assert.ok(Math.abs(m.headerTop)<1 && Math.abs(m.top-m.headerBottom)<=1);
          assert.ok(m.left>=0 && m.right<=width && m.bottom<=height+1);
        }
      }
      for (const selector of ['[data-service-menu]','[data-project-menu]','[data-promo-menu]']) {
        const dropdown=page.locator(selector), summary=dropdown.locator('summary');
        if (mobile) await summary.click(); else await summary.hover();
        assert.equal(await dropdown.evaluate(e=>e.open),true);
        const bounds=await dropdown.locator('.promo-mega').evaluate(e=>{
          const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
        });
        assert.ok(bounds.left>=-1 && bounds.right<=width+1,JSON.stringify(bounds));
        if (!mobile) assert.ok(bounds.top>=measurement.header.height-3 && bounds.bottom<=height+1,JSON.stringify(bounds));
        if ([390,768,1440,2560].includes(width) && selector==='[data-service-menu]') {
          await page.screenshot({path:`${output}/${path==='/'?'home':'vitrine'}-services-${width}.png`});
        }
        // The last category remains reachable in both the mobile scroll panel and desktop mega menu.
        const last=dropdown.locator('.promo-mega a').last();
        await last.scrollIntoViewIfNeeded();assert.ok(await last.isVisible());
        await page.keyboard.press('Escape');assert.equal(await dropdown.evaluate(e=>e.open),false);
        assert.equal(await summary.evaluate(e=>document.activeElement===e),true);
      }
      if (mobile) {
        await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      }
      // A genuinely long scroll is possible even on the shorter standalone page.
      await page.setViewportSize({width,height:360});
      await page.evaluate(()=>scrollTo({top:1000,behavior:'instant'}));
      const longScroll=await page.locator('.header').evaluate(e=>({y:scrollY,top:e.getBoundingClientRect().top}));
      assert.ok(longScroll.y>800,JSON.stringify({path,width,...longScroll}));
      assert.ok(Math.abs(longScroll.top)<1);
      await page.setViewportSize({width,height});

      if (path==='/') {
        for (const id of ['hakkinda','projeler','promosyonlar','iletisim']) {
          await page.goto(base+'/#'+id);
          await page.waitForFunction(id=>{
            const section=document.getElementById(id), header=document.querySelector('.header');
            return section.getBoundingClientRect().top>=header.getBoundingClientRect().bottom+15;
          },id);
        }
      } else {
        if (mobile) await toggle.click();
        await page.locator('.nav-workshop-link').click();
        await page.waitForURL('**/#hakkinda');
        await page.waitForFunction(()=>document.getElementById('hakkinda').getBoundingClientRect().top>=document.querySelector('.header').getBoundingClientRect().bottom+15);
        await page.goto(base+path);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      records.push({path,...measurement,positions,longScroll,megaMenus:true,anchors:true,mobile});
    }
    await page.close();
  }
  // Representative generated pages use the same shared header and active behavior.
  const category=await browser.newPage({reducedMotion:'reduce'});
  for (const path of ['/hizmetler/tabela-yonlendirme/','/projeler/tabela/','/promosyonlar/ofis-kirtasiye/']) {
    await category.goto(base+path);assert.equal(await category.locator('.nav-workshop-link').getAttribute('href'),'/#hakkinda');
    await category.evaluate(()=>scrollTo({top:1000,behavior:'instant'}));
    assert.ok(Math.abs(await category.locator('.header').evaluate(e=>e.getBoundingClientRect().top))<1);
  }
  await category.close();
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/acceptance.json`,JSON.stringify({base,records,errors},null,2));
  return records;
}
