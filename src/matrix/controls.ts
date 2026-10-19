import { palettes, type MatrixState } from './state';

export function createControls(hero: HTMLElement, state: MatrixState, action: (key: string, shift?: boolean) => void,
  configure: (key: keyof MatrixState, value: string | number | boolean) => void) {
  const hud = document.createElement('div'); hud.className = 'matrix-rain-hud';
  const hint = document.createElement('span'); hint.className = 'matrix-rain-hint';
  hint.textContent = 'W/S: Hız · M: Fly/Klasik · Space: Warp · C: Renk · ?: Tüm kontroller';
  const pad = document.createElement('div'); pad.className = 'matrix-rain-pad';
  const buttons = new Map<string, HTMLButtonElement>();
  for (const [key, label] of [['?', '?'], ['m', 'Fly/Klasik'], ['c', 'Renk'], [' ', 'Warp'], ['h', 'Gizle']]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.dataset.matrixAction = key; button.setAttribute('aria-label', key === '?' ? 'Matrix kontrolleri' : `Matrix ${label}`);
    button.addEventListener('click', () => action(key)); buttons.set(key, button); pad.append(button);
  }
  const panel = document.createElement('dialog'); panel.className = 'matrix-rain-help'; panel.id = 'matrix-rain-help';
  panel.setAttribute('aria-labelledby', 'matrix-rain-help-title');
  const title = document.createElement('h2'); title.id = 'matrix-rain-help-title'; title.textContent = 'Matrix kontrolleri';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Kapat';
  close.addEventListener('click', () => panel.close());
  const legend = document.createElement('p');
  legend.textContent = 'Fare / tek parmak: yön · W/S veya ↑/↓: hız · Kaydırma: hız ve sayfa · Space: geçici warp · M: Fly/Klasik · C / Shift+C: renk · R: yeni seed · V: vignette/scanlines · B: bloom · H: Matrix HUD gizle · F: hero tam ekran · P: PNG · L: bağlantı kopyala · ?: yardım · Escape: kapat. İki parmak: hız · çift dokunma: warp · uzun basma: gizle/göster.';
  const details = document.createElement('details'); const summary = document.createElement('summary');
  summary.textContent = 'Gelişmiş ayarlar'; details.append(summary);
  const fields = new Map<keyof MatrixState, HTMLInputElement | HTMLSelectElement>();
  const specs: [keyof MatrixState, string, string | readonly string[]][] = [
    ['seed', 'Seed', 'text'], ['palette', 'Palet', palettes], ['density', 'Yoğunluk (40–900)', 'number'],
    ['msg', 'Gizli mesaj', 'text'], ['glyphs', 'Özel karakterler', 'text'], ['bloom', 'Bloom gücü (0–1)', 'number'],
    ['halo', 'Halo', 'checkbox'], ['ramp', 'Trail ramp', 'checkbox'], ['p3', 'Display-P3', ['auto', '0', '1']],
    ['idle', 'Boştayken kamera', 'checkbox'], ['motion', 'Matrix hareket azaltmayı geçersiz kıl', 'checkbox']
  ];
  for (const [key, labelText, kind] of specs) {
    const label = document.createElement('label'); label.textContent = labelText;
    let input: HTMLInputElement | HTMLSelectElement;
    if (typeof kind !== 'string') {
      input = document.createElement('select');
      for (const name of kind) { const opt = document.createElement('option'); opt.value = name; opt.textContent = name; input.append(opt); }
    } else {
      input = document.createElement('input'); input.type = kind;
      if (key === 'density') { input.min = '40'; input.max = '900'; input.step = '1'; }
      if (key === 'bloom') { input.min = '0'; input.max = '1'; input.step = '.05'; }
      if (kind === 'text') input.maxLength = key === 'glyphs' ? 256 : key === 'seed' ? 128 : 120;
    }
    input.dataset.matrixSetting = key;
    input.addEventListener('change', () => {
      if (!input.checkValidity()) { input.reportValidity(); return; }
      configure(key, input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : input.value);
    });
    label.append(input); details.append(label); fields.set(key, input);
  }
  const capabilities = document.createElement('div'); capabilities.className = 'matrix-rain-capabilities';
  for (const [key, label] of [['f', 'Hero tam ekran'], ['p', 'Matrix PNG kaydet'], ['l', 'Bağlantı kopyala']]) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.dataset.matrixAction = key; b.addEventListener('click', () => action(key)); capabilities.append(b);
  }
  const debug = document.createElement('output'); debug.className = 'matrix-rain-debug';
  debug.hidden = true;
  if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(location.hostname)) {
    const label = document.createElement('label'); label.textContent = 'Debug (yerel önizleme)';
    const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.dataset.matrixDebug = '';
    toggle.addEventListener('change', () => { debug.hidden = !toggle.checked; }); label.append(toggle); details.append(label);
  }
  panel.append(title, close, legend, details, capabilities, debug);
  const toast = document.createElement('output'); toast.className = 'matrix-rain-toast'; toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  hud.append(hint, pad); hero.append(hud, panel, toast);
  buttons.get('?')!.setAttribute('aria-controls', panel.id);
  buttons.get('?')!.setAttribute('aria-expanded', 'false');
  const onClose = () => buttons.get('?')!.setAttribute('aria-expanded', 'false'); panel.addEventListener('close', onClose);
  let toastTimer = 0;
  const sync = (mode: MatrixState['mode'] = state.mode) => {
    for (const [key, input] of fields) {
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = Boolean(state[key]);
      else input.value = String(state[key]);
    }
    buttons.get('m')!.textContent = mode === 'fly' ? 'Fly' : 'Klasik';
    buttons.get('m')!.setAttribute('aria-pressed', String(mode === 'classic'));
    buttons.get('c')!.textContent = state.palette;
  };
  sync();
  return { hud, panel, debug, sync,
    help() { if (panel.open) panel.close(); else { hud.hidden = false; panel.showModal(); buttons.get('?')!.setAttribute('aria-expanded', 'true'); } },
    notify(text: string) { toast.textContent = text; toast.classList.add('matrix-rain-show'); clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('matrix-rain-show'), 1800); },
    destroy() { clearTimeout(toastTimer); if (panel.open) panel.close(); hud.remove(); panel.remove(); toast.remove(); }
  };
}
