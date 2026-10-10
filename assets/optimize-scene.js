import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Batch only static structures, by material and short spatial sections. Keep
// the animated gate outside this pass and retain local frustum culling.
export function batchStaticStructures(scene, roots) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  const centre = new THREE.Vector3();
  for (const root of roots) root.traverseVisible(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh || Array.isArray(mesh.material)) return;
    if (mesh.geometry.morphAttributes.position?.length) return;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.boundingBox.getCenter(centre).applyMatrix4(mesh.matrixWorld);
    const layout = Object.entries(mesh.geometry.attributes)
      .map(([name,attribute]) => `${name}:${attribute.itemSize}`).sort().join(',');
    const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${Math.floor(centre.z/12)}:${layout}`;
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(mesh);
  });
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map(mesh => {
      const geometry = mesh.geometry.clone();
      // Decode quantized attributes before applying the GLB node transform.
      for (const [name,attribute] of Object.entries(geometry.attributes)) {
        const values = new Float32Array(attribute.count*attribute.itemSize);
        for (let i=0;i<attribute.count;i++) for (let c=0;c<attribute.itemSize;c++) {
          values[i*attribute.itemSize+c] = attribute.getComponent(i,c);
        }
        geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize));
      }
      geometry.applyMatrix4(mesh.matrixWorld);
      const triangles = geometry.index ? geometry.toNonIndexed() : geometry;
      if (triangles !== geometry) geometry.dispose();
      return triangles;
    });
    const merged = mergeGeometries(geometries,false);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const batch = new THREE.Mesh(merged,meshes[0].material);
    batch.name = `StaticBatch_${meshes[0].name}`;
    batch.castShadow = meshes[0].castShadow;
    batch.receiveShadow = meshes[0].receiveShadow;
    meshes.forEach(mesh => { mesh.visible = false; });
    scene.add(batch);
  }
}
