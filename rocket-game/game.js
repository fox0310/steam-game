import * as THREE from "../node_modules/three/build/three.module.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { TARGET_ALTITUDE, nextAltitude, reachedSpace } from "./logic.mjs";

const app = document.querySelector("#app");
const liftButton = document.querySelector("#lift-button");
const resetButton = document.querySelector("#reset-button");
const rewardResetButton = document.querySelector("#reward-reset-button");
const altitudeText = document.querySelector("#altitude");
const statusText = document.querySelector("#status");
const reward = document.querySelector("#reward");
const countdown = document.querySelector("#countdown");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let altitude = 0;
let inputDown = false;
let thrusting = false;
let won = false;
let launched = false;
let countdownActive = false;
let last = performance.now();
let audioCtx = null;
let thrustOsc = null;
let thrustGain = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x74c7ff);
scene.fog = new THREE.Fog(0x050816, 18, 55);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 3.1, 9.5);
camera.lookAt(0, 1.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(app.clientWidth, app.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9ed8ff, 0x2d6136, 1.15));
const moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
moonLight.position.set(-5, 8, 6);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
scene.add(moonLight);

const land = makeLand();
scene.add(land);

const skyBackdrop = makeSkyBackdrop();
scene.add(skyBackdrop);

const externalMountains = loadExternalMountains();
scene.add(externalMountains);

const natureProps = loadNatureProps();
scene.add(natureProps);

const clouds = makeClouds();
scene.add(clouds);

const rocket = makeRocket();
scene.add(rocket);

const flame = makeFlame();
rocket.add(flame);

const stars = makeStars();
scene.add(stars);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0xf4f0d0, roughness: 0.65, transparent: true, opacity: 0 })
);
moon.position.set(-5.4, 5.8, -8);
scene.add(moon);

const targetRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.3, 0.035, 12, 80),
  new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.38 })
);
targetRing.position.set(0, 5.2, -0.8);
targetRing.rotation.x = Math.PI / 2;
scene.add(targetRing);

const smoke = makeSmoke();
scene.add(smoke);

addInput("keydown", event => {
  if (event.code === "Space") {
    event.preventDefault();
    startLift();
  }
});
addInput("keyup", event => {
  if (event.code === "Space") stopLift();
});

["pointerdown", "touchstart"].forEach(type => liftButton.addEventListener(type, event => {
  event.preventDefault();
  startLift();
}));
["pointerup", "pointerleave", "pointercancel", "touchend", "touchcancel"].forEach(type => {
  liftButton.addEventListener(type, stopLift);
});
resetButton.addEventListener("click", reset);
rewardResetButton.addEventListener("click", reset);
addEventListener("resize", resize);
resize();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  thrusting = launched && inputDown && !won;
  if (!won && launched) altitude = nextAltitude(altitude, thrusting, dt);
  if (!won && reachedSpace(altitude)) win();

  const progress = altitude / TARGET_ALTITUDE;
  const space = smoothstep(0.28, 0.82, progress);
  scene.background = new THREE.Color(0x74c7ff).lerp(new THREE.Color(0x050816), space);
  scene.fog.color.copy(scene.background);
  land.traverse(obj => {
    if (obj.material) obj.material.opacity = 1 - space;
  });
  stars.material.opacity = Math.max(0.08, space);
  moon.material.opacity = space;
  targetRing.material.opacity = 0.12 + space * 0.32;
  skyBackdrop.userData.day.material.opacity = 1 - space;
  skyBackdrop.userData.space.material.opacity = space;
  externalMountains.traverse(obj => {
    if (obj.material) obj.material.opacity = 1 - space;
  });
  natureProps.traverse(obj => {
    if (obj.material) obj.material.opacity = 1 - space;
  });
  clouds.traverse(obj => {
    if (obj.material) obj.material.opacity = Math.max(0, 1 - space * 1.5);
  });
  rocket.position.y = -1.28 + progress * 6.9;
  rocket.rotation.z = thrusting && !reduceMotion ? Math.sin(now / 75) * 0.025 : 0;
  flame.visible = thrusting && !won;
  flame.scale.setScalar(thrusting && !reduceMotion ? 0.9 + Math.sin(now / 45) * 0.08 : 0.9);
  animateSmoke(now, thrusting && progress < 0.22);
  setThrustSound(thrusting);
  stars.rotation.y += reduceMotion ? 0 : 0.0008;
  targetRing.rotation.z += reduceMotion ? 0 : 0.006;

  altitudeText.textContent = `${Math.round(altitude)}%`;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function startLift() {
  inputDown = true;
  ensureAudio();
  if (won) return;
  if (!launched && !countdownActive) beginCountdown();
  liftButton.classList.add("active");
  statusText.textContent = launched ? "火箭升空中" : "準備發射";
}

