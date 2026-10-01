import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, PMREMGenerator, ACESFilmicToneMapping, PCFSoftShadowMap, Mesh, PlaneGeometry, Raycaster, Vector2, Vector3, Box3, ShadowMaterial, type Material } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createProducts, type Outlines } from './models';
export interface ShowroomRenderer { setVisible(value:boolean):void; setReduced(value:boolean):void; select(id:string|null,x?:number,y?:number):void; dispose():void; }
export function createShowroomRenderer(stage:HTMLElement,mount:HTMLElement,outlines:Outlines,onFailure:()=>void):ShowroomRenderer {
  const renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');
  const scene=new Scene(),camera=new PerspectiveCamera(35,1,.1,80);
  const pmrem=new PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room);scene.environment=env.texture;room.dispose();pmrem.dispose();
  renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFSoftShadowMap;
  scene.add(new HemisphereLight('#f5e9d6','#122d24',2.1));
  const key=new DirectionalLight('#fff1d8',4);key.position.set(-3,6,7);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-.0005;scene.add(key);
  const rim=new DirectionalLight('#b7d3d5',2.4);rim.position.set(6,3,-3);scene.add(rim);
  const products=createProducts(outlines);products.forEach(p=>scene.add(p.group));
  const floor=new Mesh(new PlaneGeometry(30,30),new ShadowMaterial({color:'#010b07',opacity:.35}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.25;floor.receiveShadow=true;scene.add(floor);
  let visible=false,reduced=false,disposed=false,raf=0,selected:string|null=null,px=0,py=0,frames=0,last=0,slow=0;
  const levels=new Map(products.map(p=>[p.id,0]));const abort=new AbortController();let touchTimer:ReturnType<typeof setTimeout>|undefined;
  const ray=new Raycaster();const pointer=new Vector2();
  function draw(){renderer.render(scene,camera);stage.dataset.frames=String(++frames);stage.dataset.triangles=String(renderer.info.render.triangles);}
  function stop(){cancelAnimationFrame(raf);raf=0;stage.dataset.loop=visible?'idle':'stopped';last=0;}
  function animate(time:number){
    raf=0;if(disposed||!visible||document.hidden)return;
    const dt=last?Math.min((time-last)/1000,.05):1/60;
    if(last&&time-last>45&&++slow>16){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;stage.dataset.quality='low';}last=time;
    let moving=false;
    for(const p of products){const desired=selected===p.id?1:0,old=levels.get(p.id)!,level=old+(desired-old)*(1-Math.exp(-dt*11));const n=Math.abs(desired-level)<.002?desired:level;levels.set(p.id,n);
      const yaw=p.baseYaw+(reduced?0:px*.11*n*p.strength),pitch=p.basePitch+(reduced?0:-py*.075*n*p.strength),z=reduced?0:.18*n*p.strength;
      if(Math.abs(p.group.rotation.y-yaw)>.0001||Math.abs(p.group.rotation.x-pitch)>.0001||Math.abs(old-n)>.0001)moving=true;
      p.group.rotation.set(pitch,yaw,0);p.group.position.z=z;
      p.glow.forEach(m=>m.emissiveIntensity=.025+n*(p.id==='totem'?1.35:.38));p.lights.forEach(l=>l.intensity=n*4);
      p.metal.forEach(m=>m.envMapIntensity=1+n*.7);stage.dataset[p.id+'Active']=String(n>.1);stage.dataset[p.id+'Pose']=[pitch,yaw,z].join(',');
    }
    draw();if(moving){stage.dataset.loop='running';raf=requestAnimationFrame(animate);}else stop();
  }
  function wake(){if(!raf&&visible&&!disposed&&!document.hidden){stage.dataset.loop='running';raf=requestAnimationFrame(animate);}}
  function select(id:string|null,x=0,y=0){selected=id;px=x;py=y;stage.dataset.selected=id??'';wake();}
  function hit(event:PointerEvent){
    const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    const hits=ray.intersectObjects(products.map(p=>p.group),true);let id:string|null=null;
    for(const p of products)if(hits.some(h=>{let o=h.object;while(o.parent){if(o===p.group)return true;o=o.parent;}return false;})){id=p.id;break;}
    // A small screen-space halo makes approach responsive without coupling the products.
    if(!id){let closest=Infinity;for(const p of products){const b=new Box3().setFromObject(p.group);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const v=new Vector3(x,y,z).project(camera);const sx=r.left+(v.x+1)*r.width/2,sy=r.top+(1-v.y)*r.height/2;left=Math.min(left,sx);right=Math.max(right,sx);top=Math.min(top,sy);bottom=Math.max(bottom,sy);}
      const dx=Math.max(left-event.clientX,0,event.clientX-right),dy=Math.max(top-event.clientY,0,event.clientY-bottom),distance=Math.hypot(dx,dy);
      if(distance<18&&distance<closest){closest=distance;id=p.id;}
    }}
    select(id,pointer.x,pointer.y);canvas.style.cursor=id?'pointer':'default';
  }
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')hit(e);},{signal:abort.signal});
  canvas.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')select(null);},{signal:abort.signal});
  canvas.addEventListener('pointerdown',e=>{hit(e);if(e.pointerType!=='mouse'){clearTimeout(touchTimer);touchTimer=setTimeout(()=>select(null),900);}},{signal:abort.signal});
  canvas.addEventListener('pointercancel',()=>select(null),{signal:abort.signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();},{signal:abort.signal});
  function resize(){const r=stage.getBoundingClientRect(),mobile=r.width<640;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;
    products[0].group.position.set(mobile?0:-2.4,mobile?3.65:1.5,0);products[1].group.position.set(mobile?0:-2.4,mobile?1.7:-1.05,0);products[2].group.position.set(mobile?-.4:3.15,mobile?-1.45:0,0);
    products[0].group.scale.setScalar(mobile?.78:1);products[1].group.scale.setScalar(mobile?.78:1);products[2].group.scale.setScalar(mobile?.78:1);
    floor.position.y=mobile?-3.99:-3.25;const height=Math.max(mobile?10.2:7.3,(mobile?5.3:11.9)/camera.aspect);camera.position.set(0,mobile?.2:.4,height/(2*Math.tan(35*Math.PI/360)));camera.lookAt(0,mobile?.15:0,0);camera.updateProjectionMatrix();if(visible){draw();wake();}}
  const observer=new ResizeObserver(resize);observer.observe(stage);mount.append(canvas);resize();draw();stage.dataset.products='3';stage.dataset.geometry='extruded-letters-and-asymmetric-solid';stage.dataset.quality='standard';
  return {setVisible(value){if(value===visible)return;visible=value;if(value){draw();wake();}else{select(null);stop();}},setReduced(value){if(value===reduced)return;reduced=value;wake();},select,dispose(){if(disposed)return;disposed=true;stop();abort.abort();clearTimeout(touchTimer);observer.disconnect();const geometries=new Set<import('three').BufferGeometry>(),materials=new Set<Material>();scene.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());key.shadow.dispose();env.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();stage.dataset.resources='disposed';}};
}
