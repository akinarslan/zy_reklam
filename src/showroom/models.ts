import { Group, Mesh, Shape, ExtrudeGeometry, BoxGeometry, MeshStandardMaterial, PointLight } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export type Outlines = Record<string, {svg:string; width:number; height:number; text:string; font:string}>;
export interface Product { id:string; group:Group; baseYaw:number; basePitch:number; lights:PointLight[]; glow:MeshStandardMaterial[]; metal:MeshStandardMaterial[]; strength:number; }
const material=(color:string,metalness=.85,roughness=.3)=>new MeshStandardMaterial({color,metalness,roughness});
function box(parent:Group,w:number,h:number,d:number,mat:MeshStandardMaterial,x=0,y=0,z=0) {
  const mesh=new Mesh(new BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function slab(parent:Group,w:number,h:number,depth:number,mat:MeshStandardMaterial,z=0) {
  const s=new Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();
  const geometry=new ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:4});
  const mesh=new Mesh(geometry,mat);mesh.position.z=z;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function letters(parent:Group,outline:Outlines[string],width:number,face:MeshStandardMaterial,side:MeshStandardMaterial,depth:number,x:number,y:number,z:number) {
  const parsed=new SVGLoader().parse(outline.svg);const shapes=parsed.paths.flatMap(p=>SVGLoader.createShapes(p));
  const geometry=new ExtrudeGeometry(shapes,{depth:depth*outline.width/width,bevelEnabled:true,bevelThickness:.8,bevelSize:.6,bevelSegments:2,curveSegments:5,steps:1});
  geometry.scale(width/outline.width,width/outline.width,width/outline.width);geometry.computeBoundingBox();const b=geometry.boundingBox!;geometry.translate(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,0);
  const mesh=new Mesh(geometry,[face,side]);mesh.scale.y=-1;mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
export function createProducts(outlines:Outlines):Product[] {
  const gold=material('#c2a779',.92,.27),silver=material('#9caaa9',.95,.38),bronze=material('#8c6545',.9,.3);
  const white=material('#ede7d5',.35,.3),goldFace=material('#dbc08d',.82,.25),silverFace=material('#c2cacc',.88,.42);
  for(const m of [white,goldFace,silverFace]){m.emissive.set('#c18b43');m.emissiveIntensity=.025;}
  const top=new Group();top.position.set(-2.4,1.5,0);top.rotation.set(.07,-.11,0);
  slab(top,6.4,1.65,.25,gold);slab(top,6.22,1.47,.14,material('#10231f',.7,.38),.27);
  box(top,5.9,.016,.02,bronze,0,-.55,.43);
  letters(top,outlines.zy,1.22,white,gold,.2,-1.95,0,.45);letters(top,outlines.reklam,3.55,goldFace,bronze,.2,.67,0,.45);
  const lower=new Group();lower.position.set(-2.4,-1.05,.1);lower.rotation.set(.055,-.08,0);
  slab(lower,6.4,1.55,.28,silver);slab(lower,6.22,1.37,.12,material('#242d30',.88,.36),.3);
  // Small parallel metal grooves catch light without applying a flat picture.
  for(let i=0;i<8;i++)box(lower,5.9,.007,.009,material('#566365',.95,.55),0,-.58+i*.018,.435);
  letters(lower,outlines.lower,5.48,silverFace,gold,.15,0,0,.46);
  const totem=new Group();totem.position.set(3.15,0,0);totem.rotation.set(.025,-.23,0);
  const dark=material('#1b2327',.88,.32);const profile=new Shape();profile.moveTo(-.7,-2.9);profile.lineTo(.55,-2.9);profile.lineTo(.38,-1.35);profile.lineTo(.66,.55);profile.lineTo(.16,2.68);profile.lineTo(-.46,3.02);profile.lineTo(-.72,1.45);profile.lineTo(-.51,-.45);profile.closePath();
  const body=new Mesh(new ExtrudeGeometry(profile,{depth:.58,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),dark);body.castShadow=true;body.receiveShadow=true;totem.add(body);
  const facet=new Shape();facet.moveTo(-.67,-2.75);facet.lineTo(-.46,-2.75);facet.lineTo(-.2,-.7);facet.lineTo(-.42,1.15);facet.lineTo(-.38,2.72);facet.lineTo(-.55,2.45);facet.lineTo(-.65,.9);facet.lineTo(-.43,-.65);facet.closePath();
  const amber=material('#5b3820',.9,.4);amber.emissive.set('#ff7c20');amber.emissiveIntensity=.035;
  const channel=new Mesh(new ExtrudeGeometry(facet,{depth:.04,bevelEnabled:false}),amber);channel.position.z=.6;totem.add(channel);
  slab(totem,1.75,.23,.9,dark,-.15).position.y=-3.05;
  const head=new Group();head.position.set(.16,2.38,.65);totem.add(head);slab(head,2.18,.7,.33,bronze);slab(head,2.08,.6,.07,dark,.35);
  const lit=material('#cbbba3',.55,.3);lit.emissive.set('#ffad52');lit.emissiveIntensity=.025;letters(head,outlines.title,1.87,lit,bronze,.075,0,0,.45);
  ['idea','design','production','development'].forEach((key,i)=>{
    const panel=new Group();panel.position.set(.95,1.38-i*.86,.55);totem.add(panel);
    box(panel,.7,.1,.18,bronze,-.7,0,-.06);slab(panel,1.88,.58,.28,dark);box(panel,1.7,.012,.03,amber,0,-.23,.31);
    letters(panel,outlines[key],Math.min(1.62,outlines[key].width*.0055),lit,bronze,.065,0,0,.32);
  });
  const lamp=new PointLight('#ffa34d',0,5,2);lamp.position.set(-.25,.3,1.15);totem.add(lamp);
  return [
    {id:'upper',group:top,baseYaw:-.11,basePitch:.07,lights:[],glow:[white,goldFace],metal:[gold,bronze],strength:1},
    {id:'lower',group:lower,baseYaw:-.08,basePitch:.055,lights:[],glow:[silverFace],metal:[silver],strength:.65},
    {id:'totem',group:totem,baseYaw:-.23,basePitch:.025,lights:[lamp],glow:[lit,amber],metal:[dark],strength:.45},
  ];
}
