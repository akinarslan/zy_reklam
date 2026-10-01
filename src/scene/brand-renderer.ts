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

function createSignTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D kullanılamıyor.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 230px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#f4f0e6';
  ctx.fillText('ZY', 330, 185);

  ctx.font = '700 150px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#d7b45b';
  ctx.fillText('REKLAM', 790, 190);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createTotemTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D kullanılamıyor.');

  ctx.fillStyle = '#06150f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0d3022');
  gradient.addColorStop(.55, '#06150f');
  gradient.addColorStop(1, '#020907');
  ctx.fillStyle = gradient;
  ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = '#b99a4e';
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 168px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#f2eee3';
  ctx.fillText('ZY', canvas.width / 2, 365);

  ctx.font = '700 76px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#d7b45b';
  ctx.fillText('REKLAM', canvas.width / 2, 520);

  ctx.font = '600 28px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#8fa99a';
  ctx.fillText('FİKİRDEN UYGULAMAYA', canvas.width / 2, 665);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function addFrame(group: Group, width: number, height: number, depth: number, material: MeshStandardMaterial): void {
  const thickness = .12;
  const horizontal = new BoxGeometry(width + thickness * 2, thickness, depth);
  const vertical = new BoxGeometry(thickness, height, depth);

  for (const y of [-height / 2 - thickness / 2, height / 2 + thickness / 2]) {
    const bar = new Mesh(horizontal.clone(), material);
    bar.position.set(0, y, 0);
    group.add(bar);
  }
  for (const x of [-width / 2 - thickness / 2, width / 2 + thickness / 2]) {
    const bar = new Mesh(vertical.clone(), material);
    bar.position.set(x, 0, 0);
    group.add(bar);
  }
}

