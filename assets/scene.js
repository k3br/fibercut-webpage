import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { installCustomerModels, journey } from './customer-scene.js';

const canvas = document.querySelector('#scene');
const fallback = document.querySelector('#webglFallback');
const progressBar = document.querySelector('#progressBar');
const chapterNumber = document.querySelector('#chapterNumber');
const loaderEl = document.querySelector('#scenePreloader');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 800px)').matches;
const isPortrait = window.matchMedia('(orientation: portrait)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
} catch (err) {
  canvas.hidden = true;
  fallback.hidden = false;
  document.body.classList.remove('is-loading');
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2.0));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.documentElement.dataset.webgl = 'ready';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdceaf4);
scene.fog = new THREE.FogExp2(0xd9e6ef, isMobile ? 0.0088 : 0.0072);

const camera = new THREE.PerspectiveCamera(isMobile ? 64 : 55, window.innerWidth / window.innerHeight, 0.1, 280);
camera.position.set(-.3, 1.68, 7);

// Reflection environment gives the metal much more believable response than
// flat ambient lighting while still being cheap enough for mobile.
const pmrem = new THREE.PMREMGenerator(renderer);
const roomEnv = new RoomEnvironment();
const envRT = pmrem.fromScene(roomEnv, 0.04);
scene.environment = envRT.texture;
roomEnv.dispose();
pmrem.dispose();

const hemi = new THREE.HemisphereLight(0xdfefff, 0x51565c, 1.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d4, 3.2);
sun.position.set(-12, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 13;
sun.shadow.camera.bottom = -5;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.00025;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xb9d9f4, .92);
fill.position.set(10, 8, -18);
scene.add(fill);

// A few very cheap warm architectural lights around the final carport scene.
for (const [x,y,z,power] of [
  [-4.4,.55,-81,2.1], [5.7,.55,-83,1.9], [-4.7,.55,-92,1.7], [5.8,.55,-94,1.7], [.7,2.45,-88.7,2.7]
]) {
  const l = new THREE.PointLight(0xffd09a, power, 12, 2);
  l.position.set(x,y,z);
  scene.add(l);
}

function addEnvironmentShell() {
  // A single inward-facing box gives us top/back/left/right sky surfaces with
  // one continuous world-space gradient, so there are no visible seams while
  // the camera moves through the property.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    uniforms: {
      topColor:     { value: new THREE.Color(0x76afe0) },
      midColor:     { value: new THREE.Color(0xc6dff1) },
      horizonColor: { value: new THREE.Color(0xf4f7f8) },
      lowColor:     { value: new THREE.Color(0xd8e2e9) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 lowColor;
      void main() {
        float h = clamp((vWorldPos.y + 8.0) / 95.0, 0.0, 1.0);
        vec3 col;
        if (h < 0.20) {
          col = mix(lowColor, horizonColor, smoothstep(0.0, 0.20, h));
        } else if (h < 0.52) {
          col = mix(horizonColor, midColor, smoothstep(0.20, 0.52, h));
        } else {
          col = mix(midColor, topColor, smoothstep(0.52, 1.0, h));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const shell = new THREE.Mesh(new THREE.BoxGeometry(220, 120, 300), skyMat);
  shell.name = 'SkyEnvironmentShell';
  shell.position.set(0, 46, -62);
  shell.renderOrder = -100;
  shell.frustumCulled = false;
  scene.add(shell);
}
addEnvironmentShell();

let root = null;
let customerModels;
let targetProgress = 0;
let smoothProgress = 0;
let pointerX = 0;
let pointerY = 0;
let started = false;

function getProgress() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
}

function updateChapter(p) {
  const chapter = p < .18 ? '01' : p < .38 ? '02' : p < .58 ? '03' : p < .78 ? '04' : '05';
  chapterNumber.textContent = chapter;
  progressBar.style.height = `${Math.round(p * 100)}%`;
}

function ease01(v) {
  v = THREE.MathUtils.clamp(v, 0, 1);
  return v * v * (3 - 2 * v);
}

function animateGate(p) {
  customerModels?.animate(p);
}

function updateCamera(p, t) {
  let index = journey.findIndex((frame, i) => i < journey.length - 1 && p <= journey[i + 1].p);
  if (index < 0) index = journey.length - 2;
  const a = journey[index], b = journey[index + 1];
  const q = ease01((p - a.p) / (b.p - a.p));
  const mix = (key, axis) => THREE.MathUtils.lerp(a[key][axis], b[key][axis], q);
  const px = reduceMotion || isMobile ? 0 : pointerX * .04;
  const py = reduceMotion || isMobile ? 0 : pointerY * .02;
  camera.position.set(mix('position',0) + px, mix('position',1) - py, mix('position',2));
  const baseFov = isMobile ? 64 : 55;
  const detailFov = frame => frame.fov ? frame.fov + (isMobile ? 8 : 0) : baseFov;
  camera.fov = THREE.MathUtils.lerp(detailFov(a), detailFov(b), q);
  const detailAmount = THREE.MathUtils.lerp(a.detail ? 1 : 0, b.detail ? 1 : 0, q);
  document.body.classList.toggle('is-detail-shot', detailAmount > .7);
  document.body.dataset.detail = detailAmount > .7 ? (a.detail || b.detail || '') : '';
  camera.updateProjectionMatrix();
  camera.lookAt(mix('target',0) + px, mix('target',1) - py, mix('target',2));
  sun.position.set(-12, 18, camera.position.z + 10);
  sun.target.position.set(0, 0, camera.position.z - 7);
}

window.addEventListener('scroll', () => {
  targetProgress = getProgress();
  updateChapter(targetProgress);
}, { passive: true });

if (!isMobile) {
  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / window.innerWidth - .5) * 2;
    pointerY = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });
}

