import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const { groups } = JSON.parse(await readFile(join(root, 'src/content/services.json'), 'utf8'));

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const serviceMenu = `<details class="promo-dropdown service-dropdown" data-service-menu>
  <summary aria-controls="services-panel">Hizmetler <span class="promo-chevron" aria-hidden="true">⌄</span></summary>
  <div class="promo-mega service-mega" id="services-panel">
    <div class="promo-mega-heading"><p class="eyebrow">ÜRETİMDEN UYGULAMAYA</p><p>Tüm hizmetlerimizi beş ana başlıkta keşfedin.</p></div>
    <div class="service-menu-grid">
      ${groups.map(group => `<a class="service-menu-card" href="/hizmetler/${group.id}/"><span class="service-menu-index">0${groups.indexOf(group)+1}</span><div><h3>${esc(group.title)}</h3><p>${esc(group.menuPreview.join(' · '))}</p><span>Hizmetleri incele ↗</span></div></a>`).join('')}
    </div>
  </div>
</details>`;

let home = await readFile(join(root, 'index.html'), 'utf8');
const marker = /<!-- services-menu:start -->[\s\S]*?<!-- services-menu:end -->/;
if (!marker.test(home)) throw new Error('Services menu markers missing');
home = home.replace(marker, `<!-- services-menu:start -->${serviceMenu}<!-- services-menu:end -->`);
await writeFile(join(root, 'index.html'), home);

const header = home.match(/<header class="header">[\s\S]*?<\/header>/)[0].replaceAll('href="#', 'href="/#');
const footer = home.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0].replaceAll('href="#', 'href="/#');

for (const group of groups) {
  const canonical = `https://zyreklamdijital.com.tr/hizmetler/${group.id}/`;
  const pageHeader = header.replace(`href="/hizmetler/${group.id}/"`, `href="/hizmetler/${group.id}/" aria-current="page"`);
  const schema = JSON.stringify({
    '@context':'https://schema.org',
    '@type':'Service',
    name:group.title,
    description:group.description,
    provider:{'@type':'LocalBusiness',name:'ZY REKLAM',url:'https://zyreklamdijital.com.tr/',telephone:'+905464494849'},
    areaServed:{'@type':'AdministrativeArea',name:'Muş'},
    url:canonical,
    hasOfferCatalog:{
      '@type':'OfferCatalog',
      name:group.title,
      itemListElement:group.services.map(item=>({
        '@type':'Offer',
        itemOffered:{'@type':'Service',name:item[1],description:item[2]}
      }))
    }
  });

  const blocks = group.services.map((item,index) => {
    const [id,title,description,image,gallery=[]] = item;
    const images = gallery.length ? gallery : [image];
    const galleryHtml = images.map((src,imageIndex) => `<figure class="service-gallery-item">
      <img src="${esc(src)}" alt="${esc(title)} örnek uygulama ${imageIndex+1}" loading="${index<2?'eager':'lazy'}" decoding="async" onerror="this.onerror=null;this.src='${esc(image)}'">
    </figure>`).join('');
    return `<article class="service-detail service-detail-gallery" id="${esc(id)}">
      <div class="service-detail-copy">
        <span class="service-detail-number">${String(index+1).padStart(2,'0')}</span>
        <h2>${esc(title)}</h2>
        <p>${esc(description)}</p>
        <a class="text-link" href="/#iletisim">Bu hizmet için teklif alın <span aria-hidden="true">→</span></a>
      </div>
      <div class="service-gallery" aria-label="${esc(title)} örnekleri">
        ${galleryHtml}
      </div>
    </article>`;
  }).join('');

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(group.title)} | Muş Reklam Hizmetleri | ZY REKLAM</title>
  <meta name="description" content="${esc(group.description)} ZY REKLAM Muş'ta tasarım, üretim ve uygulama hizmetleri sunar.">
  <meta name="theme-color" content="#04130f">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="${esc(group.title)} | ZY REKLAM">
  <meta property="og:description" content="${esc(group.description)}">
  <meta property="og:url" content="${canonical}">
  <script type="application/ld+json">${schema}</script>
  <link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg">
  <link rel="stylesheet" href="/src/styles/main.css">
  <script type="module" src="/src/main.ts"></script>
</head>
<body class="service-category-page">
  <a class="skip-link" href="#main-content">İçeriğe geç</a>
  ${pageHeader}
  <main id="main-content">
    <section class="service-category-hero">
      <div class="shell">
        <nav class="promo-breadcrumb" aria-label="İçerik yolu"><a href="/">Ana sayfa</a><span aria-hidden="true">/</span><a href="/#hizmetler">Hizmetler</a></nav>
        <p class="eyebrow">${esc(group.eyebrow)}</p>
        <h1>${esc(group.title)}</h1>
        <p class="body-copy">${esc(group.description)}</p>
      </div>
    </section>
    <section class="service-detail-list">
      <div class="shell">${blocks}</div>
    </section>
    <section class="promo-category-end">
      <div class="shell">
        <p class="eyebrow">PROJENİZİ BİRLİKTE PLANLAYALIM</p>
        <h2>İhtiyacınıza uygun<br><span>çözümü üretelim.</span></h2>
        <p class="body-copy">Ölçü, malzeme, baskı ve uygulama detaylarını birlikte netleştirelim.</p>
        <a class="button" href="/#iletisim">Teklif Al <span aria-hidden="true">↗</span></a>
        <div class="service-other-groups" aria-label="Diğer hizmet grupları">${groups.filter(g=>g.id!==group.id).map(g=>`<a href="/hizmetler/${g.id}/">${esc(g.title)} <span aria-hidden="true">↗</span></a>`).join('')}</div>
      </div>
    </section>
  </main>
  ${footer}
</body>
</html>\n`;

  const dir = join(root, 'hizmetler', group.id);
  await mkdir(dir, { recursive:true });
  await writeFile(join(dir, 'index.html'), html);
}

console.log(`Generated ${groups.length} service category pages and Services mega menu.`);
