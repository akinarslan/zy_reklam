import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});
const base = `http://127.0.0.1:${port}`;
const workerEntry = path.join(root, 'worker', 'index.ts');
const wranglerEntry = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const testDirectory = await mkdtemp(path.join(os.tmpdir(), 'zy-admin-worker-'));
const persistDirectory = path.join(testDirectory, 'persist');
const password = 'test-only-password';
const salt = randomBytes(16);
const passwordHash = `PBKDF2$100000$${salt.toString('base64url')}$${pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64url')}`;
const token = randomBytes(32).toString('base64url');
const configFile = path.join(testDirectory, 'wrangler.jsonc');
let workerProcess;
let workerLogs = '';
let cookie;
let csrfToken;

await writeFile(configFile, JSON.stringify({
  name: 'zy-reklam-admin-test',
  main: workerEntry,
  compatibility_date: '2026-10-15',
  kv_namespaces: [{ binding: 'ADMIN_DRAFTS', id: '11111111111111111111111111111111' }],
  r2_buckets: [{ binding: 'ADMIN_MEDIA_STAGING', bucket_name: 'zy-reklam-admin-test-staging' }],
  assets: { directory: path.join(root, 'dist'), binding: 'ASSETS', not_found_handling: 'single-page-application' }
}, null, 2), 'utf8');

