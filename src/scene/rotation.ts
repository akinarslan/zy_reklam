export interface RotationTarget { yaw: number; pitch: number }

/** Pointer and keyboard input only; the renderer retains ownership of its RAF. */
export function setupSignRotation(stage: HTMLElement, canvas: HTMLCanvasElement, target: RotationTarget, wake: () => void): () => void {
  const abort = new AbortController(), options = { signal: abort.signal };
  let pointer: number | null = null, startX = 0, startY = 0, startYaw = 0;
  let face = 0, dragging = false;
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'ZY Reklam 3D tabela. Ön ve arka yüz için sol veya sağ ok tuşunu kullanın.');
  const snap = () => {
    face = Math.round(target.yaw / Math.PI) * Math.PI;
    target.yaw = face; target.pitch = .05;
    stage.dataset.snap = 'true'; wake();
  };
  const release = () => {
    const id = pointer;
    pointer = null;
    stage.dataset.dragging = 'false';
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    if (dragging) snap();
    dragging = false;
  };
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || pointer !== null) return;
    // Pointer dragging must not acquire persistent keyboard focus and keep a
    // live-content update deferred after release. Tab focus stays available;
    // browser panning is governed by touch-action: pan-y, not this default.
    event.preventDefault();
    pointer = event.pointerId; startX = event.clientX; startY = event.clientY; startYaw = target.yaw;
    canvas.setPointerCapture(pointer);
  }, options);
  canvas.addEventListener('pointermove', event => {
    const bounds = stage.getBoundingClientRect();
    if (event.pointerId === pointer) {
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (!dragging && (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy))) return;
      dragging = true; stage.dataset.dragging = 'true'; stage.dataset.snap = 'false';
      target.yaw = startYaw + dx / bounds.width * Math.PI * 2;
      wake();
    } else if (pointer === null && event.pointerType === 'mouse') {
      stage.dataset.snap = 'false';
      target.yaw = face + Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)) * Math.PI / 10;
      target.pitch = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) * Math.PI / 18;
      wake();
    }
  }, options);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(type, event => { if (event.pointerId === pointer) release(); }, options);
  }
  canvas.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && pointer === null) {
      target.yaw = face || -.12; target.pitch = .05; wake();
    }
  }, options);
  stage.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); release();
    target.yaw = Math.round(target.yaw / Math.PI) * Math.PI + (event.key === 'ArrowRight' ? Math.PI : -Math.PI);
    snap();
  }, options);
  window.addEventListener('blur', release, options);
  window.addEventListener('pagehide', release, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); }, options);
  return () => {
    release(); abort.abort();
    stage.removeAttribute('tabindex'); stage.removeAttribute('role'); stage.removeAttribute('aria-label');
  };
}