function stopLift() {
  inputDown = false;
  liftButton.classList.remove("active");
  if (!won && launched) statusText.textContent = "火箭停止升空";
}

function win() {
  won = true;
  inputDown = false;
  setThrustSound(false);
  playWinSound();
  reward.hidden = false;
  statusText.textContent = "成功到達太空";
}

function reset() {
  altitude = 0;
  won = false;
  launched = false;
  inputDown = false;
  countdownActive = false;
  setThrustSound(false);
  reward.hidden = true;
  countdown.hidden = true;
  liftButton.classList.remove("active");
  statusText.textContent = "按住空白鍵或拍制開始";
}

function resize() {
  const { clientWidth, clientHeight } = app;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function addInput(type, handler) {
  addEventListener(type, handler, { passive: false });
}

function beginCountdown() {
  countdownActive = true;
  countdown.hidden = false;
  const steps = [
    ["3", 0, 392],
    ["2", 800, 440],
    ["1", 1600, 494],
    ["發射", 2400, 660]
  ];
  for (const [text, delay, freq] of steps) {
    setTimeout(() => {
      if (!countdownActive) return;
      countdown.textContent = text;
      beep(freq, text === "發射" ? 0.38 : 0.18);
    }, delay);
  }
  setTimeout(() => {
    if (!countdownActive) return;
    countdown.hidden = true;
    launched = true;
    countdownActive = false;
    statusText.textContent = inputDown ? "火箭升空中" : "按住空白鍵或拍制";
    launchSound();
  }, 3000);
}

function ensureAudio() {
  audioCtx ||= new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function beep(freq, duration) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.03);
}

function launchSound() {
  beep(110, 0.45);
  setTimeout(() => beep(82, 0.55), 90);
}

function playWinSound() {
  [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => beep(freq, 0.2), i * 130));
}

function setThrustSound(on) {
  if (!audioCtx) return;
  if (on && !thrustOsc) {
    thrustOsc = audioCtx.createOscillator();
    thrustGain = audioCtx.createGain();
    thrustOsc.type = "sawtooth";
    thrustOsc.frequency.value = 72;
    thrustGain.gain.value = 0.045;
    thrustOsc.connect(thrustGain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  if (!on && thrustOsc) {
    thrustGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    thrustOsc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
    thrustGain = null;
  }
}

function smoothstep(edge0, edge1, value) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function makeLand() {
  const group = new THREE.Group();
  const groundMat = transparentMat({ map: makeGroundTexture(), color: 0xffffff, roughness: 0.82 });
  const mountainMat = transparentMat({ color: 0x6d7b84, roughness: 0.86 });
  const snowMat = transparentMat({ color: 0xe9f3ff, roughness: 0.55 });

  const ground = new THREE.Mesh(new THREE.BoxGeometry(28, 0.22, 18), groundMat);
  ground.position.set(0, -3.25, -4);
  ground.receiveShadow = true;
  group.add(ground);

  [-7, -3.2, 2.2, 6.4].forEach((x, i) => {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(2.1 + i * 0.16, 3.6 + i * 0.25, 4), mountainMat);
    mountain.position.set(x, -1.55, -8.5);
    mountain.rotation.y = Math.PI / 4;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    group.add(mountain);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.8, 4), snowMat);
    snow.position.set(x, 0.26 + i * 0.12, -8.5);
    snow.rotation.y = Math.PI / 4;
    group.add(snow);
  });

  loadLaunchpad(group);
  return group;
}

function transparentMat(options) {
  return new THREE.MeshStandardMaterial({ ...options, transparent: true });
}

function makeSkyBackdrop() {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const makePlane = (url, opacity) => {
    const texture = loader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 35),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, depthWrite: false })
    );
    mesh.position.set(0, 2.2, -18);
    return mesh;
  };
  const day = makePlane("/rocket-game/assets/backgrounds/sky-day.png", 1);
  const space = makePlane("/rocket-game/assets/backgrounds/sky-space.png", 0);
  group.add(day, space);
  group.userData = { day, space };
  return group;
}

