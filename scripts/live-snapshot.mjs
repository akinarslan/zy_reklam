import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {patchSite} from '../src/content/live/site.js';
import {canonical,sections,regionSelectors,validSnapshot,validManifest,validAttribute,tags} from '../src/content/live/protocol.js';

export const hash = text => createHash('sha256').update(text).digest('hex');
const childTrees = node => [...node.childNodes].map(tree).filter(item=>item!==null).reduce((items,item)=>{
  if(typeof item==='string'&&typeof items.at(-1)==='string')items[items.length-1]+=item;
  else items.push(item);
  return items;
},[]);
export function tree(node,index=0) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag=node.localName;
  if (!tags.has(tag)) throw Error(`Unsupported public tag ${tag}`);
  const attrs={};
  for (const attribute of node.attributes) {
    if (attribute.name === 'onerror') continue; // Existing static fallback is not executable snapshot data.
    if (!validAttribute(attribute.name,attribute.value)) throw Error(`Unsafe public attribute ${attribute.name}: ${attribute.value}`);
    attrs[attribute.name]=attribute.value;
  }
  const media=node.querySelector('video source, img');
  const key=attrs.id || attrs.href || attrs.src || media?.getAttribute('src') || `${tag}:${index}`;
  return {tag,key,attrs,children:childTrees(node)};
}
export async function createSnapshots(root,htmlFiles,revision) {
  const site=JSON.parse(await readFile(join(root,'src/content/site.json'),'utf8')).site;
  const data=Object.fromEntries(['phone','address','instagram','footerText'].map(key=>[key,site[key]]));
  const snapshots={site:{schemaVersion:1,section:'site',data}};
  for (const section of sections.slice(1)) snapshots[section]={schemaVersion:1,section,pages:{}};
  for (const [path,html] of htmlFiles) {
    const {document}=parseHTML(html);
    for (const section of sections.slice(1)) snapshots[section].pages[path]=regionSelectors(section,path).flatMap(selector=>{
      const node=document.querySelector(selector);
      return node?[{selector,children:childTrees(node)}]:[];
    });
  }
  const manifest={schemaVersion:1,revision,sections:{}};
  const files=new Map();
  for (const section of sections) {
    if (!validSnapshot(snapshots[section],section)) throw Error(`Invalid ${section} snapshot`);
    const text=canonical(snapshots[section]),digest=hash(text),url=`/live-content/${section}.${digest}.json`;
    manifest.sections[section]={hash:digest,url};files.set(url,text);
  }
  if (!validManifest(manifest)) throw Error('Invalid build revision or manifest');
  return {manifest,files};
}
export function liveSnapshotPlugin() {
  return {name:'public-live-snapshot',apply:'build',async closeBundle() {
    const root=process.cwd();
    const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
    const {groups}=JSON.parse(await readFile(join(root,'src/content/services.json'),'utf8'));
    const projects=JSON.parse(await readFile(join(root,'src/content/projects.json'),'utf8')).categories;
    const promotions=JSON.parse(await readFile(join(root,'src/content/promotions.json'),'utf8')).categories;
    const paths=['/','/3d-vitrin/',...groups.map(group=>`/hizmetler/${group.id}/`),...projects.map(item=>item.href),...promotions.map(item=>item.href)];
    const site=JSON.parse(await readFile(join(root,'src/content/site.json'),'utf8')).site;
    const htmlFiles=await Promise.all(paths.map(async path=>{
      const {document}=parseHTML(await readFile(join(root,'dist',path.slice(1),'index.html'),'utf8'));
      patchSite(document,site);
      if(path==='/') {
        const grid=document.querySelector('#hizmetler .service-grid');
        const cards=[...grid.querySelectorAll('.service-card')];
        groups.forEach((group,index)=>{
          const card=cards[index]??cards[0].cloneNode(true);
          card.setAttribute('href',`/hizmetler/${group.id}/`);
          card.querySelector('h3').textContent=group.title;
          card.querySelector('p').textContent=group.description;
          card.querySelector('.card-number').textContent=String(index+1).padStart(2,'0');
          grid.appendChild(card);
        });
        cards.slice(groups.length).forEach(card=>card.remove());
      }
      return [path,document.toString()];
    }));
    const {manifest,files}=await createSnapshots(root,htmlFiles,revision);
    await mkdir(join(root,'dist/live-content'),{recursive:true});
    for (const [url,text] of files) await writeFile(join(root,'dist',url),text);
    await writeFile(join(root,'dist/content-version.json'),canonical(manifest));
    for (const [path,html] of htmlFiles) await writeFile(join(root,'dist',path.slice(1),'index.html'),html.replace('</head>',`<script id="live-content-baseline" type="application/json">${canonical(manifest)}</script></head>`));
    console.log('Public manifest and four validated deterministic snapshots emitted.');
  }};
}
