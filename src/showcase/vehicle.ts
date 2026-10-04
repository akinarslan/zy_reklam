import { Box3, BufferAttribute, CanvasTexture, DirectionalLight, Group, HemisphereLight, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, SRGBColorSpace, TorusGeometry, Vector3, WebGLRenderer, ACESFilmicToneMapping, type Material } from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Project the reference's red / white / black identity onto the actual T32 body. */
function wrapTexture(){
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const x=c.getContext('2d')!;
 for(let side=0;side<2;side++){
  x.save();x.translate(side*1024,0);x.fillStyle='#f1f2f0';x.fillRect(0,0,1024,1024);
  x.save();if(side===1){x.translate(1024,0);x.scale(-1,1);}
  x.fillStyle='#b71224';x.beginPath();x.moveTo(0,0);x.lineTo(380,0);x.lineTo(690,1024);x.lineTo(0,1024);x.fill();
  x.fillStyle='#17191c';x.beginPath();x.moveTo(425,0);x.lineTo(505,0);x.lineTo(810,1024);x.lineTo(730,1024);x.fill();x.restore();
  x.fillStyle='#fff';x.font='bold 98px Arial';x.fillText('buy',270,630);x.fillStyle='#202124';x.fillText('Home',435,630);
  x.font='bold 21px Arial';x.fillStyle=side===0?'#fff':'#202124';x.fillText('REAL ESTATE',275,680);x.restore();
 }
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t;
}

