import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
  type Material,
} from 'three';

export interface BrandShowcaseRenderer {
  setVisible(visible: boolean): void;
  dispose(): void;
}

function textureFromCanvas(draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void, width = 1400, height = 360): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D kullanılamıyor.');
  draw(ctx, canvas);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createTopSignTexture(): CanvasTexture {
  return textureFromCanvas((ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 220px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#f2efe7';
    ctx.fillText('ZY', 355, 190);
    ctx.font = '800 150px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#d3b05c';
    ctx.fillText('REKLAM', 900, 192);
  });
}

function createLowerSignTexture(): CanvasTexture {
  return textureFromCanvas((ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 164px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#d7d9d7';
    ctx.shadowColor = 'rgba(210,180,100,.28)';
    ctx.shadowBlur = 8;
    ctx.fillText('DAHA İLERİYE', canvas.width / 2, 192);
  }, 1600, 360);
}

function createTotemMainTexture(): CanvasTexture {
  return textureFromCanvas((ctx, canvas) => {
    ctx.fillStyle = '#071711';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f2c21');
    gradient.addColorStop(.55, '#071711');
    gradient.addColorStop(1, '#030b08');
    ctx.fillStyle = gradient;
    ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
    ctx.strokeStyle = '#8f7a4c';
    ctx.lineWidth = 5;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 142px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#ece9df';
    ctx.fillText('ZY', canvas.width / 2, 158);
    ctx.font = '700 60px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#b79a50';
    ctx.fillText('REKLAM', canvas.width / 2, 275);
  }, 560, 420);
}

