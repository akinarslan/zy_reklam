import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser?.close();
    await stopWorker();
    await rm(testDirectory, { recursive: true, force: true });
  }
});
