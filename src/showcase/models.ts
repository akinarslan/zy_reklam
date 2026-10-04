import { Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial, CanvasTexture, SRGBColorSpace, Shape, ExtrudeGeometry, DoubleSide } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export function artwork(poster=false){
 const c=document.createElement('canvas');c.width=poster?768:1536;c.height=poster?1024:768;const x=c.getContext('2d')!;const w=c.width,h=c.height;
 x.fillStyle='#113b32';x.fillRect(0,0,w,h);
 x.strokeStyle='#c79460';x.lineWidth=2;for(let i=0;i<9;i++){x.beginPath();x.ellipse(w*.83,h*.46,w*(.16+i*.035),h*(.19+i*.046),-.45,0,Math.PI*2);x.stroke();}
 x.fillStyle='#e8d7b5';x.font=`700 ${w*.12}px Georgia`;x.fillText('NOVA',w*.08,h*.3);x.font=`${w*.04}px Arial`;x.fillText('C O F F E E',w*.09,h*.4);
 x.font=`italic ${w*.034}px Georgia`;x.fillText('Her yolculuğa bir kahve.',w*.09,h*.53);
 // Original cup illustration: cream ceramic, copper crema and rising steam.
 const cx=w*.7,cy=h*.72,r=w*.12;
 x.fillStyle='#dfbb86';x.beginPath();x.ellipse(cx,cy,r,r*.25,0,0,Math.PI*2);x.fill();
 x.fillStyle='#f4e8d2';x.beginPath();x.moveTo(cx-r,cy-r*.75);x.quadraticCurveTo(cx-r*.8,cy+r*.2,cx,cy+r*.2);x.quadraticCurveTo(cx+r*.8,cy+r*.2,cx+r,cy-r*.75);x.closePath();x.fill();
 x.strokeStyle='#f4e8d2';x.lineWidth=r*.16;x.beginPath();x.ellipse(cx+r,cy-r*.38,r*.38,r*.32,0,0,Math.PI*2);x.stroke();
 x.fillStyle='#bd804d';x.beginPath();x.ellipse(cx,cy-r*.75,r,r*.27,0,0,Math.PI*2);x.fill();
 x.strokeStyle='#e6d3b4';x.lineWidth=3;for(let i=0;i<3;i++){x.beginPath();x.moveTo(cx+(i-1)*r*.4,cy-r*1.2);x.bezierCurveTo(cx+(i-1)*r*.4-r*.3,cy-r*1.5,cx+(i-1)*r*.4+r*.3,cy-r*1.7,cx+(i-1)*r*.4,cy-r*2);x.stroke();}
 x.fillStyle='#c79460';x.fillRect(w*.08,h*.88,w*.84,2);x.font=`${w*.022}px Arial`;x.fillText(poster?'TAZE KAVRULMUŞ · ÖZENLE HAZIRLANMIŞ':'SPECIALTY COFFEE  /  FRESHLY ROASTED',w*.08,h*.94);
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t;
}
export function createVan(){
 const g=new Group();const cream=new MeshStandardMaterial({color:'#e9ddc6',metalness:.4,roughness:.3}),dark=new MeshStandardMaterial({color:'#102d27',metalness:.5,roughness:.28}),rubber=new MeshStandardMaterial({color:'#111313',roughness:.85}),chrome=new MeshStandardMaterial({color:'#b9bdba',metalness:.95,roughness:.22}),glass=new MeshStandardMaterial({color:'#162d35',metalness:.65,roughness:.12}),copper=new MeshStandardMaterial({color:'#be8c57',metalness:.6,roughness:.3});
 const add=(geo:import('three').BufferGeometry,mat:MeshStandardMaterial,x:number,y:number,z:number)=>{const m=new Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 // Nose points toward +X. The high-roof delivery van carries a full side wrap.
 add(new RoundedBoxGeometry(4.65,1.65,1.85,3,.16),cream,0,1.12,0);
 add(new RoundedBoxGeometry(3.3,.85,1.83,3,.16),cream,-.58,2.1,0);
 add(new RoundedBoxGeometry(1.15,.26,1.78,3,.08),cream,1.82,1.55,0);
 add(new RoundedBoxGeometry(4.55,.24,1.92,2,.05),dark,0,.54,0);
 const cab=new Shape();cab.moveTo(.86,1.5);cab.lineTo(2.19,1.5);cab.lineTo(1.35,2.46);cab.lineTo(.86,2.46);cab.closePath();add(new ExtrudeGeometry(cab,{depth:1.8,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035}),cream,0,0,-.9);
 const wind=add(new PlaneGeometry(1.72,.84),glass,1.72,2.05,0);wind.rotation.order='ZYX';wind.rotation.set(0,Math.PI/2,.7);
 const wrap=artwork();const wrapMat=new MeshStandardMaterial({map:wrap,roughness:.4,metalness:.12});
 for(const side of [-1,1]){
  const panel=add(new PlaneGeometry(2.96,1.58),wrapMat,-.69,1.55,side*.932);if(side<0)panel.rotation.y=Math.PI;
  const shape=new Shape();shape.moveTo(0,0);shape.lineTo(.83,0);shape.lineTo(.57,.72);shape.lineTo(0,.72);shape.closePath();
  add(new ExtrudeGeometry(shape,{depth:.01,bevelEnabled:false}),glass,.88,1.62,side*.94);
  add(new BoxGeometry(.23,.035,.04),chrome,.68,1.44,side*.965);
  add(new RoundedBoxGeometry(.24,.18,.14,2,.035),dark,1.08,1.76,side*1.07);
  // Sliding-door seam and polished rail.
  add(new BoxGeometry(.016,1.6,.012),dark,.56,1.34,side*.949);add(new BoxGeometry(1.75,.027,.018),chrome,-.55,1.37,side*.96);
  for(const axle of [-1.45,1.5]){
   const wheel=add(new CylinderGeometry(.45,.45,.25,40),rubber,axle,.48,side*.95);wheel.rotation.x=Math.PI/2;
   const rim=add(new CylinderGeometry(.29,.29,.265,32),chrome,axle,.48,side*.95);rim.rotation.x=Math.PI/2;
   const hub=add(new CylinderGeometry(.11,.11,.28,24),dark,axle,.48,side*.95);hub.rotation.x=Math.PI/2;
   for(let s=0;s<6;s++){const spoke=add(new BoxGeometry(.055,.4,.02),dark,axle,.48,side*1.091);spoke.rotation.z=s*Math.PI/3;}
  }
 }
 add(new BoxGeometry(.035,.34,1.12),dark,2.337,.97,0);
 for(const z of [-.68,.68]){add(new RoundedBoxGeometry(.05,.21,.36,2,.03),new MeshStandardMaterial({color:'#f5f1d6',emissive:'#e5d7a1',emissiveIntensity:.7}),2.345,1.29,z);add(new BoxGeometry(.04,.45,.16),new MeshStandardMaterial({color:'#9b2324',emissive:'#9b2324',emissiveIntensity:.25}),-2.34,1.08,z);}
 add(new BoxGeometry(.055,.14,.36),cream,2.37,.77,0);add(new BoxGeometry(.03,1.48,.014),dark,-2.344,1.38,0);
 add(new BoxGeometry(4.1,.04,1.87),copper,-.1,.71,0);
 // Small rear campaign panel makes the full turn informative.
 const rear=add(new PlaneGeometry(1.5,1.35),wrapMat,-2.35,1.58,0);rear.rotation.y=-Math.PI/2;
 g.rotation.y=-.45;return {group:g,textures:[wrap]};
}
export function createLightbox(){
 const g=new Group(),metal=new MeshStandardMaterial({color:'#262b29',metalness:.88,roughness:.24}),brass=new MeshStandardMaterial({color:'#b78c59',metalness:.8,roughness:.25});
 const box=new Mesh(new RoundedBoxGeometry(2.66,3.5,.18,3,.045),metal);box.castShadow=true;g.add(box);
 const trim=new Mesh(new BoxGeometry(2.58,3.42,.035),brass);trim.position.z=.101;g.add(trim);
 const tex=artwork(true);const faceMat=new MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:'#ffffff',emissiveIntensity:.85,roughness:.68,side:DoubleSide});
 const face=new Mesh(new PlaneGeometry(2.47,3.3),faceMat);face.position.z=.126;g.add(face);
 const back=new Mesh(new BoxGeometry(2.3,3.15,.05),metal);back.position.z=-.12;g.add(back);
 for(const x of [-.82,.82]){const foot=new Mesh(new BoxGeometry(.06,.58,.08),metal);foot.position.set(x,-1.97,0);g.add(foot);const base=new Mesh(new BoxGeometry(.56,.035,.65),metal);base.position.set(x,-2.25,0);base.castShadow=true;g.add(base);}
 g.rotation.y=-.18;return {group:g,faceMat,textures:[tex]};
}
