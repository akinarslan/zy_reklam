export const sections = ['site', 'services', 'projects', 'promotions'];
export const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export const safeUrl = (value, kind = 'href') => {
  if (typeof value !== 'string' || /[\\\u0000-\u0020]/.test(value)) return false;
  if (kind !== 'href') return /^\/assets\/[a-zA-Z0-9_./%+-]+(?:\?v=[a-f0-9]+)?$/.test(value) && !/%2e|%2f|\.\./i.test(value);
  return /^(?:\/(?!\/)(?:#|[a-zA-Z0-9_/#%?=&.+-])*)$/.test(value) && !/\.\.|%2e|%2f/i.test(value)
    || /^#[a-zA-Z0-9_-]+$/.test(value)
    || /^tel:\+?[0-9]+$/.test(value)
    || /^https:\/\/(?:www\.instagram\.com\/[^?#\s]+\/?|wa\.me\/[0-9]+(?:\?text=[^\s]*)?)$/.test(value);
};
export const tags = new Set(['a','div','span','p','h1','h2','h3','img','article','section','figure','nav','br','i','video','source']);
export const attributes = new Set(['id','class','href','src','srcset','sizes','alt','width','height','loading','decoding','target','rel','aria-label','aria-hidden','aria-labelledby','aria-current','controls','playsinline','preload','poster','type']);
export function validAttribute(name, value) {
  if (!attributes.has(name) || typeof value !== 'string' || value.length > 8000) return false;
  if (['href','src','poster'].includes(name)) return safeUrl(value, name);
  if (name === 'srcset') return value.split(',').every(part => { const [url,width] = part.trim().split(/\s+/); return safeUrl(url,'src') && /^\d+w$/.test(width); });
  if (name === 'target') return value === '_blank';
  return true;
}
export const regionSelectors = (section, path) => {
  const list = section === 'services' ? ['[data-service-menu] .service-menu-grid']
    : section === 'projects' ? ['[data-project-menu] .project-menu-grid'] : ['[data-promo-menu] .promo-menu-grid'];
  if (path === '/') return [...list, ...(section === 'services' ? ['#hizmetler .service-grid'] : section === 'projects' ? ['#projeler .project-disclaimer','#projeler .project-menu-grid'] : ['#promosyonlar .promo-menu-grid'])];
  if (section === 'services' && path.startsWith('/hizmetler/')) return [...list,'.service-category-hero .shell','.service-detail-list .shell','.service-other-groups'];
  if ((section === 'projects' && path.startsWith('/projeler/')) || (section === 'promotions' && path.startsWith('/promosyonlar/')))
    return [...list,'.promo-category-intro',...(section === 'projects' ? ['.promo-category-hero .project-disclaimer'] : []),'.promo-collections','.promo-other-categories'];
  return list;
};
export function validManifest(value) {
  return !!value && value.schemaVersion === 1 && /^[a-f0-9]{40,64}$/.test(value.revision)
    && sections.every(key => /^[a-f0-9]{64}$/.test(value.sections?.[key]?.hash)
      && value.sections[key].url === `/live-content/${key}.${value.sections[key].hash}.json`);
}
export function validSnapshot(value, section) {
  if (!value || value.schemaVersion !== 1 || value.section !== section) return false;
  if (section === 'site') return value.data && /^\+?[0-9]{10,15}$/.test(value.data.phone)
    && ['address','footerText'].every(key => typeof value.data[key] === 'string' && value.data[key].trim().length > 0 && value.data[key].length < 4000)
    && safeUrl(value.data.instagram) && value.data.instagram.startsWith('https://www.instagram.com/');
  let count = 0;
  const node = (item,depth=0) => {
    if (++count > 50000 || depth > 24) return false;
    if (typeof item === 'string') return item.length < 20000;
    return item && tags.has(item.tag) && typeof item.key === 'string' && item.key.length < 1000
      && item.attrs && Object.entries(item.attrs).every(([name,value]) => validAttribute(name,value))
      && Array.isArray(item.children) && item.children.every(child => node(child,depth+1));
  };
  return value.pages && Array.isArray(value.pages['/']) && value.pages['/'].length > 0 && Object.entries(value.pages).every(([path,regions]) => /^\/(?:[a-z0-9-]+\/)*$/.test(path)
    && Array.isArray(regions) && new Set(regions.map(region=>region.selector)).size === regions.length
    && regions.every(region => regionSelectors(section,path).includes(region.selector) && Array.isArray(region.children) && region.children.length > 0 && region.children.every(child => node(child))));
}
