import './matrix.css';
import { createRenderer, type MatrixRenderer } from './renderer.js';
import { createControls } from './controls';
import { attachInputs } from './input';
import { palettes, readState, rendererOptions, stateURL, type MatrixState } from './state';

export function mountMatrix(hero: HTMLElement): () => void {
  const state = readState();
  const layer = document.createElement('div'); layer.className = 'matrix-rain-layer';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); canvas.dataset.matrixRain = '';
  const bloom = document.createElement('canvas'); bloom.className = 'matrix-rain-bloom';
  const fx = document.createElement('div'); fx.className = 'matrix-rain-fx';
  layer.append(canvas, bloom, fx); hero.prepend(layer); hero.classList.add('matrix-rain-host');
  let renderer: MatrixRenderer | null = null, raf = 0, frames = 0, lastStats = 0, warpTimer = 0;
  let visible = false, destroyed = false, baseSpeed = 6, warping = false, lastBloom = state.bloom || .5;
  const abort = new AbortController(); const signal = abort.signal;
  const reduced = () => document.documentElement.dataset.motion === 'reduced' && !state.motion;
  const effectiveMode = () => reduced() ? 'classic' : state.mode;
  const active = () => !destroyed && visible && document.visibilityState !== 'hidden';
  const sign = hero.querySelector<HTMLElement>('[data-hero-stage]');
  const foregroundActive = () => sign?.dataset.renderLoop === 'running' || sign?.dataset.dragging === 'true';
  const controls = createControls(hero, state, (key, shift) => { void action(key, shift); }, configure);
  function describe() {
    if (!renderer) return;
    const stats = renderer.stats();
    hero.dataset.matrixState = JSON.stringify({ ...state, mode: effectiveMode(), speed: stats.speed,
      quality: stats.quality, baseQuality: stats.baseQuality, foregroundBudget: stats.foregroundBudget, bloomActive: stats.bloom, p3Active: stats.p3, fingerprint: stats.fingerprint,
      cameraX: stats.cameraX, cameraY: stats.cameraY, focal: stats.focal, dpr: stats.dpr,
      glyphSet: stats.glyphs, messageStrands: stats.messageStrands, frames, running: Boolean(raf), reduced: reduced() });
    if (!controls.debug.hidden) controls.debug.textContent = `${stats.frameMs.toFixed(1)} ms · CPU ${stats.workMs.toFixed(1)} ms · ${stats.glyphCount} glyph / ${stats.glowCount} glow · q${stats.quality} · DPR ${stats.dpr.toFixed(2)} · ${Math.round(stats.width * stats.dpr)}×${Math.round(stats.height * stats.dpr)} · font ${stats.monoSize.toFixed(2)}×${stats.monoSqueeze.toFixed(2)} · ${stats.p3 ? 'P3' : 'sRGB'} · ${stats.kana ? 'kana' : 'Latin fallback'}`;
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; renderer?.resetClock(); describe(); }
  function draw(time: number) {
    raf = 0; if (!active() || !renderer) return;
    renderer.draw(time); frames++;
    raf = requestAnimationFrame(draw);
    if (time - lastStats > 250) { lastStats = time; describe(); }
  }
  function resume() { if (active() && renderer && !raf) { renderer.resetClock(); raf = requestAnimationFrame(draw); describe(); } }
  function rebuild() {
    stop(); renderer?.destroy();
    const options = rendererOptions({ ...state, mode: effectiveMode() });
    renderer = createRenderer(hero, canvas, bloom, fx, options, reduced(), foregroundActive);
    renderer.speed(warping && !reduced() ? 45 : baseSpeed);
    fx.classList.toggle('matrix-rain-off', !state.effects);
    controls.sync(effectiveMode()); describe(); resume();
  }
  function write() {
    try { history.replaceState(history.state, '', stateURL(state)); } catch { /* embedded history denied */ }
  }
  function configure(key: keyof MatrixState, value: string | number | boolean) {
    const candidate = stateURL(state); candidate.searchParams.set(`mx${key.charAt(0).toUpperCase()}${key.slice(1)}`, String(typeof value === 'boolean' ? Number(value) : value));
    Object.assign(state, readState(candidate)); rebuild(); write(); controls.notify('Matrix ayarı güncellendi');
    if (key === 'bloom' && state.bloom > 0) lastBloom = state.bloom;
  }
  function speed(delta: number) {
    if (effectiveMode() === 'classic') { controls.notify('Klasik modda kamera ilerlemez'); return; }
    baseSpeed = Math.max(-20, Math.min(60, baseSpeed + delta)); renderer?.speed(baseSpeed);
    controls.notify(`Hız: ${Math.round(baseSpeed)}`); describe();
  }
  function warp() {
    if (effectiveMode() === 'classic' || reduced()) { controls.notify('Warp için Fly modu gerekir'); return; }
    clearTimeout(warpTimer); warping = true; renderer?.speed(45); controls.notify('Warp'); describe();
    warpTimer = window.setTimeout(() => { warping = false; renderer?.speed(baseSpeed); describe(); }, 1400);
  }
  async function action(key: string, shift = false) {
    if (destroyed) return;
    if (['w', 'arrowup'].includes(key)) { speed(2); return; }
    if (['s', 'arrowdown'].includes(key)) { speed(-2); return; }
    if (key === ' ') { warp(); return; }
    if (key === 'h') { controls.hud.hidden = !controls.hud.hidden; controls.notify(controls.hud.hidden ? 'Matrix kontrolleri gizlendi · H / uzun basma ile göster' : 'Matrix kontrolleri gösterildi'); return; }
    if (key === '?' || key === '/') { controls.help(); return; }
    if (key === 'f') {
      try {
        if (!document.fullscreenEnabled || !hero.requestFullscreen) throw new Error('unsupported');
        if (document.fullscreenElement === hero) await document.exitFullscreen(); else await hero.requestFullscreen();
      } catch { controls.notify('Bu tarayıcıda tam ekran kullanılamıyor.'); }
      return;
    }
    if (key === 'l') {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('unsupported');
        await navigator.clipboard.writeText(stateURL(state).href);
        if (!destroyed) controls.notify('Bağlantı kopyalandı');
      } catch { if (!destroyed) controls.notify('Bu ortamda bağlantı kopyalama kullanılamıyor.'); }
      return;
    }
    if (key === 'p') {
      try {
        if (!canvas.toBlob || !('download' in document.createElement('a'))) throw new Error('unsupported');
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG')), 'image/png'));
        if (destroyed) return;
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.download = `matrix-${state.seed.replace(/[^\w-]/g, '_')}-${Date.now()}.png`; a.href = url; a.click();
        URL.revokeObjectURL(url); controls.notify('Matrix PNG kaydedildi');
      } catch { if (!destroyed) controls.notify('Bu ortamda PNG kaydetme desteklenmiyor.'); }
      return;
    }
    if (key === 'm') state.mode = effectiveMode() === 'fly' ? 'classic' : 'fly';
    if (key === 'c') state.palette = palettes[(palettes.indexOf(state.palette as typeof palettes[number]) + (shift ? -1 : 1) + palettes.length) % palettes.length];
    if (key === 'r') state.seed = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    if (key === 'v') state.effects = !state.effects;
    if (key === 'b') { if (state.bloom > 0) { lastBloom = state.bloom; state.bloom = 0; } else state.bloom = lastBloom; }
    rebuild(); write();
    const message: Record<string, string> = {
      m: `Mod: ${effectiveMode() === 'fly' ? 'Fly' : 'Klasik'}`,
      c: `Renk: ${state.palette}`, r: `Yeni seed: ${state.seed}`,
      v: `Efektler: ${state.effects ? 'açık' : 'kapalı'}`,
      b: `Bloom: ${state.bloom > 0 ? 'açık' : 'kapalı'}`
    };
    controls.notify(message[key] || 'Matrix ayarı güncellendi');
  }
  try { rebuild(); } catch { controls.destroy(); layer.remove(); hero.classList.remove('matrix-rain-host'); return () => {}; }
  const detach = attachInputs(hero, active, (x, y) => renderer?.steer(x, y), () => renderer?.leave(),
    (key, shift) => { void action(key, shift); }, speed);
  const io = new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting && e.intersectionRatio >= .15);
    if (visible) resume(); else stop();
  }, { threshold: [0, .15, .5] }); io.observe(hero);
  let width = 0, height = 0;
  const ro = new ResizeObserver(entries => {
    const r = entries[0].contentRect;
    if (Math.abs(r.width - width) < 1 && Math.abs(r.height - height) < 1) return;
    width = r.width; height = r.height; renderer?.resize(); describe();
  }); ro.observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resume(); }, { signal });
  window.addEventListener('zy:motion', () => { clearTimeout(warpTimer); warping = false; rebuild(); }, { signal });
  document.addEventListener('fullscreenchange', () => { renderer?.resize(); describe(); }, { signal });
  window.addEventListener('pageshow', resume, { signal });
  window.addEventListener('pagehide', stop, { signal });
  return () => {
    destroyed = true; stop(); clearTimeout(warpTimer); detach(); abort.abort(); io.disconnect(); ro.disconnect();
    renderer?.destroy(); renderer = null; canvas.width = bloom.width = 1;
    controls.destroy(); layer.remove(); hero.classList.remove('matrix-rain-host'); delete hero.dataset.matrixState;
  };
}
