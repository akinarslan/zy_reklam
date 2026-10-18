import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

export const loginViewports=[[390,844],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]];

export async function verifyAdminLogin(browser,base,output,{mockSession=false,viewports=loginViewports}={}) {
 await mkdir(output,{recursive:true});
 const page=await browser.newPage(),rows=[],errors=[],mutations=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/admin/')&&request.method()!=='GET')mutations.push(request.method()+' '+request.url());});
 if(mockSession)await page.route('**/api/admin/**',async route=>{
  assert.equal(new URL(route.request().url()).pathname,'/api/admin/session');
  assert.equal(route.request().method(),'GET');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,username:null,csrfToken:null})});
 });
 try {
  for(const [width,height]of viewports){
   await page.setViewportSize({width,height});
   assert.equal((await page.goto(base+'/admin/')).status(),200);
   await page.locator('#login-form').waitFor();await page.evaluate(()=>document.fonts.ready);
   const row=await page.evaluate(()=>{
    const form=document.querySelector('#login-form'),panel=form.closest('.panel');
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const textLines=e=>{const range=document.createRange();range.selectNodeContents(e);return [...range.getClientRects()].filter(r=>r.width>0&&r.height>0).length;};
    const button=form.querySelector('button'),status=form.querySelector('.status-box');
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,columns:getComputedStyle(form).gridTemplateColumns.split(' ').length,form:rect(form),panel:rect(panel),panelMaxWidth:getComputedStyle(panel).maxWidth,fields:[...form.querySelectorAll('input')].map(e=>({name:e.name,...rect(e)})),button:rect(button),status:rect(status),buttonLines:textLines(button),statusLines:textLines(status),order:[...form.children].map(e=>e.querySelector('input')?.name||e.tagName.toLowerCase())};
   });
   assert.equal(row.columns,1,JSON.stringify(row));assert.ok(row.documentWidth<=width,JSON.stringify(row));
   assert.equal(row.panelMaxWidth,'480px');assert.ok(Math.abs(row.panel.x+row.panel.width/2-width/2)<=1);assert.ok(Math.abs(row.panel.y+row.panel.height/2-height/2)<=1);
   assert.deepEqual(row.order,['username','password','button','div']);
   for(const box of [...row.fields,row.button,row.status]){assert.ok(Math.abs(box.width-row.form.width)<=1,JSON.stringify(row));assert.ok(Math.abs(box.x-row.form.x)<=1,JSON.stringify(row));}
   assert.equal(row.buttonLines,1,JSON.stringify(row));assert.equal(row.statusLines,1,JSON.stringify(row));assert.ok(row.button.y>=row.fields[1].bottom&&row.status.y>=row.button.bottom);
   rows.push({...row,passed:true});
   if([390,1920,2560,3840].includes(width))await page.screenshot({path:output+'/admin-login-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);
  await writeFile(output+'/acceptance.json',JSON.stringify({base,rows,errors,mutations,passed:true},null,2));return rows;
 }finally{await page.close();}
}
