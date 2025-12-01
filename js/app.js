import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const { FaceLandmarker, FilesetResolver } = vision;

// DOM elements
const btn2d = document.getElementById("btn-2d");
const btn3d = document.getElementById("btn-3d");
const video = document.getElementById("video");
const canvas2d = document.getElementById("canvas-2d");
const canvas3d = document.getElementById("canvas-3d");
const ctx2d = canvas2d.getContext("2d");

let currentMode = "2d";
let faceLandmarker = null;
let lastVideoTime = -1;

// Event listeners
btn2d.addEventListener("click", () => {
  currentMode = "2d";
  btn2d.classList.add("active");
  btn3d.classList.remove("active");
  canvas2d.classList.remove("hidden");
  canvas3d.classList.add("hidden");
});

btn3d.addEventListener("click", () => {
  currentMode = "3d";
  btn3d.classList.add("active");
  btn2d.classList.remove("active");
  canvas3d.classList.remove("hidden");
  canvas2d.classList.add("hidden");
});

// PNG Glasses
const glassesImg = new Image();
glassesImg.src = "./assets/glasses.png";

// 3D globals
let renderer3d, scene3d, camera3d, glassesGroup;

function resizeCanvases() {
  const rect = video.getBoundingClientRect();
  const width = rect.width || 640;
  const height = rect.height || 480;

  canvas2d.width = width;
  canvas2d.height = height;
  canvas3d.width = width;
  canvas3d.height = height;

  if (renderer3d && camera3d) {
    renderer3d.setSize(width, height, false);
    camera3d.aspect = width / height;
    camera3d.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resizeCanvases);

// 3D model loader
function loadGlassesModel() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      "./models/glasses_clean.gltf",
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        resolve(model);
      },
      undefined,
      reject
    );
  });
}

// Init 3D Scene
async function initThree() {
  renderer3d = new THREE.WebGLRenderer({
    canvas: canvas3d,
    alpha: true,
    antialias: true,
  });

  const width = canvas3d.clientWidth || 640;
  const height = canvas3d.clientHeight || 480;

  renderer3d.setSize(width, height, false);

  scene3d = new THREE.Scene();
  scene3d.background = null;

  camera3d = new THREE.PerspectiveCamera(45, width / height, 0.1, 10);
  camera3d.position.z = 2;

  const light = new THREE.AmbientLight(0xffffff, 1);
  scene3d.add(light);

  glassesGroup = await loadGlassesModel();
  scene3d.add(glassesGroup);

  function loop() {
    requestAnimationFrame(loop);
    renderer3d.render(scene3d, camera3d);
  }
  loop();
}

// 2D overlay
function draw2D(landmarks) {
  const width = canvas2d.width;
  const height = canvas2d.height;

  const left = landmarks[33];
  const right = landmarks[263];

  const lx = (1 - left.x) * width;
  const ly = left.y * height;
  const rx = (1 - right.x) * width;
  const ry = right.y * height;

  const cx = (lx + rx) / 2;
  const cy = (ly + ry) / 2;

  const dx = rx - lx;
  const dy = ry - ly;

  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const w = dist * 2.4;
  const h = w / 2.5;

  ctx2d.clearRect(0, 0, width, height);

  ctx2d.save();
  ctx2d.translate(cx, cy);
  ctx2d.rotate(angle);
  ctx2d.drawImage(glassesImg, -w / 2, -h / 2, w, h);
  ctx2d.restore();
}

// 3D updates
function update3D(landmarks) {
  if (!glassesGroup) return;

  const left = landmarks[33];
  const right = landmarks[263];

  const lx = 1 - left.x;
  const ly = left.y;
  const rx = 1 - right.x;
  const ry = right.y;

  const cx = (lx + rx) / 2;
  const cy = (ly + ry) / 2;

  const dx = rx - lx;
  const dy = ry - ly;

  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const xWorld = (cx - 0.5) * 2;
  const yWorld = -(cy - 0.5) * 2;
  const zWorld = -0.8;

  glassesGroup.position.set(xWorld, yWorld, zWorld);
  glassesGroup.rotation.set(0, 0, -angle);

  const scale = dist * 4;
  glassesGroup.scale.set(scale, scale, scale);
}

// FaceLandmarker Loop
function renderLoop() {
  if (!faceLandmarker) return requestAnimationFrame(renderLoop);

  if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
    const nowMs = performance.now();
    const result = faceLandmarker.detectForVideo(video, nowMs);

    if (result.faceLandmarks?.length > 0) {
      const lm = result.faceLandmarks[0];

      if (currentMode === "2d") {
        draw2D(lm);
      } else {
        ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
        update3D(lm);
      }
    }
  }
  requestAnimationFrame(renderLoop);
}

// Init everything
async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });

  video.srcObject = stream;

  await new Promise((res) => {
    video.onloadedmetadata = () => {
      video.play();
      resizeCanvases();
      res();
    };
  });

  initThree();

  const resolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(resolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  renderLoop();
}

init();
