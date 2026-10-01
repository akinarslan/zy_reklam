import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { QualityMonitor } from '../src/scene/quality.ts';

const base = 'http://127.0.0.1:4187';
let server, browser;
const checks = [];
const launchArgs = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4187', '--strictPort'], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Production preview could not start');
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 99) throw new Error('Preview timeout');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.ZY_CHROMIUM_PATH || undefined, args: launchArgs });
  await mkdir('docs/evidence', { recursive: true });
});
after(async () => {
  await browser?.close(); server?.kill();
  const chunks = [];
  for (const name of await readdir('dist/assets')) {
    if (name.endsWith('.js')) { const bytes = await readFile(`dist/assets/${name}`); chunks.push({ file: name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length }); }
  }
  await writeFile('docs/evidence/P3_VERIFICATION.json', JSON.stringify({ stage: 'P3', date: new Date().toISOString(), browser: await browser?.version(), renderer: 'headless Chromium / ANGLE SwiftShader (software GPU)', deviceCaveat: 'Viewport emulation is not a physical mobile GPU measurement.', checks, chunks }, null, 2) + '\n');
});
const ready = async page => {
  await page.goto(base);
  await page.locator('[data-hero-stage]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]')?.dataset.sceneState === 'ready', null, { timeout: 15000 });
};

test('Üretim build’i: özgün konturlar ve delikler; masaüstü/mobil gerçek WebGL çizimi', async () => {
  for (const width of [1440, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: width === 360 ? 2 : 1, isMobile: width === 360, hasTouch: width === 360 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    const details = await page.locator('[data-hero-stage]').evaluate(el => ({ ...el.dataset }));
    assert.equal(details.logoPaths, '8');
    assert.equal(Number(details.logoHoles), 2, 'R/A holes must stay open');
    assert.equal(Number(details.triangles), 4882, 'batching must preserve the baseline main-pass triangle budget');
    assert.ok(Number(details.drawCalls) > 0 && Number(details.drawCalls) <= 13, 'initial idle render must use at most 13 draw calls');
    assert.equal(await page.locator('[data-scene-mount] canvas').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `docs/evidence/p3-hero-${width}.jpg`, type: 'jpeg', quality: 82 });
    checks.push({ check: 'production-webgl', width, ...details, passed: true });
    await page.close();
  }
});

test('Fare dönüşü sınırları, CTA erişimi, görünmeyen sahnede durma ve tekrar açılma', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(page);
  const stage = page.locator('[data-hero-stage]');
  const bounds = await stage.boundingBox();
  await page.mouse.move(bounds.x + bounds.width - 2, bounds.y + bounds.height - 2);
  await page.waitForFunction(() => Number(document.querySelector('[data-hero-stage]').dataset.rotationY) > .2);
  const angles = await stage.evaluate(el => ({ yaw: Number(el.dataset.rotationY), pitch: Number(el.dataset.rotationX) }));
  assert.ok(Math.abs(angles.yaw) <= Math.PI / 10 + .001);
  assert.ok(Math.abs(angles.pitch) <= Math.PI / 18 + .001);
  await page.mouse.move(50, 50);
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.renderLoop === 'idle');
  const before = await stage.getAttribute('data-render-count');
  await page.waitForTimeout(250);
  assert.equal(await stage.getAttribute('data-render-count'), before, 'idle loop does not render continuously');
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.renderLoop === 'stopped');
  const hidden = await stage.getAttribute('data-render-count');
  await page.waitForTimeout(250);
  assert.equal(await stage.getAttribute('data-render-count'), hidden);
  await stage.scrollIntoViewIfNeeded();
  await page.waitForFunction(count => Number(document.querySelector('[data-hero-stage]').dataset.renderCount) > Number(count), hidden);
  await page.locator('.hero .actions a[href="#iletisim"]').click();
  assert.equal(new URL(page.url()).hash, '#iletisim');
  checks.push({ check: 'mouse-bounds-cta-visibility-idle', angles, passed: true });
  await page.close();
});

