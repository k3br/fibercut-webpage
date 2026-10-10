import * as THREE from 'three';

// Positions are in metres. Preserve the original CAD groups for animation.
export async function installCustomerModels(scene, loader, isMobile) {
  const [gateAsset, carportAsset, stairAsset, fenceAsset, coffeeAsset, diningAsset] = await Promise.all([
    loader.loadAsync('models/web/customer-gate.glb'),
    loader.loadAsync('models/web/4_nadstresek.optimized.glb'),
    loader.loadAsync('models/web/3_stopnice.optimized.glb'),
    loader.loadAsync('models/web/2_ograja.optimized.glb'),
    loader.loadAsync('models/web/coffee-table.glb'),
    loader.loadAsync('models/web/dining-table.glb')
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
  // The right fixed post meets the roadside fence on the curb centreline.
  gate.position.set(-5.6646, .03, -74.5);
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
  // The fixed railing was mounted on a retaining wall absent from the CAD export.
  // Derive its alignment from the end mounting plates; keep it behind the
  // sliding leaf so the driveway and the roller hardware remain clear.
  gate.updateMatrixWorld(true);
  const mountingCentre = name => gate.worldToLocal(
    new THREE.Box3().setFromObject(gate.getObjectByName(name)).getCenter(new THREE.Vector3())
  );
  const wallStart = mountingCentre('CAD_part_215');
  const wallEnd = mountingCentre('CAD_part_217');
  const wallDirection = wallEnd.clone().sub(wallStart);
  const wallTop = Math.min(wallStart.y, wallEnd.y) - .0025;
  const wallBottom = -.03;
  const wallCentre = wallStart.clone().add(wallEnd).multiplyScalar(.5);
  const retainingWall = box(gate, 'CustomerGateRetainingWall',
    [Math.hypot(wallDirection.x, wallDirection.z) + .24, wallTop - wallBottom, .22],
    [wallCentre.x, (wallTop + wallBottom) / 2, wallCentre.z], concrete);
  retainingWall.rotation.y = -Math.atan2(wallDirection.z, wallDirection.x);

  // Support the complete landing below the existing metal floor, then close
  // the missing final strip between the last CAD tile and the end frame.
  box(stairs, 'CustomerStairsLandingSupport', [1.982, .12, .854], [1.657, 2.42, .1], metal);
  box(stairs, 'CustomerStairsLandingInfill', [.382, .03, .8], [2.457, 2.495, .073], metal);
  box(fence, 'CustomerFenceBuilding', [11.125, 5, 3.5], [0, 2.5, -2.30], fenceStructure?.material || concrete);
  // Both CAD railings stand at z=.51, a metre in front of the facade.
  // Connect their mounting feet to the building with continuous balcony slabs.
  const balconyConcrete = fenceStructure?.material || concrete;
  box(fence, 'CustomerUpperBalconySlab', [9.5, .22, 1.18], [0, 2.67, -.01], balconyConcrete);
  box(fence, 'CustomerLowerBalconySlab', [9.5, .12, 1.18], [0, -.04, -.01], balconyConcrete);
  for (const y of [.02, 2.78]) {
    for (const x of [-4.512, -3.008, -1.504, 0, 1.504, 3.008, 4.512]) {
      box(fence, `BalconyPostBase_${x}_${y}`, [.12, .008, .12], [x, y + .004, .51], metal);
    }
  }
  const glass = new THREE.MeshStandardMaterial({color: 0x465e69, metalness: .65, roughness: .22});
  for (const y of [1.22, 3.85]) {
    for (const x of [-3.2, 0, 3.2]) {
      box(fence, `BalconyWindow_${x}_${y}`, [2.15, 1.95, .045], [x, y, -.53], glass);
    }
  }
  box(carport, 'CustomerCarportPad', [6.7, .06, 5.3], [0, .01, 0], concrete);
  // Keep the furniture's own oak, steel and ceramic PBR materials.
  const installFurniture = (asset, name, position) => {
    const model = asset.scene;
    model.name = name;
    model.position.set(...position);
    model.rotation.y = -.278;
    model.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = !isMobile;
      obj.receiveShadow = true;
    });
    carport.add(model);
    return model;
  };
  const coffeeTable = installFurniture(coffeeAsset, 'CustomerCoffeeTable', [-1.2, .04, .72]);
  const diningTable = installFurniture(diningAsset, 'CustomerDiningTable', [.95, .04, -.40]);
  // Match the CAD roof frame (5.5 × 3.5 m), including its rotation in plan.
  const roof = box(carport, 'CustomerCarportRoofCover', [5.5, .045, 3.5], [-.0104, 2.7875, .031], new THREE.MeshStandardMaterial({color: 0x82939a, metalness: .5, roughness: .35}));
  roof.rotation.y = -Math.atan2(1.508962, 5.289146);
  box(stairs, 'EntranceBuilding', [5.3, 4.8, 3.5], [0, 2.4, -2.36], facade?.material || concrete);
  const door = box(stairs, 'FinalEntranceDoor', [1.05, 1.95, .055], [1.85, 3.485, -.36], new THREE.MeshStandardMaterial({color: 0x242d32, metalness: .45, roughness: .3}));
  box(door, 'EntranceDoorGlazing', [.24, 1.58, .018], [-.29, .07, .04], new THREE.MeshStandardMaterial({color: 0x718b96, metalness: .8, roughness: .16}));
  box(door, 'EntranceDoorHandle', [.025, .40, .04], [.37, -.05, .06], metal);
  const lamp = new THREE.PointLight(0xffdfb0, 3, 5, 2);
  lamp.position.set(-2.85, 4.1, -99.85); scene.add(lamp);

  return {gate, movingGate, carport, stairs, door, fence, coffeeTable, diningTable,
    animate(progress) {
      const open = THREE.MathUtils.smoothstep(progress, .48, .60);
      const travel = open * 5.9;
      movingGate.position.set(-.9533 * travel, 0, .3022 * travel);
    }
  };
}