export function createBrandShowcaseRenderer(stage: HTMLElement, mount: HTMLElement): BrandShowcaseRenderer {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 kullanılamıyor.');

  const renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(0, .35, 11.6);
  camera.lookAt(.25, 0, 0);

  scene.add(new AmbientLight('#9bb6aa', 1.15));
  const key = new DirectionalLight('#fff0c2', 2.4);
  key.position.set(-4, 6, 7);
  key.castShadow = true;
  scene.add(key);
  const rim = new DirectionalLight('#6aa88f', 1.6);
  rim.position.set(5, 2, -2);
  scene.add(rim);

  const metal = new MeshStandardMaterial({
    color: '#a78d55',
    metalness: .92,
    roughness: .24,
  });
  const darkMetal = new MeshStandardMaterial({
    color: '#16231d',
    metalness: .68,
    roughness: .38,
  });
  const panelMaterial = new MeshStandardMaterial({
    color: '#071a13',
    metalness: .42,
    roughness: .34,
  });

  const signTexture = createSignTexture();
  const totemTexture = createTotemTexture();

  const signGroup = new Group();
  signGroup.position.set(-1.45, .05, 0);
  scene.add(signGroup);

  const signPanel = new Mesh(new BoxGeometry(5.75, 2.05, .34), panelMaterial);
  signPanel.castShadow = true;
  signPanel.receiveShadow = true;
  signGroup.add(signPanel);
  addFrame(signGroup, 5.75, 2.05, .42, metal);

  const signFaceMaterial = new MeshStandardMaterial({
    map: signTexture,
    color: '#ffffff',
    emissive: new Color('#d8b45b'),
    emissiveIntensity: .14,
    metalness: .06,
    roughness: .28,
    transparent: true,
  });
  const signFace = new Mesh(new PlaneGeometry(5.15, 1.42), signFaceMaterial);
  signFace.position.z = .19;
  signGroup.add(signFace);

  const signGlow = new PointLight('#e2c16b', .35, 5.8, 2);
  signGlow.position.set(0, 0, 1.2);
  signGroup.add(signGlow);

  const totemGroup = new Group();
  totemGroup.position.set(3.22, -.28, .05);
  scene.add(totemGroup);

  const totemBody = new Mesh(new BoxGeometry(1.62, 3.65, .46), darkMetal);
  totemBody.castShadow = true;
  totemBody.receiveShadow = true;
  totemGroup.add(totemBody);

  const totemScreenMaterial = new MeshStandardMaterial({
    map: totemTexture,
    color: '#ffffff',
    emissive: new Color('#c9aa55'),
    emissiveIntensity: .025,
    metalness: .06,
    roughness: .32,
  });
  const totemScreen = new Mesh(new PlaneGeometry(1.38, 3.24), totemScreenMaterial);
  totemScreen.position.z = .235;
  totemGroup.add(totemScreen);

  addFrame(totemGroup, 1.62, 3.65, .52, metal);

  const base = new Mesh(new BoxGeometry(2.05, .18, 1.12), darkMetal);
  base.position.y = -1.98;
  base.castShadow = true;
  base.receiveShadow = true;
  totemGroup.add(base);

  const totemGlow = new PointLight('#d9b55a', 0, 4.5, 2);
  totemGlow.position.set(0, .2, 1);
  totemGroup.add(totemGlow);

  const floor = new Mesh(new PlaneGeometry(15, 8), new ShadowMaterial({ opacity: .20 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.18;
  floor.receiveShadow = true;
  scene.add(floor);

  stage.dataset.showcaseObjects = 'sign,totem';
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

  let signTargetY = 0;
  let signTargetX = 0;
  let signTargetZ = 0;
  let signGlowTarget = .35;
  let signEmissionTarget = .14;

  let totemTargetY = 0;
  let totemTargetX = 0;
  let totemTargetZ = .05;
  let totemGlowTarget = 0;
  let totemEmissionTarget = .025;

  const abort = new AbortController();
  const options = { signal: abort.signal };
  const resizeObserver = new ResizeObserver(() => resize());

  const setTargets = () => {
    if (!pointerActive) {
      signTargetY = 0;
      signTargetX = 0;
      signTargetZ = 0;
      signGlowTarget = .35;
      signEmissionTarget = .14;

      totemTargetY = 0;
      totemTargetX = 0;
      totemTargetZ = .05;
      totemGlowTarget = 0;
      totemEmissionTarget = .025;
      return;
    }

    const signDx = pointerX - .34;
    const signDy = pointerY - .5;
    const signDistance = Math.hypot(signDx * 1.25, signDy);
    const signNear = 1 - MathUtils.clamp(signDistance / .48, 0, 1);

    signTargetY = MathUtils.clamp(signDx * .30, -.11, .11) * signNear;
    signTargetX = MathUtils.clamp(-signDy * .20, -.07, .07) * signNear;
    signTargetZ = signNear * .12;
    signGlowTarget = .35 + signNear * 2.45;
    signEmissionTarget = .14 + signNear * 1.15;

    const totemDx = pointerX - .80;
    const totemDy = pointerY - .5;
    const totemDistance = Math.hypot(totemDx * 1.4, totemDy);
    const totemNear = 1 - MathUtils.clamp(totemDistance / .34, 0, 1);

    // Totem only moves partially: enough to feel interactive, never like a toy.
    totemTargetY = MathUtils.clamp(totemDx * .42, -.14, .14) * totemNear;
    totemTargetX = MathUtils.clamp(-totemDy * .22, -.07, .07) * totemNear;
    totemTargetZ = .05 + totemNear * .18;
    totemGlowTarget = totemNear * 3.0;
    totemEmissionTarget = .025 + totemNear * 1.6;
  };

  const unsettled = () =>
    Math.abs(signGroup.rotation.y - signTargetY) > .0004 ||
    Math.abs(signGroup.rotation.x - signTargetX) > .0004 ||
    Math.abs(signGroup.position.z - signTargetZ) > .0004 ||
    Math.abs(signGlow.intensity - signGlowTarget) > .01 ||
    Math.abs(signFaceMaterial.emissiveIntensity - signEmissionTarget) > .01 ||
    Math.abs(totemGroup.rotation.y - totemTargetY) > .0004 ||
    Math.abs(totemGroup.rotation.x - totemTargetX) > .0004 ||
    Math.abs(totemGroup.position.z - totemTargetZ) > .0004 ||
    Math.abs(totemGlow.intensity - totemGlowTarget) > .01 ||
    Math.abs(totemScreenMaterial.emissiveIntensity - totemEmissionTarget) > .01;

  const render = () => renderer.render(scene, camera);

  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;

    const delta = Math.min((now - previous) / 1000, .05);
    previous = now;
    const smoothing = 1 - Math.exp(-10 * delta);

    signGroup.rotation.y += (signTargetY - signGroup.rotation.y) * smoothing;
    signGroup.rotation.x += (signTargetX - signGroup.rotation.x) * smoothing;
    signGroup.position.z += (signTargetZ - signGroup.position.z) * smoothing;
    signGlow.intensity += (signGlowTarget - signGlow.intensity) * smoothing;
    signFaceMaterial.emissiveIntensity += (signEmissionTarget - signFaceMaterial.emissiveIntensity) * smoothing;

    totemGroup.rotation.y += (totemTargetY - totemGroup.rotation.y) * smoothing;
    totemGroup.rotation.x += (totemTargetX - totemGroup.rotation.x) * smoothing;
    totemGroup.position.z += (totemTargetZ - totemGroup.position.z) * smoothing;
    totemGlow.intensity += (totemGlowTarget - totemGlow.intensity) * smoothing;
    totemScreenMaterial.emissiveIntensity += (totemEmissionTarget - totemScreenMaterial.emissiveIntensity) * smoothing;

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
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.05 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 700 ? 14.8 : width < 1050 ? 12.6 : 11.6;
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

    signTexture.dispose();
    totemTexture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  resize();
  render();
  return { setVisible, dispose };
}
