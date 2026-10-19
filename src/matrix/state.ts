export const palettes = ['green', 'amber', 'ice', 'magenta', 'blood', 'gold', 'seed', 'auto'] as const;
export interface MatrixState {
  seed: string; palette: string; density: number; msg: string; glyphs: string;
  mode: 'fly' | 'classic'; bloom: number; halo: boolean; ramp: boolean;
  p3: 'auto' | '0' | '1'; idle: boolean; motion: boolean; effects: boolean;
}
const names: Record<keyof MatrixState, string> = {
  seed: 'mxSeed', palette: 'mxPalette', density: 'mxDensity', msg: 'mxMsg', glyphs: 'mxGlyphs',
  mode: 'mxMode', bloom: 'mxBloom', halo: 'mxHalo', ramp: 'mxRamp', p3: 'mxP3', idle: 'mxIdle',
  motion: 'mxMotion', effects: 'mxEffects'
};
export function readState(url = new URL(location.href)): MatrixState {
  const q = url.searchParams;
  const get = (k: keyof MatrixState) => q.get(names[k]);
  const bounded = (k: keyof MatrixState, fallback: number, min: number, max: number) => {
    const raw = get(k); const value = raw === null || raw.trim() === '' ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  return {
    seed: (get('seed') || 'matrix').slice(0, 128),
    palette: palettes.includes(get('palette') as typeof palettes[number]) ? get('palette')! : 'green',
    density: Math.round(bounded('density', 320, 40, 900)), msg: (get('msg') || '').slice(0, 120),
    glyphs: (get('glyphs') || '').slice(0, 256), mode: get('mode') === 'classic' ? 'classic' : 'fly',
    bloom: bounded('bloom', matchMedia('(pointer: coarse)').matches ? 0 : .5, 0, 1),
    halo: get('halo') !== '0', ramp: get('ramp') !== '0',
    p3: ['0', '1'].includes(get('p3') || '') ? get('p3') as '0' | '1' : 'auto',
    idle: get('idle') === '1', motion: get('motion') === '1', effects: get('effects') !== '0'
  };
}
export function stateURL(state: MatrixState): URL {
  const url = new URL(location.href);
  for (const [key, name] of Object.entries(names)) url.searchParams.set(name, String(
    typeof state[key as keyof MatrixState] === 'boolean' ? Number(state[key as keyof MatrixState]) : state[key as keyof MatrixState]
  ));
  return url;
}
export function rendererOptions(state: MatrixState): URLSearchParams {
  const p = new URLSearchParams();
  for (const key of Object.keys(names) as (keyof MatrixState)[]) {
    const v = state[key];
    if (key === 'p3' && v === 'auto') continue;
    if (key === 'glyphs' && !v) continue;
    p.set(key, typeof v === 'boolean' ? String(Number(v)) : String(v));
  }
  return p;
}