let lastFrame = 0;
function render(t = 0) {
  if (!started) return;
  targetProgress = getProgress();
  const delta = targetProgress - smoothProgress;
  const elapsed = Math.min(.1, (t - lastFrame) / 1000 || 1 / 60);
  lastFrame = t;
  const follow = reduceMotion ? 1 : 1 - Math.exp(-elapsed * (isMobile ? 18 : 8));
  if (isMobile && Math.abs(delta) > .11) smoothProgress += delta * .58;
  else smoothProgress += delta * follow;

  updateCamera(smoothProgress, t);
  animateGate(smoothProgress);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize() {
  const mobile = window.innerWidth <= 800;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = mobile ? 64 : 55;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.75 : 2.0));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener('resize', resize, { passive: true });

const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const line = loaderEl?.querySelector('.scene-preloader-line i');
  if (line && total) {
    const pct = Math.max(8, Math.min(96, (loaded / total) * 100));
    line.style.width = `${pct}%`;
    line.style.transform = 'none';
    line.style.animation = 'none';
  }
};

const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
const loadStarted = performance.now();
let sceneSettled = false;

function finishLoaderError(message) {
  if (sceneSettled) return;
  sceneSettled = true;
  console.error(message);
  document.body.classList.remove('is-loading');
  if (loaderEl) {
    const labels = loaderEl.querySelectorAll('.scene-preloader-label span');
    if (labels[1]) labels[1].textContent = 'NAPAKA PRI NALAGANJU';
    const line = loaderEl.querySelector('.scene-preloader-line i');
    if (line) { line.style.width = '100%'; line.style.animation = 'none'; }
    setTimeout(() => loaderEl.classList.add('is-ready'), 1300);
  }
}

// Never allow an endless loading screen, even on a failed network request.
const loadWatchdog = window.setTimeout(() => {
  finishLoaderError('FiberCut 3D scene load timed out. Check fibercut-scene.glb path / hosting.');
  canvas.hidden = true;
  fallback.hidden = false;
}, 45000);

