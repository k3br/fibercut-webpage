// Original project houses; no downloaded geometry or textures. See THIRD_PARTY_NOTICES.md.
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {Document, NodeIO} from '@gltf-transform/core';

// Original metre-scale furniture assets: no third-party model or texture licences.
const oak = new THREE.MeshStandardMaterial({color:0xb68a56,roughness:.65});
const steel = new THREE.MeshStandardMaterial({color:0x252c30,metalness:.75,roughness:.38});
const ceramic = new THREE.MeshStandardMaterial({color:0xe8e2d6,roughness:.8});
function mesh(group, name, geometry, material, position=[0,0,0]) {
  const part=new THREE.Mesh(geometry,material);part.name=name;part.position.set(...position);group.add(part);return part;
}
function leg(group,name,start,end,radius=.028) {
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),delta=b.clone().sub(a);
  const part=mesh(group,name,new THREE.CylinderGeometry(radius,radius,delta.length(),16),steel,a.clone().add(b).multiplyScalar(.5).toArray());
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
}
function roundedTop(width,depth,height,radius) {
  const x=-width/2,z=-depth/2,s=new THREE.Shape();
  s.moveTo(x+radius,z);s.lineTo(x+width-radius,z);s.quadraticCurveTo(x+width,z,x+width,z+radius);
  s.lineTo(x+width,z+depth-radius);s.quadraticCurveTo(x+width,z+depth,x+width-radius,z+depth);
  s.lineTo(x+radius,z+depth);s.quadraticCurveTo(x,z+depth,x,z+depth-radius);
  s.lineTo(x,z+radius);s.quadraticCurveTo(x,z,x+radius,z);
  const g=new THREE.ExtrudeGeometry(s,{depth:height-.012,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:10});
  g.rotateX(-Math.PI/2);return g;
}
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
async function exportGLB(group,file) {
  group.updateMatrixWorld(true);
  const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene(group.name);
  const materials=new Map();
  group.traverse(part=>{
    if(!part.isMesh)return;
    let material=materials.get(part.material);
    if(!material){material=doc.createMaterial(part.material.name || 'OriginalProjectMaterial').setBaseColorFactor([...part.material.color.toArray(),1]).setMetallicFactor(part.material.metalness).setRoughnessFactor(part.material.roughness);materials.set(part.material,material);}
    const primitive=doc.createPrimitive().setMaterial(material),geometry=part.geometry.clone().applyMatrix4(part.matrixWorld);
    for(const [attribute,semantic] of [['position','POSITION'],['normal','NORMAL']]){
      const a=geometry.getAttribute(attribute);
      primitive.setAttribute(semantic,doc.createAccessor().setType('VEC3').setArray(new Float32Array(a.array)).setBuffer(buffer));
    }
    if(geometry.index)primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(geometry.index.array)).setBuffer(buffer));
    scene.addChild(doc.createNode(part.name).setMesh(doc.createMesh(part.name).addPrimitive(primitive)));
  });
  await new NodeIO().write(file,doc);console.log(file,(await fs.stat(file)).size,'bytes');
}