export async function createVehicle(stage:HTMLElement,onFailure:()=>void,signal:AbortSignal){
 const renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}),canvas=renderer.domElement;
 canvas.setAttribute('aria-hidden','true');renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 const scene=new Scene(),camera=new PerspectiveCamera(34,1,.1,50),pm=new PMREMGenerator(renderer),room=new RoomEnvironment(),env=pm.fromScene(room);
 scene.environment=env.texture;room.dispose();pm.dispose();scene.add(new HemisphereLight('#e6efff','#202b35',2));
 const key=new DirectionalLight('#fff4e6',3);key.position.set(5,7,3);scene.add(key);const rim=new DirectionalLight('#c1d8ff',2);rim.position.set(-4,4,-5);scene.add(rim);
 const wrap=wrapTexture(),materials=new Set<Material>();let disposed=false,visible=true,raf=0,drag:number|null=null,start=0,angle=0;
 const abort=new AbortController(),group=new Group();scene.add(group);
 const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);abort.abort();ro?.disconnect();scene.traverse(o=>{if(o instanceof Mesh)o.geometry.dispose();});materials.forEach(m=>{const map=(m as MeshStandardMaterial).map;if(map&&map!==wrap)map.dispose();m.dispose();});wrap.dispose();env.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
 let ro:ResizeObserver|undefined;
 try {
  const response=await fetch('/assets/showcase/nissan-t32.glb',{signal:AbortSignal.any([signal,AbortSignal.timeout(25000)])});if(!response.ok)throw new Error('Model unavailable');
  const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(await response.arrayBuffer(),'');
  gltf.scene.traverse(o=>{if(!(o instanceof Mesh))return;const old=o.material as MeshStandardMaterial,name=old.name;old.dispose();if(name==='wheel.2'){o.visible=false;return;}
   let m:MeshStandardMaterial;
   if(name==='primary'){
    const pos=o.geometry.getAttribute('position'),uv=new Float32Array(pos.count*2);
    for(let i=0;i<pos.count;i++){const side=pos.getX(i)<0?-1:1;uv[i*2]=side<0?(1-(pos.getY(i)+2.55)/5.3)*.5:((pos.getY(i)+2.55)/5.3)*.5+.5;uv[i*2+1]=(pos.getZ(i)-.05)/1.95;}
    o.geometry.setAttribute('uv',new BufferAttribute(uv,2));
    m=new MeshPhysicalMaterial({map:wrap,metalness:.22,roughness:.3,clearcoat:.7,clearcoatRoughness:.28});
    m.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 wrapPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwrapPosition=position;');shader.fragmentShader='varying vec3 wrapPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(abs(wrapPosition.x)>.75 && wrapPosition.z>1.14 && wrapPosition.z<1.61 && wrapPosition.y> -1.26 && wrapPosition.y<.25 && abs(wrapPosition.y+.11)>.055) diffuseColor.rgb=vec3(.025,.05,.065);');};
   }else if(name.toLowerCase().includes('glass'))m=new MeshPhysicalMaterial({color:'#10202b',metalness:.25,roughness:.12,clearcoat:1});
   else if(name==='wheel.2')m=new MeshStandardMaterial({color:'#121416',roughness:.85});
   else if(name.startsWith('wheel'))m=new MeshStandardMaterial({color:'#a5abb3',metalness:.9,roughness:.24});
   else if(/rear_light|breaklight|indicator_[lr]r/.test(name))m=new MeshPhysicalMaterial({color:'#9a1020',roughness:.25,clearcoat:1});
   else if(/light|indicator/.test(name))m=new MeshPhysicalMaterial({color:'#bac9d2',metalness:.65,roughness:.18,clearcoat:1});
   else m=new MeshStandardMaterial({color:name==='chassis.0'?'#aeb4b8':'#202329',metalness:name==='chassis.0'?.65:.25,roughness:.4});
   m.name=name;materials.add(m);o.material=m;
  });
  // The source has one detailed wheel assembly. Instantiate it at all four axles.
  const wheelMeshes:Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof Mesh&&(o.material as Material).name.startsWith('wheel'))wheelMeshes.push(o);});
  for(const wheel of wheelMeshes){for(const [mirror,rear] of [[true,false],[false,true],[true,true]]){const clone=wheel.clone();if(mirror)clone.scale.x=-1;if(rear)clone.position.y=-3.35;wheel.parent!.add(clone);}}
  const rubber=new MeshStandardMaterial({color:'#111315',roughness:.92});materials.add(rubber);
  for(const x of [-.92,.92])for(const y of [1.665,-1.685]){const tire=new Mesh(new TorusGeometry(.315,.087,12,64),rubber);tire.rotation.y=Math.PI/2;tire.position.set(x,y,.177);gltf.scene.children[0].add(tire);}
  gltf.scene.updateMatrixWorld(true);const box=new Box3().setFromObject(gltf.scene),center=box.getCenter(new Vector3());
  gltf.scene.position.set(-center.x,-box.min.y,-center.z);group.add(gltf.scene);group.rotation.y=2.6;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;const ctx=shadowCanvas.getContext('2d')!,gradient=ctx.createRadialGradient(128,128,10,128,128,125);gradient.addColorStop(0,'#000000bb');gradient.addColorStop(1,'#00000000');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);const shadow=new CanvasTexture(shadowCanvas);
  const floor=new Mesh(new PlaneGeometry(6.4,6.4),new MeshStandardMaterial({map:shadow,transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=.005;materials.add(floor.material);scene.add(floor);

  function draw(){if(disposed||!visible||document.hidden)return;renderer.render(scene,camera);stage.dataset.angle=String(group.rotation.y);stage.dataset.frames=String(Number(stage.dataset.frames||0)+1);}
  function requestDraw(){if(!raf&&visible&&!disposed)raf=requestAnimationFrame(()=>{raf=0;draw();});}
  function resize(){const r=stage.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,r.width<600?1:1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.set(5.1,2.8,5.8);camera.lookAt(0,.65,0);camera.updateProjectionMatrix();requestDraw();}
  canvas.addEventListener('pointerdown',e=>{drag=e.pointerId;start=e.clientX;angle=group.rotation.y;canvas.setPointerCapture(e.pointerId);},{signal:abort.signal});
  canvas.addEventListener('pointermove',e=>{if(drag===e.pointerId){group.rotation.y=angle+(e.clientX-start)*.012;requestDraw();}},{signal:abort.signal});
  const release=()=>{drag=null;};for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release,{signal:abort.signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cleanup();onFailure();},{signal:abort.signal});
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();group.rotation.y+=(e.key==='ArrowLeft'?-1:1)*Math.PI/12;requestDraw();}if(e.key==='Home'){e.preventDefault();group.rotation.y=2.6;requestDraw();}},{signal:abort.signal});
  const section=stage.closest('section')!;section.querySelectorAll<HTMLElement>('[data-van-turn]').forEach(b=>b.addEventListener('click',()=>{group.rotation.y+=Number(b.dataset.vanTurn)*Math.PI/6;requestDraw();},{signal:abort.signal}));section.querySelector('[data-van-reset]')?.addEventListener('click',()=>{group.rotation.y=2.6;requestDraw();},{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{release();if(!document.hidden)requestDraw();},{signal:abort.signal});
  stage.append(canvas);stage.dataset.state='ready';ro=new ResizeObserver(resize);ro.observe(stage);resize();
  return {setVisible(v:boolean){visible=v;if(!v){cancelAnimationFrame(raf);raf=0;release();}else requestDraw();},dispose:cleanup};
 }catch(error){cleanup();throw error;}
}
