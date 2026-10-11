// Original stylized scanner illustration inspired by Leica RTC360 product reference.
// No manufacturer mesh, photos or logo assets are redistributed; see notices.
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


const white=new THREE.MeshStandardMaterial({name:'ScannerWhiteShell',color:0xe9eceb,roughness:.38});
const red=new THREE.MeshStandardMaterial({name:'LeicaRedAccent',color:0xc72b34,roughness:.4});
const black=new THREE.MeshStandardMaterial({name:'ScannerCarbonAndOptics',color:0x172025,roughness:.48,metalness:.3});
const alloy=new THREE.MeshStandardMaterial({name:'TripodAluminium',color:0x8e999e,roughness:.35,metalness:.8});
const lens=new THREE.MeshStandardMaterial({name:'OpticalGlass',color:0x254651,roughness:.14,metalness:.75});
const tripod=new THREE.Group();tripod.name='SurveyTripod';
function bar(g,n,a,b,r,m){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start);const o=mesh(g,n,new THREE.CylinderGeometry(r,r,v.length(),12),m,start.clone().add(end).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());}
for(let i=0;i<3;i++){
 const a=i*2*Math.PI/3+.25,x=Math.sin(a),z=Math.cos(a);
 bar(tripod,'CarbonTripodLeg',[x*.12,1.36,z*.12],[x*.52,.06,z*.52],.028,black);
 bar(tripod,'SilverLowerLeg',[x*.34,.58,z*.34],[x*.54,.025,z*.54],.018,alloy);
 bar(tripod,'TripodSpreader',[0,.67,0],[x*.36,.54,z*.36],.009,alloy);
 mesh(tripod,'RubberFoot',new THREE.SphereGeometry(.033,12,8),black,[x*.54,.028,z*.54]);
 mesh(tripod,'LegClamp',new THREE.BoxGeometry(.07,.075,.065),black,[x*.33,.62,z*.33]);
}
mesh(tripod,'TripodMount',new THREE.CylinderGeometry(.14,.12,.055,24),alloy,[0,1.39,0]);
mesh(tripod,'LevelingBase',new THREE.CylinderGeometry(.095,.10,.045,24),black,[0,1.44,0]);
const head=new THREE.Group();head.name='MeasurementHead';
mesh(head,'ScannerLowerHousing',new THREE.CylinderGeometry(.115,.115,.115,24),white,[0,1.535,0]);
for(const x of [-.155,.155])mesh(head,'RoundedSideHousing',roundedTop(.095,.225,.22,.033),white,[x,1.525,0]);
mesh(head,'CentralOpticalRotor',new THREE.CylinderGeometry(.087,.087,.20,24),black,[0,1.695,0]).rotation.x=Math.PI/2;
mesh(head,'LaserAperture',new THREE.CylinderGeometry(.049,.049,.012,24),lens,[0,1.695,.107]).rotation.x=Math.PI/2;
mesh(head,'LensRing',new THREE.TorusGeometry(.054,.007,8,24),alloy,[0,1.695,.12]);
mesh(head,'TopCarryBridge',roundedTop(.31,.085,.04,.03),white,[0,1.79,-.07]);
mesh(head,'RedInstrumentBadge',new THREE.BoxGeometry(.055,.095,.012),red,[-.155,1.67,.12]);
mesh(head,'ControlPanel',new THREE.BoxGeometry(.16,.055,.015),black,[0,1.562,.125]);
mesh(head,'StatusLED',new THREE.SphereGeometry(.006,8,6),new THREE.MeshStandardMaterial({name:'StatusGreen',color:0x70b354,emissive:0x32591e}),[.055,1.56,.14]);
const combined=new THREE.Group();combined.name='LeicaStyleSurveyScanner';
for(const [group,prefix]of [[tripod,'Tripod_'],[head,'ScannerHead_']]){
 group.updateMatrixWorld(true);const groups=new Map();group.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed();if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(a);});
 for(const [m,geos]of groups)mesh(combined,prefix+(m.name||'Material'),mergeGeometries(geos),m);
}
await exportGLB(combined,'assets/environment/survey-scanner.glb');