const plaster=new THREE.MeshStandardMaterial({name:'WarmWhitePlaster',color:0xd6d5cc,roughness:.9});
const glass=new THREE.MeshStandardMaterial({name:'BlueReflectiveGlazing',color:0x597987,metalness:.7,roughness:.18});
const trim=new THREE.MeshStandardMaterial({name:'DarkArchitecturalAluminium',color:0x263136,metalness:.65,roughness:.4});
const timber=new THREE.MeshStandardMaterial({name:'TimberCladding',color:0x9c7046,roughness:.85});
const concrete=new THREE.MeshStandardMaterial({name:'StoneBase',color:0x939991,roughness:.95});
function box(g,n,size,pos,m=plaster){return mesh(g,n,new THREE.BoxGeometry(...size),m,pos);}
function window(g,x,y,z,w,h){
 box(g,'RecessedWindowReveal',[w+.22,h+.22,.16],[x,y,z],trim);
 box(g,'ReflectiveGlass',[w,h,.03],[x,y,z-.09],glass);
 for(let i=1;i<Math.ceil(w/1.1);i++)box(g,'WindowMullion',[.035,h,.035],[x-w/2+i*w/Math.ceil(w/1.1),y,z-.12],trim);
 box(g,'ProjectingWindowSill',[w+.26,.055,.30],[x,y-h/2-.08,z-.06],concrete);
}
for(let variant=0;variant<3;variant++){
 const g=new THREE.Group();g.name=['CourtyardVilla','CantileverResidence','TerracePavilion'][variant];
 box(g,'Foundation',[7.8,.20,7.8],[0,.1,0],concrete);
 box(g,'MainGroundVolume',[7.2,2.95,6.9],[0,1.66,.12]);
 box(g,'FrontRoofOverhang',[7.85,.18,7.7],[0,3.19,0],trim);
 window(g,-1.65,1.65,-3.36,3.55,2.15);
 window(g,2.1,1.65,-3.36,1.25,2.15);
 box(g,'EntranceDoor',[.96,2.25,.11],[.65,1.40,-3.40],timber);
 box(g,'DoorHandle',[.035,.38,.055],[.98,1.42,-3.48],trim);
 for(let i=0;i<10;i++)box(g,'VerticalTimberFin',[.075,2.50,.12],[3.05+i*.075,1.6,-3.43],timber);
 box(g,'EntranceStep',[2.15,.14,.58],[.72,.25,-3.72],concrete);
 box(g,'SidePictureWindow',[.10,1.85,3.5],[-3.65,1.65,.1],trim);
 box(g,'SideGlazing',[.035,1.68,3.30],[-3.72,1.65,.1],glass);
 if(variant!==2){
  const offset=variant===1?-.50:.65;
  box(g,'UpperCantilever',[5.75,2.6,5.3],[offset,4.59,.40]);
  box(g,'UpperRoof',[6.15,.18,5.65],[offset,5.99,.4],trim);
  window(g,offset,4.55,-2.30,4.55,1.75);
  box(g,'UpperSideGlass',[.035,1.70,2.8],[offset-2.91,4.55,.25],glass);
  box(g,'BalconyDeck',[6.2,.15,1.13],[offset,3.36,-2.92],concrete);
  for(const x of [offset-2.95,offset,offset+2.95])box(g,'BalconyPost',[.045,.95,.045],[x,3.90,-3.38],trim);
  box(g,'BalconyGlassBalustrade',[5.90,.72,.035],[offset,3.87,-3.38],glass);
  box(g,'BalconyHandrail',[6.02,.045,.06],[offset,4.38,-3.38],trim);
 }else{
  box(g,'RaisedRoofVolume',[3.35,.68,4.2],[1.70,3.65,.5],plaster);
  box(g,'ClerestoryGlass',[2.9,.34,.055],[1.7,3.65,-1.63],glass);
  box(g,'RaisedRoofCap',[3.70,.16,4.55],[1.7,4.07,.5],trim);
 }
 for(const x of [-3.25,3.25])box(g,'PorticoSupport',[.10,2.98,.10],[x,1.70,-3.63],trim);
 box(g,'RoofParapetFront',[7.40,.16,.13],[0,3.38,-3.55],plaster);
 box(g,'RoofParapetBack',[7.40,.16,.13],[0,3.38,3.55],plaster);
 // Bake and merge by material: each complete house needs only six draw calls.
 g.updateMatrixWorld(true);const grouped=new Map();
 g.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed();if(!grouped.has(o.material))grouped.set(o.material,[]);grouped.get(o.material).push(a);});
 const merged=new THREE.Group();merged.name=g.name;
 for(const [m,geos]of grouped)mesh(merged,m.name||'FacadeDetail',mergeGeometries(geos),m);
 await exportGLB(merged,'assets/environment/house-'+['villa','cantilever','pavilion'][variant]+'.glb');
}

