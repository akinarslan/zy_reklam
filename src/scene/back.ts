import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

/** Rear mounting hardware belongs to the existing sign, with no second logo. */
export function createSignBack(): Group {
  const rear = new Group();
  rear.name = 'rear-mounts';
  const steel = new MeshStandardMaterial({ color: '#718078', metalness: .8, roughness: .57 });
  const slotMaterial = new MeshStandardMaterial({ color: '#17251e', metalness: .4, roughness: .8 });
  const rails = new InstancedMesh(new BoxGeometry(8.15, .16, .12), steel, 2);
  const bolts = new InstancedMesh(new CylinderGeometry(.065, .065, .045, 6), steel, 4);
  const slots = new InstancedMesh(new BoxGeometry(.07, .014, .009), slotMaterial, 4);
  const matrix = new Matrix4(), position = new Vector3(), scale = new Vector3(1, 1, 1);
  const flat = new Quaternion(), boltRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  for (let i = 0; i < 2; i++) {
    const y = i ? .82 : -.82;
    rails.setMatrixAt(i, matrix.compose(position.set(0, y, -.335), flat, scale));
    for (let j = 0; j < 2; j++) {
      const x = j ? 3.72 : -3.72, index = i * 2 + j;
      bolts.setMatrixAt(index, matrix.compose(position.set(x, y, -.4175), boltRotation, scale));
      slots.setMatrixAt(index, matrix.compose(position.set(x, y, -.444), flat, scale));
    }
  }
  for (const mesh of [rails, bolts, slots]) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    rear.add(mesh);
  }
  return rear;
}
