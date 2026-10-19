/**
 * Matrix Digital Rain — Matteo He / hematteo, CC BY-NC-SA 4.0.
 * Derived from upstream 3752d0b75fd87911a92682313a02e6520ad88d02/index.html.
 * Modified for ZY Reklam Matrix hero experiment. See docs/THIRD_PARTY.md.
 * Upstream rendering math retained; host, lifecycle and input ownership injected.
 */
export function createRenderer(host, canvas, bloom, fx, P, reduced) {
  // Wide gamut: on a P3 display the palette's numbers are read as P3, which
  // reaches a phosphor green sRGB cannot show. Every canvas the rain passes
  // through has to be P3 too, or it is clipped back to sRGB on the way.
  // #p3=0 opts out, #p3=1 forces it.
  const WANT_P3 = P.get('p3') === '1' || (P.get('p3') !== '0'
    && typeof matchMedia === 'function' && matchMedia('(color-gamut: p3)').matches);
  const ctx2d = (c) => { let context; try { context = c.getContext('2d', WANT_P3 ? { colorSpace: 'display-p3' } : undefined); } catch {} context ||= c.getContext('2d'); if (!context) throw new Error('Canvas 2D unavailable'); return context; };
  const ctx = ctx2d(canvas);
  // browsers without canvas colour spaces ignore the option; then stay in sRGB
  const P3 = WANT_P3 && ctx.getContextAttributes?.().colorSpace === 'display-p3';
  let SEED_STR = P.get('seed') || 'matrix';
  const MSG = (P.get('msg') || '').toUpperCase();
  let MODE = P.get('mode') === 'classic' ? 'classic' : 'fly';   // 'fly' = 3D corridor, 'classic' = the film
  // Flying the camera through a field is exactly the parallax that triggers
  // motion sickness, so honour the OS setting: start flat, and stop the glyphs
  // flashing when they change. #motion=1 overrides.
  const REDUCED = reduced && P.get('motion') !== '1';
  if (REDUCED && !P.get('mode')) MODE = 'classic';

  // FNV-1a -> mulberry32: same seed string always grows the same field.
  const hash32 = (str) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const mulberry32 = (a) => () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let SEED = hash32(SEED_STR);
  let rng = mulberry32(SEED);                // reassigned by reseed()
  const rand = (a, b) => a + rng() * (b - a);

  // The film's set: half-width katakana (narrow, scanned from cookbooks) with
  // Latin capitals and digits, all drawn mirrored -- see the frame transform.
  const katakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ';
  let glyphs = P.get('glyphs')
    ? [...new Set(P.get('glyphs'))]
    : (katakana + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:･."=*+-<>').split('');

  // --- fonts ----------------------------------------------------------------
  // Two stacks. A Japanese font supplies the half-width kana; a real monospace
  // supplies the Latin and symbols. They are used at DIFFERENT sizes, chosen so
  // both advance exactly one cell -- the film's glyphs sit on a uniform grid,
  // and the Japanese faces that ship on most machines (Hiragino, Yu Gothic) are
  // proportional for Latin: 'W' is 4x the width of ':' if you let them be.
  const CJK = '"Hiragino Kaku Gothic ProN","Hiragino Sans","Osaka-Mono","MS Gothic","Meiryo","Yu Gothic","Noto Sans CJK JP","Noto Sans Mono CJK JP","IPAGothic","TakaoGothic","VL Gothic",sans-serif';
  const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace';

  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const REF = 100;
  const advance = (stack, ch) => { probe.font = REF + 'px ' + stack; return probe.measureText(ch).width / REF; };
  // Missing glyphs render as .notdef (a box) or as nothing. Comparing pixels
  // against a codepoint no font can have catches both.
  function covers(stack, ch) {
    probe.canvas.width = probe.canvas.height = 24;
    probe.font = '20px ' + stack; probe.textBaseline = 'top'; probe.fillStyle = '#fff';
    const shot = (t) => { probe.clearRect(0, 0, 24, 24); probe.fillText(t, 0, 0);
                          return probe.getImageData(0, 0, 24, 24).data.join(); };
    const tofu = shot('\uFFFF'), blank = shot(' '), real = shot(ch);
    return real !== tofu && real !== blank;
  }

  // Ink height, averaged over a few glyphs: how tall the strokes actually are,
  // which is what the eye matches on -- not the em size.
  const inkHeight = (stack, chars) => {
    probe.font = REF + 'px ' + stack; probe.textBaseline = 'alphabetic';
    let h = 0, n = 0;
    for (const ch of chars) {
      const m = probe.measureText(ch);
      const a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
      if (Number.isFinite(a) && Number.isFinite(d) && a + d > 0) { h += a + d; n++; }
    }
    return n ? h / n / REF : NaN;
  };

  const HAS_KANA = covers(CJK, 'ｱ');
  // One cell = the half-width advance (0.5 em in every Japanese face), or the
  // monospace advance when no Japanese font is installed at all.
  const CELL = HAS_KANA ? advance(CJK, 'ｱ') : advance(MONO, 'M');
  const MONO_ADV = advance(MONO, 'M');
  // If the Japanese face is a true monospace (MS Gothic, Osaka-Mono) its ASCII
  // is already one cell, so one font draws everything and MONO is never touched.
  const CJK_MONO = HAS_KANA && Math.abs(advance(CJK, 'M') - CELL) < 0.01
                            && Math.abs(advance(CJK, 'I') - CELL) < 0.01;
  // Match the Latin to the kana by HEIGHT, then squeeze it into the cell.
  // Shrinking the font size until the ADVANCES match (the obvious move) shrinks
  // the strokes with it -- Menlo came out at 0.77x the kana, where the film's
  // Latin and kana read at the same size. Condensing instead keeps the height
  // and costs one transform per strand, since the Latin is already batched.
  const kanaInk = HAS_KANA ? inkHeight(CJK, 'ｱｲｳｶｷﾀﾅﾊﾏﾗ') : NaN;
  const monoInk = inkHeight(MONO, 'AMXW09');
  let MONO_SIZE = CELL / MONO_ADV, MONO_SQUEEZE = 1;   // fallback: advance-matched
  if (HAS_KANA && !CJK_MONO && kanaInk > 0 && monoInk > 0) {
    MONO_SIZE = Math.min(1.6, Math.max(0.5, kanaInk / monoInk));
    MONO_SQUEEZE = Math.min(1.5, Math.max(0.5, CELL / (MONO_ADV * MONO_SIZE)));
  }
  const SQUEEZE = Math.abs(MONO_SQUEEZE - 1) > 0.005;
  // Otherwise split by script, not by width: ASCII goes to the monospace face.
  // Picking per-glyph on width alone would strand the odd Latin letter that
  // happens to measure one cell (Hiragino's 'J') in a different typeface.
  const USE_CJK = new Uint8Array(0x10000);
  glyphs = glyphs.filter(ch => {
    const cp = ch.charCodeAt(0);
    const cjkOk = HAS_KANA && covers(CJK, ch) && Math.abs(advance(CJK, ch) - CELL) < 0.01;
    if (cjkOk && (CJK_MONO || cp > 127)) { USE_CJK[cp] = 1; return true; }
    return covers(MONO, ch);              // drop anything neither stack can draw
  });
  if (!glyphs.length) glyphs = ['0', '1'];
  const pick = () => glyphs[(rng() * glyphs.length) | 0];
  // Latin glyphs are queued while the kana are drawn, then flushed in one go,
  // so ctx.font changes twice per strand instead of once per glyph.
  const qCh = [], qY = new Float32Array(1024), qA = new Float32Array(1024);
  const nCh = [], nY = new Float32Array(8), nA = new Float32Array(8);   // neck glyphs
  // One glyph in whichever face it belongs to; leaves ctx.font on the kana.
  function glyph(ch, x, y, fCjk, fMono) {
    if (USE_CJK[ch.charCodeAt(0)]) { ctx.fillText(ch, x, y); return; }
    if (SQUEEZE) {
      ctx.save(); ctx.translate(x, 0); ctx.scale(MONO_SQUEEZE, 1);
      ctx.font = fMono; ctx.fillText(ch, 0, y); ctx.restore();
    } else { ctx.font = fMono; ctx.fillText(ch, x, y); ctx.font = fCjk; }
  }

  // --- camera / projection ---
  let W, H, cx, cy, dpr;
  const FOCAL = 420;        // lens: larger = narrower FOV / more zoom
  const NEAR = 40;          // z at which a strand has flown past us
  const FAR = 2600;         // spawn depth
  const BEHIND = FAR;       // reversing past this recycles a strand to the near plane
  const GLYPH_SPACING = 26; // world-space vertical gap between glyphs in a strand
  const FIELD = 1400;       // how far strands spread from the centre axis
  const NEAR_FADE = 90;     // strands dissolve over this much depth before the near plane
  const FAR_FADE = 240;     // ...and emerge from black over this much depth after spawning
  const GAZE_R = 150;       // px: glyphs this close to the cursor wake up
  let mx = -1e9, my = -1e9; // cursor in CSS px; off-screen until the mouse moves

  // The camera moves through the field; strands are NOT panned on screen. That
  // is what buys depth-dependent parallax: near strands sweep, far ones drift.
  let camTX = 0, camTY = 0, camX = 0, camY = 0;
  let focal = FOCAL;        // eased: widens (dolly-zoom) as speed climbs

  // speed: eased toward a target so acceleration ramps instead of jumping
  const SPEED_MIN = -20, SPEED_MAX = 60, CRUISE = 6, WARP = 45;
  let speedTarget = CRUISE, speed = CRUISE;   // forward walking speed (world units / frame)

  const IDLE_DRIFT = !REDUCED && P.get('idle') === '1';
  let lastMouse = performance.now(); // idle timer: hides the cursor + HUD, gates autopilot
  let wasIdle = false;

  // --- adaptive quality -----------------------------------------------------
  // A frame-time EMA steps the render scale (backing-store pixels) and the
  // far-cull size down when frames are being dropped, and back up cautiously
  // when there is clear headroom, so the page finds its own level on whatever
  // it is running on. Each down-step doubles the wait before trying up again.
  // 'ontouchstart' is true on any machine with a touchscreen, and in Chrome's
  // device emulation, so it says nothing about how the page is actually driven.
  // The phone profile keys off the PRIMARY pointer instead; the gestures are
  // wired wherever touch exists, so a touchscreen laptop keeps the desktop look
  // and still responds to a finger.
  const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  // an embedded frame is never granted downloads, and its URL is not the page's
  const MAX_DPR = Math.min(window.devicePixelRatio || 1, TOUCH ? 1.5 : 2);
  // The background shares the main thread with the WebGL sign. One additional
  // LOD step leaves headroom without stopping rain or imposing an FPS cap.
  const QUALITY = [1, 0.75, 0.5, 0.375];
  let qi = 0;
  let ftEma = 16.7, workEma = 4;    // ms: rAF interval, and our own CPU time per frame
  let lastStep = 0, upWait = 4000, lastDbg = 0;
  // The film's glyphs sit in heavy, soft bloom; a per-head sprite is far
  // tighter than that. Quarter-resolution blur of the whole frame, screened
  // back over it. Off on touch devices and whenever the governor steps down.
  const bloomCtx = ctx2d(bloom);
  // The source is thresholded first, so only heads and the brightest glyphs
  // bloom and the dim trails no longer lift the blacks into a green haze.
  // Then two blurs of it: a tight core and a wide, faint halo. #halo=0 is the
  // old single blur of the whole frame.
  const HALO = P.get('halo') !== '0';
  const bloomSrc = document.createElement('canvas'), bloomSrcCtx = ctx2d(bloomSrc);
  const BLOOM_DIV = 4;
  const BLOOM = Math.max(0, Math.min(1, P.get('bloom') === null ? (TOUCH ? 0 : 0.5) : +P.get('bloom') || 0));
  let bloomOff = BLOOM <= 0;
  const DEBUG = false; const dbg = {textContent: ''};
  if (TOUCH) fx.classList.add('matrix-rain-off');  // the overlay is pure fill-rate on a phone

  function resize() {
    dpr = MAX_DPR * QUALITY[qi];
    const rect = host.getBoundingClientRect(); W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = W * dpr; canvas.height = H * dpr;   // render at native pixels
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    // CSS stretches the small bloom buffer back up, which smooths it for free
    bloom.width = Math.max(1, (W * dpr / BLOOM_DIV) | 0);
    bloom.height = Math.max(1, (H * dpr / BLOOM_DIV) | 0);
    bloomSrc.width = bloom.width; bloomSrc.height = bloom.height;
    cx = W / 2; cy = H / 2;
  }
  resize();
  

  // --- colour ---------------------------------------------------------------
  // A palette is one hue with four strand "personalities" hung off it: mostly
  // classic, some pale/bright, some deep & dim, a rare shifted one.
  const hsl = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const i = (h / 60) | 0;
    const r = [c, x, 0, 0, x, c][i], g = [x, c, c, x, 0, 0][i], b = [0, 0, x, c, c, x][i];
    return [((r + m) * 255) | 0, ((g + m) * 255) | 0, ((b + m) * 255) | 0];
  };
  // `neck` is the few glyphs just behind the head: the film's drop cools from
  // white through a pale, washed-out tint into the saturated body.
  const makeTints = (hue) => [
    { body: hsl(hue, 95, 45),      neck: hsl(hue, 80, 72),       head: hsl(hue, 100, 91),     w: 0.64 },  // classic: phosphor, not neon
    { body: hsl(hue + 12, 100, 73), neck: hsl(hue + 12, 100, 85), head: hsl(hue + 12, 100, 94), w: 0.10 }, // pale bright
    { body: hsl(hue - 8, 100, 33),  neck: hsl(hue - 8, 85, 55),   head: hsl(hue - 8, 70, 74),   w: 0.16 }, // deep / dim
    { body: hsl(hue + 45, 100, 50), neck: hsl(hue + 45, 100, 72), head: hsl(hue + 45, 100, 87), w: 0.10 }, // shifted accent
  ];
  // Colour ramp along the trail (#ramp=0 for the old flat one): the neck
  // tint, and a power-curve falloff stretched longer, so the head stays punchy
  // and the tail thins out gradually instead of greying out linearly. Both
  // pairs keep mean brightness about where the linear ramp had it. Fly gets
  // the gentler curve: its camera motion already smears the tail, and a
  // longer one there only adds haze.
  const RAMP = P.get('ramp') !== '0';
  const NECK = RAMP ? 3 : 0;            // glyphs behind the head drawn in the neck tint
  const TRAIL_POW = { classic: RAMP ? 2 : 1, fly: RAMP ? 1.4 : 1 };
  const TRAIL_STRETCH = { classic: RAMP ? 1.4 : 1, fly: RAMP ? 1.15 : 1 };
  const css = (c, a) => P3
    ? `color(display-p3 ${c.map(v => (v / 255).toFixed(4)).join(' ')}${a === undefined ? '' : ' / ' + a})`
    : a === undefined ? `rgb(${c})` : `rgba(${c},${a})`;
  const NAMED = { green: 135, amber: 42, ice: 190, magenta: 310, blood: 0, gold: 52 };
  const NAMES = Object.keys(NAMED);
  // palette=seed  -> a hue nobody else's seed lands on
  // palette=auto  -> tracks the local clock: amber evenings, ice at night
  function hueFor(name) {
    if (name === 'auto') { const h = new Date().getHours(); return h < 6 ? 190 : h < 11 ? 135 : h < 17 ? 52 : h < 21 ? 42 : 310; }
    if (name === 'seed' || !(name in NAMED)) return SEED % 360;
    return NAMED[name];
  }
  let paletteName = P.get('palette') || 'green';

  const WARP_RGB = [190, 255, 255];   // everything bleaches toward this at speed
  // One solid colour per tint; brightness is globalAlpha (a number, no string
  // parse per glyph). The glow is a cached radial blob drawn behind the head:
  // one drawImage of a bitmap, where a canvas shadow would re-render and blur
  // the glyph into a temp surface on every single head, every frame.
  function glowSprite(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = ctx2d(c);
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, css(rgb, 0.9));
    grad.addColorStop(0.35, css(rgb, 0.35));
    grad.addColorStop(1, css(rgb, 0));
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return c;
  }
  function buildPal(tints, warpMix) {
    const mix = (c) => warpMix ? c.map((v, i) => (v + (WARP_RGB[i] - v) * 0.72) | 0) : c;
    return tints.map(t => {
      const b = mix(t.body), n = mix(t.neck), h = mix(t.head);
      return { body: css(b), neck: css(n), head: css(h), glow: glowSprite(h) };
    });
  }
  let TINTS, PAL, PAL_W;
  function setPalette(name) {
    paletteName = name;
    const hue = hueFor(name);
    TINTS = makeTints(hue);
    PAL = buildPal(TINTS, false);
    PAL_W = buildPal(TINTS, true);
    host.style.setProperty('--matrix-rain-hue', String(((hue % 360) + 360) % 360));
    
  }
  function pickTint() {
    let r = rng();
    for (let i = 0; i < TINTS.length; i++) { r -= TINTS[i].w; if (r <= 0) return i; }
    return 0;
  }
  const GLOW_MIN = 14;     // only glow heads large enough for it to read

  // --- strands ---
  // density also falls out of the seed unless it is pinned in the hash
  let NUM, NUM_CLASSIC;
  function setCounts() {
    NUM = Math.max(40, Math.min(900, +P.get('density') || (200 + (SEED >>> 8) % 180)));
    // classic runs about twice as many: most columns are lit at any moment in
    // the film, and each drop is on screen for only about half its cycle
    NUM_CLASSIC = P.get('density') ? NUM : Math.min(900, Math.round(NUM * 2));
  }
  setCounts();
  const strands = [];
  setPalette(paletteName);

  // --- classic mode: what the film actually shows -------------------------
  // Fixed columns on a glyph grid, a few depth planes, no forward travel. The
  // same strand machinery runs; only the geometry and the recycling differ.
  const PLANES = [{ z: 420, w: 0.55 }, { z: 720, w: 0.30 }, { z: 1150, w: 0.15 }];
  const PITCH = GLYPH_SPACING * 0.8;   // column pitch in world units (about one glyph width)

  function spawn(s, where) {
    if (!s.chars) { s.chars = []; s.jit = []; }
    s.msg = false;
    if (MODE === 'classic') {
      // `where` 2 = a drop that finished: keep the plane (and so the depth order)
      if (where !== 2) {
        let r = rng(); s.z = PLANES[PLANES.length - 1].z;
        for (const p of PLANES) { r -= p.w; if (r <= 0) { s.z = p.z; break; } }
      }
      const scale = FOCAL / s.z;
      const R = (W / 2 + 560) / scale;                 // covers the screen at this plane, steering included
      s.x = Math.round(rand(-R, R) / PITCH) * PITCH;   // snapped to the column grid
      s.y = -(H / 2 + 420) / scale;                    // column top stays above the screen at any steer
      s.gs = GLYPH_SPACING;
      s.len = Math.ceil(H / (GLYPH_SPACING * scale)) + 34;
      s.trail = rand(10, 28) / s.len;                  // 10-28 lit glyphs behind the head
      s.gap = rand(0.15, 0.7) * s.len;                 // a short dark spell between drops
    } else {
      // A corridor, not a cube: most strands live in an annulus around the axis
      // so walls stream past on either side and the centre stays open where you
      // look. A few sit in the middle so it never reads as empty.
      const ang = rand(0, Math.PI * 2);
      const r = rng() < 0.12
        ? FIELD * 0.4 * Math.sqrt(rng())                                  // centre disk
        : FIELD * Math.sqrt(rng() * (1.05 * 1.05 - 0.4 * 0.4) + 0.4 * 0.4); // uniform in annulus
      s.x = Math.cos(ang) * r;
      s.y = Math.sin(ang) * r;
      // `where`: 0 = anywhere (startup), 1 = far edge, -1 = just in front of us
      // Recycled strands land on an exact plane: any jitter here would break the
      // far -> near ordering the frame loop relies on instead of sorting.
      s.z = where === 1 ? FAR : where === -1 ? NEAR + 1 : rand(NEAR, FAR);
      // skewed so most strands are short-to-medium but some trail much longer
      s.len = (6 + Math.pow(rng(), 1.8) * 64) | 0;   // ~6 to ~70
      s.gs = GLYPH_SPACING * rand(0.7, 1.5);  // per-strand glyph size / thickness
      s.trail = rand(0.45, 1.35);   // <1 short punchy trail, >1 long fading tail
      // A column goes dark between drops: the head runs past the end into a gap,
      // the trail fades out, then the next drop starts from the top.
      s.gap = rand(0, 0.8) * s.len;
    }
    s.head = rand(0, s.len + s.gap); // bright leading glyph, descends the strand
    s.fall = rand(0.08, 0.3);     // rain speed within the strand (~5-18 glyphs/s)
    s.tint = pickTint();          // colour personality
    s.mut = rand(0.002, 0.03);    // how twitchy the glyphs are
    s.dim = rand(0.55, 1);        // overall brightness of the whole strand
    s.wo = rng();                 // warp threshold -> the field bleaches unevenly
    // A few strands carry the message: long trail so the whole word stays lit.
    // It starts mostly encrypted and decodes under your gaze (see frame loop).
    if (MSG && rng() < 0.03) {
      s.msg = true; s.len = MSG.length; s.mut = 0; s.trail = 3; s.gap = 0.2 * s.len;
      s.dim = 1; s.fall = 0.05; s.head = rand(0, s.len + s.gap);
      if (MODE === 'classic') {                      // somewhere on screen, on the grid
        const scale = FOCAL / s.z;
        s.y = rand(-H / 2, H / 2 - s.len * GLYPH_SPACING * scale) / scale;
      } else s.gs = GLYPH_SPACING * rand(1.0, 1.4);
      for (let i = 0; i < s.len; i++) s.chars[i] = rng() < 0.3 ? MSG[i] : pick();
    } else {
      for (let i = 0; i < s.len; i++) s.chars[i] = pick();
    }
    // per-glyph brightness: the film's trails are ragged, not a smooth ramp
    for (let i = 0; i < s.len; i++) s.jit[i] = rand(0.55, 1);
    s.chars.length = s.jit.length = s.len;
    return s;
  }
  function setMode(m) {
    MODE = m;
    const n = MODE === 'classic' ? NUM_CLASSIC : NUM;
    strands.length = Math.min(strands.length, n);
    while (strands.length < n) strands.push({});
    for (const s of strands) spawn(s, 0);
    // Sorted far -> near ONCE. Every strand's z changes by the same amount each
    // frame, so the order only breaks where one is recycled; see the frame loop.
    strands.sort((a, b) => b.z - a.z);
    setPalette(paletteName);
    
  }
  // R: a new seed regrows the field in place
  function reseed(str) {
    SEED_STR = str; SEED = hash32(str); rng = mulberry32(SEED);
    setCounts(); setMode(MODE);
  }
  setMode(MODE);
  const fingerprint = hash32(JSON.stringify(strands.map(s => [s.x,s.y,s.z,s.chars,s.jit]))).toString(16);
  let last = 0, glyphCount = 0, glowCount = 0;

  function frame(ts) {
    // frame-rate-independent time step (1 == a 60fps frame), clamped for tab-switches
    const dt = last ? Math.min(3, (ts - last) / 16.667) : 1;
    const t0 = performance.now();
    if (last && ts - last < 100) ftEma += (ts - last - ftEma) * 0.1;   // ignore tab-switch gaps
    last = ts;

    if (ts - lastStep > 1000 && (ftEma > 24 || workEma > 24) && qi < QUALITY.length - 1) {
      qi++; lastStep = ts; upWait = Math.min(60000, upWait * 2); resize();
    } else if (ts - lastStep > upWait && ftEma < 18 && workEma < 6 && qi > 0) {
      qi--; lastStep = ts; resize();
    }
    // Cull distant glyph work as well as pixels. Every strand still advances;
    // modes, seed/density, input and frame-rate-independent motion stay intact.
    const minSize = 1.5 / (QUALITY[qi] * QUALITY[qi]);

    // 0 -> 1 as we push past cruising speed; drives fog, lens and colour
    const spd = MODE === 'classic' ? 0 : speed;   // the film's rain does not travel
    const warp = Math.max(0, Math.min(1, (spd - 18) / 30));
    const tPow = TRAIL_POW[MODE], tStretch = TRAIL_STRETCH[MODE];

    // Mirrored, like the film: everything is drawn flipped left-to-right.
    // The cursor is mirrored in the mousemove handler so steering and gaze match.
    ctx.setTransform(-dpr, 0, 0, dpr, W * dpr, 0);
    // fade previous frame -> motion trails. Faster travel = weaker fade = the
    // glyphs smear into streaks on their own.
    const fadeA = 1 - Math.pow(1 - (0.22 - 0.17 * Math.min(1, Math.abs(spd) / 50)), dt);
    ctx.fillStyle = `rgba(0,0,0,${fadeA.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);

    // ease steering + speed toward their targets (frame-rate independent)
    const es = 1 - Math.pow(1 - 0.14, dt);
    const el = 1 - Math.pow(1 - 0.07, dt);

    // idle autopilot (opt in with #idle=1): two slow out-of-phase drifts, for
    // when it is left running unattended. Off by default -- the camera only
    // moves when you steer it.
    if (IDLE_DRIFT && ts - lastMouse > 3000) {
      camTX = Math.sin(ts * 0.00023) * 300 + Math.sin(ts * 0.00061) * 140;
      camTY = Math.cos(ts * 0.00017) * 200;
    }
    camX += (camTX - camX) * es;
    camY += (camTY - camY) * es;
    speed += (speedTarget - speed) * el;
    focal += ((FOCAL - 170 * warp) - focal) * el;   // dolly-zoom: FOV opens at speed

    ctx.textAlign = 'center';
    // centre each glyph on its row so `size` is a true cell pitch, and the two
    // font sizes line up on the same axis
    ctx.textBaseline = 'middle';

    const idle = ts - lastMouse > 2500;
    if (idle !== wasIdle) { host.classList.toggle('matrix-rain-idle', idle); wasIdle = idle; }

    let headN = 0, tailN = 0;   // recycled strands, always contiguous at the ends
    let nGlyph = 0, nGlow = 0;

    for (let i = 0; i < strands.length; i++) {
      const s = strands[i];
      // walk forward (scaled by dt so motion is speed-consistent at any refresh rate)
      s.z -= spd * dt;
      // rain runs faster when we do, so the cascade reads differently at warp
      s.head += s.fall * (1 + spd * 0.035) * dt;
      const cyc = s.len + s.gap;                // drop + dark gap
      if (s.head >= cyc) {
        // classic: a finished drop becomes a new drop in another column, same plane
        if (MODE === 'classic') { spawn(s, 2); continue; }
        s.head %= cyc;
      }
      if (s.z <= NEAR) { spawn(s, 1); tailN++; continue; }
      if (s.z > BEHIND) { spawn(s, -1); headN++; continue; }

      // Classic's fixed near planes survive distance LOD, so low quality must
      // also bound its column draw work. A stable, evenly spread subset avoids
      // per-frame flicker; all strands still simulate/recycle, messages stay drawn.
      if (MODE === 'classic' && !s.msg && (i * 0.61803398875) % 1 >= QUALITY[qi] * QUALITY[qi]) continue;

      const scale = focal / s.z;
      const sx = cx + (s.x - camX) * scale;      // parallax: depth-dependent sweep
      const sy0 = cy + (s.y - camY) * scale;
      const size = s.gs * scale;                // per-strand thickness
      if (size < minSize) continue;             // too far to matter
      // cull strands that project entirely off-screen
      if (sx < -size || sx > W + size) continue;

      // nothing pops: dissolve through the near plane, emerge from the far one
      const edge = Math.min(1, (s.z - NEAR) / NEAR_FADE, (FAR - s.z) / FAR_FADE);
      const near = 1 - Math.min(1, (s.z - NEAR) / 220);   // 0 far .. 1 about to pass us
      // gaze: 0 far from the cursor .. 1 under it (distance to the strand's extent)
      const gdy = my < sy0 ? sy0 - my : Math.max(0, my - (sy0 + s.len * size));
      const gaze = Math.max(0, 1 - Math.hypot(sx - mx, gdy) / GAZE_R);

      const depthFog = Math.min(1, (Math.min(1, (FAR - s.z) / FAR + 0.15) * s.dim + 0.45 * gaze) * edge);
      if (depthFog < 0.02) continue;            // still black: skip the draw calls
      const pal = (warp > s.wo ? PAL_W : PAL)[s.tint];
      const fCjk = (size | 0) + 'px ' + CJK;   // integer size -> glyph-cache hit
      const fMono = ((size * MONO_SIZE) | 0) + 'px ' + MONO;
      ctx.font = fCjk;
      ctx.fillStyle = pal.body;                 // one colour per strand; brightness is alpha
      const trailLen = s.len * s.trail * tStretch;   // per-strand trail length
      // twitchiness, not tied to refresh rate; glyphs under the cursor churn harder
      const mut = 1 - Math.pow(1 - s.mut * (1 + 6 * gaze), dt);
      let headK = -1, headY = 0;                // the bright glyph is drawn last, on top
      let qn = 0, nn = 0;                       // queued Latin glyphs, neck glyphs
      // The frame is mirrored like the film, which leaves the message reading
      // backwards. Flip these strands back about their own axis so the noise
      // stays film-accurate but the message you chose is legible.
      const gx = s.msg ? 0 : sx;
      if (s.msg) { ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1); }

      for (let k = 0; k < s.len; k++) {
        const sy = sy0 + k * size;
        if (sy > H + size) break;               // strand runs downward: rest is below
        if (sy < -size) continue;

        // a glyph that changes flashes for a moment, then settles to a new level
        let j = s.jit[k];
        if (s.msg) {
          // the message decodes under your gaze and re-encrypts when it leaves
          if (rng() < (0.03 + 0.35 * gaze) * dt) { s.chars[k] = rng() < 0.3 + 0.7 * gaze ? MSG[k] : pick(); j = 1.7; }
        } else if (mut && rng() < mut) { s.chars[k] = pick(); j = 1.7; }
        if (REDUCED && j > 1) j = 1;            // no flash on change
        if (j > 1) { j -= 0.1 * dt; if (j <= 1) j = 0.55 + 0.45 * rng(); }
        s.jit[k] = j;

        // brightness falls off behind the head; dark ahead of it and in the gap
        let d = s.head - k;
        if (d < 0) d += cyc;

        if (d < 0.6) { headK = k; headY = sy; continue; }   // bright leading glyph
        const f = 1 - d / trailLen;
        if (f <= 0) continue;
        const bright = Math.min(1, Math.pow(f, tPow) * depthFog * j);
        const ch = s.chars[k];
        if (d < NECK) {
          if (nn < 8) { nCh[nn] = ch; nY[nn] = sy; nA[nn] = bright; nn++; }
        } else if (USE_CJK[ch.charCodeAt(0)]) {
          ctx.globalAlpha = bright;
          ctx.fillText(ch, gx, sy); nGlyph++;
        } else if (qn < 1024) {
          qCh[qn] = ch; qY[qn] = sy; qA[qn] = bright; qn++;
        }
      }
      if (qn) {
        if (SQUEEZE) { ctx.save(); ctx.translate(gx, 0); ctx.scale(MONO_SQUEEZE, 1); }
        const qx = SQUEEZE ? 0 : gx;
        ctx.font = fMono;
        for (let q = 0; q < qn; q++) { ctx.globalAlpha = qA[q]; ctx.fillText(qCh[q], qx, qY[q]); nGlyph++; }
        if (SQUEEZE) ctx.restore(); else ctx.font = fCjk;   // restore() puts fCjk back
      }
      if (nn) {
        ctx.fillStyle = pal.neck;
        for (let q = 0; q < nn; q++) { ctx.globalAlpha = nA[q]; glyph(nCh[q], gx, nY[q], fCjk, fMono); nGlyph++; }
      }
      if (headK >= 0) {
        if (size >= GLOW_MIN) {
          // glow blooms as a strand comes at you, and a little under the cursor
          const gr = size * (0.7 + 1.3 * near + 0.4 * gaze);
          ctx.globalAlpha = depthFog * (0.35 + 0.4 * near);   // soft core, not a bloom
          ctx.drawImage(pal.glow, gx - gr, headY - gr, gr * 2, gr * 2); nGlow++;
        }
        ctx.fillStyle = pal.head;
        ctx.globalAlpha = depthFog;
        glyph(s.chars[headK], gx, headY, fCjk, fMono); nGlyph++;
      }
      if (s.msg) ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Restore the far -> near invariant without a full sort: strands that flew
    // past us are the tail (smallest z) and belong at the front, and vice versa.
    if (headN || tailN) {
      const head = strands.splice(0, headN);
      const tail = tailN ? strands.splice(strands.length - tailN, tailN) : [];
      if (tail.length) strands.unshift(...tail);
      if (head.length) strands.push(...head);
    }

    const bloomOn = !bloomOff && qi === 0;
    bloom.classList.toggle('matrix-rain-off', !bloomOn);
    if (bloomOn) {
      const bw = bloom.width, bh = bloom.height;
      bloomCtx.clearRect(0, 0, bw, bh);
      if (HALO) {
        // contrast() about mid-grey is a soft threshold: channels under ~0.3
        // go to black, over ~0.7 saturate. Downscaled first, so tiny far
        // heads average out and only glyphs of some size bloom.
        bloomSrcCtx.clearRect(0, 0, bw, bh);
        bloomSrcCtx.filter = 'brightness(1.3) contrast(2.5)';
        bloomSrcCtx.drawImage(canvas, 0, 0, bw, bh);
        bloomSrcCtx.filter = 'none';
        bloomCtx.filter = 'blur(2px)';      // core: 2px at quarter res ~ 8px on screen
        bloomCtx.globalAlpha = BLOOM;
        bloomCtx.drawImage(bloomSrc, 0, 0);
        bloomCtx.globalCompositeOperation = 'lighter';
        bloomCtx.filter = 'blur(8px)';      // halo
        bloomCtx.globalAlpha = BLOOM * 0.7;
        bloomCtx.drawImage(bloomSrc, 0, 0);
        bloomCtx.globalCompositeOperation = 'source-over';
      } else {
        bloomCtx.filter = 'blur(2px)';
        bloomCtx.globalAlpha = BLOOM;
        bloomCtx.drawImage(canvas, 0, 0, bw, bh);
      }
      bloomCtx.filter = 'none';
    }

    glyphCount = nGlyph; glowCount = nGlow;
    workEma += (performance.now() - t0 - workEma) * 0.1;
    if (DEBUG && ts - lastDbg > 250) {
      lastDbg = ts;
      dbg.textContent = `${ftEma.toFixed(1)} ms/frame · ${workEma.toFixed(1)} ms cpu · `
        + `${strands.length} strands · ${nGlyph} glyphs · ${nGlow} glows · ${(W * dpr) | 0}×${(H * dpr) | 0} @${dpr.toFixed(2)} · q${QUALITY[qi]}`
        + ` · latin ${MONO_SIZE.toFixed(2)}x${SQUEEZE ? ' squeezed ' + MONO_SQUEEZE.toFixed(2) : ''}`
        + ` · bloom ${bloomOn ? BLOOM.toFixed(2) + (HALO ? ' halo' : '') : 'off'} · ${P3 ? 'p3' : 'srgb'}`;
    }

  }


  // --- controls -------------------------------------------------------------
  // The frame loop eases toward these targets, so the response stays smooth.
  function steer(x, y) {
    lastMouse = performance.now();
    mx = W - x; my = y;                        // the frame is mirrored; so is the cursor
    camTX = REDUCED ? 0 : (0.5 - x / W) * 2 * 520;
    camTY = REDUCED ? 0 : (y / H - 0.5) * 2 * 380;
  }


  return {
    draw: frame,
    resize() { resize(); reseed(SEED_STR); },
    steer,
    leave() { mx = my = -1e9; camTX = camTY = 0; lastMouse = performance.now(); },
    speed(value) { speedTarget = Math.max(SPEED_MIN, Math.min(SPEED_MAX, value)); },
    resetClock() { last = 0; },
    stats() { return { mode: MODE, seed: SEED_STR, palette: paletteName, density: strands.length,
      speed: speedTarget, cameraX: camX, cameraY: camY, focal, quality: QUALITY[qi], frameMs: ftEma,
      workMs: workEma, dpr, bloom: !bloomOff && qi === 0, p3: P3, kana: HAS_KANA,
      fingerprint, glyphs: glyphs.join(''), messageStrands: strands.filter(s => s.msg).length,
      glyphCount, glowCount, width: W, height: H, monoSize: MONO_SIZE, monoSqueeze: MONO_SQUEEZE }; },
    destroy() { strands.length = 0; PAL = PAL_W = TINTS = []; bloomSrc.width = bloomSrc.height = 1; }
  };
}
