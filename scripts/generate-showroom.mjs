import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const home = await readFile(join(root, 'index.html'), 'utf8');
const section = await readFile(join(root, 'src/showroom/page.html'), 'utf8');
const shared = (pattern) => {
  const match = home.match(pattern);
  if (!match) throw new Error('Shared page markup missing');
  return match[0].replaceAll('href="#', 'href="/#');
};
const header = shared(/<header class="header">[\s\S]*?<\/header>/)
  .replace('href="/3d-vitrin/"', 'href="/3d-vitrin/" aria-current="page"');
const footer = shared(/<footer class="footer">[\s\S]*?<\/footer>/);
const whatsapp = shared(/<a class="whatsapp-float"[\s\S]*?<\/a>/);
const instagram = shared(/<a class="instagram-float"[\s\S]*?<\/a>/);
const canonical = 'https://zyreklamdijital.com.tr/3d-vitrin/';
const title = '3D Vitrin | Kutu Harf Tabela ve Totem | ZY REKLAM';
const description = 'İki kutu harf tabela ve yönlendirme totemini malzeme, derinlik ve ışık etkileşimleriyle keşfedin. Temsili ZY REKLAM ürün tasarımları.';
const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#04130f">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="ZY REKLAM">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://zyreklamdijital.com.tr/assets/showroom/static-desktop.webp">
  <link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg">
  <link rel="stylesheet" href="/src/styles/main.css">
  <link rel="stylesheet" href="/src/styles/showroom.css">
  <script type="module" src="/src/vitrine.ts"></script>
</head>
<body class="showroom-page">
  <a class="skip-link" href="#main-content">İçeriğe geç</a>
  ${header}
  <main id="main-content">
    ${section}
    <section class="showroom-contact"><div class="shell">
      <p class="eyebrow">PROJENİZE ÖZEL ÜRETİM</p>
      <p>Ölçü, malzeme ve uygulama seçeneklerini birlikte netleştirelim.</p>
      <a class="button" href="/#iletisim">Teklif Al <span aria-hidden="true">↗</span></a>
      <a class="text-link" href="/">Ana sayfaya dön <span aria-hidden="true">↗</span></a>
    </div></section>
  </main>
  ${footer}
  ${whatsapp}
  ${instagram}
</body>
</html>
`;
await mkdir(join(root, '3d-vitrin'), { recursive: true });
await writeFile(join(root, '3d-vitrin/index.html'), html);
console.log('Generated standalone 3D Vitrin page and shared navigation.');
