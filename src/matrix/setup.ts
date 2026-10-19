export function setupMatrix(): () => void {
  const hero = document.querySelector<HTMLElement>('main > .hero[data-hero-3d]');
  if (!hero) return () => {};
  let disposed = false; let cleanup: (() => void) | undefined;
  void import('./controller').then(({ mountMatrix }) => { if (!disposed) cleanup = mountMatrix(hero); }).catch(() => {
    // Optional background failure must never block static content, navigation or the sign.
  });
  return () => { disposed = true; cleanup?.(); };
}