function loadExternalMountains() {
  const group = new THREE.Group();
  new GLTFLoader().load("/rocket-game/assets/models/mountains-quaternius.glb", gltf => {
    const model = gltf.scene;
    model.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material.transparent = true;
      }
    });
    normalizeModel(model, 7.2);
    model.position.set(0, -2.68, -7.7);
    group.add(model);
  });
  return group;
}

function loadNatureProps() {
  const group = new THREE.Group();
  const props = [
    ["tree_pineTallA.glb", -5.7, -3.02, -3.2, 0.9],
    ["tree_default.glb", 5.6, -3.02, -3.7, 0.85],
    ["rock_largeA.glb", -3.35, -3.05, -1.15, 0.72],
    ["grass_large.glb", 3.25, -3.02, -1.05, 0.9]
  ];
  for (const [file, x, y, z, size] of props) {
    new GLTFLoader().load(`/rocket-game/assets/models/${file}`, gltf => {
      const model = gltf.scene;
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.material.transparent = true;
        }
      });
      normalizeModel(model, size);
      model.position.set(x, y, z);
      group.add(model);
    });
  }
  return group;
}

function loadLaunchpad(group) {
  new GLTFLoader().load("/rocket-game/assets/models/proton-rocket-launchpad.glb", gltf => {
    const model = gltf.scene;
    model.getObjectByName("Object_8")?.removeFromParent();
    prepareModel(model);
    normalizeModel(model, 4.5);
    model.position.set(0.65, -1.95, -0.45);
    group.add(model);
  });
}

function prepareModel(model) {
  model.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material.transparent = true;
    }
  });
}

function normalizeModel(model, targetWidth) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetWidth / Math.max(size.x, size.y, size.z, 0.001);
  model.scale.setScalar(scale);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(scale));
}

function makeGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2f8f4e";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(32,92,46,.35)" : "rgba(126,170,82,.25)";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 1 + Math.random() * 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 4);
  return texture;
}

function makeClouds() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, roughness: 0.9 });
  [[-5, 2.6, -5], [4.2, 3.2, -6.4], [0.8, 4.3, -8.5]].forEach(([x, y, z]) => {
    const cloud = new THREE.Group();
    [0, 0.52, -0.48].forEach((dx, i) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.45 + i * 0.08, 18, 10), mat);
      puff.position.set(dx, Math.sin(i) * 0.1, 0);
      cloud.add(puff);
    });
    cloud.position.set(x, y, z);
    cloud.scale.set(1.8, 0.42, 0.55);
    group.add(cloud);
  });
  return group;
}

function makeSmoke() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xcfd5d8, transparent: true, opacity: 0.4, roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16 + Math.random() * 0.16, 14, 8), mat.clone());
    puff.userData = { angle: Math.random() * Math.PI * 2, radius: 0.25 + Math.random() * 0.7, speed: 0.4 + Math.random() * 0.4 };
    puff.visible = false;
    group.add(puff);
  }
  return group;
}

function animateSmoke(now, active) {
  smoke.children.forEach((puff, i) => {
    puff.visible = active;
    if (!active) return;
    const age = ((now / 1000) * puff.userData.speed + i / smoke.children.length) % 1;
    const radius = puff.userData.radius + age * 0.8;
    puff.position.set(Math.cos(puff.userData.angle) * radius, -2.7 + age * 0.62, Math.sin(puff.userData.angle) * radius * 0.45);
    puff.scale.setScalar(0.55 + age * 1.7);
    puff.material.opacity = 0.5 * (1 - age);
  });
}

function makeRocket() {
  const group = new THREE.Group();
  new GLTFLoader().load("/rocket-game/assets/models/long-march-5-rocket.glb", gltf => {
    const model = gltf.scene;
    prepareModel(model);
    normalizeModel(model, 3.6);
    group.add(model);
  });
  return group;
}

function makeFlame() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 1.25, 28),
    new THREE.MeshBasicMaterial({ color: 0xff7a18, transparent: true, opacity: 0.9 })
  );
  outer.position.y = -1.92;
  outer.rotation.x = Math.PI;
  const inner = new THREE.Mesh(
    new THREE.ConeGeometry(0.19, 0.82, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff18b, transparent: true, opacity: 0.95 })
  );
  inner.position.y = -1.72;
  inner.rotation.x = Math.PI;
  group.add(outer, inner);
  group.visible = false;
  return group;
}

function makeStars() {
  const geometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i < 700; i++) {
    points.push((Math.random() - 0.5) * 42, Math.random() * 24 - 7, -Math.random() * 34 - 4);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.9 })
  );
}
