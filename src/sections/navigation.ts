export function setupNavigation(): () => void {
  const button = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('#main-nav');
  if (!button || !nav) return () => {};
  const setOpen = (open: boolean, restoreFocus = false) => {
    button.setAttribute('aria-expanded', String(open));
    nav.dataset.open = String(open);
    if (restoreFocus) button.focus();
  };
  const toggle = () => setOpen(button.getAttribute('aria-expanded') !== 'true');
  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  };
  const clickAway = (event: MouseEvent) => {
    if (!nav.contains(event.target as Node) && !button.contains(event.target as Node)) setOpen(false);
  };
  button.addEventListener('click', toggle);
  nav.addEventListener('click', closeOnLink);
  document.addEventListener('keydown', escape);
  document.addEventListener('click', clickAway);
  return () => {
    button.removeEventListener('click', toggle);
    nav.removeEventListener('click', closeOnLink);
    document.removeEventListener('keydown', escape);
    document.removeEventListener('click', clickAway);
  };
}
