// Roomly - Ultra-Realistic Architectural 3D Room Landing Page
// Features:
// 1. Instant 3D Placeholders (0ms delay) + Seamless GLTF swap (no slow loading/empty room pop-in)
// 2. Real-life GLB models downloaded from Khronos: Velvet Sofa, Sheen Armchair, Botanical Plant, Silk Pouf, and Flower Vase
// 3. True Architectural Window with physical wall cutout, deep oak windowsill, aluminum casing, scenic outdoor landscape (Day/Evening), sheer linen drapes, and windowsill decor
// 4. 2 New Luxury Items: Silk Pouf Ottoman + Scandinavian Slatted Media Credenza with Fresh Flower Glass Vase
// 5. Clean walls with zero outside protrusion, smooth 360° orbit/zoom controls, warm Alabaster background, and Day/Evening lighting toggle

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ArrowRight, Sparkles, Move3D, Sun, Moon, Ruler, Box, CheckCircle2 } from 'lucide-react';
import { ROOM_PRESETS } from '../data/roomData';

// Global memory cache for loaded GLTF models (0ms delay when revisiting page)
const MODEL_CACHE = new Map();

// --- Procedural High-Res Hardwood Floor & Normal Maps ---

function createHardwoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#D8BDA0';
  ctx.fillRect(0, 0, 1024, 1024);

  const planks = 10;
  const plankH = 1024 / planks;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;

    // Subtle tone shift between adjacent planks
    const shift = (Math.sin(i * 3.1) * 0.04);
    ctx.fillStyle = shift > 0 ? `rgba(255, 248, 235, ${shift})` : `rgba(60, 40, 20, ${Math.abs(shift)})`;
    ctx.fillRect(0, y, 1024, plankH);

    // Deep plank bevel groove line
    ctx.strokeStyle = 'rgba(40, 25, 15, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    // Plank end joints (staggered seams)
    const sx1 = ((i * 390) % 650) + 150;
    const sx2 = sx1 + 460;
    [sx1, sx2].forEach(sx => {
      if (sx < 1024) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx, y + plankH);
        ctx.stroke();
      }
    });

    // Organic woodgrain fibers
    for (let g = 0; g < 24; g++) {
      ctx.strokeStyle = 'rgba(125, 90, 60, 0.2)';
      ctx.lineWidth = 0.8 + Math.random() * 0.8;
      const lineY = y + Math.random() * plankH;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(
        260, lineY + (Math.random() - 0.5) * 16,
        740, lineY + (Math.random() - 0.5) * 16,
        1024, lineY
      );
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createWoodNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, 512, 512);

  const planks = 10;
  const plankH = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    ctx.strokeStyle = 'rgb(128, 180, 255)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y - 1);
    ctx.lineTo(512, y - 1);
    ctx.stroke();

    ctx.strokeStyle = 'rgb(128, 76, 255)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 1);
    ctx.lineTo(512, y + 1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createWoolRugTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#E8E2D7';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(110, 95, 80, 0.15)';
  ctx.lineWidth = 2.2;
  for (let y = 0; y < 512; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(160, 140, 120, 0.35)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 498);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
  grad.addColorStop(0, 'rgba(20, 16, 12, 0.65)');
  grad.addColorStop(0.5, 'rgba(20, 16, 12, 0.28)');
  grad.addColorStop(1, 'rgba(20, 16, 12, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

// Procedural Outdoor Scenic Landscape (Sunny Day vs Sunset Evening)
function createOutdoorSceneryTexture(isEvening) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (isEvening) {
    // Evening Twilight & Sunset Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, '#151928');    // Deep twilight indigo
    sky.addColorStop(0.35, '#2D2845'); // Dusk purple
    sky.addColorStop(0.65, '#C45738'); // Sunset terracotta / ember
    sky.addColorStop(0.82, '#E88B48'); // Warm golden amber
    sky.addColorStop(1.0, '#FFC36B');  // Horizon glow
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 1024);

    // Warm sunset sun disc
    ctx.fillStyle = 'rgba(255, 230, 175, 0.45)';
    ctx.beginPath();
    ctx.arc(680, 680, 95, 0, Math.PI * 2);
    ctx.fill();

    // Soft dusk cloud bands
    ctx.fillStyle = 'rgba(65, 42, 58, 0.4)';
    for (let c = 0; c < 5; c++) {
      ctx.beginPath();
      ctx.ellipse(180 + c * 190, 320 + (c % 2) * 70, 160, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Silhouette Tree Canopy at Horizon
    ctx.fillStyle = '#111518';
    for (let t = 0; t < 20; t++) {
      const tx = (t * 58) - 30;
      const ty = 730 + Math.sin(t * 1.6) * 45;
      const tr = 50 + (t % 4) * 22;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ground level shadow
    ctx.fillRect(0, 800, 1024, 224);
  } else {
    // Fresh Natural Daylight Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, '#75A9DA');    // Crisp clear sky blue
    sky.addColorStop(0.45, '#A8D0F0'); // Soft daylight mid-sky
    sky.addColorStop(0.75, '#E0EFF8'); // Horizon haze
    sky.addColorStop(0.9, '#FAF6EE');  // Warm sun horizon
    sky.addColorStop(1.0, '#FFFDF8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 1024);

    // Warm Sun Flare Glow
    const sunGrad = ctx.createRadialGradient(720, 320, 20, 720, 320, 260);
    sunGrad.addColorStop(0, 'rgba(255, 252, 235, 0.85)');
    sunGrad.addColorStop(0.4, 'rgba(255, 245, 210, 0.35)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Soft Wispy Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let c = 0; c < 6; c++) {
      ctx.beginPath();
      ctx.ellipse(150 + c * 170, 250 + (c % 3) * 60, 140, 28, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 1: Distant soft-focus trees (cool olive / sage)
    ctx.fillStyle = '#6E947A';
    for (let t = 0; t < 16; t++) {
      const tx = t * 75 - 20;
      const ty = 700 + Math.sin(t * 1.8) * 40;
      const tr = 60 + (t % 3) * 20;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: Mid-ground lush botanical foliage (rich emerald forest green)
    ctx.fillStyle = '#3E6D48';
    for (let t = 0; t < 22; t++) {
      const tx = t * 52 - 30;
      const ty = 750 + Math.cos(t * 1.4) * 35;
      const tr = 50 + (t % 4) * 18;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 3: Sunlit leaf highlights (golden lime green)
    ctx.fillStyle = 'rgba(125, 175, 85, 0.65)';
    for (let t = 0; t < 28; t++) {
      const tx = t * 40;
      const ty = 735 + Math.sin(t * 2.1) * 30;
      const tr = 25 + (t % 3) * 15;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Garden lawn base
    ctx.fillStyle = '#2A4D33';
    ctx.fillRect(0, 830, 1024, 194);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural soft box helper for books and credenza
function createSoftBox(w, h, d, radius = 0.035, bevelSegments = 3) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const r = Math.min(radius, w * 0.25, h * 0.25);

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x + r, y);
  shape.quadraticCurveTo(x, y, x + r, y);

  const extrudeSettings = {
    steps: 1,
    depth: Math.max(0.01, d - r * 2),
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelOffset: 0,
    bevelSegments: bevelSegments
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

export default function WelcomePage({ onOpenStudio, onStart, onSelectRoomPreset }) {
  const mountRef = useRef(null);
  const [lightingMode, setLightingMode] = useState('day'); // 'day' or 'evening'
  const [assetsReady, setAssetsReady] = useState(false);

  // Cinematic Brand Intro Screen State (~3.2s smooth reveal, NO loading spinners)
  const [brandIntro, setBrandIntro] = useState(true);
  const [brandIntroFading, setBrandIntroFading] = useState(false);
  const modelsLoadedCountRef = useRef(0);

  const sceneElementsRef = useRef({
    scene: null,
    renderer: null,
    sun: null,
    ambient: null,
    lampPoint: null,
    windowSun: null,
    fill: null,
    sceneryMesh: null,
    sceneryDayTex: null,
    sceneryEveTex: null
  });

  const handleLaunchStudio = (preset = null) => {
    if (preset && onSelectRoomPreset) {
      onSelectRoomPreset(preset);
    } else if (onOpenStudio) {
      onOpenStudio();
    } else if (onStart) {
      onStart();
    }
  };

  // Toggle Day sunlight vs Evening golden hour
  const handleToggleLighting = (mode) => {
    setLightingMode(mode);
    const { scene, sun, ambient, lampPoint, windowSun, fill, sceneryMesh, sceneryDayTex, sceneryEveTex } = sceneElementsRef.current;
    if (!scene || !sun || !ambient || !lampPoint) return;

    if (mode === 'evening') {
      // Warm, moody velvet evening with golden floor lamp illumination
      scene.background.setHex(0x1F2328);
      scene.fog.color.setHex(0x1F2328);
      sun.color.setHex(0xDE8C56);
      sun.intensity = 0.6;
      sun.position.set(4.5, 3.8, 3.2);
      ambient.color.setHex(0x3E3430);
      ambient.intensity = 0.75;
      if (fill) {
        fill.color.setHex(0x3B4E5E);
        fill.intensity = 0.25;
      }
      if (windowSun) {
        windowSun.color.setHex(0xE06D3E);
        windowSun.intensity = 0.8;
      }
      lampPoint.intensity = 3.8; // Floor lamp shines bright and cozy
      if (sceneryMesh && sceneryEveTex) {
        sceneryMesh.material.map = sceneryEveTex;
        sceneryMesh.material.needsUpdate = true;
      }
    } else {
      // Warm, natural Scandinavian daytime with soft alabaster oatmeal backdrop
      scene.background.setHex(0xEFEBE3);
      scene.fog.color.setHex(0xEFEBE3);
      sun.color.setHex(0xFFF3DB);
      sun.intensity = 1.95;
      sun.position.set(6.2, 8.2, 5.0);
      ambient.color.setHex(0xFFFBF4);
      ambient.intensity = 1.25;
      if (fill) {
        fill.color.setHex(0xE5F0E8);
        fill.intensity = 0.6;
      }
      if (windowSun) {
        windowSun.color.setHex(0xFFE8C8);
        windowSun.intensity = 1.8;
      }
      lampPoint.intensity = 1.4;
      if (sceneryMesh && sceneryDayTex) {
        sceneryMesh.material.map = sceneryDayTex;
        sceneryMesh.material.needsUpdate = true;
      }
    }
  };

  // Cinematic Brand Intro Controller (~3.2s smooth reveal, NO loading spinners)
  useEffect(() => {
    const startTime = Date.now();
    const MIN_INTRO_MS = 3200; // ~3.2s lets the full typography reveal, shimmer, and dot ripple unfold
    const MAX_INTRO_MS = 4800; // 4.8s safety ceiling

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const count = modelsLoadedCountRef.current;

      const isTimeSatisfied = elapsed >= MIN_INTRO_MS;
      const isModelsDone = count >= 5;
      const isTimeout = elapsed >= MAX_INTRO_MS;

      if ((isTimeSatisfied && isModelsDone) || isTimeout) {
        clearInterval(timer);
        setAssetsReady(true);

        // Smooth cinematic blur & dissolve transition into the 3D room
        setBrandIntroFading(true);
        setTimeout(() => {
          setBrandIntro(false);
        }, 800);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- 1. Scene, Camera & WebGL Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EFEBE3');
    scene.fog = new THREE.FogExp2('#EFEBE3', 0.035);
    sceneElementsRef.current.scene = scene;

    const width = mount.clientWidth || 920;
    const height = mount.clientHeight || 560;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(5.8, 4.2, 6.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    sceneElementsRef.current.renderer = renderer;

    // --- 2. Smooth OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.target.set(0, 0.8, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 2.8;
    controls.maxDistance = 14;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;

    const stopAutoRotate = () => { controls.autoRotate = false; };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate);

    // --- 3. Warm Architectural Lighting Setup ---
    const ambientLight = new THREE.AmbientLight(0xFFFBF4, 1.25);
    scene.add(ambientLight);
    sceneElementsRef.current.ambient = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xFFF3DB, 1.95);
    sunLight.position.set(6.2, 8.2, 5.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -5.5;
    sunLight.shadow.camera.right = 5.5;
    sunLight.shadow.camera.top = 5.5;
    sunLight.shadow.camera.bottom = -5.5;
    scene.add(sunLight);
    sceneElementsRef.current.sun = sunLight;

    // Dedicated sunlight beam pouring in from the window on the West wall
    const windowSunLight = new THREE.DirectionalLight(0xFFE8C8, 1.8);
    windowSunLight.position.set(-6.5, 3.5, -0.4);
    windowSunLight.target.position.set(0, 0.5, 0.2);
    scene.add(windowSunLight);
    scene.add(windowSunLight.target);
    sceneElementsRef.current.windowSun = windowSunLight;

    const softFillLight = new THREE.DirectionalLight(0xE5F0E8, 0.6);
    softFillLight.position.set(-5, 4.5, -4);
    scene.add(softFillLight);
    sceneElementsRef.current.fill = softFillLight;

    // --- 4. Materials & Textures ---
    const floorWoodTex = createHardwoodTexture();
    const floorWoodNorm = createWoodNormalMap();
    const furnitureWoodTex = createHardwoodTexture();
    const rugTex = createWoolRugTexture();
    const contactShadowTex = createContactShadowTexture();
    const sceneryDayTex = createOutdoorSceneryTexture(false);
    const sceneryEveTex = createOutdoorSceneryTexture(true);

    sceneElementsRef.current.sceneryDayTex = sceneryDayTex;
    sceneElementsRef.current.sceneryEveTex = sceneryEveTex;

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorWoodTex,
      normalMap: floorWoodNorm,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.3,
      metalness: 0.04
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF5F0E8,
      roughness: 0.94
    });

    const woodMat = new THREE.MeshStandardMaterial({
      map: furnitureWoodTex,
      roughness: 0.42,
      metalness: 0.05
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xD4A86A,
      metalness: 0.92,
      roughness: 0.22
    });

    const blackSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1A1C1D,
      metalness: 0.85,
      roughness: 0.35
    });

    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.96
    });

    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false
    });

    // --- 5. Clean Architectural Room (Floor & 2 Walls with TRUE WINDOW CUTOUT) ---
    const roomW = 5.0;
    const roomD = 5.0;
    const wallH = 2.75;
    const wallThick = 0.14;

    // Hardwood Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // North Wall (Back) - Clean, solid architectural wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, wallH, wallThick), wallMat);
    backWall.position.set(0, wallH / 2, -roomD / 2 - wallThick / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // --- TRUE ARCHITECTURAL WINDOW WITH PHYSICAL WALL OPENING (Left / West Wall) ---
    // Window opening centered at z = -0.4, width = 1.8m (z from -1.3 to +0.5), height = 1.6m (y from 0.75 to 2.35)
    const winCenterZ = -0.4;
    const winW = 1.8;
    const winH = 1.6;
    const winSillY = 0.75;
    const winTopY = winSillY + winH; // 2.35m

    // 1. Lower Wall Segment below window sill
    const wallBelow = new THREE.Mesh(new THREE.BoxGeometry(wallThick, winSillY, roomD), wallMat);
    wallBelow.position.set(-roomW / 2 - wallThick / 2, winSillY / 2, 0);
    wallBelow.receiveShadow = true;
    scene.add(wallBelow);

    // 2. Upper Wall Segment above window header
    const topH = wallH - winTopY; // 0.40m
    const wallAbove = new THREE.Mesh(new THREE.BoxGeometry(wallThick, topH, roomD), wallMat);
    wallAbove.position.set(-roomW / 2 - wallThick / 2, winTopY + topH / 2, 0);
    wallAbove.receiveShadow = true;
    scene.add(wallAbove);

    // 3. Wall Segment Behind the Window (North section of West Wall)
    const backSecDepth = (winCenterZ - winW / 2) - (-roomD / 2); // (-1.3) - (-2.5) = 1.2m
    const wallLeftBack = new THREE.Mesh(new THREE.BoxGeometry(wallThick, winH, backSecDepth), wallMat);
    wallLeftBack.position.set(-roomW / 2 - wallThick / 2, winSillY + winH / 2, -roomD / 2 + backSecDepth / 2);
    wallLeftBack.receiveShadow = true;
    scene.add(wallLeftBack);

    // 4. Wall Segment In Front of the Window (South section of West Wall)
    const frontSecDepth = (roomD / 2) - (winCenterZ + winW / 2); // 2.5 - 0.5 = 2.0m
    const wallLeftFront = new THREE.Mesh(new THREE.BoxGeometry(wallThick, winH, frontSecDepth), wallMat);
    wallLeftFront.position.set(-roomW / 2 - wallThick / 2, winSillY + winH / 2, roomD / 2 - frontSecDepth / 2);
    wallLeftFront.receiveShadow = true;
    scene.add(wallLeftFront);

    // Architectural White Baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.45 });
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, 0.02), baseboardMat);
    bbBack.position.set(0, 0.05, -roomD / 2 + 0.01);
    scene.add(bbBack);

    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, roomD), baseboardMat);
    bbLeft.position.set(-roomW / 2 + 0.01, 0.05, 0);
    scene.add(bbLeft);

    // --- REALISTIC ARCHITECTURAL WINDOW ASSEMBLY ---
    const windowGroup = new THREE.Group();
    windowGroup.position.set(-roomW / 2, winSillY + winH / 2, winCenterZ);

    // Deep Natural Oak Windowsill Ledge (Projects 6cm into the room for authentic depth)
    const sillLedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, winW + 0.14),
      woodMat
    );
    sillLedge.position.set(0.05, -winH / 2 + 0.02, 0);
    sillLedge.castShadow = true;
    sillLedge.receiveShadow = true;
    windowGroup.add(sillLedge);

    // Outer Architectural Aluminum Frame (Matte Charcoal)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1E2124, metalness: 0.7, roughness: 0.35 });
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, winH, winW), frameMat);
    // Cut inside by forming jambs:
    // Left & Right Vertical Jambs
    [-winW / 2 + 0.025, winW / 2 - 0.025].forEach(jz => {
      const vertJamb = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, winH, 0.05), frameMat);
      vertJamb.position.set(-wallThick / 2, 0, jz);
      vertJamb.castShadow = true;
      windowGroup.add(vertJamb);
    });

    // Top Header & Bottom Frame
    [-winH / 2 + 0.025, winH / 2 - 0.025].forEach(jy => {
      const horizJamb = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.05, winW), frameMat);
      horizJamb.position.set(-wallThick / 2, jy, 0);
      horizJamb.castShadow = true;
      windowGroup.add(horizJamb);
    });

    // Center Vertical Mullion (Dual Sash Divide)
    const centerMullion = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.025, winH, 0.04), frameMat);
    centerMullion.position.set(-wallThick / 2, 0, 0);
    centerMullion.castShadow = true;
    windowGroup.add(centerMullion);

    // Horizontal Muntin Bars (Classic 4-pane French Casement)
    [-0.32, 0.32].forEach(hy => {
      const muntin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, winW - 0.1), frameMat);
      muntin.position.set(0.005, hy, 0);
      muntin.castShadow = true;
      windowGroup.add(muntin);
    });

    // Brushed Brass Sash Latches
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xCCA662, metalness: 0.9, roughness: 0.25 });
    [-0.2, 0.2].forEach(ly => {
      const latch = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 12), latchMat);
      latch.position.set(0.03, ly, 0.02);
      latch.rotation.z = Math.PI / 2;
      windowGroup.add(latch);
    });

    // Double-Pane Architectural Glass (Physical Material with true transmission and reflections)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xF2F7FB,
      transparent: true,
      opacity: 0.32,
      roughness: 0.04,
      transmission: 0.94,
      ior: 1.52,
      reflectivity: 0.65
    });
    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(winW - 0.08, winH - 0.08), glassMat);
    glassPane.position.set(0, 0, 0);
    glassPane.rotation.y = Math.PI / 2;
    windowGroup.add(glassPane);

    // Scenic Outdoor Backdrop Plane (Set right outside the glass within the wall opening footprint)
    const sceneryMat = new THREE.MeshBasicMaterial({
      map: sceneryDayTex,
      side: THREE.FrontSide
    });
    const sceneryMesh = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), sceneryMat);
    sceneryMesh.position.set(-wallThick - 0.005, 0, 0);
    sceneryMesh.rotation.y = Math.PI / 2;
    windowGroup.add(sceneryMesh);
    sceneElementsRef.current.sceneryMesh = sceneryMesh;

    // Decor on Windowsill Ledge: Ceramic Terracotta Succulent Pot & Candle
    const sillPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.032, 0.075, 16),
      new THREE.MeshStandardMaterial({ color: 0xC8785E, roughness: 0.6 })
    );
    sillPot.position.set(0.08, -winH / 2 + 0.078, 0.45);
    sillPot.castShadow = true;
    windowGroup.add(sillPot);

    const sillPlant = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x4A7856, roughness: 0.5 })
    );
    sillPlant.position.set(0.08, -winH / 2 + 0.125, 0.45);
    sillPlant.scale.set(1, 0.7, 1);
    sillPlant.castShadow = true;
    windowGroup.add(sillPlant);

    const sillCandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.4 })
    );
    sillCandle.position.set(0.08, -winH / 2 + 0.085, -0.45);
    sillCandle.castShadow = true;
    windowGroup.add(sillCandle);

    // Floor-to-Ceiling Luxury Sheer Linen Curtains
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x161819, metalness: 0.8, roughness: 0.3 });
    const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, winW + 0.5, 16), rodMat);
    curtainRod.position.set(0.12, winH / 2 + 0.14, 0);
    curtainRod.rotation.x = Math.PI / 2;
    curtainRod.castShadow = true;
    windowGroup.add(curtainRod);

    // Finials on Curtain Rod Ends
    [-1, 1].forEach(side => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.025, 14, 14), rodMat);
      finial.position.set(0.12, winH / 2 + 0.14, side * ((winW + 0.5) / 2 + 0.015));
      windowGroup.add(finial);
    });

    // Translucent Linen Drapes (Left and Right gathers framing the window)
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0xFBF9F5,
      roughness: 0.95,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide
    });

    [-1, 1].forEach(side => {
      const curtainGroup = new THREE.Group();
      curtainGroup.position.set(0.11, -0.15, side * (winW / 2 + 0.08));

      // 4 graceful vertical fabric folds
      for (let f = 0; f < 4; f++) {
        const fold = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.065, winH + 0.72, 12, 1, true, 0, Math.PI),
          curtainMat
        );
        fold.position.set(Math.sin(f * 0.8) * 0.02, 0, f * 0.05 * -side);
        fold.rotation.y = side > 0 ? 0 : Math.PI;
        fold.castShadow = true;
        curtainGroup.add(fold);
      }
      windowGroup.add(curtainGroup);
    });

    scene.add(windowGroup);

    // --- 6. Grounding Contact Shadows ---
    const sofaShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), contactShadowMat);
    sofaShadow.rotation.x = -Math.PI / 2;
    sofaShadow.position.set(0, 0.009, -0.65);
    scene.add(sofaShadow);

    const tableShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), contactShadowMat);
    tableShadow.rotation.x = -Math.PI / 2;
    tableShadow.position.set(0, 0.018, 0.48);
    scene.add(tableShadow);

    const chairShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), contactShadowMat);
    chairShadow.rotation.x = -Math.PI / 2;
    chairShadow.position.set(1.5, 0.018, 0.38);
    scene.add(chairShadow);

    const plantShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), contactShadowMat);
    plantShadow.rotation.x = -Math.PI / 2;
    plantShadow.position.set(-1.8, 0.009, -1.8);
    scene.add(plantShadow);

    const poufShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), contactShadowMat);
    poufShadow.rotation.x = -Math.PI / 2;
    poufShadow.position.set(-0.95, 0.018, 0.85);
    scene.add(poufShadow);

    const credenzaShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), contactShadowMat);
    credenzaShadow.rotation.x = -Math.PI / 2;
    credenzaShadow.position.set(1.65, 0.009, -2.15);
    scene.add(credenzaShadow);

    // Woven Wool Rug
    const rug = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.018, 2.3), rugMat);
    rug.position.set(0, 0.009, 0.22);
    rug.receiveShadow = true;
    scene.add(rug);

    // --- 7. Round Natural Oak Coffee Table with Tabletop Styling ---
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0.48);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.04, 48), woodMat);
    tableTop.position.set(0, 0.38, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.016, 0.38, 18), woodMat);
      leg.position.set(Math.cos(a) * 0.35, 0.19, Math.sin(a) * 0.35);
      leg.castShadow = true;
      tableGroup.add(leg);
    }

    // Architecture Hardcover Books
    const bookGeo1 = createSoftBox(0.25, 0.035, 0.18, 0.008, 2);
    const book1 = new THREE.Mesh(bookGeo1, new THREE.MeshStandardMaterial({ color: 0x466352, roughness: 0.6 }));
    book1.position.set(-0.11, 0.42, 0.02);
    book1.rotation.y = 0.14;
    book1.castShadow = true;
    tableGroup.add(book1);

    const bookGeo2 = createSoftBox(0.23, 0.03, 0.16, 0.008, 2);
    const book2 = new THREE.Mesh(bookGeo2, new THREE.MeshStandardMaterial({ color: 0xC8785E, roughness: 0.6 }));
    book2.position.set(-0.1, 0.455, 0.03);
    book2.rotation.y = -0.06;
    book2.castShadow = true;
    tableGroup.add(book2);

    // Ceramic Stoneware Coffee Mug
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.035, 0.08, 18),
      new THREE.MeshStandardMaterial({ color: 0xDCD5C9, roughness: 0.4 })
    );
    mug.position.set(0.12, 0.44, 0.16);
    mug.castShadow = true;
    tableGroup.add(mug);

    scene.add(tableGroup);

    // --- 8. Arched Brass Floor Lamp with Illuminating Light ---
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.75, 0, 0.85);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 28), brassMat);
    lampBase.position.set(0, 0.012, 0);
    lampBase.castShadow = true;
    lampGroup.add(lampBase);

    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.025, 0),
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(0.15, 1.6, 0),
      new THREE.Vector3(0.4, 1.7, 0)
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 24, 0.013, 16, false);
    const lampPole = new THREE.Mesh(archGeo, brassMat);
    lampPole.castShadow = true;
    lampGroup.add(lampPole);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.24, 0.26, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xFFF9EE, roughness: 0.5, side: THREE.DoubleSide })
    );
    lampShade.position.set(0.4, 1.55, 0);
    lampGroup.add(lampShade);

    const lampPoint = new THREE.PointLight(0xFFE5A8, 1.4, 5.0, 2);
    lampPoint.position.set(0.4, 1.52, 0);
    lampGroup.add(lampPoint);
    sceneElementsRef.current.lampPoint = lampPoint;

    scene.add(lampGroup);

    // --- 9. INSTANT PROCEDURAL 3D PLACEHOLDERS (0ms Delay - Room is 100% Furnished on Frame 0!) ---
    // User NEVER sees an empty room or waits for models to load.
    const placeholderSofa = new THREE.Group();
    placeholderSofa.position.set(0, 0, -0.65);
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0xE2D3C4, roughness: 0.65 });
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.42, 0.95), velvetMat);
    sofaSeat.position.set(0, 0.23, 0);
    sofaSeat.castShadow = true;
    placeholderSofa.add(sofaSeat);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.44, 0.22), velvetMat);
    sofaBack.position.set(0, 0.54, -0.36);
    sofaBack.castShadow = true;
    placeholderSofa.add(sofaBack);
    scene.add(placeholderSofa);

    const placeholderChair = new THREE.Group();
    placeholderChair.position.set(1.52, 0, 0.38);
    placeholderChair.rotation.y = -Math.PI / 4.2;
    const chairFabricMat = new THREE.MeshStandardMaterial({ color: 0xDDD4C7, roughness: 0.7 });
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.82), chairFabricMat);
    chairSeat.position.set(0, 0.34, 0);
    chairSeat.castShadow = true;
    placeholderChair.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.48, 0.16), chairFabricMat);
    chairBack.position.set(0, 0.62, -0.32);
    chairBack.castShadow = true;
    placeholderChair.add(chairBack);
    scene.add(placeholderChair);

    const placeholderPlant = new THREE.Group();
    placeholderPlant.position.set(-1.8, 0, -1.8);
    const plantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.48, 24),
      new THREE.MeshStandardMaterial({ color: 0xD47D62, roughness: 0.6 })
    );
    plantPot.position.set(0, 0.24, 0);
    plantPot.castShadow = true;
    placeholderPlant.add(plantPot);
    const plantFoliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0x3F6F4C, roughness: 0.6 })
    );
    plantFoliage.position.set(0, 0.68, 0);
    plantFoliage.scale.set(1, 1.25, 1);
    plantFoliage.castShadow = true;
    placeholderPlant.add(plantFoliage);
    scene.add(placeholderPlant);

    // Item 1 Placeholder: Silk Pouf Ottoman
    const placeholderPouf = new THREE.Group();
    placeholderPouf.position.set(-0.95, 0, 0.85);
    const poufMat = new THREE.MeshStandardMaterial({ color: 0xDCD3C4, roughness: 0.55 });
    const poufCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.34, 32), poufMat);
    poufCushion.position.set(0, 0.17, 0);
    poufCushion.castShadow = true;
    placeholderPouf.add(poufCushion);
    scene.add(placeholderPouf);

    // Item 2: Modern Scandinavian Slatted Media Credenza (Sideboard) along North Wall
    const credenzaGroup = new THREE.Group();
    credenzaGroup.position.set(1.65, 0, -2.15);

    const credBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.52, 0.44),
      woodMat
    );
    credBody.position.set(0, 0.42, 0);
    credBody.castShadow = true;
    credBody.receiveShadow = true;
    credenzaGroup.add(credBody);

    // Slatted vertical front doors
    for (let s = -0.68; s <= 0.68; s += 0.05) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.48, 0.015), blackSteelMat);
      slat.position.set(s, 0.42, 0.225);
      credenzaGroup.add(slat);
    }

    // 4 Minimalist Black Steel Legs
    [[-0.65, -0.16], [0.65, -0.16], [-0.65, 0.16], [0.65, 0.16]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.16, 12), blackSteelMat);
      leg.position.set(lx, 0.08, lz);
      leg.castShadow = true;
      credenzaGroup.add(leg);
    });

    // Art print framed on top of credenza leaning against back wall
    const artFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.48, 0.02),
      blackSteelMat
    );
    artFrame.position.set(0.35, 0.88, -0.12);
    artFrame.rotation.x = -0.06;
    artFrame.castShadow = true;
    credenzaGroup.add(artFrame);

    const artCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.9 })
    );
    artCanvas.position.set(0.35, 0.88, -0.108);
    artCanvas.rotation.x = -0.06;
    credenzaGroup.add(artCanvas);

    scene.add(credenzaGroup);

    // Placeholder Vase on top of Credenza
    const placeholderVase = new THREE.Group();
    placeholderVase.position.set(1.35, 0.68, -2.15);
    const vaseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.07, 0.28, 20),
      new THREE.MeshPhysicalMaterial({ color: 0xEEF5F8, transmission: 0.9, roughness: 0.1 })
    );
    placeholderVase.add(vaseMesh);
    scene.add(placeholderVase);

    // --- 10. High-Speed Pre-Cached GLTF Loading & In-Place Seamless Swap ---
    const gltfLoader = new GLTFLoader();

    // Auto-scale, center, ground, and enable soft shadows on loaded GLB models
    const fitAndPlace = (model, targetWidth, posX, posY, posZ, rotY = 0) => {
      model.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            node.material.roughness = Math.max(0.25, node.material.roughness || 0.6);
            node.material.envMapIntensity = 1.25;
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxH = Math.max(size.x, size.z);
      const scale = targetWidth / (maxH > 0 ? maxH : 1);
      model.scale.set(scale, scale, scale);

      box.setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());

      model.position.set(
        posX - center.x,
        posY - box.min.y,
        posZ - center.z
      );
      model.rotation.y = rotY;
      scene.add(model);
      return model;
    };

    let loadedCounter = 0;
    const checkAllLoaded = () => {
      loadedCounter++;
      modelsLoadedCountRef.current = loadedCounter;
      if (loadedCounter >= 5) {
        setAssetsReady(true);
      }
    };

    // Helper to load or retrieve from memory cache for instant revisit
    const loadCachedModel = (url, targetWidth, posX, posY, posZ, rotY, placeholderMesh) => {
      if (MODEL_CACHE.has(url)) {
        const cachedScene = MODEL_CACHE.get(url).clone();
        if (placeholderMesh && placeholderMesh.parent) {
          placeholderMesh.parent.remove(placeholderMesh);
        }
        fitAndPlace(cachedScene, targetWidth, posX, posY, posZ, rotY);
        checkAllLoaded();
        return;
      }

      gltfLoader.load(
        url,
        (gltf) => {
          MODEL_CACHE.set(url, gltf.scene);
          if (placeholderMesh && placeholderMesh.parent) {
            placeholderMesh.parent.remove(placeholderMesh);
          }
          fitAndPlace(gltf.scene, targetWidth, posX, posY, posZ, rotY);
          checkAllLoaded();
        },
        undefined,
        (err) => {
          console.warn(`Fallback active for ${url}:`, err);
          checkAllLoaded();
        }
      );
    };

    // Load All 5 Photorealistic 3D Models in Parallel
    loadCachedModel('/models/sofa.glb', 2.35, 0, 0, -0.65, 0, placeholderSofa);
    loadCachedModel('/models/chair.glb', 0.95, 1.52, 0, 0.38, -Math.PI / 4.2, placeholderChair);
    loadCachedModel('/models/plant.glb', 0.85, -1.8, 0, -1.8, 0, placeholderPlant);
    loadCachedModel('/models/pouf.glb', 0.72, -0.95, 0, 0.85, 0.3, placeholderPouf);
    loadCachedModel('/models/vase.glb', 0.32, 1.35, 0.68, -2.15, 0, placeholderVase);

    // --- 11. Animation Loop ---
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- 12. Window Resize Handler ---
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 13. Cleanup on Unmount ---
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', stopAutoRotate);
      cancelAnimationFrame(reqId);
      controls.dispose();
      renderer.dispose();
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`pure-landing-page ${lightingMode === 'evening' ? 'theme-evening' : 'theme-day'}`}>
      {/* Cinematic Brand Name Reveal Intro Sequence (No loading bars or spinners) */}
      {brandIntro && (
        <div className={`pure-brand-intro ${brandIntroFading ? 'fade-out' : ''}`}>
          <div className="brand-intro-glow" />

          <div className="brand-intro-content">
            <div className="brand-intro-kicker">
              <span>ARCHITECTURAL STUDIO</span>
            </div>

            <h1 className="brand-intro-title" aria-label="roomly.">
              <span className="char char-1">r</span>
              <span className="char char-2">o</span>
              <span className="char char-3">o</span>
              <span className="char char-4">m</span>
              <span className="char char-5">l</span>
              <span className="char char-6">y</span>
              <span className="char char-dot">
                <span className="dot-inner">.</span>
                <span className="dot-ripple" />
              </span>
            </h1>

            <div className="brand-intro-divider">
              <div className="divider-line" />
              <div className="divider-spark" />
            </div>

            <p className="brand-intro-subtitle">
              Design to scale · Experience in 3D
            </p>
          </div>

          <button
            type="button"
            className="brand-intro-skip"
            onClick={() => handleLaunchStudio()}
          >
            Skip directly to Studio →
          </button>
        </div>
      )}

      {/* Top Floating Branding */}
      <header className="pure-landing-header">
        <div className="pure-brand">
          roomly<span className="pure-dot">.</span>
        </div>

        <div className="pure-header-right">
          {/* Subtle 3D Asset Readiness Status */}
          <div className={`pure-assets-badge ${assetsReady ? 'ready' : 'loading'}`}>
            <Sparkles size={13} />
            <span>{assetsReady ? 'Realistic 3D Assets Active' : 'Loading Photorealistic 3D...'}</span>
          </div>

          {/* Interactive Day / Evening Lighting Switcher */}
          <div className="pure-light-switcher" title="Switch between Day sunlight and Evening golden hour">
            <button
              type="button"
              className={`light-switch-btn ${lightingMode === 'day' ? 'active' : ''}`}
              onClick={() => handleToggleLighting('day')}
            >
              <Sun size={13} />
              <span>Daylight</span>
            </button>
            <button
              type="button"
              className={`light-switch-btn ${lightingMode === 'evening' ? 'active' : ''}`}
              onClick={() => handleToggleLighting('evening')}
            >
              <Moon size={13} />
              <span>Evening</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 3D Canvas Showcase */}
      <div className="pure-3d-stage">
        {/* Interactive 3D Room Canvas */}
        <div ref={mountRef} className="pure-three-mount" />

        {/* Orbit & Zoom Interaction Hint */}
        <div className="pure-orbit-hint">
          <Move3D size={14} />
          <span>Click & drag to rotate 360° · Scroll to zoom</span>
        </div>

        {/* Hero Overlay: Title, 3 Key Features, The Single Big Button & Quick Starters */}
        <div className="pure-cta-overlay">
          <div className="pure-cta-text">
            <h1>Design your room to scale in 3D</h1>
            <p>Rotate and explore the realistic room preview. Plan your space with zero guesswork.</p>
          </div>

          {/* Three Architectural Highlights Badges */}
          <div className="pure-features-row">
            <span className="pure-feature-pill">
              <Ruler size={13} />
              <span>Real Scale Accuracy (cm & in)</span>
            </span>
            <span className="pure-feature-pill">
              <Box size={13} />
              <span>Photorealistic 3D Walk-in</span>
            </span>
            <span className="pure-feature-pill">
              <CheckCircle2 size={13} />
              <span>100% Free · No Sign-Up</span>
            </span>
          </div>

          {/* The Single Big Studio Launch Button */}
          <button
            type="button"
            className="pure-launch-btn"
            onClick={() => handleLaunchStudio()}
            title="Open Roomly 2D/3D Studio Planner"
          >
            <span>Launch Studio Planner</span>
            <ArrowRight size={18} />
          </button>

          {/* Quick Starter Room Shortcuts */}
          <div className="pure-starter-row">
            <span className="starter-row-label">Or jump straight into:</span>
            <div className="starter-buttons">
              <button
                type="button"
                className="starter-quick-btn"
                onClick={() => handleLaunchStudio(ROOM_PRESETS[0])}
                title="Launch Living Room Template"
              >
                🛋️ Living Room
              </button>
              <button
                type="button"
                className="starter-quick-btn"
                onClick={() => handleLaunchStudio(ROOM_PRESETS[1])}
                title="Launch Bedroom Template"
              >
                🛏️ Bedroom
              </button>
              <button
                type="button"
                className="starter-quick-btn"
                onClick={() => handleLaunchStudio(ROOM_PRESETS[2])}
                title="Launch Home Office Template"
              >
                💼 Home Office
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