test('Mobil yatay sürükleme ve gerçek dokunmayla dikey sayfa kaydırma', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  await ready(page);
  const stage = page.locator('[data-hero-stage]');
  const session = await page.context().newCDPSession(page);
  const bounds = await stage.boundingBox();
  const y = Math.min(700, bounds.y + bounds.height / 2);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 90, y }] });
  for (let x = 110; x <= 250; x += 20) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const yaw = Number(await stage.getAttribute('data-rotation-y'));
  assert.ok(yaw > 0 && yaw <= Math.PI / 10 + .001);
  const scrollBefore = await page.evaluate(() => scrollY);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y }] });
  for (let offset = 20; offset <= 140; offset += 20) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: y - offset }] });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => scrollY) > scrollBefore + 40);
  checks.push({ check: 'real-touch-horizontal-drag-vertical-scroll', yaw, passed: true });
  await page.close();
});

test('Hareket sırasında gölge çizimi sınırlanır; son konum ve idle gölgesi korunur', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(page);
  const measurement = await page.evaluate(() => new Promise(resolve => {
    const stage = document.querySelector('[data-hero-stage]');
    const canvas = stage.querySelector('canvas');
    const bounds = stage.getBoundingClientRect();
    const started = performance.now();
    const shadows = Number(stage.dataset.shadowCount);
    const frames = Number(stage.dataset.renderCount);
    const loop = now => {
      canvas.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: bounds.x + bounds.width * (.5 + .4 * Math.sin(now / 180)), clientY: bounds.y + bounds.height / 2 }));
      if (now - started < 1200) requestAnimationFrame(loop);
      else resolve({ elapsedMs: now - started, shadowUpdates: Number(stage.dataset.shadowCount) - shadows, frames: Number(stage.dataset.renderCount) - frames });
    };
    requestAnimationFrame(loop);
  }));
  assert.ok(measurement.shadowUpdates > 0);
  assert.ok(measurement.shadowUpdates <= Math.ceil(measurement.elapsedMs / 50) + 1, 'shadow work is bounded to 20 Hz during movement');
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.renderLoop === 'idle');
  const final = await page.locator('[data-hero-stage]').evaluate(el => ({ ...el.dataset }));
  assert.equal(final.shadowRotationY, final.rotationY);
  assert.equal(final.shadowRotationX, final.rotationX);
  await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-shadow-count'), final.shadowCount);
  checks.push({ check: 'bounded-shadow-refresh-final-pose-idle', ...measurement, passed: true });
  await page.close();
});

test('Hareket azaltma: Three.js indirilmez; açık sahne kaynakları temizlenir', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const rendererRequests = [];
  page.on('request', r => { if (/\/renderer-[^/]+\.js/.test(r.url())) rendererRequests.push(r.url()); });
  await page.goto(base);
  await page.waitForTimeout(600);
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-state'), 'reduced');
  assert.deepEqual(rendererRequests, []);
  assert.equal(await page.locator('[data-scene-mount] canvas').count(), 0);
  await page.locator('[data-motion-toggle]').click();
  await page.locator('[data-hero-stage]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.sceneState === 'ready');
  await page.locator('[data-motion-toggle]').click();
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-state'), 'reduced');
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-resources'), 'disposed');
  assert.equal(await page.locator('[data-scene-mount] canvas').count(), 0);
  assert.equal(await page.locator('[data-scene-poster]').evaluate(el => getComputedStyle(el).opacity), '1');
  checks.push({ check: 'reduced-motion-no-download-disposal', passed: true });
  await page.close();
});