const startWorker = async () => {
  workerProcess = spawn(process.execPath, [
    wranglerEntry,
    'dev',
    '--local',
    '--config', configFile,
    '--var', 'ADMIN_USERNAME:worker-test',
    '--var', `ADMIN_PASSWORD_HASH:${passwordHash}`,
    '--var', `ADMIN_SESSION_SECRET:${token}`,
    '--persist-to', persistDirectory,
    '--ip', '127.0.0.1',
    '--port', String(port),
    '--log-level', 'error'
  ], { cwd: testDirectory, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  workerLogs = '';
  workerProcess.stdout.on('data', (chunk) => { workerLogs += chunk.toString(); });
  workerProcess.stderr.on('data', (chunk) => { workerLogs += chunk.toString(); });
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (workerProcess.exitCode !== null) throw new Error(`Local Worker exited with code ${workerProcess.exitCode}`);
    try {
      const response = await fetch(`${base}/api/admin/session`);
      if (response.ok) return;
    } catch {
      // The local runtime has not bound its port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Local Worker did not start within 15 seconds.');
};

const stopWorker = async () => {
  if (!workerProcess || workerProcess.exitCode !== null) return;
  workerProcess.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    workerProcess.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  workerProcess = null;
};

const adminRequest = (pathname, init = {}) => fetch(`${base}${pathname}`, {
  ...init,
  headers: {
    ...(init.headers ?? {}),
    ...(cookie ? { Cookie: cookie } : {}),
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(init.method && init.method !== 'GET' ? { Origin: base } : {})
  }
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createOnePixelPng = () => {
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0, 0]))),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

test('Local Worker persists drafts, validates uploads, protects used files, and serves private ranges', async () => {
  let browser;
  try {
    await startWorker();
    const login = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ username: 'worker-test', password })
    });
    assert.equal(login.status, 200, `${await login.clone().text()}\n${workerLogs}`);
    cookie = login.headers.get('set-cookie')?.split(';')[0];
    csrfToken = (await login.json()).csrfToken;
    assert.ok(cookie);
    assert.ok(csrfToken);

    const session = await adminRequest('/api/admin/session');
    assert.equal((await session.json()).authenticated, true);
    const forbiddenMutation = await fetch(`${base}/api/admin/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: base },
      body: JSON.stringify({ content: {} })
    });
    assert.equal(forbiddenMutation.status, 403);

    const draftResponse = await adminRequest('/api/admin/draft');
    const draft = await draftResponse.json();
    assert.equal(draftResponse.status, 200);
    assert.ok(draft.publishedContent);
    const nextContent = {
      site: { ...draft.site, title: `${draft.site.title} worker test` },
      services: draft.services,
      projects: draft.projects,
      promotions: draft.promotions,
      seo: draft.seo
    };
    const saved = await adminRequest('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: nextContent })
    });
    assert.equal(saved.status, 200);
    assert.equal((await (await adminRequest('/api/admin/draft')).json()).site.title, nextContent.site.title);
    const changedStatus = await (await adminRequest('/api/admin/status')).json();
    assert.equal(changedStatus.hasPendingDraft, true);
    assert.deepEqual(changedStatus.changedSections, ['site']);

    const serviceId = nextContent.services.groups[0].services[0][0];
    const image = new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4])], 'worker-test.png', { type: 'image/png' });
    const badForm = new FormData();
    badForm.set('file', new File(['not-png'], 'invalid.png', { type: 'image/png' }));
    badForm.set('folder', 'uploads');
    badForm.set('target', JSON.stringify({ kind: 'none' }));
    badForm.set('width', '1');
    badForm.set('height', '1');
    const rejectedUpload = await adminRequest('/api/admin/media', { method: 'POST', body: badForm });
    assert.equal(rejectedUpload.status, 400, `${await rejectedUpload.clone().text()}\n${workerLogs}`);

    const form = new FormData();
    form.set('file', image);
    form.set('folder', 'services');
    form.set('target', JSON.stringify({ kind: 'service', serviceId, field: 'primary' }));
    form.set('width', '1');
    form.set('height', '1');
    const uploaded = await adminRequest('/api/admin/media', { method: 'POST', body: form });
    assert.equal(uploaded.status, 201, `${await uploaded.clone().text()}\n${workerLogs}`);
    const uploadedFile = await uploaded.json();

    const listing = await adminRequest('/api/admin/media');
    const files = (await listing.json()).files;
    const media = files.find(({ path: filePath }) => filePath === uploadedFile.path);
    assert.equal(media.pending, true);
    assert.ok(media.usage.some((entry) => entry.includes('Hizmetler')));

    const range = await adminRequest(`/api/admin/media/preview?path=${encodeURIComponent(uploadedFile.path)}`, {
      headers: { Range: 'bytes=0-3' }
    });
    assert.equal(range.status, 206);
    assert.equal(range.headers.get('content-range'), `bytes 0-3/${image.size}`);
    assert.deepEqual(new Uint8Array(await range.arrayBuffer()), Uint8Array.from([137, 80, 78, 71]));

    const protectedDelete = await adminRequest('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: uploadedFile.path })
    });
    assert.equal(protectedDelete.status, 409);

    await stopWorker();
    await startWorker();
    const persisted = await adminRequest('/api/admin/draft');
    const persistedDraft = await persisted.json();
    assert.equal(persistedDraft.site.title, nextContent.site.title);
    assert.equal(persistedDraft.pendingMedia.length, 1);
    assert.equal((await adminRequest('/api/admin/media')).status, 200);

    browser = await chromium.launch({
      executablePath: process.env.ZY_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/admin/`);
    await page.locator('[name="username"]').fill('worker-test');
    await page.locator('[name="password"]').fill(password);
    await page.locator('#login-form button[type="submit"]').click();
    await page.locator('.admin-nav').waitFor({ state: 'visible' });
    await page.locator('[data-target="media"]').click();
    assert.equal(await page.locator('#media-upload-form').count(), 1);
    await page.locator('[data-action="publish"]').click();
    await page.locator('#publish-dialog[open]').waitFor({ state: 'visible' });
    assert.ok(await page.locator('#publish-content-diff li').count() > 0);
    await page.locator('[data-action="close-publish"]').click();

    await page.locator('#media-file').setInputFiles({
      name: 'ui-test.png',
      mimeType: 'image/png',
      buffer: createOnePixelPng()
    });
    await page.waitForFunction(() => document.querySelector('#media-width')?.value === '1');
    await page.locator('#media-upload-form button[type="submit"]').click();
    await page.getByText('Medya KV/R2 taslağına eklendi', { exact: false }).waitFor();
    assert.ok(await page.locator('.media-card').count() >= 2);

    await mkdir('docs/evidence/responsive', { recursive: true });
    const viewportMatrix = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 412, height: 915 },
      { width: 768, height: 1024 },
      { width: 820, height: 1180 },
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1600, height: 900 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
      { width: 3440, height: 1440 },
      { width: 3840, height: 2160 }
    ];
    const responsiveMetrics = [];
    for (const viewport of viewportMatrix) {
      await page.setViewportSize(viewport);
      const measurement = await page.evaluate(() => {
        const bounds = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height, top: rect.top, left: rect.left, right: rect.right };
        };
        return {
          width: innerWidth,
          height: innerHeight,
          documentWidth: document.documentElement.scrollWidth,
          adminContent: bounds('.admin-content'),
          header: bounds('.admin-header'),
          navigationWidth: document.querySelector('.admin-nav')?.scrollWidth ?? 0,
          navigationClientWidth: document.querySelector('.admin-nav')?.clientWidth ?? 0,
          mediaColumns: (() => {
            const cards = [...document.querySelectorAll('.media-card')];
            if (cards.length === 0) return 0;
            const rowTop = Math.round(cards[0].getBoundingClientRect().top);
            return new Set(cards
              .filter((card) => Math.round(card.getBoundingClientRect().top) === rowTop)
              .map((card) => Math.round(card.getBoundingClientRect().left))).size;
          })(),
          formFieldOverflow: [...document.querySelectorAll('.field input, .field textarea, .field select')]
            .some((field) => field.getBoundingClientRect().right > innerWidth + 1),
          wideFieldWidth: document.querySelector('.field-wide')?.getBoundingClientRect().width ?? 0
        };
      });
      assert.ok(measurement.documentWidth <= viewport.width,
        `Admin sayfa yatay taşıyor: ${JSON.stringify(measurement)}`);
      assert.ok(measurement.adminContent.width <= 1761,
        `Admin container max sınırını aştı: ${JSON.stringify(measurement)}`);
      assert.equal(measurement.formFieldOverflow, false,
        `Admin form alanı viewport dışına taştı: ${JSON.stringify(measurement)}`);
      assert.ok(measurement.mediaColumns <= 6, `Admin medya grid'i 6 kolonu aştı: ${JSON.stringify(measurement)}`);
      if (viewport.width >= 1280) {
        assert.ok(measurement.navigationWidth <= measurement.navigationClientWidth,
          `Admin masaüstü menüsünde gizli sekme/taşma var: ${JSON.stringify(measurement)}`);
      }
      if (viewport.width >= 1920) {
        assert.ok(measurement.wideFieldWidth <= 1201,
          `Admin geniş metin alanı okunabilir max genişliği aştı: ${JSON.stringify(measurement)}`);
      }

      if (viewport.width <= 1100) {
        const menuToggle = page.locator('.menu-toggle');
        assert.equal(await menuToggle.isVisible(), true);
        await menuToggle.click();
        assert.equal(await menuToggle.getAttribute('aria-expanded'), 'true');
        const navBounds = await page.locator('.admin-nav').evaluate((nav) => {
          const rect = nav.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        });
        assert.ok(navBounds.left >= 0 && navBounds.right <= viewport.width,
          `Admin mobil/tablet menüsü taşmış: ${JSON.stringify(navBounds)}`);
        const touchTarget = await page.locator('.admin-nav button').first().evaluate((button) => button.getBoundingClientRect().height);
        assert.ok(touchTarget >= 44, `Admin menü dokunma hedefi 44px altında: ${touchTarget}px`);
        await menuToggle.click();
      } else {
        assert.equal(await page.locator('.admin-nav').isVisible(), true);
        assert.equal(await page.locator('.admin-nav button').count(), 12);
      }

      if ([1440, 1920, 2560, 3440, 3840].includes(viewport.width)) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `docs/evidence/responsive/admin-${viewport.width}.png` });
      }
      responsiveMetrics.push(measurement);
    }
    for (const section of ['site', 'services', 'projects', 'promotions', 'seo']) {
      assert.ok(await page.locator(`[data-section="${section}"]`).count() > 0,
        `${section} içerik editörü bulunamadı.`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-action="publish"]').click();
    const publishDialog = page.locator('#publish-dialog[open]');
    await publishDialog.waitFor({ state: 'visible' });
    const dialogBounds = await publishDialog.evaluate((dialog) => {
      const rect = dialog.getBoundingClientRect();
      return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
    });
    assert.ok(dialogBounds.left >= 0 && dialogBounds.right <= 390,
      `Mobil yayın penceresi viewport dışına taştı: ${JSON.stringify(dialogBounds)}`);
    assert.ok(dialogBounds.height <= 0.9 * 844,
      `Mobil yayın penceresi ekran yüksekliğini aştı: ${JSON.stringify(dialogBounds)}`);
    await page.locator('[data-action="close-publish"]').click();

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(100);
    const headerTop = await page.locator('.admin-header').evaluate((header) => header.getBoundingClientRect().top);
    assert.ok(Math.abs(headerTop) <= 1, `Admin sabit menü kaydırmada kayboldu: top=${headerTop}`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#media-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'docs/evidence/responsive/admin-media-1440.png' });
    console.log(`Admin responsive measurements: ${JSON.stringify(responsiveMetrics)}`);
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser?.close();
    await stopWorker();
    await rm(testDirectory, { recursive: true, force: true });
  }
});
