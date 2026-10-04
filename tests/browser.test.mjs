import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

let server;
let browser;
const base = 'http://127.0.0.1:4177';
const results = [];
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4177', '--strictPort'], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Test sunucusu başlayamadı.');
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 99) throw new Error('Test sunucusu zaman aşımı.');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await mkdir('docs/evidence', { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: process.env.ZY_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});
after(async () => {
  await browser?.close();
  server?.kill();
  await mkdir('docs/evidence', { recursive: true });
  await writeFile('docs/evidence/P2_VERIFICATION.json', JSON.stringify({ stage: 'P2', date: new Date().toISOString(), results }, null, 2) + '\n');
});

test('360, 768 ve 1440 px: yatay taşma, başlık, görseller ve sayfa hataları', async () => {
  for (const width of [360, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.evaluate(() => [...document.images].filter(img => {
      const rect = img.getBoundingClientRect();
      return img.checkVisibility() && rect.top < innerHeight && rect.bottom > 0;
    }).every(img => img.complete && img.naturalWidth > 0)), true);
    const size = await page.locator('h1').evaluate(el => getComputedStyle(el).fontSize);
    if (width === 1440) assert.equal(size, '60px');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `docs/evidence/p2-${width}.png`, fullPage: true });
    results.push({ check: 'responsive', width, headingFontSize: size, passed: true });
    await page.close();
  }
});

test('Mobil menü açılır, Escape ile kapanır ve odak butona döner', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await page.goto(base);
  const menu = page.locator('[data-nav-toggle]');
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.evaluate(el => document.activeElement === el), true);
  await menu.click();
  await page.locator('#main-nav a[href="#hakkinda"]').click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  results.push({ check: 'mobile-navigation', passed: true });
  await page.close();
});

test('Sistem hareket tercihi ve kullanıcının azaltma kontrolü uygulanır', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(base);
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
  assert.equal(await page.locator('[data-motion-toggle]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-motion-toggle]').click();
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'full');
  results.push({ check: 'reduced-motion', passed: true });
  await page.close();
});

test('WhatsApp metni Türkçe ve özel karakterleri korur; gönderildi iddiası yok', async () => {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.open = url => { window.__openedUrl = String(url); return null; }; });
  await page.goto(base);
  await page.locator('#contact-name').fill('Akın & Şule');
  await page.locator('#contact-message').fill('Özel tabela <script>alert(1)</script>\nÖlçü: 1,5 m');
  await page.locator('[data-contact-form] button[type="submit"]').click();
  const url = new URL(await page.evaluate(() => window.__openedUrl));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/905464494849');
  assert.match(url.searchParams.get('text'), /Akın & Şule/);
  assert.match(url.searchParams.get('text'), /Özel tabela <script>alert\(1\)<\/script>\nÖlçü: 1,5 m/);
  assert.equal(await page.locator('script:not([src]):not([type="application/ld+json"])').count(), 0);
  assert.doesNotMatch(await page.locator('[data-contact-status]').textContent(), /gönderildi/i);
  results.push({ check: 'whatsapp-text-encoding', passed: true });
  await page.close();
});

test('Boşluklardan oluşan mesaj gönderilemez', async () => {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.open = () => { window.__opened = true; return null; }; });
  await page.goto(base);
  await page.locator('#contact-name').fill('   ');
  await page.locator('#contact-message').fill('    ');
  await page.locator('[data-contact-form] button[type="submit"]').click();
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  results.push({ check: 'blank-input-validation', passed: true });
  await page.close();
});

test('JavaScript kapalıyken içerik, logo ve doğrudan iletişim erişilir', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  await page.goto(base);
  assert.match(await page.locator('h1').textContent(), /Projenize özel/);
  assert.equal(await page.locator('a[href="tel:+905464494849"]').first().isVisible(), true);
  assert.equal(await page.locator('noscript a').isVisible(), true);
  assert.equal(await page.locator('.sign-poster img').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  results.push({ check: 'no-javascript-fallback', passed: true });
  await page.close();
});
