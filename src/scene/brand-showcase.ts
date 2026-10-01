import type { BrandShowcaseRenderer } from './brand-renderer';

/**
 * Keeps the colourful brand scene out of the initial bundle and only starts it
 * when the showcase approaches the viewport. The static HTML remains the fallback.
 */
export function setupBrandShowcase(): () => void {
  const stage = document.querySelector<HTMLElement>('[data-brand-showcase]');
  const mount = document.querySelector<HTMLElement>('[data-brand-showcase-mount]');
  if (!stage || !mount) return () => {};

  let instance: BrandShowcaseRenderer | undefined;
  let visible = false;
  let destroyed = false;
  let failed = false;
  let loading = false;
  let generation = 0;

  const reduced = () => document.documentElement.dataset.motion === 'reduced';
  const state = (value: string) => { stage.dataset.brandState = value; };

  const unload = () => {
    generation++;
    instance?.dispose();
    instance = undefined;
    loading = false;
    mount.replaceChildren();
  };

  const load = async () => {
    if (destroyed || failed || reduced() || !visible || document.hidden || loading || instance) return;
    loading = true;
    const token = ++generation;
    state('loading');
    try {
      const module = await import('./brand-renderer');
      if (destroyed || token !== generation || reduced()) return;
      instance = module.createBrandShowcaseRenderer(stage, mount);
      instance.setVisible(visible && !document.hidden);
      state('ready');
    } catch {
      if (!destroyed && token === generation) {
        failed = true;
        unload();
        state('fallback');
      }
    } finally {
      if (token === generation) loading = false;
    }
  };

  const reconcile = () => {
    if (destroyed) return;
    if (reduced()) {
      unload();
      state('reduced');
      return;
    }
    if (failed) return;
    if (instance) {
      instance.setVisible(visible && !document.hidden);
      return;
    }
    if (visible && !document.hidden) void load();
    else state('pending');
  };

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    reconcile();
  }, { threshold: .03, rootMargin: '180px 0px' });

  observer.observe(stage);
  window.addEventListener('zy:motion', reconcile);
  document.addEventListener('visibilitychange', reconcile);

  const pageshow = () => {
    const bounds = stage.getBoundingClientRect();
    visible = bounds.bottom > -180 && bounds.top < innerHeight + 180;
    reconcile();
  };
  window.addEventListener('pageshow', pageshow);

  state(reduced() ? 'reduced' : 'pending');

  return () => {
    destroyed = true;
    observer.disconnect();
    window.removeEventListener('zy:motion', reconcile);
    document.removeEventListener('visibilitychange', reconcile);
    window.removeEventListener('pageshow', pageshow);
    unload();
    state('disposed');
  };
}
