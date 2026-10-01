import { measureScene } from './sampler.js';

const frame = document.querySelector('#scene');
const panel = document.querySelector('#panel');
const form = document.querySelector('#measurement-form');
const startButton = document.querySelector('#start');
const running = document.querySelector('#running');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const result = document.querySelector('#result');
const enableMotion = document.querySelector('#enable-motion');
let controller, report;
const message = text => { status.textContent = text; };
const wait = (ms, signal) => new Promise((resolve, reject) => {
  const abort = () => { clearTimeout(timer); reject(signal.reason); };
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
});
const stop = reason => controller?.abort(new Error(reason));
document.querySelector('#stop').addEventListener('click', () => stop('Ölçüm kullanıcı tarafından durduruldu.'));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Sekme gizlendi; bu ölçüm geçersiz. Yeniden başlatın.'); });
window.addEventListener('resize', () => stop('Ekran boyutu değişti; bu ölçüm geçersiz. Yeniden başlatın.'));
window.addEventListener('pagehide', () => stop('Sayfadan çıkıldı.'));

async function ready(signal) {
  const deadline = performance.now() + 15000;
  while (performance.now() < deadline) {
    const doc = frame.contentDocument;
    const stage = doc?.querySelector('[data-hero-stage]');
    if (stage) {
      stage.scrollIntoView({ behavior: 'instant', block: 'center' });
      if (stage.dataset.sceneState === 'reduced') {
        enableMotion.hidden = false;
        throw new Error('Hareket azaltma etkin. Ölçüm yapılmadı. İsterseniz aşağıdaki düğmeyle 3D hareketini açıp ölçebilirsiniz.');
      }
      if (stage.dataset.sceneState === 'fallback') throw new Error(`3D kullanılamıyor (${stage.dataset.sceneReason}). Ölçüm yapılmadı.`);
      if (stage.dataset.sceneState === 'ready' && stage.querySelector('canvas')) return stage;
    }
    await wait(100, signal);
  }
  throw new Error('Sahne 15 saniye içinde hazırlanamadı. Bağlantıyı kontrol edip yeniden deneyin.');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (controller || !form.reportValidity()) return;
  if (!document.querySelector('#device-model').value.trim() || !document.querySelector('#device-os').value.trim()) {
    message('Cihaz modeli ve işletim sistemi alanlarını doldurun.'); return;
  }
  enableMotion.hidden = true;
  report = undefined; result.hidden = true;
  controller = new AbortController();
  const signal = controller.signal;
  const kind = document.querySelector('#device-kind').value;
  const context = {
    kind, environmentClaim: document.querySelector('#environment').value,
    model: document.querySelector('#device-model').value.trim(),
    os: document.querySelector('#device-os').value.trim(),
    powerMode: document.querySelector('#power-mode').value,
  };
  const duration = Number(document.querySelector('#sample-duration').value);
  startButton.disabled = true; panel.hidden = true; running.hidden = false; frame.hidden = false;
  progress.textContent = 'Sahne hazırlanıyor…';
  // Same origin, actual production page and viewport; no replacement scene/model.
  if (!frame.hasAttribute('src')) frame.src = '/';
  try {
    const stage = await ready(signal);
    const win = frame.contentWindow;
    const viewport = { width: win.innerWidth, height: win.innerHeight, dpr: win.devicePixelRatio };
    const samples = [];
    for (let index = 0; index < 3; index++) {
      progress.textContent = `Ölçüm ${index + 1}/3 · hazırlık`;
      await measureScene(stage, 1000, signal); // Discard warm-up counters.
      progress.textContent = `Ölçüm ${index + 1}/3 · ${duration / 1000} saniye`;
      samples.push(await measureScene(stage, duration, signal));
    }
    const sorted = samples.map(sample => sample.averageFPS).sort((a, b) => a - b);
    const gpu = stage.querySelector('canvas')?.getContext('webgl2');
    const debug = gpu?.getExtension('WEBGL_debug_renderer_info');
    report = {
      schemaVersion: 1, stage: 'P3.6', measuredAt: new Date().toISOString(),
      origin: location.origin, buildScripts: [...frame.contentDocument.querySelectorAll('script[src]')].map(script => new URL(script.src).pathname),
      context, deviceEvidence: 'User-supplied context; physical hardware is not automatically verified.',
      browser: navigator.userAgent, gpuRenderer: debug ? gpu.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'Unavailable',
      viewport, sceneViewport: stage.getBoundingClientRect().toJSON(),
      method: 'Three active synthetic mouse-input samples on the production page; 1-second warm-up before each. Renderer-call counters, not presented GPU frames. No CPU throttling applied by this tool.',
      sampleDurationMs: duration, samples, medianFPS: sorted[1],
      acceptance: 'Pending review of hardware profile, sample duration and manual touch/scroll/visual checks; no automatic P3 pass.',
    };
    document.querySelector('#summary').textContent = `Üç örneğin ortancası: ${report.medianFPS.toFixed(1)} FPS. Kalite: ${stage.dataset.quality}. Cihaz kabulü ayrıca incelenecek.`;
    result.hidden = false;
    message('Üç ölçüm tamamlandı. Raporu indirebilirsiniz.');
  } catch (error) {
    report = undefined; result.hidden = true;
    message(error instanceof Error ? error.message : 'Ölçüm tamamlanamadı.');
  } finally {
    controller = undefined; startButton.disabled = false; panel.hidden = false; running.hidden = true;
  }
});

enableMotion.addEventListener('click', () => {
  const doc = frame.contentDocument;
  if (doc?.documentElement.dataset.motion === 'reduced') doc.querySelector('[data-motion-toggle]')?.click();
  enableMotion.hidden = true;
  form.requestSubmit();
});

document.querySelector('#download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `zy-reklam-p3-${report.context.kind}-${Date.now()}.json`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
