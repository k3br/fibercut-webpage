import * as THREE from 'three';

// Asset provenance: ../THIRD_PARTY_NOTICES.md.
// tree-oak / tree-pine: Kenney Nature Kit (CC0-1.0), kenney.nl/assets/nature-kit.
// grass / sky: Poly Haven grass_ground and kloofendal_48d_partly_cloudy_puresky
// (CC0-1.0), polyhaven.com/license; resized original texture/HDRI downloads.
// tree-natural: original procedural project geometry, no downloaded model.
// Roadside background: original flat-roof House0/House2 volumes from the base
// scene, with window/accent overlays hidden; no additional house downloads.
// Garage and woodshed: original procedural project models, no external assets.
// survey-scanner: original stylized Leica RTC360-inspired illustration.

// Shared landscape assets; repeated background planting uses instancing.
export async function installEnvironment(scene, root, loader, isMobile) {
  const textures = new THREE.TextureLoader();
  const [oak, pine, naturalTree, sky, grass, garage, woodshed, scannerAsset] = await Promise.all([
    loader.loadAsync('assets/environment/tree-oak.glb'),
    loader.loadAsync('assets/environment/tree-pine.glb'),
    loader.loadAsync('assets/environment/tree-natural.glb'),
    textures.loadAsync('assets/environment/sky.webp'),
    textures.loadAsync('assets/environment/grass.webp'),
    loader.loadAsync('assets/environment/garage.glb'),
    loader.loadAsync('assets/environment/woodshed.glb'),
    loader.loadAsync('assets/environment/survey-scanner.glb')
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
    // Replace background props only. The customer balcony facade and its
    // mounted railings remain the product presentation in the foreground.
    if (/^House[02]$/.test(o.name)) o.visible = true;
    if (/^House(?:Accent|Window)?[34]$|^House(?:Accent|Window)[02]$/.test(o.name)) o.visible = false;
    if (/^(Tree|Bush)/i.test(o.name)) o.visible = false;
    if (/^Bollard(?:Glow)?3$/.test(o.name)) o.visible = false;
    if (!o.isMesh) return;
    const mats = [o.material].flat();
    if (o.name === 'Ground' || mats.some(m=>/ArtificialTurf/i.test(m.name))) { o.material = lawn; o.receiveShadow = true; }
  });
  // End paved surfaces at the back of the stair building. The existing
  // grass ground continues beyond this line, including the contact backdrop.
  root.updateMatrixWorld(true);
  // Quiet rear elevations keep the fence presentation in focus. Share plain
  // materials and add only a thin flat roof, matching the garage's dark steel.
  const roadsideWhite = new THREE.MeshStandardMaterial({color:0xe8e8e3,roughness:.95});
  const roadsideRoof = new THREE.MeshStandardMaterial({color:0x252c30,metalness:.75,roughness:.38});
  for (const name of ['House0','House2']) {
    const house = root.getObjectByName(name);
    if (!house?.isMesh) continue;
    house.material = roadsideWhite;
    const bounds = new THREE.Box3().setFromObject(house);
    const size = bounds.getSize(new THREE.Vector3());
    const centre = bounds.getCenter(new THREE.Vector3());
    const roof = new THREE.Mesh(new THREE.BoxGeometry(size.x+.16,.15,size.z+.16),roadsideRoof);
    roof.name = `${name}FlatRoof`;
    roof.position.set(centre.x,bounds.max.y+.075,centre.z);
    roof.castShadow = !isMobile;
    roof.receiveShadow = true;
    scene.add(roof);
    scene.updateMatrixWorld(true);
    // Preserve world dimensions and alignment under the base GLB transform.
    root.attach(roof);
  }
  for (const name of ['Road','Driveway']) {
    const surface = root.getObjectByName(name);
    if (!surface?.isMesh) continue;
    const geometry = surface.geometry.clone(), original = geometry.getAttribute('position');
    const positions = new THREE.Float32BufferAttribute(original.count*3,3);
    const inverse = surface.matrixWorld.clone().invert(), point = new THREE.Vector3();
    for (let i=0;i<original.count;i++) {
      point.fromBufferAttribute(original,i).applyMatrix4(surface.matrixWorld);
      point.z = Math.max(point.z,-101);
      point.applyMatrix4(inverse);
      positions.setXYZ(i,point.x,point.y,point.z);
    }
    geometry.setAttribute('position',positions);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    surface.geometry = geometry;
  }
  // Beside the carport, pavement stops at the pad's right edge. Keep the
  // wider entrance by the garage; the existing lawn covers the removed strip.
  const driveway = root.getObjectByName('Driveway');
  if (driveway?.isMesh) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(driveway);
    const edge = 2.1 + 6.7/2;
    const outline = [
      [bounds.min.x,bounds.min.z], [edge,bounds.min.z],
      [edge,-84], [bounds.max.x,-84],
      [bounds.max.x,bounds.max.z], [bounds.min.x,bounds.max.z]
    ].map(([x,z])=>new THREE.Vector2(x,z));
    const indices = THREE.ShapeUtils.triangulateShape(outline,[]).flat();
    const inverse = driveway.matrixWorld.clone().invert();
    const positions = outline.flatMap(p=>new THREE.Vector3(p.x,bounds.max.y,p.y).applyMatrix4(inverse).toArray());
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(outline.flatMap(p=>[(p.x-bounds.min.x)/17,(p.y-bounds.min.z)/48]),2));
    // X/Z contour winding points down; reverse it for the top surface.
    geometry.setIndex(indices.flatMap((_,i)=>i%3===0?[indices[i],indices[i+2],indices[i+1]]:[]));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    driveway.geometry.dispose();
    driveway.geometry = geometry;
  }
  const residences = [
    [garage, 6.9, -79, -Math.PI/2], [woodshed, -5.6, -80, Math.PI/2]
  ];
  for (const [asset,x,z,rotation] of residences) {
    const house = asset.scene.clone(true);
    house.name = `BackgroundResidence_${z}`;
    // Outbuilding entrances face inward across the driveway.
    house.rotation.y = rotation;
    house.position.set(x,.02,z);
    house.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !isMobile;
      o.receiveShadow = true;
    });
    scene.add(house);
  }
  const scanner = scannerAsset.scene;
  scanner.name = 'LeicaSurveyScanner';
  scanner.position.set(-.3,.035,-92.65);
  scanner.rotation.y = -2.54;
  scene.add(scanner);
  const scannerHead = new THREE.Group();
  scannerHead.name = 'RotatingMeasurementHead';
  scannerHead.position.y = 1.62;
  scanner.add(scannerHead);
  scene.updateMatrixWorld(true);
  const headParts = [];
  scanner.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = !isMobile; o.receiveShadow = true;
    if (o.name.startsWith('ScannerHead_')) headParts.push(o);
  });
  // Reparent with world transforms intact, including GLB quantisation scales.
  headParts.forEach(part => scannerHead.attach(part));
  const status = scannerHead.getObjectByName('ScannerHead_StatusGreen');
  if (status) { status.material.emissive.setHex(0x32591e); status.material.emissiveIntensity = .6; }
  const sites = [
    [-7,-5,5.1], [9,-12,5.8], [-8,-23,6], [10,-30,5.2],
    [-8,-43,5.5], [11,-51,6.3], [-8,-60,5], [11,-69,5.7],
    [-8,-82,6.1], [11,-86,5.4], [9,-99,5.9], [-9,-105,5.3]
  ];
  // The nearest trees establish the opening scene: use a rounded branching
  // broadleaf silhouette rather than the old stacked geometric crowns.
  const naturalBounds = new THREE.Box3().setFromObject(naturalTree.scene);
  const naturalCentre = naturalBounds.getCenter(new THREE.Vector3());
  const naturalHeight = naturalBounds.max.y - naturalBounds.min.y;
  for (const [index, [x,z,height]] of sites.slice(0,2).entries()) {
    const placement = new THREE.Group();
    placement.name = `OpeningNaturalTree_${index}`;
    const tree = naturalTree.scene.clone(true);
    tree.position.set(-naturalCentre.x,-naturalBounds.min.y,-naturalCentre.z);
    tree.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = !isMobile;
      obj.receiveShadow = true;
    });
    placement.add(tree);
    placement.scale.setScalar(height / naturalHeight);
    placement.rotation.y = index * 1.7;
    placement.position.set(x,.02,z);
    scene.add(placement);
  }
  // A layered garden beyond the final landing fills the bare horizon, while
  // leaving the driveway and the entire camera route clear.
  const backgroundTrees = [
    [-15,-112,6.5], [-10,-119,7.2], [-18,-126,8.1], [-12,-134,7.6],
    [-6,-140,8.4], [1,-143,7.8], [8,-139,8.6], [15,-133,7.4],
    [19,-121,7.1], [12,-116,6.2]
  ];
  naturalTree.scene.updateMatrixWorld(true);
  naturalTree.scene.traverse(o => {
    if (!o.isMesh) return;
    const geometry = o.geometry.clone();
    // Decode quantized GLB attributes before baking the node transform.
    // Transforming normalized integer buffers in place clips the tree crown.
    for (const name of ['position','normal']) {
      const attribute = geometry.getAttribute(name);
      if (!attribute) continue;
      const values = new Float32Array(attribute.count*3);
      for (let i=0;i<attribute.count;i++) {
        values.set([attribute.getX(i),attribute.getY(i),attribute.getZ(i)],i*3);
      }
      geometry.setAttribute(name,new THREE.BufferAttribute(values,3));
    }
    geometry.applyMatrix4(o.matrixWorld);
    geometry.translate(-naturalCentre.x,-naturalBounds.min.y,-naturalCentre.z);
    const batch = new THREE.InstancedMesh(geometry,o.material,backgroundTrees.length);
    batch.name = `ContactGarden_${o.name}`;
    batch.receiveShadow = true;
    const dummy = new THREE.Object3D();
    backgroundTrees.forEach(([x,z,height],i) => {
      dummy.position.set(x,.02,z);
      dummy.rotation.y = i*2.39;
      dummy.scale.setScalar(height/naturalHeight);
      dummy.updateMatrix();
      batch.setMatrixAt(i,dummy.matrix);
    });
    batch.computeBoundingSphere();
    scene.add(batch);
  });
  const shrubs = [
    [-10,-112,1.2], [-12,-113,1.5], [-14,-115,1.1], [-8,-123,1.4],
    [-7,-126,1.1], [-7,-132,1.6], [-4,-136,1.3], [-1,-137,1.5],
    [2,-137,1.2], [5,-136,1.6], [8,-131,1.4], [11,-123,1.3],
    [12,-121,1.1], [13,-118,1.5]
  ];
  const shrubBatch = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1,2),
    new THREE.MeshStandardMaterial({color:0x48613c,roughness:1}),shrubs.length
  );
  shrubBatch.name = 'ContactGardenShrubs';
  shrubBatch.receiveShadow = true;
  const shrubTransform = new THREE.Object3D();
  shrubs.forEach(([x,z,height],i) => {
    shrubTransform.position.set(x,height*.43,z);
    shrubTransform.scale.set(height*.8,height*.55,height*.65);
    shrubTransform.rotation.y = i*2.39;
    shrubTransform.updateMatrix();
    shrubBatch.setMatrixAt(i,shrubTransform.matrix);
  });
  shrubBatch.computeBoundingSphere();
  scene.add(shrubBatch);
  for (const [type, asset] of [oak,pine].entries()) {
    const model = asset.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const centre = bounds.getCenter(new THREE.Vector3());
    const height = bounds.max.y-bounds.min.y;
    const placements = sites.filter((_,i)=>i>=2 && i%2===type);
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
  return {
    scanner,
    animate(time, reducedMotion = false) {
      // A slow instrument sweep suggests measurement; tripod stays fixed.
      scannerHead.rotation.y = reducedMotion ? 0 : time * .00018;
    }
  };
}
