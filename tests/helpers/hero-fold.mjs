import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {gpuTimingFailure,observeGpuPage} from './gpu-policy.mjs';

export const foldViewports = [[360,800],[390,844],[412,915],[768,1024],[820,1180],[834,1194],[1024,768],[1024,1366],[1280,720],[1366,768],[1440,900],[1536,864],[1600,900],[1900,1000],[1920,1080],[2560,1440],[3440,1440],[3840,2160]];

export async function verifyHeroFold(browser,base,output,{probe=false,stress=false,viewports=foldViewports}={}) {
  await mkdir(output,{recursive:true});
  const page=await browser.newPage({reducedMotion:probe?'reduce':'no-preference'}),rows=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  observeGpuPage(page);
  try {
    for (const [width,height] of viewports) {
      await page.setViewportSize({width,height});
      assert.equal((await page.goto(base+'/')).status(),200);
      await page.evaluate(()=>document.fonts.ready);
      if(!probe)await page.waitForFunction(()=>document.querySelector('[data-hero-stage]')?.dataset.sceneState==='ready');
      const row=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
        const next=document.querySelector('.brand-showcase'),style=getComputedStyle(next);
        const labels=['#hero-title','.hero-intro','.hero-note','.hero .sign-stage','.object-caption','.hero-bottom','.hero-bottom .motion-button'];
        return {caption:document.querySelector('.object-caption').textContent.trim(),actions:document.querySelectorAll('.hero .actions').length,width:innerWidth,height:innerHeight,scrollY,documentWidth:document.documentElement.scrollWidth,hero:rect(document.querySelector('.hero')),header:rect(document.querySelector('.header')),next:{...rect(next),display:style.display,visibility:style.visibility,opacity:parseFloat(style.opacity)},parts:Object.fromEntries(labels.map(s=>[s,rect(document.querySelector(s))])),whatsapp:rect(document.querySelector('.whatsapp-float')),canvas:document.querySelectorAll('[data-hero-stage] canvas').length,showroom:document.querySelectorAll('[data-showroom-stage], [data-showroom-mount] canvas').length,scene:document.querySelector('[data-hero-stage]').dataset.sceneState};
      });
      rows.push(row);
      const name=width===1024?'1024-'+(height>width?'portrait':'landscape'):width;
      if(stress)await page.evaluate(()=>window.gpuProbeCanvas=document.querySelector('[data-hero-stage] canvas'));
      if(stress||width<=1920)try{await page.screenshot({path:`${output}/home-first-fold-${name}.png`});}catch(error){if(stress)await gpuTimingFailure(error,page,'png-readback');throw error;}
      if(!probe){
        assert.equal(row.scrollY,0);assert.equal(row.actions,0,'intentional CTA removal');assert.equal(row.caption,'','intentional caption/hint removal');
        assert.ok(row.next.top>=height-1,JSON.stringify(row));
        assert.ok(Math.abs(row.hero.bottom-height)<2,JSON.stringify(row));
        assert.ok(row.documentWidth<=width,JSON.stringify(row));
        assert.notEqual(row.next.display,'none');assert.notEqual(row.next.visibility,'hidden');assert.ok(row.next.opacity>0 && row.next.height>0);
        assert.equal(row.canvas,1);assert.equal(row.showroom,0);
        for(const [name,r] of Object.entries(row.parts)){
          assert.ok(r.height>0 && r.top>=row.header.bottom-1 && r.bottom<=height+1 && r.left>=-1 && r.right<=width+1,`${name} out of fold ${JSON.stringify(row)}`);
        }
        const motion=row.parts['.hero-bottom .motion-button'], wa=row.whatsapp;
        assert.ok(motion.right<=wa.left || motion.bottom<=wa.top || motion.left>=wa.right || motion.top>=wa.bottom,`WhatsApp overlaps motion button ${JSON.stringify(row)}`);
        const next=page.locator('.brand-showcase');
        await next.scrollIntoViewIfNeeded();
        assert.ok(await next.isVisible());
        assert.equal(await page.locator('#brand-showcase-title').textContent(),'Markanız ışıkta. Markanız yolda.');
        assert.ok(await next.evaluate(e=>{const r=e.getBoundingClientRect();return r.height>0 && r.top<innerHeight && r.bottom>document.querySelector('.header').getBoundingClientRect().bottom;}));
        assert.equal(await next.locator('.real-lightbox').count(),1);assert.equal(await next.locator('.real-car-reference').count(),1);
        row.afterScroll=true;
      }
      console.log('FIRST_FOLD',width,height,row.next.top,row.hero.bottom,probe?'probe':'PASS');
    }
    assert.deepEqual(errors,[]);
    await writeFile(`${output}/acceptance.json`,JSON.stringify({base,rows,errors},null,2));
    return rows;
  } finally {await page.close();}
}
