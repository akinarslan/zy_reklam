import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const { categories, photos } = JSON.parse(await readFile(join(root, 'src/content/promotions.json'), 'utf8'));
const { pageMeta } = JSON.parse(await readFile(join(root, 'src/content/seo.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const image = (photo, sizes, priority = false) => {
  const small = photo.variants[0], large = photo.variants[1];
  return `<img src="${esc(small.src)}" srcset="${esc(small.src)} ${small.width}w, ${esc(large.src)} ${large.width}w" sizes="${sizes}" width="${large.width}" height="${large.height}" alt="${esc(photo.alt)}" loading="${priority ? 'eager' : 'lazy'}" decoding="async">`;
};
const card = (category, current = false) => `<a class="promo-menu-card" href="${category.href}"${current ? ' aria-current="page"' : ''}>${image(photos.find(p => p.id === category.cover), '(max-width: 767px) 76px, (max-width: 1100px) 22vw, 285px')}<div><h3>${esc(category.title)}</h3><p>${esc(category.examples)}</p><span class="promo-card-action">Koleksiyonu incele <span aria-hidden="true">↗</span></span></div></a>`;
const menu = `<details class="promo-dropdown" data-promo-menu><summary aria-controls="promotions-panel">Promosyonlar <span class="promo-chevron" aria-hidden="true">⌄</span></summary><div class="promo-mega" id="promotions-panel"><div class="promo-mega-heading"><p class="eyebrow">MARKANIZA ÖZEL</p><p>Günlük kullanımdan özel hediyelere.</p></div><div class="promo-menu-grid">${categories.map(c => card(c)).join('')}</div><a class="promo-menu-overview text-link" href="/#promosyonlar">Tüm promosyon kategorileri <span aria-hidden="true">→</span></a></div></details>`;
let home = await readFile(join(root, 'index.html'), 'utf8');
const menuMarker = /<!-- promotions-menu:start -->[\s\S]*?<!-- promotions-menu:end -->/;
const overviewMarker = /<!-- promotions-overview:start -->[\s\S]*?<!-- promotions-overview:end -->/;
if (!menuMarker.test(home) || !overviewMarker.test(home)) throw new Error('Promosyon HTML markers missing');
home = home.replace(menuMarker, `<!-- promotions-menu:start -->${menu}<!-- promotions-menu:end -->`);
home = home.replace(overviewMarker, `<!-- promotions-overview:start --><div class="shell promo-overview"><div class="promo-menu-grid">${categories.map(c => card(c)).join('')}</div></div><!-- promotions-overview:end -->`);
await writeFile(join(root, 'index.html'), home);
const header = home.match(/<header class="header">[\s\S]*?<\/header>/)[0].replaceAll('href="#', 'href="/#');
const footer = home.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0].replaceAll('href="#', 'href="/#');
const gallery = (items, title, id) => `<section class="promo-gallery" aria-labelledby="${id}"><div class="promo-gallery-heading"><h2 id="${id}">${esc(title)}</h2><p>${items.length} görsel</p></div><div class="promo-product-grid">${items.map(p => `<article class="promo-product"><div class="promo-product-image">${image(p, '(max-width: 600px) 90vw, (max-width: 1023px) 44vw, 390px')}</div><div class="promo-product-copy"><h3>${esc(p.title)}</h3><a class="text-link" href="https://wa.me/905464494849?text=${encodeURIComponent(`Merhaba ZY REKLAM, ${p.title} için baskı ve adet seçeneklerini öğrenmek istiyorum.`)}" target="_blank" rel="noopener noreferrer">Bu ürün için bilgi al <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div></section>`;
for (const category of categories) {
  const items = photos.filter(p => p.category === category.id || p.alsoIn?.includes(category.id));
  const cover = photos.find(p => p.id === category.cover);
  const canonical = `https://zyreklamdijital.com.tr${category.href}`;
  const meta = pageMeta.promotions[category.id] || { title: `${category.title} | ZY REKLAM`, description: `${category.description} ZY REKLAM promosyon çözümleri.`, keywords: [] };
  const serviceJson = JSON.stringify({"@context":"https://schema.org","@type":"Service","name":category.title,"serviceType":meta.keywords?.[0]||category.title,"description":meta.description,"provider":{"@type":"LocalBusiness","name":"ZY REKLAM","url":"https://zyreklamdijital.com.tr/","telephone":"+905464494849"},"areaServed":{"@type":"AdministrativeArea","name":"Muş"},"url":canonical});
  const pageHeader = header.replace(`href="${category.href}"`, `href="${category.href}" aria-current="page"`);
  const collections = category.id === 'vip-ekolojik-setler'
    ? gallery(items.filter(p => p.section === 'vip'), 'VIP özel setler', 'vip-title') + gallery(items.filter(p => p.section === 'eco'), 'Bez çantalar ve keseler', 'eco-title')
    : gallery(items, 'Ürün seçenekleri', 'collection-title');
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title><meta name="description" content="${esc(meta.description)}"><meta name="theme-color" content="#04130f"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:title" content="${esc(meta.title)}"><meta property="og:description" content="${esc(meta.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://zyreklamdijital.com.tr${cover.variants[1].src}"><meta property="og:image:alt" content="${esc(cover.alt)}"><script type="application/ld+json">${serviceJson}</script>
<link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg"><link rel="stylesheet" href="/src/styles/main.css"><script type="module" src="/src/main.ts"></script></head>
<body class="promo-page"><a class="skip-link" href="#main-content">İçeriğe geç</a>${pageHeader}
<main id="main-content"><section class="promo-category-hero"><div class="shell"><nav class="promo-breadcrumb" aria-label="İçerik yolu"><a href="/">Ana sayfa</a><span aria-hidden="true">/</span><a href="/#promosyonlar">Promosyonlar</a></nav><div class="promo-category-intro"><div><p class="eyebrow">PROMOSYON KOLEKSİYONU</p><h1>${esc(category.title)}</h1><p class="body-copy">${esc(category.description)}</p><a class="button" href="/#iletisim">Baskı ve adet seçeneklerini konuşalım <span aria-hidden="true">↗</span></a></div><div class="promo-category-cover">${image(cover, '(max-width: 767px) 90vw, 440px', true)}</div></div></div></section>
<div class="shell promo-collections">${collections}</div><section class="promo-category-end"><div class="shell"><p class="eyebrow">BİRLİKTE ŞEKİLLENDİRELİM</p><h2>Markanıza uygun<br><span>seçeneği bulalım.</span></h2><p class="body-copy">Logo uygulaması, ürün içeriği ve adet seçeneklerini birlikte netleştirelim.</p><a class="button" href="/#iletisim">Projenizi anlatın <span aria-hidden="true">↗</span></a><div class="promo-other-categories" aria-label="Diğer promosyon kategorileri">${categories.filter(c => c.id !== category.id).map(c => `<a href="${c.href}">${esc(c.title)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div></section></main>${footer}</body></html>\n`;
  const dir = join(root, 'promosyonlar', category.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html);
}
await writeFile(join(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...categories.map(c => c.href)].map(path => `  <url><loc>https://zyreklamdijital.com.tr${path}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${categories.length} promotion pages and shared menus.`);