function createPanelTexture(text: string): CanvasTexture {
  return textureFromCanvas((ctx, canvas) => {
    ctx.fillStyle = '#07140f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#8b7649';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 54px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#c5c3ba';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  }, 560, 150);
}

function addFrame(group: Group, width: number, height: number, depth: number, thickness: number, material: MeshStandardMaterial): void {
  const horizontal = new BoxGeometry(width + thickness * 2, thickness, depth);
  const vertical = new BoxGeometry(thickness, height, depth);
  for (const y of [-height / 2 - thickness / 2, height / 2 + thickness / 2]) {
    const bar = new Mesh(horizontal.clone(), material);
    bar.position.set(0, y, 0);
    bar.castShadow = true;
    group.add(bar);
  }
  for (const x of [-width / 2 - thickness / 2, width / 2 + thickness / 2]) {
    const bar = new Mesh(vertical.clone(), material);
    bar.position.set(x, 0, 0);
    bar.castShadow = true;
    group.add(bar);
  }
}

function addLayeredLetters(
  group: Group,
  texture: CanvasTexture,
  width: number,
  height: number,
  sideColor: string,
  frontColor: string,
  emissive: string,
): MeshStandardMaterial {
  const geometry = new PlaneGeometry(width, height);
  const sideMaterial = new MeshBasicMaterial({
    map: texture,
    color: sideColor,
    transparent: true,
    alphaTest: .08,
    depthWrite: true,
  });
  for (let layer = 0; layer < 7; layer++) {
    const side = new Mesh(geometry.clone(), sideMaterial);
    side.position.z = .205 + layer * .028;
    group.add(side);
  }
  const frontMaterial = new MeshStandardMaterial({
    map: texture,
    color: frontColor,
    emissive: new Color(emissive),
    emissiveIntensity: .10,
    metalness: .24,
    roughness: .18,
    transparent: true,
    alphaTest: .08,
    depthWrite: true,
  });
  const front = new Mesh(geometry.clone(), frontMaterial);
  front.position.z = .415;
  group.add(front);
  return frontMaterial;
}

export function createBrandShowcaseRenderer(stage: HTMLElement, mount: HTMLElement): BrandShowcaseRenderer {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 kullanılamıyor.');

  const renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(.1, .2, 12.2);
  camera.lookAt(.2, 0, 0);

  scene.add(new AmbientLight('#9eb4aa', 1.05));
  const key = new DirectionalLight('#fff0c4', 2.25);
  key.position.set(-4, 6, 7);
  key.castShadow = true;
  scene.add(key);
  const rim = new DirectionalLight('#6ba58d', 1.35);
  rim.position.set(5, 2, -2);
  scene.add(rim);

  const champagne = new MeshStandardMaterial({ color: '#9e8652', metalness: .94, roughness: .20 });
  const brushedSilver = new MeshStandardMaterial({ color: '#8d9491', metalness: .96, roughness: .16 });
  const graphite = new MeshStandardMaterial({ color: '#1a211f', metalness: .82, roughness: .28 });
  const emeraldPanel = new MeshStandardMaterial({ color: '#071a13', metalness: .38, roughness: .32 });
  const smokedPanel = new MeshStandardMaterial({ color: '#171b1a', metalness: .72, roughness: .25 });

  const topTexture = createTopSignTexture();
  const lowerTexture = createLowerSignTexture();
  const totemMainTexture = createTotemMainTexture();
  const panelTextures = ['FİKİR', 'TASARIM', 'ÜRETİM', 'GELİŞTİRME'].map(createPanelTexture);

  // LEFT / TOP: main ZY REKLAM sign — bold illuminated box letters.
  const topSign = new Group();
  topSign.position.set(-1.65, 1.08, 0);
  scene.add(topSign);

  const topPanel = new Mesh(new BoxGeometry(5.55, 1.62, .34), emeraldPanel);
  topPanel.castShadow = true;
  topPanel.receiveShadow = true;
  topSign.add(topPanel);
  addFrame(topSign, 5.55, 1.62, .44, .105, champagne);
  const topLetters = addLayeredLetters(topSign, topTexture, 4.92, 1.15, '#806a3d', '#ffffff', '#d9b55a');
  const topGlow = new PointLight('#e4c56d', .18, 5.6, 2);
  topGlow.position.set(0, 0, 1.15);
  topSign.add(topGlow);

  // LEFT / LOWER: DAHA İLERİYE — slimmer serif/chrome box letters.
  const lowerSign = new Group();
  lowerSign.position.set(-1.65, -1.05, -.08);
  scene.add(lowerSign);

  const lowerPanel = new Mesh(new BoxGeometry(5.25, 1.20, .30), smokedPanel);
  lowerPanel.castShadow = true;
  lowerPanel.receiveShadow = true;
  lowerSign.add(lowerPanel);
  addFrame(lowerSign, 5.25, 1.20, .40, .085, brushedSilver);
  const lowerLetters = addLayeredLetters(lowerSign, lowerTexture, 4.72, .80, '#9a814a', '#d7d9d7', '#d7b96b');
  lowerLetters.metalness = .52;
  lowerLetters.roughness = .12;
  const lowerGlow = new PointLight('#d7b96b', .05, 4.8, 2);
  lowerGlow.position.set(0, 0, 1.05);
  lowerSign.add(lowerGlow);

  // RIGHT: sculptural asymmetric totem with four illuminated side fins.
  const totem = new Group();
  totem.position.set(3.45, -.10, .02);
  scene.add(totem);

  const spine = new Mesh(new BoxGeometry(1.22, 3.95, .52), graphite);
  spine.position.x = -.20;
  spine.castShadow = true;
  spine.receiveShadow = true;
  totem.add(spine);

  const sculpturalWing = new Mesh(new BoxGeometry(.30, 4.22, .54), champagne);
  sculpturalWing.position.set(-.88, .02, .01);
  sculpturalWing.rotation.z = MathUtils.degToRad(-7);
  sculpturalWing.castShadow = true;
  totem.add(sculpturalWing);

  const topBeam = new Mesh(new BoxGeometry(2.18, .56, .54), graphite);
  topBeam.position.set(.22, 1.67, .02);
  topBeam.castShadow = true;
  totem.add(topBeam);

  const mainFaceMaterial = new MeshStandardMaterial({
    map: totemMainTexture,
    color: '#ffffff',
    emissive: new Color('#caa653'),
    emissiveIntensity: .018,
    metalness: .08,
    roughness: .28,
  });
  const mainFace = new Mesh(new PlaneGeometry(1.76, 1.20), mainFaceMaterial);
  mainFace.position.set(.15, 1.27, .285);
  totem.add(mainFace);

  const warmStripMaterial = new MeshStandardMaterial({
    color: '#4c3a20',
    emissive: new Color('#ffbf55'),
    emissiveIntensity: .02,
    metalness: .25,
    roughness: .20,
  });
  const warmStrip = new Mesh(new BoxGeometry(.075, 3.42, .10), warmStripMaterial);
  warmStrip.position.set(-.72, -.12, .315);
  totem.add(warmStrip);

  const panelMaterials: MeshStandardMaterial[] = [];
  const panelY = [.63, .10, -.43, -.96];
  panelTextures.forEach((texture, index) => {
    const panelGroup = new Group();
    panelGroup.position.set(.83, panelY[index], .02);
    const body = new Mesh(new BoxGeometry(1.58, .42, .44), graphite);
    body.castShadow = true;
    panelGroup.add(body);
    const faceMaterial = new MeshStandardMaterial({
      map: texture,
      color: '#ffffff',
      emissive: new Color('#d9b55a'),
      emissiveIntensity: .012,
      metalness: .10,
      roughness: .26,
    });
    const face = new Mesh(new PlaneGeometry(1.42, .31), faceMaterial);
    face.position.z = .235;
    panelGroup.add(face);
    panelMaterials.push(faceMaterial);
    totem.add(panelGroup);
  });

  const base = new Mesh(new BoxGeometry(2.45, .18, 1.20), graphite);
  base.position.set(-.03, -2.06, .02);
  base.castShadow = true;
  base.receiveShadow = true;
  totem.add(base);

  const totemGlow = new PointLight('#ffbf55', 0, 5.2, 2);
  totemGlow.position.set(.15, .15, 1.18);
  totem.add(totemGlow);

  const floor = new Mesh(new PlaneGeometry(15, 8), new ShadowMaterial({ opacity: .20 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.20;
  floor.receiveShadow = true;
  scene.add(floor);

  stage.dataset.showcaseObjects = 'top-sign,lower-sign,totem';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.touchAction = 'pan-y';
  mount.replaceChildren(canvas);

  let visible = false;
  let disposed = false;
  let frame = 0;
  let pointerActive = false;
  let pointerX = .5;
  let pointerY = .5;
  let previous = performance.now();

  const topBaseZ = 0;
  const lowerBaseZ = -.08;
  const totemBaseZ = .02;

  let topTargetX = 0, topTargetY = 0, topTargetZ = topBaseZ, topLightTarget = .18, topEmissionTarget = .10;
  let lowerTargetX = 0, lowerTargetY = 0, lowerTargetZ = lowerBaseZ, lowerLightTarget = .05, lowerEmissionTarget = .10;
  let totemTargetX = 0, totemTargetY = 0, totemTargetZ = totemBaseZ, totemLightTarget = 0, totemEmissionTarget = .018;

  const abort = new AbortController();
  const options = { signal: abort.signal };
  const resizeObserver = new ResizeObserver(() => resize());

  const proximity = (cx: number, cy: number, radius: number, xWeight = 1): number => {
    if (!pointerActive) return 0;
    const dx = (pointerX - cx) * xWeight;
    const dy = pointerY - cy;
    return 1 - MathUtils.clamp(Math.hypot(dx, dy) / radius, 0, 1);
  };

  const setTargets = () => {
    if (!pointerActive) {
      topTargetX = 0; topTargetY = 0; topTargetZ = topBaseZ; topLightTarget = .18; topEmissionTarget = .10;
      lowerTargetX = 0; lowerTargetY = 0; lowerTargetZ = lowerBaseZ; lowerLightTarget = .05; lowerEmissionTarget = .10;
      totemTargetX = 0; totemTargetY = 0; totemTargetZ = totemBaseZ; totemLightTarget = 0; totemEmissionTarget = .018;
      return;
    }

    const topNear = proximity(.30, .34, .34, 1.20);
    const lowerNear = proximity(.30, .68, .32, 1.20);
    const totemNear = proximity(.80, .50, .33, 1.38);

    topTargetY = MathUtils.clamp((pointerX - .30) * .30, -.11, .11) * topNear;
    topTargetX = MathUtils.clamp((.34 - pointerY) * .22, -.07, .07) * topNear;
    topTargetZ = topBaseZ + topNear * .15;
    topLightTarget = .18 + topNear * 2.65;
    topEmissionTarget = .10 + topNear * 1.28;

    lowerTargetY = MathUtils.clamp((pointerX - .30) * .24, -.085, .085) * lowerNear;
    lowerTargetX = MathUtils.clamp((.68 - pointerY) * .18, -.055, .055) * lowerNear;
    lowerTargetZ = lowerBaseZ + lowerNear * .11;
    lowerLightTarget = .05 + lowerNear * 1.70;
    lowerEmissionTarget = .10 + lowerNear * .82;

    // Totem motion is intentionally partial: enough for tactile feedback, never continuous.
    totemTargetY = MathUtils.clamp((pointerX - .80) * .38, -.13, .13) * totemNear;
    totemTargetX = MathUtils.clamp((.50 - pointerY) * .20, -.065, .065) * totemNear;
    totemTargetZ = totemBaseZ + totemNear * .17;
    totemLightTarget = totemNear * 3.25;
    totemEmissionTarget = .018 + totemNear * 1.42;
  };

  const smooth = (current: number, target: number, amount: number): number => current + (target - current) * amount;

  const unsettled = (): boolean =>
    Math.abs(topSign.rotation.x - topTargetX) > .0004 ||
    Math.abs(topSign.rotation.y - topTargetY) > .0004 ||
    Math.abs(topSign.position.z - topTargetZ) > .0004 ||
    Math.abs(topGlow.intensity - topLightTarget) > .01 ||
    Math.abs(topLetters.emissiveIntensity - topEmissionTarget) > .01 ||
    Math.abs(lowerSign.rotation.x - lowerTargetX) > .0004 ||
    Math.abs(lowerSign.rotation.y - lowerTargetY) > .0004 ||
    Math.abs(lowerSign.position.z - lowerTargetZ) > .0004 ||
    Math.abs(lowerGlow.intensity - lowerLightTarget) > .01 ||
    Math.abs(lowerLetters.emissiveIntensity - lowerEmissionTarget) > .01 ||
    Math.abs(totem.rotation.x - totemTargetX) > .0004 ||
    Math.abs(totem.rotation.y - totemTargetY) > .0004 ||
    Math.abs(totem.position.z - totemTargetZ) > .0004 ||
    Math.abs(totemGlow.intensity - totemLightTarget) > .01 ||
    Math.abs(mainFaceMaterial.emissiveIntensity - totemEmissionTarget) > .01;

  const render = () => renderer.render(scene, camera);

  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = Math.min((now - previous) / 1000, .05);
    previous = now;
    const easing = 1 - Math.exp(-10 * delta);

    topSign.rotation.x = smooth(topSign.rotation.x, topTargetX, easing);
    topSign.rotation.y = smooth(topSign.rotation.y, topTargetY, easing);
    topSign.position.z = smooth(topSign.position.z, topTargetZ, easing);
    topGlow.intensity = smooth(topGlow.intensity, topLightTarget, easing);
    topLetters.emissiveIntensity = smooth(topLetters.emissiveIntensity, topEmissionTarget, easing);

    lowerSign.rotation.x = smooth(lowerSign.rotation.x, lowerTargetX, easing);
    lowerSign.rotation.y = smooth(lowerSign.rotation.y, lowerTargetY, easing);
    lowerSign.position.z = smooth(lowerSign.position.z, lowerTargetZ, easing);
    lowerGlow.intensity = smooth(lowerGlow.intensity, lowerLightTarget, easing);
    lowerLetters.emissiveIntensity = smooth(lowerLetters.emissiveIntensity, lowerEmissionTarget, easing);

    totem.rotation.x = smooth(totem.rotation.x, totemTargetX, easing);
    totem.rotation.y = smooth(totem.rotation.y, totemTargetY, easing);
    totem.position.z = smooth(totem.position.z, totemTargetZ, easing);
    totemGlow.intensity = smooth(totemGlow.intensity, totemLightTarget, easing);
    mainFaceMaterial.emissiveIntensity = smooth(mainFaceMaterial.emissiveIntensity, totemEmissionTarget, easing);
    warmStripMaterial.emissiveIntensity = smooth(warmStripMaterial.emissiveIntensity, .02 + totemLightTarget * .46, easing);
    panelMaterials.forEach((material, index) => {
      const stagger = Math.max(0, totemLightTarget - index * .18);
      material.emissiveIntensity = smooth(material.emissiveIntensity, .012 + stagger * .36, easing);
    });

    render();
    if (unsettled()) frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (disposed || !visible || document.hidden || frame) return;
    previous = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    if (disposed) return;
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.05 : 1.32));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 700 ? 15.7 : width < 1050 ? 13.4 : 12.2;
    camera.position.y = width < 700 ? .05 : .2;
    camera.updateProjectionMatrix();
    render();
  };

  const updatePointer = (event: PointerEvent) => {
    if (!event.isPrimary) return;
    const bounds = stage.getBoundingClientRect();
    pointerX = MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    pointerY = MathUtils.clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    pointerActive = true;
    setTargets();
    wake();
  };

  const releaseTouch = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    pointerActive = false;
    setTargets();
    wake();
  };

  const leave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pointerActive = false;
    setTargets();
    wake();
  };

  const setVisible = (next: boolean) => {
    visible = next;
    cancelAnimationFrame(frame);
    frame = 0;
    if (next && !document.hidden) {
      resize();
      render();
    }
  };

  canvas.addEventListener('pointermove', updatePointer, options);
  canvas.addEventListener('pointerdown', updatePointer, options);
  canvas.addEventListener('pointerup', releaseTouch, options);
  canvas.addEventListener('pointercancel', releaseTouch, options);
  canvas.addEventListener('pointerleave', leave, options);
  resizeObserver.observe(stage);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    resizeObserver.disconnect();
    scene.traverse(object => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material: Material) => material.dispose());
      }
    });
    topTexture.dispose();
    lowerTexture.dispose();
    totemMainTexture.dispose();
    panelTextures.forEach(texture => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  resize();
  render();
  return { setVisible, dispose };
}
