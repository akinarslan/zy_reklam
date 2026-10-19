export function attachInputs(hero: HTMLElement, active: () => boolean,
  steer: (x: number, y: number) => void, leave: () => void,
  action: (key: string, shift?: boolean) => void, speed: (delta: number) => void) {
  const abort = new AbortController(); const signal = abort.signal;
  const editing = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(
    'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],form'
  ));
  const occupied = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(
    'button,a,input,textarea,select,dialog,[contenteditable],[data-hero-stage],.matrix-rain-hud'
  ));
  const point = (x: number, y: number) => { const r = hero.getBoundingClientRect(); steer(x - r.left, y - r.top); };
  hero.addEventListener('pointermove', e => { if (!occupied(e.target) && active()) point(e.clientX, e.clientY); }, { signal, passive: true });
  hero.addEventListener('pointerleave', leave, { signal, passive: true });
  hero.addEventListener('wheel', e => { if (active() && !occupied(e.target) && e.deltaY) speed(-e.deltaY * .02); }, { signal, passive: true });
  document.addEventListener('keydown', e => {
    if (!active() || editing(e.target) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const key = e.code === 'Space' ? ' ' : e.key.toLowerCase();
    if (e.repeat && !['w', 's', 'arrowup', 'arrowdown'].includes(key)) return;
    if (!['w', 's', 'arrowup', 'arrowdown', ' ', 'm', 'c', 'r', 'v', 'b', '?', '/', 'h', 'f', 'p', 'l'].includes(key)) return;
    if (e.target instanceof Element && e.target.closest('[data-hero-stage]')) return;
    if (key === ' ' && e.target instanceof Element && e.target.closest('button,a')) return;
    if (key === ' ' || key.startsWith('arrow')) e.preventDefault();
    action(key, e.shiftKey);
  }, { signal });
  let press = 0, pinch: number | null = null, lastY = 0, tap = 0, startX = 0, startY = 0;
  let moved = false, held = false, tracking = false;
  const clear = () => { clearTimeout(press); press = 0; };
  hero.addEventListener('touchstart', e => {
    clear(); if (!active() || occupied(e.target)) { tracking = false; return; }
    tracking = true; moved = held = false;
    if (e.touches.length === 1) {
      const t = e.touches[0]; startX = t.clientX; startY = t.clientY; point(startX, startY);
      press = window.setTimeout(() => { held = true; action('h'); }, 600);
    } else if (e.touches.length === 2) { pinch = lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2; moved = true; }
  }, { signal, passive: true });
  hero.addEventListener('touchmove', e => {
    if (!tracking) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - startX, t.clientY - startY) > 12) { moved = true; clear(); }
    if (e.touches.length === 1 && pinch === null) point(t.clientX, t.clientY);
    if (e.touches.length === 2) { const y = (e.touches[0].clientY + e.touches[1].clientY) / 2; speed((lastY - y) * .12); lastY = y; }
    // Passive: vertical browser scroll/pinch and existing sign gestures retain ownership.
  }, { signal, passive: true });
  hero.addEventListener('touchend', e => {
    clear(); if (!tracking || e.touches.length) return;
    if (!moved && !held && pinch === null) { const now = performance.now(); if (now - tap < 320) { action(' '); tap = 0; } else tap = now; }
    pinch = null; tracking = false;
  }, { signal, passive: true });
  hero.addEventListener('touchcancel', () => { clear(); tracking = false; pinch = null; }, { signal, passive: true });
  window.addEventListener('blur', () => { clear(); leave(); }, { signal });
  return () => { clear(); abort.abort(); };
}
