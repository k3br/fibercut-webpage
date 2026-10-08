import * as THREE from 'three';

// Two shared tree assets; every repeated part is rendered with instancing.
export async function installEnvironment(scene, root, loader, isMobile) {
  const textures = new THREE.TextureLoader();
  const [oak, pine, sky, grass] = await Promise.all([
    loader.loadAsync('assets/environment/tree-oak.glb'),
    loader.loadAsync('assets/environment/tree-pine.glb'),
    textures.loadAsync('assets/environment/sky.webp'),
    textures.loadAsync('assets/environment/grass.webp')
  ]);
  sky.colorSpace = THREE.SRGBColorSpace;
  sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = sky;
  scene.backgroundIntensity = .85;
  scene.getObjectByName('SkyEnvironmentShell').visible = false;
  grass.colorSpace = THREE.SRGBColorSpace;
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.anisotropy = isMobile ? 2 : 4;
  const lawn = new THREE.MeshStandardMaterial({map:grass, color:0xb4c69a, roughness:1});
  lawn.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 lawnUV;');
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nlawnUV = (modelMatrix * vec4(transformed, 1.0)).xz / 3.0;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 lawnUV;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', 'diffuseColor *= texture2D(map, lawnUV);');
  };
  root.traverse(o => {
    if (/^(Tree|Bush)/i.test(o.name)) o.visible = false;
    if (!o.isMesh) return;
    const mats = [o.material].flat();
    if (o.name === 'Ground' || mats.some(m=>/ArtificialTurf/i.test(m.name))) { o.material = lawn; o.receiveShadow = true; }
  });
  const sites = [
    [-7,-5,5.1], [9,-12,5.8], [-8,-23,6], [10,-30,5.2],
    [-8,-43,5.5], [11,-51,6.3], [-8,-60,5], [11,-69,5.7],
    [-8,-82,6.1], [11,-86,5.4], [9,-99,5.9], [-9,-105,5.3]
  ];
  for (const [type, asset] of [oak,pine].entries()) {
    const model = asset.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const centre = bounds.getCenter(new THREE.Vector3());
    const height = bounds.max.y-bounds.min.y;
    const placements = sites.filter((_,i)=>i%2===type);
    model.traverse(o => {
      if (!o.isMesh) return;
      const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
      geometry.translate(-centre.x,-bounds.min.y,-centre.z);
      const material = new THREE.MeshStandardMaterial({
        color: /leaf/i.test(o.material.name) ? (type ? 0x35543b : 0x587347) : 0x69503c,
        roughness: .95, metalness: 0
      });
      const batch = new THREE.InstancedMesh(geometry,material,placements.length);
      batch.name = `LandscapeTrees_${type}_${o.name}`;
      batch.castShadow = !isMobile; batch.receiveShadow = true;
      const dummy = new THREE.Object3D();
      placements.forEach(([x,z,h],i)=>{
        dummy.position.set(x,.02,z);
        dummy.rotation.y = i*2.39+type;
        dummy.scale.setScalar(h/height);
        dummy.updateMatrix(); batch.setMatrixAt(i,dummy.matrix);
      });
      batch.computeBoundingSphere(); scene.add(batch);
    });
  }
}