test('WebGL yokken, 3D dosyası hatasında ve context kaybında iletişim korunur', async () => {
  for (const scenario of ['no-webgl', 'module-failure', 'context-loss']) {
    const page = await browser.newPage();
    if (scenario === 'no-webgl') await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
    });
    if (scenario === 'module-failure') await page.route('**/renderer-*.js', route => route.abort());
    if (scenario === 'context-loss') {
      await ready(page);
      await page.locator('[data-scene-mount] canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    } else await page.goto(base);
    await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.sceneState === 'fallback');
    assert.equal(await page.locator('[data-scene-mount] canvas').count(), 0);
    assert.equal(await page.locator('[data-scene-poster]').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.locator('#contact-name').fill('Akın');
    await page.locator('#contact-message').fill('Tabela talebi');
    assert.equal(await page.locator('#contact-message').inputValue(), 'Tabela talebi');
    const reason = await page.locator('[data-hero-stage]').getAttribute('data-scene-reason');
    checks.push({ check: 'fallback', scenario, reason, passed: true });
    await page.close();
  }
});

test('Sürdürülen düşük FPS kaliteyi azaltır, devamında statik yedeğe döner', () => {
  const monitor = new QualityMonitor();
  const decisions = [];
  for (let now = 100; now < 10500; now += 100) {
    const result = monitor.sample(now);
    if (result) decisions.push(result);
  }
  assert.deepEqual(decisions, ['lower', 'poster']);
  checks.push({ check: 'adaptive-quality-policy', measuredSimulationFPS: 10, decisions, passed: true });
});


test('Geciken 3D yüklemesi içeriği engellemez; hareket tercihi yarışında renderer kurulmaz', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/renderer-*.js', async route => { await gate; await route.continue(); });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.sceneState === 'loading');
  assert.equal(await page.locator('h1').isVisible(), true);
  assert.equal(await page.locator('[data-scene-poster]').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await page.locator('.hero .actions a[href="#iletisim"]').isVisible(), true);
  await page.locator('[data-motion-toggle]').click();
  release();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-state'), 'reduced');
  assert.equal(await page.locator('[data-scene-mount] canvas').count(), 0);
  checks.push({ check: 'late-module-motion-race-and-initial-content', passed: true });
  await page.close();
});

test('Sekme gizleme, BFCache geri dönüşü ve sayfadan çıkış kaynak temizliği', async () => {
  const page = await browser.newPage();
  await ready(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-render-loop'), 'stopped');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  });
  assert.equal(await page.locator('[data-scene-mount] canvas').count(), 1);
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-render-loop'), 'stopped');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-state'), 'ready');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  assert.equal(await page.locator('[data-hero-stage]').getAttribute('data-scene-resources'), 'disposed');
  assert.equal(await page.locator('[data-scene-mount] canvas').count(), 0);
  checks.push({ check: 'visibility-page-transition-events-disposal', method: 'controlled lifecycle event simulation', passed: true });
  await page.close();
});

test('Sabit masaüstü ve mobil emülasyon profillerinde etkileşim FPS örneklemesi', async () => {
  for (const profile of [{ name: 'desktop-software', width: 1440, dpr: 1, cpu: 1 }, { name: 'mobile-software-emulation', width: 360, dpr: 2, cpu: 4 }]) {
    const page = await browser.newPage({ viewport: { width: profile.width, height: 900 }, deviceScaleFactor: profile.dpr });
    await ready(page);
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    const measurement = await page.evaluate(() => new Promise(resolve => {
      const stage = document.querySelector('[data-hero-stage]');
      const canvas = stage.querySelector('canvas');
      const bounds = stage.getBoundingClientRect();
      const started = performance.now();
      const count = Number(stage.dataset.renderCount);
      const loop = now => {
        canvas.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', isPrimary: true, clientX: bounds.x + bounds.width * (.5 + .4 * Math.sin(now / 180)), clientY: bounds.y + bounds.height / 2 }));
        if (now - started < 4500 && stage.dataset.sceneState === 'ready') requestAnimationFrame(loop);
        else resolve({ elapsedMs: now - started, renderedFrames: Number(stage.dataset.renderCount) - count, state: stage.dataset.sceneState, quality: stage.dataset.quality });
      };
      requestAnimationFrame(loop);
    }));
    measurement.fps = measurement.renderedFrames * 1000 / measurement.elapsedMs;
    assert.ok(measurement.renderedFrames > 0, 'Actual WebGL frames were sampled');
    checks.push({ check: 'interaction-fps-sample', profile, ...measurement, physicalDevice: false, passed: true });
    await page.close();
  }
});

