import type {Snapshot,Tree} from './protocol.js';
import {patchSite} from './site.js';

const key = (node:Node,index:number) => node instanceof Element
  ? node.id || node.getAttribute('href') || node.getAttribute('src') || node.querySelector('video source, img')?.getAttribute('src') || `${node.localName}:${index}` : '';
function children(parent:Node, wanted:Tree[]) {
  const previous=Array.from(parent.childNodes),used=new Set<Node>();
  let cursor=parent.firstChild;
  wanted.forEach((item,index)=>{
    let node:Node|undefined;
    if (typeof item==='string') node=previous[index]?.nodeType===Node.TEXT_NODE&&!used.has(previous[index])?previous[index]:undefined;
    else node=previous.find((candidate,i)=>candidate instanceof Element && candidate.localName===item.tag && key(candidate,i)===item.key && !used.has(candidate));
    if (!node) node=typeof item==='string'?document.createTextNode(item):document.createElement(item.tag);
    used.add(node);
    if (node!==cursor) parent.insertBefore(node,cursor);
    cursor=node.nextSibling;
    if (typeof item==='string') {if(node.textContent!==item)node.textContent=item;}
    else {
      const element=node as Element;
      for (const name of element.getAttributeNames()) if (!(name in item.attrs)) element.removeAttribute(name);
      for (const [name,value] of Object.entries(item.attrs)) if(element.getAttribute(name)!==value)element.setAttribute(name,value);
      if (element.getAttribute('target')==='_blank') element.setAttribute('rel','noopener noreferrer');
      children(element,item.children);
    }
  });
  previous.filter(node=>!used.has(node)).forEach(node=>node.parentNode===parent&&parent.removeChild(node));
}
export function applySnapshots(snapshots:Snapshot[]) {
  // Validate/prepare every target before touching the document. Missing targets
  // (e.g. removed category routes) preserve the previous published page.
  const jobs:Array<{parent:Element;children:Tree[]}>=[];
  for (const snapshot of snapshots) for (const region of snapshot.pages?.[location.pathname]??[]) {
    const parent=document.querySelector(region.selector);
    if(!parent)throw Error('Live region missing');
    jobs.push({parent,children:region.children});
  }
  const x=scrollX,y=scrollY;
  for(const job of jobs) children(job.parent,job.children);
  const site=snapshots.find(snapshot=>snapshot.section==='site')?.data;
  if(site)patchSite(document,site);
  // No smooth scroll during a patch. Existing form/canvas/dialog/video nodes
  // are outside patch roots or retained by stable keys.
  if(scrollX!==x||scrollY!==y)scrollTo({left:x,top:y,behavior:'instant'});
}
