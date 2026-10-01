export function setupNavigation(): () => void {
  const button = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('#main-nav');
  if (!button || !nav) return () => {};
  const dropdowns = Array.from(nav.querySelectorAll<HTMLDetailsElement>('[data-promo-menu], [data-project-menu]'));
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 768px)');
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const close = (dropdown: HTMLDetailsElement) => {
    dropdown.open = false;
    dropdown.querySelector('summary')?.setAttribute('aria-expanded', 'false');
  };
  const open = (dropdown: HTMLDetailsElement) => {
    dropdowns.filter(d => d !== dropdown).forEach(close);
    dropdown.open = true;
    dropdown.querySelector('summary')?.setAttribute('aria-expanded', 'true');
  };
  const setOpen = (value: boolean, restoreFocus = false) => {
    button.setAttribute('aria-expanded', String(value));
    nav.dataset.open = String(value);
    if (!value) dropdowns.forEach(close);
    if (restoreFocus) button.focus();
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'), options);
  nav.addEventListener('click', event => {
    if ((event.target as Element).closest('a')) setOpen(false);
  }, options);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const active = dropdowns.find(d => d.open);
    if (active) { close(active); active.querySelector<HTMLElement>('summary')?.focus(); }
    else if (button.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  }, options);
  document.addEventListener('click', event => {
    if (!nav.contains(event.target as Node) && !button.contains(event.target as Node)) setOpen(false);
  }, options);
  for (const dropdown of dropdowns) {
    const summary = dropdown.querySelector<HTMLElement>('summary');
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    const later = (fn: () => void, delay: number) => {
      const timer = setTimeout(() => { timers.delete(timer); fn(); }, delay);
      timers.add(timer); return timer;
    };
    const cancel = (timer: ReturnType<typeof setTimeout> | undefined) => {
      if (timer !== undefined) { clearTimeout(timer); timers.delete(timer); }
    };
    summary?.setAttribute('aria-expanded', String(dropdown.open));
    summary?.addEventListener('click', () => {
      if (!dropdown.open) dropdowns.filter(d => d !== dropdown).forEach(close);
    }, options);
    dropdown.addEventListener('toggle', () => summary?.setAttribute('aria-expanded', String(dropdown.open)), options);
    dropdown.addEventListener('pointerenter', event => {
      cancel(closeTimer);
      if (hover.matches && desktop.matches && (event as PointerEvent).pointerType === 'mouse') open(dropdown);
    }, options);
    dropdown.addEventListener('pointerleave', () => {
      if (hover.matches && desktop.matches) { cancel(closeTimer); closeTimer = later(() => {
        if (!dropdown.contains(document.activeElement)) close(dropdown);
      }, 180); }
    }, options);
    dropdown.addEventListener('focusout', () => {
      // Native focus transfer finishes after blur; keep keyboard/touch targets visible.
      cancel(focusTimer);
      focusTimer = later(() => { if (!dropdown.contains(document.activeElement)) close(dropdown); }, 0);
    }, options);
    summary?.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); open(dropdown); dropdown.querySelector<HTMLAnchorElement>('a')?.focus();
      }
    }, options);
  }
  const resize = () => setOpen(false);
  desktop.addEventListener('change', resize);
  return () => { abort.abort(); timers.forEach(clearTimeout); timers.clear(); desktop.removeEventListener('change', resize); };
}
