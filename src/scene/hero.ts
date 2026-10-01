import type { HeroRenderer } from './renderer';

/** Importing this adapter does not download Three.js. Content stays usable throughout. */
export function setupHeroScene(): () => void {
  const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
  const mount = document.querySelector<HTMLElement>('[data-scene-mount]');
  const hint = document.querySelector<HTMLElement>('[data-scene-hint]');
  if (!stage || !mount) return () => {};
  let instance: HeroRenderer | undefined;
  let visible = false;
  let destroyed = false;
  let failed = false;
  let generation = 0;
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  let pending: AbortController | undefined;
  const reduced = () => document.documentElement.dataset.motion === 'reduced';
  const state = (value: string, reason = '') => {
    stage.dataset.sceneState = value;
    stage.dataset.sceneReason = reason;
    if (hint) hint.textContent = value === 'ready' ? 'FAREYLE DÖNDÜR · YATAY SÜRÜKLE' : 'FİKİRDEN UYGULAMAYA';
  };
  const cancel = () => {
    generation++;
    clearTimeout(scheduled); scheduled = undefined;
    pending?.abort(); pending = undefined;
    instance?.dispose(); instance = undefined;
  };
  const fallback = (reason: string) => { failed = true; cancel(); state('fallback', reason); };
  const load = async () => {
    if (destroyed || failed || reduced() || !visible || document.hidden || pending || instance) return;
    const token = ++generation;
    const controller = new AbortController();
    pending = controller;
    const timeout = setTimeout(() => { if (token === generation) fallback('load-timeout'); }, 8000);
    state('loading');
    try {
      const module = await import('./renderer');
      if (token !== generation || destroyed) return;
      const response = await fetch('/assets/brand/zy-reklam-wordmark.svg', { signal: controller.signal });
      if (!response.ok) throw new Error('Logo kaynağı yüklenemedi.');
      const svg = await response.text();
      if (token !== generation || destroyed || reduced()) return;
      instance = module.createHeroRenderer(stage, mount, svg, fallback);
      instance.setVisible(visible && !document.hidden);
      state('ready');
    } catch {
      if (token === generation && !destroyed) fallback('load-or-webgl-error');
    } finally {
      clearTimeout(timeout);
      if (token === generation) pending = undefined;
    }
  };
  const reconcile = () => {
    if (destroyed) return;
    if (reduced()) { cancel(); state('reduced'); return; }
    if (failed) return;
    if (instance) { instance.setVisible(visible && !document.hidden); return; }
    if (!visible || document.hidden) {
      if (pending || scheduled !== undefined) cancel();
      state('pending'); return;
    }
    if (!pending && scheduled === undefined) {
      state('pending');
      scheduled = setTimeout(() => { scheduled = undefined; void load(); }, 250);
    }
  };
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    reconcile();
  }, { threshold: .05 });
  observer.observe(stage);
  window.addEventListener('zy:motion', reconcile);
  document.addEventListener('visibilitychange', reconcile);
  const hide = (event: PageTransitionEvent) => { if (event.persisted) { visible = false; reconcile(); } };
  const show = () => {
    const bounds = stage.getBoundingClientRect();
    visible = bounds.bottom > 0 && bounds.top < innerHeight;
    reconcile();
  };
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  state(reduced() ? 'reduced' : 'pending');
  return () => {
    destroyed = true; cancel(); observer.disconnect();
    window.removeEventListener('zy:motion', reconcile);
    document.removeEventListener('visibilitychange', reconcile);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', show);
    state('disposed');
  };
}
