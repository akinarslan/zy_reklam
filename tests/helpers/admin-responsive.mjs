import { readFile } from 'node:fs/promises';

export const viewports = [[360,800],[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1280,720],[1366,768],[1440,900],[1536,864],[1600,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160]].map(([width,height])=>({width,height}));

// Frontend fixtures only: every admin API request is intercepted, including mutations.
export async function mockAdmin(page) {
  const read = async name => JSON.parse(await readFile(new URL('../../src/content/'+name+'.json',import.meta.url),'utf8'));
  const [site,services,projects,promotions,seo] = await Promise.all(['site','services','projects','promotions','seo'].map(read));
  let content = {site:site.site,services,projects,promotions,seo};
  const baseline = structuredClone(content);
  const image = services.groups.flatMap(g=>g.services).find(s=>s[3])?.[3] || '/assets/brand/zy-reklam-wordmark.svg';
  const files = Array.from({length:24},(_,i)=>({
    path:'public/assets/images/services/responsive-fixture-'+i+'-uzun-dosya-adi.webp',
    mimeType:'image/webp',mediaType:'image',size:12345,folder:'services',
    pending:i===0,pendingDelete:false,previewUrl:image,usage:i%2?[]:['Hizmetler · Tabela · Ön görsel']
  }));
  const video=projects.videos[0];
  if(video)files[23]={...files[23],path:'public/assets/videos/responsive-fixture.mp4',mimeType:'video/mp4',mediaType:'video',previewUrl:video.src};
  const seen=[];
  await page.route('**/api/admin/**',async route=>{
    const request=route.request(), path=new URL(request.url()).pathname;
    seen.push({path,method:request.method()});
    let data;
    if(path.endsWith('/session')) data={authenticated:true,username:'responsive-fixture',csrfToken:'fixture-only'};
    else if(path.endsWith('/draft')) data={...content,publishedContent:baseline};
    else if(path.endsWith('/media')) data={files};
    else if(path.endsWith('/publish-log')) data={entries:[]};
    else if(path.endsWith('/status')) data={lastPublish:null,hasPendingDraft:true,changedSections:['site'],pendingMedia:1,deletedMedia:0};
    else if(path.endsWith('/content')&&request.method()==='PUT'){content=request.postDataJSON().content;data={ok:true};}
    else throw Error('Unexpected mocked admin request: '+request.method()+' '+path);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  return seen;
}

export async function adminMetrics(page) {
 return page.evaluate(()=>{
  const rect=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
  const columns=selector=>getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(' ').length;
  return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,content:rect('.admin-content'),topbar:rect('.admin-topbar'),nav:rect('.admin-nav'),panel:rect('#dashboard-panel'),header:rect('.admin-header'),formColumns:columns('#services-panel .form-grid'),miniColumns:columns('.mini-grid'),mediaColumns:columns('.media-grid'),dashboardColumns:columns('.dashboard-stats'),maxStatWidth:Math.max(...[...document.querySelectorAll('.stat-card')].map(e=>e.getBoundingClientRect().width)),fieldOverflow:[...document.querySelectorAll('.field input,.field textarea,.field select')].some(e=>e.getBoundingClientRect().right>innerWidth+1),textWidth:Math.max(...[...document.querySelectorAll('.field textarea')].map(e=>e.getBoundingClientRect().width)),wideWidth:Math.max(...[...document.querySelectorAll('.field-wide')].map(e=>e.getBoundingClientRect().width))};
 });
}
