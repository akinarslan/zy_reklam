export function setupNavigation(): () => void {
  const button = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('#main-nav');
  if (!button || !nav) return () => {};
  const dropdown = nav.querySelector<HTMLDetailsElement>('[data-promo-menu]');
  const summary = dropdown?.querySelector<HTMLElement>('summary');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 768px)');
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  const closeDropdown = () => {
    clearTimeout(closeTimer);
    if (dropdown) { dropdown.open = false; summary?.setAttribute('aria-expanded', 'false'); }
  };
  const setOpen = (open: boolean, restoreFocus = false) => {
    button.setAttribute('aria-expanded', String(open));
    nav.dataset.open = String(open);
    if (!open) closeDropdown();
    if (restoreFocus) button.focus();
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'), options);
  nav.addEventListener('click', event => {
    if ((event.target as Element).closest('a')) setOpen(false);
  }, options);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (dropdown?.open) { closeDropdown(); summary?.focus(); }
    else if (button.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  }, options);
  document.addEventListener('click', event => {
    if (!nav.contains(event.target as Node) && !button.contains(event.target as Node)) setOpen(false);
  }, options);
  summary?.setAttribute('aria-expanded', String(dropdown?.open ?? false));
  dropdown?.addEventListener('toggle', () => summary?.setAttribute('aria-expanded', String(dropdown.open)), options);
  dropdown?.addEventListener('pointerenter', event => {
    clearTimeout(closeTimer);
    if (hover.matches && desktop.matches && (event as PointerEvent).pointerType === 'mouse') dropdown.open = true;
  }, options);
  dropdown?.addEventListener('pointerleave', () => {
    if (hover.matches && desktop.matches) closeTimer = setTimeout(() => {
      if (!dropdown.contains(document.activeElement)) closeDropdown();
    }, 180);
  }, options);
  dropdown?.addEventListener('focusout', () => {
    // Wait for native focus transfer; a microtask can run between blur and focus.
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      if (!dropdown.contains(document.activeElement)) closeDropdown();
    }, 0);
  }, options);
  summary?.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (dropdown) dropdown.open = true;
      dropdown?.querySelector<HTMLAnchorElement>('a')?.focus();
    }
  }, options);
  const resize = () => setOpen(false);
  desktop.addEventListener('change', resize);
  return () => { abort.abort(); clearTimeout(closeTimer); clearTimeout(focusTimer); desktop.removeEventListener('change', resize); };
}
