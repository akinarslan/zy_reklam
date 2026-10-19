import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, Shape, ExtrudeGeometry,
  MeshStandardMaterial, CircleGeometry, PlaneGeometry, ShadowMaterial,
  HemisphereLight, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping,
  PCFSoftShadowMap, MathUtils, Box3, Vector3, type Material, type WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLogo } from './logo';
import { QualityMonitor } from './quality';
import { createSignBack } from './back';
import { setupSignRotation } from './rotation';

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
  const target = { yaw: -.12, pitch: .05 };
  let cleanupRotation: (() => void) | undefined;
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
    cleanupRotation?.();
    cancelAnimationFrame(frame);
    abort.abort();
    resizeObserver?.disconnect();
    scene.traverse(object => {
      if (object instanceof DirectionalLight) object.shadow.dispose();
      if (object instanceof Mesh) {
        if (object instanceof InstancedMesh) object.dispose();
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
    const back = new Mesh(new ExtrudeGeometry(plate, { depth: .22, steps: 1, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 6 }), [new MeshStandardMaterial({ color: '#0a2217', metalness: .55,transparent: true,
opacity: 0.6, roughness: .48 }), new MeshStandardMaterial({ color: '#64775c',transparent: true,
opacity: 0.6, metalness: .85, roughness: .3 })]);
    back.position.z = -.25;
    back.castShadow = true;
    back.receiveShadow = true;
    sign.add(back);
    sign.add(createSignBack());
    stage.dataset.backMounts = '4';
    stage.dataset.backRails = '2';
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
    const localBounds = new Box3().setFromObject(sign);
    const corners: Vector3[] = [];
    for (const x of [localBounds.min.x, localBounds.max.x]) for (const y of [localBounds.min.y, localBounds.max.y]) for (const z of [localBounds.min.z, localBounds.max.z]) corners.push(new Vector3(x, y, z));
    sign.rotation.set(target.pitch, target.yaw, 0);
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
      if (settled) {
        sign.updateWorldMatrix(true, false);
        camera.updateMatrixWorld();
        const points = corners.map(point => point.clone().applyMatrix4(sign.matrixWorld).project(camera));
        stage.dataset.projectedBounds = JSON.stringify({ minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)), minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)), minZ: Math.min(...points.map(p => p.z)), maxZ: Math.max(...points.map(p => p.z)) });
      }
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
      const reduced = document.documentElement.dataset.motion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      const smoothing = reduced ? 1 : 1 - Math.exp(-(stage.dataset.snap === 'true' ? 20 : 12) * delta);
      sign.rotation.y += (target.yaw - sign.rotation.y) * smoothing;
      sign.rotation.x += (target.pitch - sign.rotation.x) * smoothing;
      const unsettled = Math.abs(target.yaw - sign.rotation.y) + Math.abs(target.pitch - sign.rotation.x) > .0002;
      if (!unsettled) sign.rotation.set(target.pitch, target.yaw, 0);
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
    const visibility = () => setVisible(visible);
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) fallback('context-lost'); };
    const options = { signal: abort.signal };
    cleanupRotation = setupSignRotation(stage, canvas, target, wake);
    canvas.addEventListener('webglcontextlost', contextLost, options);
    document.addEventListener('visibilitychange', visibility, options);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    return { setVisible, dispose };
  } catch (error) { dispose(); throw error; }
}
