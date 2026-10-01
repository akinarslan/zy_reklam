import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const project = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv[2]) throw new Error('Usage: node scripts/compare-scene.mjs <baseline-dist> [baseline-commit] [output-name.json]');
const outputName = process.argv[4] || 'P3_PERFORMANCE_COMPARISON.json';
if (!/^[A-Z0-9_]+\.json$/.test(outputName)) throw new Error('Invalid evidence filename');
const roots = { before: resolve(process.argv[2]), after: join(project, 'dist') };
const server = createServer();
let active = 'before';
server.on('request', async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
    const file = resolve(roots[active], path);
    if (!file.startsWith(roots[active] + '/')) throw new Error('Invalid asset path');
    const bytes = await readFile(file);
    res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.woff') ? 'font/woff' : 'text/html');
    res.end(bytes);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(resolve => server.listen(4198, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.ZY_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const samples = [];
function decomposeDrawCalls(samples, variant) {
  const rows = samples.filter(sample => sample.variant === variant);
  const unavailable = reason => ({ variant, mainPassDrawCalls: null, extraDrawCallsPerShadowUpdate: null, reason });
  if (!rows.every(row => Number.isFinite(row.shadowUpdates))) return unavailable('Baseline has no shadow-update counter. Raw GL totals remain recorded.');
  const first = rows[0];
  const second = rows.find(row => first.renderedFrames * row.shadowUpdates !== row.renderedFrames * first.shadowUpdates);
  if (!second) return unavailable('No independent frame/shadow sample pair.');
  const determinant = first.renderedFrames * second.shadowUpdates - second.renderedFrames * first.shadowUpdates;
  const main = Math.round((first.glDrawCalls * second.shadowUpdates - second.glDrawCalls * first.shadowUpdates) / determinant);
  const shadow = Math.round((first.renderedFrames * second.glDrawCalls - second.renderedFrames * first.glDrawCalls) / determinant);
  if (!rows.every(row => row.glDrawCalls === row.renderedFrames * main + row.shadowUpdates * shadow)) return unavailable('Draw-call decomposition does not match every sample; inspect quality changes and raw GL totals.');
  return { variant, mainPassDrawCalls: main, extraDrawCallsPerShadowUpdate: shadow, exactMatchSamples: rows.length, method: 'Solve two independent measured frame/shadow/GL totals, round to integer draw submissions, then verify all variant samples exactly.' };
}
try {
  for (const profile of [{ name: 'desktop-software', width: 1440, dpr: 1, cpu: 1 }, { name: 'mobile-software-emulation', width: 360, dpr: 2, cpu: 4 }]) {
    for (let repetition = 1; repetition <= 3; repetition++) for (const variant of ['before', 'after']) {
      active = variant;
      const page = await browser.newPage({ viewport: { width: profile.width, height: 900 }, deviceScaleFactor: profile.dpr });
      await page.addInitScript(() => {
        window.__glDrawCalls = 0;
        for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
          const original = WebGL2RenderingContext.prototype[name];
          WebGL2RenderingContext.prototype[name] = function (...args) {
            window.__glDrawCalls++;
            return original.apply(this, args);
          };
        }
      });
      await page.goto('http://127.0.0.1:4198');
      await page.locator('[data-hero-stage]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.sceneState === 'ready', null, { timeout: 15000 });
      if (repetition === 1) {
        await page.waitForTimeout(500);
        await page.locator('[data-hero-stage] canvas').screenshot({ path: join(project, `../p3-batch-${profile.name}-${variant}.png`) });
      }
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
      const result = await page.evaluate(() => new Promise(resolve => {
        const stage = document.querySelector('[data-hero-stage]'), canvas = stage.querySelector('canvas'), bounds = stage.getBoundingClientRect();
        const start = performance.now(), frames = Number(stage.dataset.renderCount), shadows = Number(stage.dataset.shadowCount || 0), draws = window.__glDrawCalls;
        const loop = now => {
          canvas.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', isPrimary: true, clientX: bounds.x + bounds.width * (.5 + .4 * Math.sin(now / 180)), clientY: bounds.y + bounds.height / 2 }));
          if (now - start < 4500 && stage.dataset.sceneState === 'ready') requestAnimationFrame(loop);
          else resolve({ elapsedMs: now - start, renderedFrames: Number(stage.dataset.renderCount) - frames, shadowUpdates: stage.dataset.shadowCount ? Number(stage.dataset.shadowCount) - shadows : null, glDrawCalls: window.__glDrawCalls - draws, lastRenderDrawCalls: Number(stage.dataset.drawCalls) || null, triangles: Number(stage.dataset.triangles), state: stage.dataset.sceneState, quality: stage.dataset.quality });
        }; requestAnimationFrame(loop);
      }));
      samples.push({ profile, variant, repetition, ...result, fps: result.renderedFrames * 1000 / result.elapsedMs });
      console.log(profile.name, variant, repetition, samples.at(-1).fps.toFixed(1));
      await page.close();
    }
  }
  const medians = [];
  for (const profile of [...new Set(samples.map(s => s.profile.name))]) for (const variant of ['before', 'after']) {
    const values = samples.filter(s => s.profile.name === profile && s.variant === variant).map(s => s.fps).sort((a,b) => a-b);
    medians.push({ profile, variant, medianFPS: values[1], minFPS: values[0], maxFPS: values[2] });
  }
  const drawCalls = ['before', 'after'].map(variant => decomposeDrawCalls(samples, variant));
  await writeFile(join(project, 'docs/evidence', outputName), JSON.stringify({ date: new Date().toISOString(), baselineCommit: process.argv[3] || null, browser: browser.version(), gpu: 'ANGLE SwiftShader / software GPU', method: 'Three alternating before/after pairs per profile, 4.5 seconds active interaction per sample; same process/browser. FPS counts actual renderer calls. Identical WebGL2 draw-method instrumentation counts main and shadow draw submissions in both variants; initialization excluded. lastRenderDrawCalls and triangles include shadow work when the final frame refreshes shadows.', physicalDevice: false, acceptance: 'Physical desktop/mobile acceptance remains open; software comparison is not a device guarantee.', drawCalls, medians, samples }, null, 2) + '\n');
} finally { await browser.close(); server.close(); }
