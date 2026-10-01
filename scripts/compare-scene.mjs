import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const project = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv[2]) throw new Error('Usage: node scripts/compare-scene.mjs <baseline-dist> [baseline-commit]');
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
try {
  for (const profile of [{ name: 'desktop-software', width: 1440, dpr: 1, cpu: 1 }, { name: 'mobile-software-emulation', width: 360, dpr: 2, cpu: 4 }]) {
    for (let repetition = 1; repetition <= 3; repetition++) for (const variant of ['before', 'after']) {
      active = variant;
      const page = await browser.newPage({ viewport: { width: profile.width, height: 900 }, deviceScaleFactor: profile.dpr });
      await page.goto('http://127.0.0.1:4198');
      await page.locator('[data-hero-stage]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-hero-stage]').dataset.sceneState === 'ready', null, { timeout: 15000 });
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
      const result = await page.evaluate(() => new Promise(resolve => {
        const stage = document.querySelector('[data-hero-stage]'), canvas = stage.querySelector('canvas'), bounds = stage.getBoundingClientRect();
        const start = performance.now(), frames = Number(stage.dataset.renderCount), shadows = Number(stage.dataset.shadowCount || 0);
        const loop = now => {
          canvas.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', isPrimary: true, clientX: bounds.x + bounds.width * (.5 + .4 * Math.sin(now / 180)), clientY: bounds.y + bounds.height / 2 }));
          if (now - start < 4500 && stage.dataset.sceneState === 'ready') requestAnimationFrame(loop);
          else resolve({ elapsedMs: now - start, renderedFrames: Number(stage.dataset.renderCount) - frames, shadowUpdates: stage.dataset.shadowCount ? Number(stage.dataset.shadowCount) - shadows : null, state: stage.dataset.sceneState, quality: stage.dataset.quality });
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
  await writeFile(join(project, 'docs/evidence/P3_PERFORMANCE_COMPARISON.json'), JSON.stringify({ date: new Date().toISOString(), baselineCommit: process.argv[3] || null, browser: browser.version(), gpu: 'ANGLE SwiftShader / software GPU', method: 'Three alternating before/after pairs per profile, 4.5 seconds active interaction per sample; same process/browser. FPS counts actual renderer calls.', physicalDevice: false, acceptance: 'Physical desktop/mobile acceptance remains open; software comparison is not a device guarantee.', medians, samples }, null, 2) + '\n');
} finally { await browser.close(); server.close(); }
