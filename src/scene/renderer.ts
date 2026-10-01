import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry,
  MeshStandardMaterial, CircleGeometry, PlaneGeometry, ShadowMaterial,
  HemisphereLight, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping,
  PCFSoftShadowMap, MathUtils, type Material, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLogo } from './logo';
import { QualityMonitor } from './quality';

export interface HeroRenderer {
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function createHeroRenderer(stage: HTMLElement, mount: HTMLElement, svg: string, fallback: (reason: string) => void): HeroRenderer {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 kullanılamıyor.');
  const scene = new Scene();
  const sign = new Group();
  scene.add(sign);
  let renderer: WebGLRenderer | undefined;
  let environment: WebGLRenderTarget | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let disposed = false;
  let frame = 0;
  let previousTime = 0;
  let visible = false;
  let pointerId: number | null = null;
  let pointerStartX = 0;
  let startYaw = 0;
  let yaw = -.12;
  let pitch = .05;
  let renderCount = 0;
  let shadowCount = 0;
  let shadowTime = -Infinity;
  let shadowYaw = NaN;
  let shadowPitch = NaN;
  const quality = new QualityMonitor();
  const abort = new AbortController();
  const camera = new PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(0, .2, 14);
  camera.lookAt(0, 0, 0);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    resizeObserver?.disconnect();
    scene.traverse(object => {
      if (object instanceof DirectionalLight) object.shadow.dispose();
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material: Material) => material.dispose());
      }
    });
    scene.environment = null;
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    canvas.remove();
    stage.dataset.renderLoop = 'stopped';
    stage.dataset.sceneResources = 'disposed';
  };

  try {
    renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    // Environment is generated locally; no remote HDR or image texture is needed.
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(room, .04, .1, 100, { size: 128 }); }
    finally { room.dispose(); pmrem.dispose(); }
    scene.environment = environment.texture;
    scene.environmentIntensity = .8;
    scene.add(new HemisphereLight('#c5e6dc', '#142b1d', 2));
    const key = new DirectionalLight('#fff3d0', 3);
    key.position.set(-3, 6, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.camera.near = .1; key.shadow.camera.far = 25;
    key.shadow.normalBias = .03;
    scene.add(key);
    const rim = new DirectionalLight('#90ceb5', 2);
    rim.position.set(4, 2, -2);
    scene.add(rim);

    const plate = new Shape();
    const w = 9.15, h = 2.6, r = .12;
    plate.moveTo(-w / 2 + r, -h / 2);
    plate.lineTo(w / 2 - r, -h / 2); plate.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    plate.lineTo(w / 2, h / 2 - r); plate.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    plate.lineTo(-w / 2 + r, h / 2); plate.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    plate.lineTo(-w / 2, -h / 2 + r); plate.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const back = new Mesh(new ExtrudeGeometry(plate, { depth: .22, steps: 1, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 6 }), [new MeshStandardMaterial({ color: '#0a2217', metalness: .55, roughness: .48 }), new MeshStandardMaterial({ color: '#64775c', metalness: .85, roughness: .3 })]);
    back.position.z = -.25;
    back.castShadow = true;
    back.receiveShadow = true;
    sign.add(back);
    const logo = createLogo(svg);
    logo.position.z = .04;
    sign.add(logo);
    const boltMaterial = new MeshStandardMaterial({ color: '#8b967e', metalness: .9, roughness: .35 });
    const boltGeometry = new CircleGeometry(.035, 12);
    for (const x of [-4.32, 4.32]) for (const y of [-1.08, 1.08]) {
      const bolt = new Mesh(boltGeometry, boltMaterial);
      bolt.position.set(x, y, .03);
      sign.add(bolt);
    }
    const floor = new Mesh(new PlaneGeometry(18, 12), new ShadowMaterial({ opacity: .18 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.1;
    floor.receiveShadow = true;
    scene.add(floor);
    sign.rotation.set(pitch, yaw, 0);
    stage.dataset.logoPaths = String(logo.userData.sourcePaths);
    stage.dataset.logoHoles = String(logo.userData.holes);
    stage.dataset.sceneResources = 'active';
    stage.dataset.quality = quality.quality;
    stage.dataset.renderCount = '0';
    canvas.setAttribute('aria-hidden', 'true');
    mount.replaceChildren(canvas);

    const render = (now = performance.now(), settled = false) => {
      if (disposed || !visible || document.hidden) return;
      // Reuse the shadow map between updates; always capture the final pose.
      const changed = shadowYaw !== sign.rotation.y || shadowPitch !== sign.rotation.x;
      const updateShadow = quality.quality === 'high' && changed && (settled || now - shadowTime >= 50);
      renderer!.shadowMap.needsUpdate = updateShadow;
      renderer!.render(scene, camera);
      if (updateShadow) {
        shadowTime = now;
        shadowYaw = sign.rotation.y; shadowPitch = sign.rotation.x;
        stage.dataset.shadowCount = String(++shadowCount);
        stage.dataset.shadowRotationY = String(shadowYaw);
        stage.dataset.shadowRotationX = String(shadowPitch);
      }
      stage.dataset.renderCount = String(++renderCount);
      stage.dataset.rotationY = String(sign.rotation.y);
      stage.dataset.rotationX = String(sign.rotation.x);
      stage.dataset.triangles = String(renderer!.info.render.triangles);
      stage.dataset.drawCalls = String(renderer!.info.render.calls);
    };
    const resize = () => {
      if (disposed) return;
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer!.setPixelRatio(Math.min(devicePixelRatio, quality.quality === 'high' ? (width < 480 ? 1.25 : 1.5) : 1));
      renderer!.setSize(width, height, false);
      camera.aspect = width / height;
      const fov = MathUtils.degToRad(camera.fov);
      camera.position.z = Math.max(10, 10.7 / (2 * Math.tan(fov / 2) * camera.aspect));
      camera.updateProjectionMatrix();
      render();
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const delta = previousTime ? Math.min((now - previousTime) / 1000, .05) : .016;
      previousTime = now;
      const smoothing = 1 - Math.exp(-9 * delta);
      sign.rotation.y += (yaw - sign.rotation.y) * smoothing;
      sign.rotation.x += (pitch - sign.rotation.x) * smoothing;
      const unsettled = Math.abs(yaw - sign.rotation.y) + Math.abs(pitch - sign.rotation.x) > .0002;
      try { render(now, !unsettled); } catch { fallback('render-error'); return; }
      const update = quality.sample(now);
      if (update === 'lower') {
        stage.dataset.quality = 'low';
        renderer!.shadowMap.enabled = false;
        resize();
      } else if (update === 'poster') { fallback('slow-device'); return; }
      if (unsettled && !disposed) frame = requestAnimationFrame(tick);
      else { quality.reset(); stage.dataset.renderLoop = 'idle'; }
    };
    const wake = () => {
      if (disposed || !visible || document.hidden || frame) return;
      stage.dataset.renderLoop = 'running';
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    };
    const setVisible = (next: boolean) => {
      visible = next;
      cancelAnimationFrame(frame); frame = 0;
      quality.reset(); previousTime = 0;
      stage.dataset.renderLoop = next && !document.hidden ? 'idle' : 'stopped';
      if (next && !document.hidden) { resize(); wake(); }
    };
    const mouseMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || pointerId !== null) return;
      const bounds = stage.getBoundingClientRect();
      yaw = MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1) * MathUtils.degToRad(18);
      pitch = MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1) * MathUtils.degToRad(10);
      wake();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      pointerId = event.pointerId; pointerStartX = event.clientX; startYaw = yaw;
      canvas.setPointerCapture(event.pointerId);
    };
    const drag = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      yaw = MathUtils.clamp(startYaw + (event.clientX - pointerStartX) / stage.clientWidth * .8, -MathUtils.degToRad(18), MathUtils.degToRad(18));
      wake();
    };
    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      pointerId = null;
    };
    const leave = (event: PointerEvent) => { if (event.pointerType === 'mouse' && pointerId === null) { yaw = -.12; pitch = .05; wake(); } };
    const visibility = () => setVisible(visible);
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) fallback('context-lost'); };
    const options = { signal: abort.signal };
    canvas.addEventListener('pointermove', mouseMove, options);
    canvas.addEventListener('pointerdown', down, options);
    canvas.addEventListener('pointermove', drag, options);
    canvas.addEventListener('pointerup', release, options);
    canvas.addEventListener('pointercancel', release, options);
    canvas.addEventListener('lostpointercapture', () => { pointerId = null; }, options);
    canvas.addEventListener('pointerleave', leave, options);
    canvas.addEventListener('webglcontextlost', contextLost, options);
    document.addEventListener('visibilitychange', visibility, options);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    return { setVisible, dispose };
  } catch (error) { dispose(); throw error; }
}
