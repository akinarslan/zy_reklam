export function setupMotionPreferences(): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  let override: boolean | null = null;
  const apply = () => {
    const reduced = override ?? query.matches;
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    button?.setAttribute('aria-pressed', String(reduced));
    if (button) button.textContent = reduced ? 'Hareket azaltıldı' : 'Hareketi azalt';
    window.dispatchEvent(new CustomEvent('zy:motion', { detail: { reduced } }));
  };
  const toggle = () => {
    override = !(override ?? query.matches);
    apply();
  };
  query.addEventListener('change', apply);
  button?.addEventListener('click', toggle);
  apply();
  return () => {
    query.removeEventListener('change', apply);
    button?.removeEventListener('click', toggle);
  };
}