test('Cihaz ölçüm ekranı: üç gerçek çizim örneği ve indirilen JSON; mobil taşma yok', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const writes = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.goto(`${base}/qa/scene-performance.html`);
  assert.equal(await page.locator('#scene').getAttribute('src'), null, 'no scene loads before explicit measurement');
  await page.locator('#device-kind').selectOption('mobile');
  await page.locator('#environment').selectOption('emulated');
  await page.locator('#device-model').fill('Chromium software QA');
  await page.locator('#device-os').fill('Linux — viewport emulation');
  await page.locator('#sample-duration').selectOption('3000');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#start').click();
  await page.waitForFunction(() => !document.querySelector('#result').hidden, null, { timeout: 45000 });
  const downloaded = page.waitForEvent('download');
  await page.locator('#download').click();
  const file = await downloaded;
  const evidence = JSON.parse(await readFile(await file.path(), 'utf8'));
  assert.equal(evidence.samples.length, 3);
  assert.equal(evidence.viewport.width, 360);
  assert.equal(evidence.context.environmentClaim, 'emulated');
  assert.match(evidence.acceptance, /Pending review/);
  for (const sample of evidence.samples) {
    assert.ok(sample.renderedFrames > 0);
    assert.ok(sample.elapsedMs >= 3000);
    assert.equal(sample.windows.reduce((sum, window) => sum + window.frames, 0), sample.renderedFrames);
    assert.ok(sample.qualityTransitions.length > 0);
  }
  assert.ok(evidence.medianFPS > 0);
  assert.deepEqual(writes, [], 'measurement report is not uploaded');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await writeFile('docs/evidence/P3_DEVICE_TOOL_SAMPLE.json', JSON.stringify({ ...evidence, testEnvironment: 'Headless software GPU; not a physical-device acceptance report.' }, null, 2) + '\n');
  checks.push({ check: 'device-tool-three-samples-json-no-upload-mobile-layout', samples: evidence.samples.length, passed: true });
  await page.close();
});

test('Cihaz ölçümü: hareket tercihi korunur; kullanıcı iptali, resize ve gizli sekme geçersiz sayılır', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/qa/scene-performance.html`);
  await page.locator('#device-model').fill('Chromium test');
  await page.locator('#device-os').fill('Linux test');
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Hareket azaltma etkin'));
  assert.equal(await page.frameLocator('#scene').locator('canvas').count(), 0);
  assert.equal(await page.locator('#result').isVisible(), false);
  await page.locator('#enable-motion').click();
  await page.waitForFunction(() => document.querySelector('#progress').textContent.includes('Ölçüm 1/3'));
  await page.locator('#stop').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('kullanıcı tarafından durduruldu'));
  assert.equal(await page.locator('#download').isVisible(), false);
  await page.locator('#start').click();
  await page.waitForFunction(() => !document.querySelector('#running').hidden);
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Ekran boyutu değişti'));
  assert.equal(await page.locator('#download').isVisible(), false);
  await page.locator('#start').click();
  await page.waitForFunction(() => !document.querySelector('#running').hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Sekme gizlendi'));
  assert.equal(await page.locator('#download').isVisible(), false);
  checks.push({ check: 'device-tool-reduced-explicit-opt-in-stop-resize-hidden-invalidation', method: 'headless browser; hidden event controlled simulation', passed: true });
  await page.close();
});

test('Cihaz ölçümü sırasında gerçek WebGL context kaybı başarılı rapor üretmez', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/qa/scene-performance.html`);
  await page.locator('#device-model').fill('Chromium software QA');
  await page.locator('#device-os').fill('Linux');
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#progress').textContent.includes('Ölçüm 1/3'));
  await page.frameLocator('#scene').locator('canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('fallback'));
  assert.equal(await page.locator('#download').isVisible(), false);
  assert.equal(await page.frameLocator('#scene').locator('canvas').count(), 0);
  checks.push({ check: 'device-tool-real-context-loss-no-success-report', passed: true });
  await page.close();
});
