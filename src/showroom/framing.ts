import {Box3, Vector3, type Group, type PerspectiveCamera} from 'three';

/** Fit the unchanged product geometry, including depth, inside the camera frustum. */
export function fitShowroom(camera:PerspectiveCamera,groups:Group[]) {
  const bounds=new Box3();
  groups.forEach(group=>bounds.union(new Box3().setFromObject(group)));
  const center=bounds.getCenter(new Vector3());
  const tangent=Math.tan(camera.fov*Math.PI/360);
  let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    // Keep a margin for the existing hover tilt and forward movement.
    distance=Math.max(distance,z-center.z+Math.max(Math.abs(x-center.x)/(tangent*camera.aspect),Math.abs(y-center.y)/tangent)*1.12);
  }
  camera.position.set(center.x,center.y,center.z+distance);
  camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}

export function projectedProducts(camera:PerspectiveCamera,groups:Group[]) {
  return groups.map(group=>{
    const b=new Box3().setFromObject(group),points:Vector3[]=[];
    for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new Vector3(x,y,z).project(camera));
    return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),bottom:Math.min(...points.map(p=>p.y)),top:Math.max(...points.map(p=>p.y)),near:Math.min(...points.map(p=>p.z)),far:Math.max(...points.map(p=>p.z))};
  });
}
