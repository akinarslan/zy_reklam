import { Group, ExtrudeGeometry, Mesh, MeshStandardMaterial, type Material, type Shape } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGroups } from 'three/addons/utils/BufferGeometryUtils.js';

/** All lettering comes from the approved SVG paths, including their holes. */
export function createLogo(svg: string): Group {
  const data = new SVGLoader().parse(svg);
  if (data.paths.length !== 8) throw new Error('Beklenen logo konturları bulunamadı.');
  const letters = new Group();
  letters.name = 'approved-wordmark';
  letters.scale.set(8 / 629, -8 / 629, 8 / 629);
  const housing = new MeshStandardMaterial({ color: '#8d9384', metalness: .78, roughness: .35 });
  const white = new MeshStandardMaterial({ color: '#ffffff', emissive: '#d7f7ed', emissiveIntensity: .7, metalness: .05, roughness: .28 });
  const gold = new MeshStandardMaterial({ color: '#d9b55a', metalness: .9, roughness: .23 });
  const goldSide = new MeshStandardMaterial({ color: '#a77b2b', metalness: .9, roughness: .35 });
  const light = new MeshStandardMaterial({ color: '#ffffff', emissive: '#c6e7d8', emissiveIntensity: 1.5, roughness: .5 });
  let shapesCount = 0;
  let holesCount = 0;
  const whiteShapes: Shape[] = [];
  const goldShapes: Shape[] = [];
  for (const [index, path] of data.paths.entries()) {
    const shapes = path.toShapes();
    shapesCount += shapes.length;
    holesCount += shapes.reduce((count, shape) => count + shape.holes.length, 0);
    (index < 2 ? whiteShapes : goldShapes).push(...shapes);
  }
  // Batch only identical materials/depths; retain the source contours and holes.
  const layers: Array<{ name: string; shapes: Shape[]; z: number; depth: number; material: Material | Material[] }> = [
    { name: 'white-housing', shapes: whiteShapes, z: 0, depth: 10, material: housing },
    { name: 'white-led', shapes: whiteShapes, z: 10, depth: 4, material: light },
    { name: 'white-face', shapes: whiteShapes, z: 14, depth: 4, material: [white, housing] },
    { name: 'gold-letters', shapes: goldShapes, z: 0, depth: 15, material: [gold, goldSide] },
  ];
  for (const layer of layers) {
    const geometry = new ExtrudeGeometry(layer.shapes, { depth: layer.depth, curveSegments: 8, steps: 1, bevelEnabled: false });
    geometry.translate(-511.5, -417, layer.z);
    if (Array.isArray(layer.material)) mergeGroups(geometry);
    const mesh = new Mesh(geometry, layer.material);
    mesh.name = `logo-${layer.name}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    letters.add(mesh);
  }
  letters.userData = { sourcePaths: data.paths.length, shapes: shapesCount, holes: holesCount };
  return letters;
}