async function bootScene() {
  try {
    const gltf = await gltfLoader.loadAsync('fibercut-scene.glb');
    root = gltf.scene;
    root.name = 'FiberCutBakedScene';
    scene.add(root);

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const name = obj.name || '';
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach((mat) => {
        if (!mat) return;
        for (const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']) {
          if (mat[key]) mat[key].anisotropy = maxAniso;
        }

        // The GLB textures already contain the perforation in their alpha
        // channel. Keep them as true cut-out sheet metal — no transparent
        // glass plane behind them.
        const mn = mat.name || '';
        if (/Fence_Graphite_Geo/i.test(mn)) {
          mat.color.setHex(0x666c72);
          mat.metalness = .88; mat.roughness = .29;
        } else if (/Fence_WarmBronze_Leaf/i.test(mn)) {
          mat.color.setHex(0x9a8067);
          mat.metalness = .86; mat.roughness = .30;
        } else if (/Fence_SoftAlu_Waves/i.test(mn)) {
          mat.color.setHex(0xc7c9c7);
          mat.metalness = .84; mat.roughness = .31;
        } else if (/Fence_Anthracite_Dots/i.test(mn)) {
          mat.color.setHex(0x30343a);
          mat.metalness = .90; mat.roughness = .28;
        } else if (/Fence_Black_Slots/i.test(mn)) {
          mat.color.setHex(0x17191c);
          mat.metalness = .91; mat.roughness = .27;
        }

        if (/^Fence_/i.test(mn)) {
          mat.transparent = false;
          mat.opacity = 1;
          mat.alphaTest = .32;
          mat.depthWrite = true;
          mat.depthTest = true;
          mat.side = THREE.DoubleSide;
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.needsUpdate = true;
          }
        }

        if (/ArtificialTurf/i.test(mn)) {
          mat.color.setHex(0x6da94b);
          mat.roughness = .94;
          mat.metalness = 0;
        }
        mat.needsUpdate = true;
      });

      const isReceiver = /Ground|Road|Driveway|CarportPad/i.test(name);
      const isHeroCaster = isMobile
        ? /Carport|Stair|SlidingGate|Rail/i.test(name)
        : /Carport|Stair|SlidingGate|Rail|Slat|Geo|Leaf|Waves|Corner|Gate/i.test(name);
      obj.receiveShadow = isReceiver || /Carport/i.test(name);
      obj.castShadow = isHeroCaster && !/BakedShadow|Backdrop|ArtificialTurf/i.test(name);

      // The old photographic mountain card caused the large uncovered area
      // when scrolling. The new sky shell replaces it completely.
      if (/MountainBackdrop/i.test(name)) {
        obj.visible = false;
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });

    root.traverse(obj => {
      if (/^(SlidingGate|GateReturn|GatePost|Carport|Stair|RailRear|RailFront|RailRight)/.test(obj.name)) obj.visible = false;
      if (/^House(?:Accent|Window)?1$/.test(obj.name)) obj.visible = false;
      // The customer's two-storey railing replaces this section of the old
      // roadside fence. Remove only meshes occupying the same frontage.
      if (obj.isMesh && !/Ground|Road|Driveway|Tree|Bush|House|Backdrop/.test(obj.name)) {
        const bounds = new THREE.Box3().setFromObject(obj);
        const centre = bounds.getCenter(new THREE.Vector3());
        if (centre.x > 3.3 && centre.x < 4.2 && bounds.min.z < -31.9 && bounds.max.z > -43.1) obj.visible = false;
      }
    });
    customerModels = await installCustomerModels(scene, gltfLoader, isMobile);

    targetProgress = getProgress();
    smoothProgress = targetProgress;
    updateChapter(targetProgress);
    updateCamera(smoothProgress, performance.now());
    animateGate(smoothProgress);

    // Compile all imported materials before scroll is enabled.
    try {
      if (typeof renderer.compileAsync === 'function') await renderer.compileAsync(scene, camera);
      else renderer.compile(scene, camera);
    } catch (_) {}

    renderer.render(scene, camera);

    // Keep the loader visible for about two seconds by design. This gives the
    // browser time to upload the embedded PBR textures and avoids shader work
    // being discovered during the user's first fast swipe.
    const elapsed = performance.now() - loadStarted;
    if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000 - elapsed));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    window.clearTimeout(loadWatchdog);
    if (sceneSettled) return;
    sceneSettled = true;
    const line = loaderEl?.querySelector('.scene-preloader-line i');
    if (line) line.style.width = '100%';
    document.body.classList.remove('is-loading');
    if (loaderEl) {
      loaderEl.classList.add('is-ready');
      setTimeout(() => loaderEl.remove(), 450);
    }

    started = true;
    requestAnimationFrame(render);
  } catch (err) {
    window.clearTimeout(loadWatchdog);
    console.error('FiberCut scene failed to load', err);
    canvas.hidden = true;
    fallback.hidden = false;
    finishLoaderError('FiberCut scene failed to load');
  }
}
bootScene();
