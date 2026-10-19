import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import { chromium } from 'playwright';

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 834, height: 1194 },
  { width: 1024, height: 768 },
  { width: 1024, height: 1366 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1600, height: 900 },
  { width: 1900, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3440, height: 1440 },
  { width: 3840, height: 2160 }
];

let server;
let browser;
let base;
const metrics = [];

before(async () => {
  const port = await new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      listener.close(() => resolve(address.port));
    });
  });
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort'
  ], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Responsive test sunucusu başlayamadı.');
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      if (attempt === 99) throw new Error('Responsive test sunucusu zaman aşımına uğradı.');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await mkdir('docs/evidence/responsive', { recursive: true });
  browser = await chromium.launch({
    executablePath: process.env.ZY_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
});

after(async () => {
  await browser?.close();
  server?.kill();
  if (metrics.length) console.log(`Site responsive measurements: ${JSON.stringify(metrics)}`);
});

test('Ana site viewport matrisi, geniş ekran ölçekleri, menüler ve yatay taşma', async () => {
  const page = await browser.newPage({ viewport: viewports[0] });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const measurement = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height, left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
      };
      return {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        shell: rect('.header-inner'),
        hero: rect('.hero-grid'),
        heroSection: rect('.hero'),
        nextSection: rect('.brand-showcase'),
        titleFontSize: getComputedStyle(document.querySelector('#hero-title')).fontSize,
        signStage: rect('.sign-stage'),
        showroomCount: document.querySelectorAll('#vitrin, [data-showroom-stage]').length,
        heroColumns: getComputedStyle(document.querySelector('.hero-grid')).gridTemplateColumns.split(' ').length,
        heroOwnsStage: document.querySelector('[data-hero-3d]').contains(document.querySelector('[data-hero-stage]')),
        showcaseImage: rect('.real-lightbox img'),
        serviceColumns: getComputedStyle(document.querySelector('.service-grid')).gridTemplateColumns.split(' ').length,
        headerHeight: rect('.header-inner')?.height
      };
    });
    assert.ok(measurement.documentWidth <= viewport.width, `Ana site yatay taşıyor: ${JSON.stringify(measurement)}`);
    assert.ok(measurement.nextSection.top >= viewport.height - 1, `İkinci bölüm ilk ekrana girdi: ${JSON.stringify(measurement)}`);
    assert.ok(measurement.shell.width <= viewport.width, `Container viewport dışına çıktı: ${JSON.stringify(measurement)}`);
    if (viewport.width >= 1440 && viewport.width < 1920) {
      assert.ok(measurement.shell.width <= 1761, `Ana container max sınırını aştı: ${JSON.stringify(measurement)}`);
      assert.equal(measurement.serviceColumns, 4, `Large desktop hizmet grid'i dört kolon değil: ${JSON.stringify(measurement)}`);
      assert.ok(Number.parseFloat(measurement.titleFontSize) <= 86, `Hero başlığı aşırı büyüdü: ${JSON.stringify(measurement)}`);
    }
    if (viewport.width >= 1920) {
      const expectedShellWidth = viewport.width >= 3440 ? 2560 : viewport.width >= 2560 ? 2240 : 1800;
      assert.ok(Math.abs(measurement.shell.width - expectedShellWidth) <= 1,
        `Ana shell hedef genişliğinde değil: ${JSON.stringify(measurement)}`);
      assert.equal(measurement.serviceColumns, 4, `Large desktop hizmet grid'i dört kolon değil: ${JSON.stringify(measurement)}`);
      assert.ok(measurement.headerHeight >= 90, `Geniş ekran navbar yüksekliği yetersiz: ${JSON.stringify(measurement)}`);
    }
    if (viewport.width >= 1920 && viewport.width < 2560) {
      assert.ok(Number.parseFloat(measurement.titleFontSize) <= 86,
        `1920px hero başlığı önceki ölçüsünü aştı: ${JSON.stringify(measurement)}`);
    }
    if (viewport.width >= 2560) {
      const heroHeight = measurement.hero.height;
      const signStageHeight = measurement.signStage.height;
      const titleFontSize = Number.parseFloat(measurement.titleFontSize);
      assert.ok(heroHeight >= 760 && heroHeight <= viewport.height && Math.abs(measurement.heroSection.bottom - viewport.height) < 2,
        `2560px+ hero ilk ekranı tam doldurmalı: ${JSON.stringify(measurement)}`);
      assert.ok(signStageHeight >= 600 && signStageHeight <= 680,
        `2560px+ tabela sahnesi hedef dışında: ${JSON.stringify(measurement)}`);
      assert.ok(titleFontSize >= 90 && titleFontSize <= 100,
        `2560px+ hero başlığı hedef dışında: ${JSON.stringify(measurement)}`);
    }
    if (viewport.width >= 1920) {
      const showcaseMinimum = viewport.width >= 2560 ? 720 : 620;
      const showcaseMaximum = viewport.width >= 2560 ? 800 : 680;
      assert.ok(measurement.showcaseImage.height >= showcaseMinimum && measurement.showcaseImage.height <= showcaseMaximum,
        `Showcase hedef ölçüsünün dışında: ${JSON.stringify(measurement)}`);
    }
    assert.equal(measurement.showroomCount, 0);
    assert.equal(measurement.heroOwnsStage, true);
    assert.equal(measurement.heroColumns, viewport.width >= 768 ? 2 : 1);
    assert.ok(measurement.signStage.left >= measurement.hero.left - 1 && measurement.signStage.right <= measurement.hero.right + 1);
    metrics.push(measurement);
    // Large GPU readbacks are retained in diagnostics/legacy-home-captures.
    // Every viewport's layout and overflow assertions above remain blocking.
    if ([390, 768, 1366, 1440, 1920].includes(viewport.width)) {
      await page.screenshot({ path: `docs/evidence/responsive/site-${viewport.width}.png` });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const menuButton = page.locator('[data-nav-toggle]');
  await menuButton.click();
  assert.equal(await menuButton.getAttribute('aria-expanded'), 'true');
  const navBounds = await page.locator('#main-nav').evaluate((element) => {
    const { left, right, height } = element.getBoundingClientRect();
    return { left, right, height };
  });
  assert.ok(navBounds.left >= 0 && navBounds.right <= 390, `Mobil ana site menüsü taşmış: ${JSON.stringify(navBounds)}`);
  const disclosure = page.locator('#main-nav details').first();
  await disclosure.locator('summary').click();
  assert.equal(await disclosure.evaluate((element) => element.open), true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopDisclosure = page.locator('#main-nav details').first();
  await desktopDisclosure.hover();
  assert.equal(await desktopDisclosure.evaluate((element) => element.open), true);
  const megaBounds = await desktopDisclosure.evaluate((element) => {
    const mega = element.querySelector('.promo-mega, .project-mega, .service-mega');
    if (!mega) return null;
    const { left, right } = mega.getBoundingClientRect();
    return { left, right };
  });
  assert.ok(megaBounds);
  assert.ok(megaBounds.left >= 0 && megaBounds.right <= 1440, `Masaüstü mega menü taşmış: ${JSON.stringify(megaBounds)}`);
  assert.deepEqual(pageErrors, []);
  await page.close();
});

