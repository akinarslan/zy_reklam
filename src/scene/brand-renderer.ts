import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
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
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Material,
} from 'three';

export interface BrandShowcaseRenderer {
  setVisible(visible: boolean): void;
  dispose(): void;
}

interface LetterRig {
  group: Group;
  front: MeshStandardMaterial;
  glow: MeshBasicMaterial;
  baseX: number;
  normalizedX: number;
  phase: number;
}

const CHARACTERS = ['Z', 'Y', 'R', 'E', 'K', 'L', 'A', 'M'] as const;
const COLORS = ['#f4b942', '#2dd4bf', '#ff4fa3', '#8b5cf6', '#3b82f6', '#84cc16', '#ff7849', '#22d3ee'] as const;
const WIDTHS: Record<string, number> = { Z: 1.05, Y: 1.05, R: 1.02, E: .92, K: 1.02, L: .82, A: 1.08, M: 1.28 };

function createGlyphTexture(character: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 380;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D kullanılamıyor.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 270px "Arial Black", Arial, Helvetica, sans-serif';
  context.fillText(character, canvas.width / 2, canvas.height / 2 + 10);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createBrandShowcaseRenderer(stage: HTMLElement, mount: HTMLElement): BrandShowcaseRenderer {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 kullanılamıyor.');

  const renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new Scene();
  const root = new Group();
  scene.add(root);

  const camera = new PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(0, .15, 9);
  camera.lookAt(0, 0, 0);

  scene.add(new AmbientLight('#b7d6ca', 1.15));
  const key = new DirectionalLight('#fff2c9', 2.8);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const rim = new DirectionalLight('#70d7c0', 2.15);
  rim.position.set(4, 1, -2);
  scene.add(rim);

  const rigs: LetterRig[] = [];
  const textures: CanvasTexture[] = [];
  const totalWidth = CHARACTERS.reduce((sum, char) => sum + WIDTHS[char], 0) + .15 * (CHARACTERS.length - 1) + .55;
  let cursor = -totalWidth / 2;

  CHARACTERS.forEach((character, index) => {
    const width = WIDTHS[character];
    const centerX = cursor + width / 2;
    cursor += width + .15 + (index === 1 ? .55 : 0);

    const texture = createGlyphTexture(character);
    textures.push(texture);

    const geometry = new PlaneGeometry(width, 1.7);
    const group = new Group();
    group.position.set(centerX, 0, -2.5);

    // Several alpha-cut glyph planes create a lightweight volumetric edge without
    // loading another font/geometry asset.
    for (let layer = 0; layer < 5; layer++) {
      const depth = -.18 + layer * .036;
      const sideMaterial = new MeshBasicMaterial({
        map: texture,
        color: new Color(COLORS[index]).multiplyScalar(.22 + layer * .035),
        transparent: true,
        alphaTest: .08,
        opacity: .95,
        depthWrite: true,
      });
      const side = new Mesh(geometry.clone(), sideMaterial);
      side.position.z = depth;
      group.add(side);
    }

    const frontMaterial = new MeshStandardMaterial({
      map: texture,
      color: COLORS[index],
      emissive: new Color(COLORS[index]),
      emissiveIntensity: .72,
      metalness: .22,
      roughness: .22,
      transparent: true,
      alphaTest: .08,
      depthWrite: true,
    });
    const front = new Mesh(geometry.clone(), frontMaterial);
    front.position.z = .015;
    group.add(front);

    const glowMaterial = new MeshBasicMaterial({
      map: texture,
      color: COLORS[index],
      transparent: true,
      opacity: .15,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const glow = new Mesh(geometry.clone(), glowMaterial);
    glow.position.z = .055;
    glow.scale.set(1.09, 1.09, 1);
    group.add(glow);

    group.rotation.y = MathUtils.degToRad((index - 3.5) * -1.2);
    root.add(group);
    rigs.push({
      group,
      front: frontMaterial,
      glow: glowMaterial,
      baseX: centerX,
      normalizedX: (index + .5) / CHARACTERS.length,
      phase: index * .72,
    });
  });

  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.touchAction = 'pan-y';
  mount.replaceChildren(canvas);

  let visible = false;
  let disposed = false;
  let frame = 0;
  let pointerX = .5;
  let pointerY = .5;
  let pointerActive = false;
  let startTime = performance.now();
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const resizeObserver = new ResizeObserver(() => resize());

  const resize = () => {
    if (disposed) return;
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.1 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 700 ? 11.4 : 9;
    camera.updateProjectionMatrix();
  };

  const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;

    const elapsed = now - startTime;
    const px = pointerActive ? pointerX : .5;
    const py = pointerActive ? pointerY : .5;
    const targetRootY = (px - .5) * .22;
    const targetRootX = -(py - .5) * .10;
    root.rotation.y += (targetRootY - root.rotation.y) * .075;
    root.rotation.x += (targetRootX - root.rotation.x) * .075;

    rigs.forEach((rig, index) => {
      const intro = easeOut(MathUtils.clamp((elapsed - index * 85) / 620, 0, 1));
      const distance = Math.abs(px - rig.normalizedX) + Math.abs(py - .5) * .42;
      const proximity = pointerActive ? 1 - MathUtils.clamp(distance / .29, 0, 1) : 0;
      const floatY = Math.sin(now * .00115 + rig.phase) * .055;
      const targetZ = proximity * .46;
      const targetScale = 1 + proximity * .085;

      rig.group.position.x = rig.baseX;
      rig.group.position.y += (floatY - rig.group.position.y) * .08;
      rig.group.position.z = MathUtils.lerp(-2.5, targetZ, intro);
      const introScale = MathUtils.lerp(.72, targetScale, intro);
      const currentScale = rig.group.scale.x + (introScale - rig.group.scale.x) * .12;
      rig.group.scale.setScalar(currentScale);
      rig.group.rotation.z = Math.sin(now * .00075 + rig.phase) * .012;
      rig.front.emissiveIntensity += ((.72 + proximity * 2.4) - rig.front.emissiveIntensity) * .12;
      rig.glow.opacity += ((.14 + proximity * .42) - rig.glow.opacity) * .12;
    });

    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (disposed || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(tick);
  };

  const setVisible = (next: boolean) => {
    visible = next;
    cancelAnimationFrame(frame);
    frame = 0;
    if (next && !document.hidden) {
      startTime = performance.now();
      resize();
      wake();
    }
  };

  const updatePointer = (event: PointerEvent) => {
    if (!event.isPrimary) return;
    const bounds = stage.getBoundingClientRect();
    pointerX = MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    pointerY = MathUtils.clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    pointerActive = true;
    wake();
  };
  const leave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      pointerActive = false;
      wake();
    }
  };
  const visibility = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden) wake();
  };

  canvas.addEventListener('pointermove', updatePointer, options);
  canvas.addEventListener('pointerdown', updatePointer, options);
  canvas.addEventListener('pointerleave', leave, options);
  document.addEventListener('visibilitychange', visibility, options);
  resizeObserver.observe(stage);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    resizeObserver.disconnect();
    root.traverse(object => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material: Material) => material.dispose());
      }
    });
    textures.forEach(texture => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  resize();
  return { setVisible, dispose };
}
