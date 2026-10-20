import {diagnosticTest,gpuTimingFailure,observeGpuPage,assertGpuEvents} from '../helpers/gpu-policy.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { QualityMonitor } from '../../src/scene/quality.ts';
import {browserDiagnostics} from '../helpers/browser-ready.mjs';

const base = 'http://127.0.0.1:4213';
let server, browser;
const checks = [];
const launchArgs = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
before(async () => {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4213', '--strictPort'], { stdio: 'ignore' });
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
  await writeFile('docs/evidence/GPU_PERFORMANCE_VERIFICATION.json', JSON.stringify({ stage: 'P3', date: new Date().toISOString(), browser: await browser?.version(), renderer: 'headless Chromium / ANGLE SwiftShader (software GPU)', deviceCaveat: 'Viewport emulation is not a physical mobile GPU measurement.', checks, chunks }, null, 2) + '\n');
});
const ready = async page => {
  await page.goto(base);
  await page.locator('[data-hero-stage]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-hero-stage]')?.dataset.sceneState === 'ready', null, { timeout: 15000 });
};

diagnosticTest('Sabit masaüstü ve mobil emülasyon profillerinde etkileşim FPS örneklemesi', async () => {
  for (const profile of [{ name: 'desktop-software', width: 1440, dpr: 1, cpu: 1 }, { name: 'mobile-software-emulation', width: 360, dpr: 2, cpu: 4 }]) {
    const page = await browser.newPage({ viewport: { width: profile.width, height: 900 }, deviceScaleFactor: profile.dpr });
    observeGpuPage(page);
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
    assertGpuEvents(page);await page.close();
  }
});

diagnosticTest('Cihaz ölçüm ekranı: üç gerçek çizim örneği ve indirilen JSON; mobil taşma yok', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  observeGpuPage(page);
  const diagnostic=browserDiagnostics(page);
  try {
  const writes = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  const response=await page.goto(`${base}/qa/scene-performance.html`,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.locator('#start').waitFor({state:'visible'});
  assert.equal(await page.locator('#scene').getAttribute('src'), null, 'no scene loads before explicit measurement');
  await page.locator('#device-kind').selectOption('mobile');
  await page.locator('#environment').selectOption('emulated');
  await page.locator('#device-model').fill('Chromium software QA');
  await page.locator('#device-os').fill('Linux — viewport emulation');
  await page.locator('#sample-duration').selectOption('3000');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#start').click();
  // The tool has explicit completion/error states. An error must fail with its
  // cause, not spend 45 seconds waiting for a result it will never produce.
  await page.waitForFunction(() => !document.querySelector('#running').hidden || document.querySelector('#start').disabled, null, {polling:100});
  await page.waitForFunction(() => !document.querySelector('#result').hidden || !document.querySelector('#start').disabled, null, {timeout:45000,polling:100});
  assert.equal(await page.locator('#result').isVisible(),true,await page.locator('#status').textContent());
  const downloaded = page.waitForEvent('download');
  await page.locator('#download').click();
  const file = await downloaded;
  const evidence = JSON.parse(await readFile(await file.path(), 'utf8'));
  const shared = await page.frameLocator('#scene').locator('.hero').evaluate(hero => ({
    matrix: JSON.parse(hero.dataset.matrixState), matrixCanvas: hero.querySelectorAll('[data-matrix-rain]').length,
    webglCanvas: hero.querySelectorAll('[data-hero-stage] canvas').length, scene: hero.querySelector('[data-hero-stage]').dataset.sceneState,
  }));
  assert.equal(shared.matrixCanvas, 1, 'Matrix remains enabled during the actual three-sample measurement');
  assert.equal(shared.webglCanvas, 1); assert.equal(shared.scene, 'ready');
  assert.ok(shared.matrix.frames > 0 && shared.matrix.running, 'Matrix keeps rendering alongside WebGL');
  assert.equal(shared.matrix.density, 320, 'Adaptive culling must not replace the requested particle field');
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
  assertGpuEvents(page);
  }catch(error){await diagnostic('scene-device-measurement',error);await gpuTimingFailure(error,page,'measurement');throw error;}
  finally{await page.close();}
});
