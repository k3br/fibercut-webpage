import * as THREE from 'three';

// Positions are in metres. Preserve the original CAD groups for animation.
export async function installCustomerModels(scene, loader, isMobile) {
  const [gateAsset, carportAsset, stairAsset, fenceAsset] = await Promise.all([
    loader.loadAsync('models/web/customer-gate.glb'),
    loader.loadAsync('models/web/4_nadstresek.optimized.glb'),
    loader.loadAsync('models/web/3_stopnice.optimized.glb'),
    loader.loadAsync('models/web/2_ograja.optimized.glb')
  ]);
  const metal = new THREE.MeshStandardMaterial({color: 0x555e66, metalness: .82, roughness: .34, side: THREE.DoubleSide});
  const renderModel = (model, name) => {
    model.name = name;
    model.traverse(obj => {
      if (!obj.isMesh) return;
      obj.material = metal;
      obj.castShadow = !isMobile;
      obj.receiveShadow = true;
    });
    scene.add(model);
    return model;
  };
  const gate = renderModel(gateAsset.scene, 'CustomerGateSite');
  gate.rotation.y = -.307;
  gate.position.set(-6.3, .03, -74.5);
  const movingGate = gate.getObjectByName('SlidingGateAssembly');
  if (!movingGate || movingGate.children.length !== 16) throw new Error('Customer sliding gate assembly is missing parts');

  const carport = renderModel(carportAsset.scene, 'CustomerCarportSite');
  carport.position.set(2.1, .03, -87.8);
  const stairs = renderModel(stairAsset.scene, 'CustomerStairsSite');
  stairs.rotation.y = Math.PI / 2;
  stairs.position.set(-3.6, .03, -98);
  const facade = stairs.getObjectByName('CAD_part_000');
  if (facade) facade.material = new THREE.MeshStandardMaterial({color: 0xd3d0c8, roughness: .94});
  const fence = renderModel(fenceAsset.scene, 'CustomerFenceSite');
  fence.rotation.y = -Math.PI / 2;
  fence.position.set(4.3, .03, -37.5);
  const fenceStructure = fence.getObjectByName('CAD_part_000');
  if (fenceStructure) fenceStructure.material = facade?.material || new THREE.MeshStandardMaterial({color: 0xd3d0c8, roughness: .94});

  const box = (parent, name, dimensions, position, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
    mesh.name = name; mesh.position.set(...position);
    mesh.receiveShadow = true; mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const concrete = new THREE.MeshStandardMaterial({color: 0xb5b5ae, roughness: .92});
  box(fence, 'CustomerFenceBuilding', [11.125, 5, 3.5], [0, 2.5, -2.30], fenceStructure?.material || concrete);
  const glass = new THREE.MeshStandardMaterial({color: 0x465e69, metalness: .65, roughness: .22});
  for (const y of [1.22, 3.85]) {
    for (const x of [-3.2, 0, 3.2]) {
      box(fence, `BalconyWindow_${x}_${y}`, [2.15, 1.95, .045], [x, y, -.53], glass);
    }
  }
  box(carport, 'CustomerCarportPad', [6.7, .06, 5.3], [0, .01, 0], concrete);
  // Match the CAD roof frame (5.5 × 3.5 m), including its rotation in plan.
  const roof = box(carport, 'CustomerCarportRoofCover', [5.5, .045, 3.5], [-.0104, 2.7875, .031], new THREE.MeshStandardMaterial({color: 0x82939a, metalness: .5, roughness: .35}));
  roof.rotation.y = -Math.atan2(1.508962, 5.289146);
  box(stairs, 'EntranceBuilding', [5.3, 4.8, 3.5], [0, 2.4, -2.36], facade?.material || concrete);
  const door = box(stairs, 'FinalEntranceDoor', [1.05, 1.95, .055], [1.85, 3.485, -.36], new THREE.MeshStandardMaterial({color: 0x242d32, metalness: .45, roughness: .3}));
  box(door, 'EntranceDoorGlazing', [.24, 1.58, .018], [-.29, .07, .04], new THREE.MeshStandardMaterial({color: 0x718b96, metalness: .8, roughness: .16}));
  box(door, 'EntranceDoorHandle', [.025, .40, .04], [.37, -.05, .06], metal);
  const lamp = new THREE.PointLight(0xffdfb0, 3, 5, 2);
  lamp.position.set(-2.85, 4.1, -99.85); scene.add(lamp);

  return {gate, movingGate, carport, stairs, door, fence,
    animate(progress) {
      const open = THREE.MathUtils.smoothstep(progress, .48, .60);
      const travel = open * 5.9;
      movingGate.position.set(-.9533 * travel, 0, .3022 * travel);
    }
  };
}

// Gate is fully clear before the camera crosses z=-73. The last keyframe stays
// outside the entrance, above the actual CAD landing (2.51 m + eye height).
export const journey = [
  {p: 0,    position: [-.3,1.68,7],      target: [2.9,1.34,-3.5]},
  {p: .20,  position: [-.3,1.68,-15],    target: [2.9,1.34,-25.5]},
  {p: .28,  position: [-.3,1.68,-26],    target: [4.3,2.35,-35]},
  {p: .355, position: [-.3,1.68,-36],    target: [4.3,2.35,-39.5]},
  {p: .40,  position: [-.3,1.68,-43],    target: [2.9,1.34,-53.5]},
  {p: .49,  position: [-.3,1.68,-62],    target: [.3,1.34,-73]},
  {p: .60,  position: [0,1.68,-69],      target: [0,1.34,-81]},
  {p: .66,  position: [0,1.68,-77],      target: [1.4,1.55,-87.8]},
  // Near-left upper CAD joint: column, perimeter beam and roof members.
  {p: .705, position: [-2.0,2.15,-85.65], target: [-1.02,2.61,-86.88], fov: 38, detail: 'carport-roof-joint'},
  {p: .725, position: [-2.0,2.15,-85.65], target: [-1.02,2.61,-86.88], fov: 38, detail: 'carport-roof-joint'},
  {p: .755, position: [-2.2,1.68,-89],   target: [1.2,1.7,-89]},
  {p: .80,  position: [-2.65,1.68,-95.3],target: [-3.15,2.9,-98.5]},
  {p: .89,  position: [-2.65,3.97,-98.7],target: [-3.45,3.65,-100]},
  {p: .96,  position: [-1.65,3.97,-99.8],target: [-4.02,3.55,-100.55]},
  {p: 1,    position: [-1.65,3.97,-99.8],target: [-4.02,3.55,-100.55]}
];
