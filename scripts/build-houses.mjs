import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import * as THREE from 'three';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,prune,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
// Kenney City Kit Suburban 2.0 (CC0-1.0); retain licences and source inventory.
// Supply the unpacked official package's 'Models/GLB format' directory.
const input=process.argv[2]||'.tools/house-reference/Models/GLB format';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
for(const [id,name,scale]of [['p','villa',5.5],['q','cantilever',5.5],['g','pavilion',5]]){
 const source='building-type-'+id+'.glb',doc=await io.read(path.join(input,source));
 for(const node of doc.getRoot().listNodes())node.setName('KenneySuburban_'+id);
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const mat=p.getMaterial(),texture=mat.getBaseColorTexture(),uv=p.getAttribute('TEXCOORD_0'),pos=p.getAttribute('POSITION');
  const {data,info}=await sharp(texture.getImage()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const colors=new Float32Array(pos.getCount()*3);
  for(let i=0;i<pos.getCount();i++){
   const [u,v]=uv.getElement(i,[]),xy=pos.getElement(i,[]);
   const pixel=(Math.min(info.height-1,Math.max(0,Math.floor(v*info.height)))*info.width+Math.min(info.width-1,Math.max(0,Math.floor(u*info.width))))*4;
   let r=data[pixel]/255,g=data[pixel+1]/255,b=data[pixel+2]/255;
   // Neutral slate roof, retaining low garden planting and original glazing.
   if(xy[1]>.35 && g>r*1.2 && g>b*1.1){r=.31;g=.34;b=.35;}
   const color=new THREE.Color().setRGB(r,g,b,THREE.SRGBColorSpace);
   colors.set(color.toArray(),i*3);
   pos.setElement(i,xy.map(c=>c*scale));
  }
  p.setAttribute('COLOR_0',doc.createAccessor('BakedPaletteColors').setType('VEC3').setArray(colors).setBuffer(pos.getBuffer()));
  p.setAttribute('TEXCOORD_0',null);
  mat.setBaseColorTexture(null).setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(.85);
  for(const extension of mat.listExtensions())extension.dispose();
 }
 for(const extension of doc.getRoot().listExtensionsUsed())if(extension.extensionName==='KHR_texture_transform')extension.dispose();
 doc.getRoot().listScenes()[0].setExtras({source,author:'Kenney',license:'CC0-1.0',sourceURL:'https://kenney.nl/assets/city-kit-suburban',modifications:'Metre scale, neutral slate roof, texture palette baked to linear vertex colours, Meshopt compression'});
 await doc.transform(prune(),dedup(),weld(),meshopt({encoder:MeshoptEncoder,level:'high'}));
 const out='assets/environment/house-'+name+'.glb';await io.write(out,doc);console.log(out,(await fs.stat(out)).size);
}
