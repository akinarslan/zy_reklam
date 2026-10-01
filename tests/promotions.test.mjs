import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:4191';
const { categories } = JSON.parse(await readFile('src/content/promotions.json', 'utf8'));
let server, browser;
const checks = [];
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4191', '--strictPort'], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Promotion preview failed');
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 99) throw new Error('Promotion preview timeout');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.ZY_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});
after(async () => {
  await browser?.close(); server?.kill();
  await writeFile('docs/evidence/P2_PROMOTIONS_VERIFICATION.json', JSON.stringify({ date: new Date().toISOString(), stage: 'P2.7', browser: browser?.version(), method: 'Built multi-page production preview; viewport emulation is not physical device validation.', checks }, null, 2) + '\n');
});

test('Promosyon mega menüsü: hover, klavye, Escape, dış tıklama ve dört fotoğraflı bağlantı', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.goto(base);
  const details = page.locator('[data-promo-menu]'), summary = details.locator('summary');
  await summary.hover();
  await page.waitForFunction(() => document.querySelector('[data-promo-menu]').open);
  assert.equal(await details.locator('.promo-menu-card').count(), 4);
  for (let i = 0; i < 4; i++) {
    const card = details.locator('.promo-menu-card').nth(i);
    assert.equal(await card.getAttribute('href'), categories[i].href);
    assert.equal(await card.locator('h3').textContent(), categories[i].title);
    await card.locator('img').evaluate(img => img.decode());
  }
  await details.locator('.promo-menu-card').first().hover();
  assert.equal(await details.evaluate(el => el.open), true);
  await page.screenshot({ path: 'docs/evidence/promotions-menu-1440.png' });
  await page.keyboard.press('Escape');
  assert.equal(await details.evaluate(el => el.open), false);
  assert.equal(await summary.evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('ArrowDown');
  assert.equal(await details.locator('.promo-menu-card').first().evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  assert.equal(await details.locator('.promo-menu-card').first().evaluate(el => document.activeElement === el), true);
  await page.locator('.hero-note').click();
  assert.equal(await details.evaluate(el => el.open), false);
  await summary.hover();
  await details.locator('.promo-menu-card').first().click();
  await page.waitForURL('**/promosyonlar/tekstil-giyim/');
  await page.close(); checks.push({ check: 'desktop-disclosure-keyboard-hover-outside', links: 4, passed: true });
});

test('Mobil promosyon menüsü: dokunma, kategoriye geçiş ve iç/dış Escape odak sırası', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.goto(base);
  const button = page.locator('[data-nav-toggle]');
  await button.tap(); await page.locator('[data-promo-menu] summary').tap();
  assert.equal(await page.locator('[data-promo-menu]').evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'docs/evidence/promotions-menu-360.png' });
  await page.locator('[data-promo-menu] .promo-menu-card').nth(1).tap();
  await page.waitForURL('**/promosyonlar/ofis-kirtasiye/');
  assert.equal(await page.locator('h1').textContent(), 'Ofis ve Kırtasiye Malzemeleri');
  assert.equal(await page.locator('.promo-breadcrumb').isVisible(), true);
  await button.tap(); await page.locator('[data-promo-menu] summary').tap();
  await page.keyboard.press('Escape');
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('[data-promo-menu] summary').evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Escape');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.equal(await button.evaluate(el => document.activeElement === el), true);
  await page.close(); checks.push({ check: 'mobile-touch-navigation-nested-escape', width: 360, passed: true });
});

test('Dört doğrudan kategori URL’si: doğru içerik, SEO, görseller, responsive düzen ve 3D indirmeme', async () => {
  for (const width of [360, 768, 1440]) for (const category of categories) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    const errors = [], rendererRequests = [], failedResponses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/renderer-.*\.js/.test(request.url())) rendererRequests.push(request.url()); });
    page.on('response', response => { if (response.status() >= 400) failedResponses.push(response.url()); });
    const response = await page.goto(base + category.href);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').textContent(), category.title);
    assert.match(await page.title(), /ZY REKLAM/);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://zyreklamdijital.com.tr' + category.href);
    assert.equal(await page.locator('[aria-current=page]').count(), 1);
    assert.ok(await page.locator('.promo-product').count() > 0);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode(); })));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); assert.deepEqual(failedResponses, []); assert.deepEqual(rendererRequests, []);
    if (width === 360 && category.id === 'vip-ekolojik-setler') {
      assert.equal(await page.locator('#vip-title').textContent(), 'VIP özel setler');
      assert.equal(await page.locator('#eco-title').textContent(), 'Bez çantalar ve keseler');
      await page.screenshot({ path: 'docs/evidence/promotions-vip-360.png', fullPage: true });
    }
    if (width === 1440 && category.id === 'ofis-kirtasiye') await page.screenshot({ path: 'docs/evidence/promotions-office-1440.png', fullPage: true });
    checks.push({ check: 'direct-category-production', category: category.id, width, photos: await page.locator('.promo-product').count(), passed: true });
    await page.close();
  }
});

test('JavaScript kapalı promosyon gezinmesi, statik ürün içerikleri ve WhatsApp metni', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 360, height: 900 } });
  await page.goto(base);
  await page.locator('[data-promo-menu] summary').click();
  await page.locator('[data-promo-menu] .promo-menu-card').nth(2).click();
  await page.waitForURL('**/promosyonlar/yasam-mutfak-seyahat/');
  assert.match(await page.locator('h1').textContent(), /Yaşam, Mutfak/);
  assert.equal(await page.locator('.promo-product h3').filter({ hasText: 'Kişiye özel kupa' }).count(), 1);
  const link = new URL(await page.locator('.promo-product').filter({ has: page.locator('h3', { hasText: 'Kişiye özel kupa' }) }).locator('a').getAttribute('href'));
  assert.equal(link.hostname, 'wa.me'); assert.equal(link.pathname, '/905464494849');
  assert.match(link.searchParams.get('text'), /Kişiye özel kupa/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const category of categories) assert.equal((await page.request.get(base + category.href)).status(), 200);
  const sitemap = await (await page.request.get(base + '/sitemap.xml')).text();
  for (const category of categories) assert.ok(sitemap.includes(category.href));
  await page.close(); checks.push({ check: 'no-js-static-links-whatsapp-sitemap', passed: true });
});
