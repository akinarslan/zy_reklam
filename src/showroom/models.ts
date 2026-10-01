import { Group, Mesh, Shape, ExtrudeGeometry, BoxGeometry, MeshStandardMaterial, PointLight } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export type Outlines = Record<string, {svg:string; width:number; height:number; text:string; font:string; glyphs?:{char:string;x:number;width:number;path:string}[]}>;
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
const lightColors=['#20bcc9','#c94e58','#467acb','#d78c44','#eef3ed'];
function letters(parent:Group,outline:Outlines[string],width:number,face:MeshStandardMaterial,chrome:MeshStandardMaterial,depth:number,x:number,y:number,z:number,glow?:MeshStandardMaterial[],colorOffset=0) {
  const parsed=new SVGLoader().parse(outline.svg),scale=width/outline.width;
  const assembly=new Group();assembly.position.set(x,y,z);parent.add(assembly);
  parsed.paths.forEach((path,i)=>{
    const shapes=SVGLoader.createShapes(path);
    const geometry=new ExtrudeGeometry(shapes,{depth:depth/scale,bevelEnabled:true,bevelThickness:1,bevelSize:1,bevelSegments:2,curveSegments:3,steps:1});
    geometry.scale(scale,scale,scale);geometry.translate(-outline.width*scale/2,-74*scale,0);
    const housing=new Mesh(geometry,chrome);housing.scale.y=-1;housing.castShadow=true;assembly.add(housing);
    // Each letter has its own inset luminous face inside a continuous chrome case.
    const frontGeometry=new ExtrudeGeometry(shapes,{depth:.025/scale,bevelEnabled:true,bevelThickness:.35,bevelSize:.35,bevelSegments:1,curveSegments:3,steps:1});
    frontGeometry.scale(scale,scale,scale);frontGeometry.computeBoundingBox();const bounds=frontGeometry.boundingBox!;
    const cx=(bounds.min.x+bounds.max.x)/2,cy=(bounds.min.y+bounds.max.y)/2;
    frontGeometry.translate(-cx,-cy,0);frontGeometry.scale(.90,.94,1);
    const frontMaterial=face.clone();if(glow){frontMaterial.emissive.set(lightColors[(i+colorOffset)%lightColors.length]);frontMaterial.emissiveIntensity=0;frontMaterial.userData.baseColor=frontMaterial.color.clone();frontMaterial.userData.baseMetalness=frontMaterial.metalness;glow.push(frontMaterial);}
    const front=new Mesh(frontGeometry,frontMaterial);front.scale.y=-1;front.position.set(cx-outline.width*scale/2,-(cy-74*scale),depth+.024);front.castShadow=true;assembly.add(front);
  });
  assembly.userData.capHeight=100*scale;assembly.userData.text=outline.text;assembly.userData.chrome=true;
  return assembly;
}
export function createProducts(outlines:Outlines):Product[] {
  const gold=material('#c2a779',.92,.27),silver=material('#9caaa9',.95,.38),bronze=material('#8c6545',.9,.3);
  const white=material('#ede7d5',.35,.3),goldFace=material('#dbc08d',.82,.25),silverFace=material('#c2cacc',.88,.42);
  for(const m of [white,goldFace,silverFace]){m.emissive.set('#c18b43');m.emissiveIntensity=.025;}
  const topGlow:MeshStandardMaterial[]=[],lowerGlow:MeshStandardMaterial[]=[];const chrome=material('#ccd6d9',1,.19);const top=new Group();top.position.set(-2.4,1.5,0);top.rotation.set(.07,-.11,0);
  slab(top,6.4,1.65,.25,gold);slab(top,6.22,1.47,.14,material('#10231f',.7,.38),.27);
  box(top,5.9,.016,.02,bronze,0,-.55,.43);
  letters(top,outlines.zy,1.22,white,chrome,.2,-2.02,0,.45,topGlow);letters(top,outlines.reklam,3.88,goldFace,chrome,.2,.73,0,.45,topGlow,2);
  const lower=new Group();lower.position.set(-2.4,-1.05,.1);lower.rotation.set(.055,-.08,0);
  slab(lower,6.4,1.55,.28,silver);slab(lower,6.22,1.37,.12,material('#242d30',.88,.36),.3);
  // Small parallel metal grooves catch light without applying a flat picture.
  for(let i=0;i<8;i++)box(lower,5.9,.007,.009,material('#566365',.95,.55),0,-.58+i*.018,.435);
  letters(lower,outlines.lower,5.48,silverFace,chrome,.18,0,0,.46,lowerGlow,3);
  const totem=new Group();totem.position.set(3.15,0,0);totem.rotation.set(.025,-.23,0);
  const dark=material('#1b2327',.88,.32);const profile=new Shape();profile.moveTo(-.7,-2.9);profile.lineTo(.55,-2.9);profile.lineTo(.38,-1.35);profile.lineTo(.66,.55);profile.lineTo(.16,2.68);profile.lineTo(-.46,3.02);profile.lineTo(-.72,1.45);profile.lineTo(-.51,-.45);profile.closePath();
  const body=new Mesh(new ExtrudeGeometry(profile,{depth:.58,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),dark);body.castShadow=true;body.receiveShadow=true;totem.add(body);
  const facet=new Shape();facet.moveTo(-.67,-2.75);facet.lineTo(-.46,-2.75);facet.lineTo(-.2,-.7);facet.lineTo(-.42,1.15);facet.lineTo(-.38,2.72);facet.lineTo(-.55,2.45);facet.lineTo(-.65,.9);facet.lineTo(-.43,-.65);facet.closePath();
  const amber=material('#5b3820',.9,.4);amber.emissive.set('#ff7c20');amber.emissiveIntensity=.035;
  const channel=new Mesh(new ExtrudeGeometry(facet,{depth:.04,bevelEnabled:false}),amber);channel.position.z=.6;totem.add(channel);
  slab(totem,1.75,.23,.9,dark,-.15).position.y=-3.05;
  const head=new Group();head.position.set(.16,2.38,.65);totem.add(head);slab(head,3.8,.9,.33,bronze);slab(head,3.7,.8,.07,dark,.35);
  const lit=material('#cbbba3',.55,.3);lit.emissive.set('#ffad52');lit.emissiveIntensity=.025;const totemGlow:MeshStandardMaterial[]=[amber];const title=letters(head,outlines.title,3.45,lit,chrome,.09,0,0,.45);title.traverse(o=>{if(o instanceof Mesh&&o.material!==chrome)totemGlow.push(o.material as MeshStandardMaterial);});
  ['idea','design','production','development'].forEach((key,i)=>{
    const panel=new Group();panel.position.set(.95,1.38-i*.86,.55);totem.add(panel);
    box(panel,.7,.1,.18,bronze,-.7,0,-.06);slab(panel,2.95,.64,.28,dark);box(panel,2.75,.012,.03,amber,0,-.26,.31);
    const label=letters(panel,outlines[key],outlines[key].width*.00345,lit,chrome,.075,0,0,.32);label.traverse(o=>{if(o instanceof Mesh&&o.material!==chrome)totemGlow.push(o.material as MeshStandardMaterial);});
  });
  const lamp=new PointLight('#ffa34d',0,5,2);lamp.position.set(-.25,.3,1.15);totem.add(lamp);
  const signLights=(group:Group,colors:string[])=>colors.map((color,i)=>{const lamp=new PointLight(color,0,2.4,2);lamp.position.set(-1.4+i*2.8,0,.95);group.add(lamp);return lamp;});
  return [
    {id:'upper',group:top,baseYaw:-.11,basePitch:.07,lights:signLights(top,['#64cbd3','#d99b64']),glow:topGlow,metal:[gold,bronze,chrome],strength:1},
    {id:'lower',group:lower,baseYaw:-.08,basePitch:.055,lights:signLights(lower,['#789dde','#d77676']),glow:lowerGlow,metal:[silver,chrome],strength:.65},
    {id:'totem',group:totem,baseYaw:-.23,basePitch:.025,lights:[lamp],glow:totemGlow,metal:[dark],strength:.45},
  ];
}
