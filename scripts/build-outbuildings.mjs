// Original procedural project garage and woodshed; no downloaded geometry or textures.
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
import {mergeGeometries}from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {ALL_EXTENSIONS}from '@gltf-transform/extensions';
import {dedup,weld,meshopt}from '@gltf-transform/functions';
import {MeshoptEncoder}from 'meshoptimizer';
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
  await MeshoptEncoder.ready; await doc.transform(dedup(),weld(),meshopt({encoder:MeshoptEncoder,level:'high'})); await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder}).write(file,doc);console.log(file,(await fs.stat(file)).size,'bytes');
}

const facade=new THREE.MeshStandardMaterial({name:'NeutralFacade',color:0xc9c8bd,roughness:.95});
const wood=new THREE.MeshStandardMaterial({name:'OutdoorTimber',color:0x7f6041,roughness:.95});
function box(g,n,size,pos,m){return mesh(g,n,new THREE.BoxGeometry(...size),m,pos);}
const garage=new THREE.Group();garage.name='DetachedGarage';
box(garage,'ConcretePad',[5.3,.12,5],[0,.06,0],facade);
for(const x of [-2.5,2.5])box(garage,'SideWall',[.18,2.65,4.8],[x,1.445,0],facade);
box(garage,'RearWall',[5.2,2.65,.18],[0,1.445,-2.31],facade);
for(const x of [-2.23,2.23])box(garage,'DoorJamb',[.54,2.65,.18],[x,1.445,2.31],facade);
box(garage,'DoorLintel',[4.0,.31,.18],[0,2.615,2.31],facade);
box(garage,'Roof',[5.55,.15,5.1],[0,2.85,0],steel);
box(garage,'GarageDoorFrame',[4.02,2.35,.07],[0,1.285,2.42],steel);
box(garage,'GarageDoor',[3.83,2.19,.035],[0,1.285,2.468],facade);
for(let i=1;i<9;i++)box(garage,'SectionalDoorJoint',[3.83,.009,.009],[0,.19+i*.243,2.49],steel);
box(garage,'DoorHandle',[.23,.035,.02],[0,.89,2.49],steel);
const shed=new THREE.Group();shed.name='TimberWoodshed';
box(shed,'Foundation',[3.7,.12,3.15],[0,.06,0],facade);
for(const x of [-1.70,1.70])for(const z of [-1.35,1.35])box(shed,'TimberPost',[.12,2.22,.12],[x,1.23,z],wood);
for(let row=0;row<10;row++){
 box(shed,'RearVentilatedSlat',[3.5,.15,.06],[0,.27+row*.20,-1.38],wood);
 for(const x of [-1.73,1.73])box(shed,'SideVentilatedSlat',[.06,.15,2.76],[x,.27+row*.20,0],wood);
}
box(shed,'FrontHeader',[3.55,.16,.14],[0,2.30,1.35],wood);
const roof=box(shed,'ShedRoof',[3.95,.09,3.45],[0,2.45,0],steel);roof.rotation.x=-.045;
for(let row=0;row<5;row++)for(let col=0;col<9;col++){
 const log=mesh(shed,'StoredFirewood',new THREE.CylinderGeometry(.12,.115,1.05,8),wood,[-1.18+col*.285+(row%2)*.06,.27+row*.24,.35]);log.rotation.x=Math.PI/2;
}
for(const [g,name]of [[garage,'garage'],[shed,'woodshed']]){
 g.updateMatrixWorld(true);const groups=new Map();g.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed();if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(a);});
 const merged=new THREE.Group();merged.name=g.name;for(const [m,geos]of groups)mesh(merged,m.name||'BuildingDetail',mergeGeometries(geos),m);
 await exportGLB(merged,'assets/environment/'+name+'.glb');
}