test('Üretilen hizmet, proje ve promosyon sayfaları mobil/tablet/large desktop uyumunu korur', async () => {
  const pages = [
    '/hizmetler/tabela-yonlendirme/',
    '/hizmetler/dijital-baski-kaplama/',
    '/hizmetler/lazer-ozel-uretim/',
    '/hizmetler/promosyon-baski/',
    '/hizmetler/tasarim-kurumsal/',
    '/projeler/tabela/',
    '/projeler/totem/',
    '/projeler/lazer-kesim/',
    '/projeler/dijital-baski/',
    '/projeler/ozel-uretim/',
    '/promosyonlar/ofis-kirtasiye/',
    '/promosyonlar/tekstil-giyim/',
    '/promosyonlar/yasam-mutfak-seyahat/',
    '/promosyonlar/vip-ekolojik-setler/'
  ];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  for (const path of pages) {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 3840, height: 2160 }
    ]) {
      await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const response = await page.goto(`${base}${path}`);
      assert.equal(response?.status(), 200, `Sayfa açılamadı: ${path}`);
      const layout = await page.evaluate(() => {
        const columnsFor = (selector) => {
          const grid = document.querySelector(selector);
          if (!grid) return 0;
          const value = getComputedStyle(grid).gridTemplateColumns;
          let depth = 0;
          let columns = 0;
          let inTrack = false;
          for (const character of value) {
            if (character === '(') depth += 1;
            if (character === ')') depth -= 1;
            if (/\s/.test(character) && depth === 0) {
              if (inTrack) columns += 1;
              inTrack = false;
            } else if (!/\s/.test(character)) {
              inTrack = true;
            }
          }
          return columns + Number(inTrack);
        };
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
          shellWidth: document.querySelector('.shell')?.getBoundingClientRect().width ?? 0,
          detailColumns: columnsFor('.service-detail'),
          galleryColumns: columnsFor('.service-gallery'),
          videoWidth: document.querySelector('.project-video')?.getBoundingClientRect().width ?? 0,
          videoMaxWidth: document.querySelector('.project-video')
            ? Number.parseFloat(getComputedStyle(document.querySelector('.project-video')).maxWidth)
            : 0,
          promoColumns: columnsFor('.promo-product-grid'),
          promoImageFit: document.querySelector('.promo-product-image img')
            ? getComputedStyle(document.querySelector('.promo-product-image img')).objectFit
            : ''
        };
      });
      assert.ok(layout.documentWidth <= viewport.width, `${path} yatay taşıyor: ${JSON.stringify(layout)}`);
      assert.ok(layout.shellWidth <= viewport.width, `${path} container viewport dışına taşıyor: ${JSON.stringify(layout)}`);
      if (path.startsWith('/hizmetler/') && viewport.width >= 1440) {
        assert.equal(layout.detailColumns, 2, `${path} hizmet detayı iki kolon değil: ${JSON.stringify(layout)}`);
        assert.equal(layout.galleryColumns, 2, `${path} hizmet galerisi iki kolon değil: ${JSON.stringify(layout)}`);
      }
      if (path.startsWith('/projeler/') && viewport.width >= 1440 && layout.videoWidth > 0) {
        assert.ok(layout.videoWidth <= 1050 && layout.videoWidth <= layout.videoMaxWidth + 1,
          `${path} video alanı sınırı aştı: ${JSON.stringify(layout)}`);
      }
      if (path.startsWith('/promosyonlar/')) {
        assert.equal(layout.promoImageFit, 'contain', `${path} ürün görseli kırpılıyor.`);
        assert.ok(layout.promoColumns <= 3, `${path} ürün grid'i gereğinden fazla kolona çıktı.`);
      }
    }
  }
  assert.deepEqual(pageErrors, []);
  await page.close();
});