// Gate is fully clear before the camera crosses z=-73. The journey ends
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
  // Inspect the upper column/roof joint while continuing past it. The second
  // detail frame advances instead of holding the camera at one position.
  {p: .705, position: [-2.0,2.15,-85.65], target: [-1.02,2.61,-86.88], zoom: 1},
  {p: .725, position: [-2.05,2.12,-86.10],target: [-.92,2.61,-87.10], zoom: 1},
  {p: .755, position: [-2.2,1.68,-89],   target: [1.2,1.7,-89]},
  // Walk on the left half, towards the house, with the original viewing angles.
  // First tread begins at z=-95.314, y=.211; climb still starts at its foot.
  {p: .78,  position: [-3.78,1.68,-93.6],target: [-3.78,.8,-95.8]},
  {p: .80,  position: [-3.78,1.68,-94.85],target: [-3.78,1.0,-96.4]},
  {p: .815, position: [-3.78,1.86,-95.45],target: [-3.78,2.15,-97.1]},
  {p: .845, position: [-3.78,2.80,-96.62],target: [-3.435,3.05,-99.1]},
  {p: .89,  position: [-3.78,4.19,-98.75],target: [-3.435,3.55,-100.35]},
  {p: 1,    position: [-3.78,4.19,-100],target: [-4.275,3.55,-100.55]}
];

// Interpolate viewing angles rather than nearby look-at points: a short target
// distance must not amplify a small translation into a sudden camera turn.
let previousYaw = 0;
const orientations = journey.map((frame,i) => {
  const [x,y,z] = frame.target.map((value,axis) => value-frame.position[axis]);
  let yaw = Math.atan2(x,-z);
  if (i) yaw = previousYaw + Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));
  previousYaw = yaw;
  return {yaw, pitch: Math.atan2(y,Math.hypot(x,z))};
});
// Quintic Hermite curves share velocity and zero acceleration at waypoints.
// The old cubic only matched velocity, leaving acceleration jumps at joins.
const channels = [
  ...['position', 'target'].flatMap(key => [0,1,2].map(axis => ({key,axis}))),
  ...['zoom','yaw','pitch'].map(key => ({key,axis:null}))
].map(({key,axis}) => {
  const values = journey.map((frame,i) => axis !== null ? frame[key][axis]
    : key === 'zoom' ? (frame.zoom ?? 0) : orientations[i][key]);
  const intervals = journey.slice(1).map((frame,i) => frame.p - journey[i].p);
  const slopes = intervals.map((h,i) => (values[i+1] - values[i]) / h);
  const tangents = values.map((_,i) => {
    if (i === 0) return slopes[0];
    if (i === values.length - 1) return slopes.at(-1);
    const left = slopes[i-1], right = slopes[i];
    if (left * right <= 0) return 0;
    const w1 = 2 * intervals[i] + intervals[i-1];
    const w2 = intervals[i] + 2 * intervals[i-1];
    return (w1 + w2) / (w1 / left + w2 / right);
  });
  return {key, axis, values, tangents};
});

export function sampleJourney(progress, result = {position: [0,0,0], target: [0,0,0]}) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let index = journey.findIndex((frame,i) => i < journey.length - 1 && p <= journey[i+1].p);
  if (index < 0) index = journey.length - 2;
  const a = journey[index], b = journey[index+1], h = b.p - a.p;
  const t = (p - a.p) / h, t2 = t*t, t3 = t2*t, t4 = t3*t, t5 = t4*t;
  for (const {key, axis, values, tangents} of channels) {
    const value = (1 - 10*t3 + 15*t4 - 6*t5) * values[index]
      + (t - 6*t3 + 8*t4 - 3*t5) * h * tangents[index]
      + (10*t3 - 15*t4 + 6*t5) * values[index+1]
      + (-4*t3 + 7*t4 - 3*t5) * h * tangents[index+1];
    if (axis === null) result[key] = value;
    else result[key][axis] = value;
  }
  return result;
}
