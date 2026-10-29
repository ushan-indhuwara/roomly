// Roomly - High-Performance Ultra-Realistic 3D Room Studio
// Features: Cached procedural textures, 60 FPS floor dragging, instant raycast selection,
// optimized shadow maps, smooth OrbitControls, clean UI (no obstructive floating cards)

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CATALOG, MATERIALS } from '../data/roomData';
import { Sun, Moon, Eye, Compass, Box, Layers } from 'lucide-react';

// --- Global Texture and Material Cache to prevent memory leaks and stutter ---
const textureCache = new Map();
const materialCache = new Map();

function getCachedWoodTexture(baseColor = '#D4B595', grainColor = '#B89775') {
  const key = `wood_${baseColor}_${grainColor}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  const numPlanks = 6;
  const plankH = 512 / numPlanks;
  for (let i = 0; i < numPlanks; i++) {
    const y = i * plankH;
    ctx.strokeStyle = 'rgba(60, 40, 25, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    ctx.strokeStyle = grainColor;
    ctx.lineWidth = 1;
    for (let g = 0; g < 20; g++) {
      ctx.beginPath();
      ctx.globalAlpha = 0.12 + Math.random() * 0.15;
      const lineY = y + Math.random() * plankH;
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(
        150, lineY + (Math.random() - 0.5) * 8,
        350, lineY + (Math.random() - 0.5) * 8,
        512, lineY
      );
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(key, texture);
  return texture;
}

function getCachedFabricTexture(baseHex = '#F4EFEA') {
  const key = `fabric_${baseHex}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let x = 0; x < 256; x += 4) {
    ctx.fillRect(x, 0, 2, 256);
  }
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  for (let i = 0; i < 800; i++) {
    const nx = Math.random() * 256;
    const ny = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(nx, ny, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache.set(key, texture);
  return texture;
}

function getCachedTileTexture() {
  const key = 'tile_terrazzo';
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#EBE7DF';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#D1CBC1';
  ctx.lineWidth = 3;
  const tileSize = 64;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  textureCache.set(key, texture);
  return texture;
}

// Procedural Soft Beveled Rounded Box Geometry
// Replaces razor-sharp box corners with organic pillowy edges, bevels, and smooth curves
function createSoftBox(w, h, d, radius = 0.03, bevelSegments = 3) {
  const maxR = Math.min(w / 2 - 0.005, d / 2 - 0.005);
  const r = Math.min(Math.max(radius, 0.004), maxR > 0.004 ? maxR : 0.004);
  const hw = Math.max(0.001, w / 2 - r);
  const hd = Math.max(0.001, d / 2 - r);

  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd - r);
  shape.lineTo(hw, -hd - r);
  shape.quadraticCurveTo(hw + r, -hd - r, hw + r, -hd);
  shape.lineTo(hw + r, hd);
  shape.quadraticCurveTo(hw + r, hd + r, hw, hd + r);
  shape.lineTo(-hw, hd + r);
  shape.quadraticCurveTo(-hw - r, hd + r, -hw - r, hd);
  shape.lineTo(-hw - r, -hd);
  shape.quadraticCurveTo(-hw - r, -hd - r, -hw, -hd - r);

  const bevelSize = Math.min(r * 0.45, Math.min(h / 3.2, 0.025));
  const extrudeDepth = Math.max(0.004, h - bevelSize * 2);

  const extrudeSettings = {
    depth: extrudeDepth,
    bevelEnabled: bevelSize > 0.001,
    bevelSegments: bevelSegments,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  geo.rotateX(Math.PI / 2);
  return geo;
}

// Procedural Scenic Outdoor Window Backdrop Texture (Day & Evening Garden Sky)
function getCachedWindowSceneryTexture(isEvening = false) {
  const key = `window_scenery_${isEvening ? 'evening' : 'day'}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!isEvening) {
    // Crisp natural daylight sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, '#5C9CE6');
    skyGrad.addColorStop(0.55, '#A0C8F0');
    skyGrad.addColorStop(1, '#E8F2FC');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Warm sun glow in upper corner
    const sunGrad = ctx.createRadialGradient(390, 90, 10, 390, 90, 160);
    sunGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
    sunGrad.addColorStop(0.35, 'rgba(255, 245, 200, 0.45)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(390, 90, 160, 0, Math.PI * 2);
    ctx.fill();

    // Soft cumulus clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    [[80, 140, 60, 24], [180, 110, 80, 30], [310, 160, 70, 26]].forEach(([cx, cy, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Distant mountain / tree silhouette
    ctx.fillStyle = '#8CA392';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    for (let x = 0; x <= 512; x += 32) {
      const y = 330 + Math.sin(x * 0.02) * 16 + Math.cos(x * 0.05) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(512, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Midground rich lush garden foliage & trees
    const treeGreens = ['#2E5A36', '#3D7347', '#4E8A58', '#6DA776', '#264A2D'];
    for (let i = 0; i < 24; i++) {
      const tx = (i / 24) * 540 - 15;
      const ty = 370 + ((i % 5) * 12);
      const tr = 34 + (i % 4) * 10;
      ctx.fillStyle = treeGreens[i % treeGreens.length];
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Foreground sunny lawn and garden flowers
    const groundGrad = ctx.createLinearGradient(0, 420, 0, 512);
    groundGrad.addColorStop(0, '#5A8F4E');
    groundGrad.addColorStop(1, '#3B6632');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 420, 512, 92);

    // Dappled sunlight specs
    for (let s = 0; s < 45; s++) {
      ctx.fillStyle = s % 2 === 0 ? 'rgba(255, 240, 180, 0.4)' : 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc((s * 37) % 512, 380 + (s * 19) % 120, 2 + (s % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Twilight / Sunset sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#1E2548');
    skyGrad.addColorStop(0.5, '#563D6C');
    skyGrad.addColorStop(0.85, '#D46A4A');
    skyGrad.addColorStop(1, '#F3A358');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Warm sunset horizon glow
    const sunGrad = ctx.createRadialGradient(256, 380, 10, 256, 380, 220);
    sunGrad.addColorStop(0, 'rgba(255, 210, 140, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(235, 120, 70, 0.5)');
    sunGrad.addColorStop(1, 'rgba(30, 20, 50, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(256, 380, 220, 0, Math.PI * 2);
    ctx.fill();

    // Silhouetted tree crowns at dusk
    ctx.fillStyle = '#171B26';
    for (let i = 0; i < 22; i++) {
      const tx = (i / 22) * 540 - 15;
      const ty = 390 + ((i % 4) * 10);
      const tr = 32 + (i % 3) * 12;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(0, 430, 512, 82);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

export default function Planner3D({
  room,
  selectedId,
  onSelectItem,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const furnitureGroupRef = useRef(null);
  const architectureGroupRef = useRef(null);
  const selectionOutlineRef = useRef(null);

  const [showAllWalls, setShowAllWalls] = useState(false);
  const [cameraMode, setCameraMode] = useState('orbit');
  const [timeOfDay, setTimeOfDay] = useState('day');

  const sunLightRef = useRef(null);
  const hemiLightRef = useRef(null);

  const getItemElevation = (it) => {
    if (it.elevation !== undefined) return it.elevation;
    if (it.type?.startsWith('tv')) return 54;
    if (it.type?.startsWith('window')) return 85;
    if (it.type?.startsWith('door')) return 0;
    return 0;
  };

  // Raycasting & Dragging State
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const floorPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragPlaneIntersectRef = useRef(new THREE.Vector3());
  const isDraggingItemRef = useRef(false);
  const draggedItemOffsetRef = useRef({ x: 0, z: 0 });
  const activeDragIdRef = useRef(null);
  const currentDragCoordsRef = useRef({ x: 0, y: 0 });

  // Keep track of room items structure to avoid unnecessary full rebuilds
  const itemsSignatureRef = useRef('');

  // Selected item reference
  const selectedItem = room?.items?.find(it => it.id === selectedId);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5F2EB);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set((room.width / 100) * 1.1, 4.2, (room.length / 100) * 1.3);
    cameraRef.current = camera;

    // 3. Renderer with high performance settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 1.6;
    controls.maxDistance = 16;
    controlsRef.current = controls;

    // 5. Optimized Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xFFF9EE, 0xD4C8B8, 0.7);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xFFF4E0, 1.35);
    sunLight.position.set((room.width / 100) * 1.2, 7.5, (room.length / 100) * 0.8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 22;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const windowLight = new THREE.DirectionalLight(0xDCEEFF, 0.35);
    windowLight.position.set(room.width / 200, 3, -1);
    scene.add(windowLight);

    // 6. Architecture & Furniture Groups
    const archGroup = new THREE.Group();
    archGroup.name = 'architectureGroup';
    scene.add(archGroup);
    architectureGroupRef.current = archGroup;

    const furnitureGroup = new THREE.Group();
    furnitureGroup.name = 'furnitureGroup';
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    // Selection Ring
    const selRingGeo = new THREE.RingGeometry(0.18, 0.24, 32);
    selRingGeo.rotateX(-Math.PI / 2);
    const selRingMat = new THREE.MeshBasicMaterial({ color: 0x466352, side: THREE.DoubleSide });
    const selRing = new THREE.Mesh(selRingGeo, selRingMat);
    selRing.visible = false;
    scene.add(selRing);
    selectionOutlineRef.current = selRing;

    // Initial build
    buildArchitecture(room, archGroup, showAllWalls);
    rebuildFurniture(room, furnitureGroup);

    // 7. Smooth Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // Update room architecture when room dimensions, finishes, wall visibility, or fixtures change
  const fixturesHash = (room?.items || [])
    .filter(it => it.type?.startsWith('door') || it.type?.startsWith('window'))
    .map(it => `${it.id}:${Math.round(it.x)}:${Math.round(it.y)}:${Math.round(it.w)}:${Math.round(it.d)}:${it.rot || 0}:${it.elevation || 0}`)
    .join('|');

  useEffect(() => {
    if (!architectureGroupRef.current || !room) return;
    buildArchitecture(room, architectureGroupRef.current, showAllWalls);
  }, [room?.width, room?.length, room?.height, room?.floorType, room?.floorColor, room?.wallColor, room?.id, showAllWalls, fixturesHash]);

  // Dynamic day/evening lighting update
  useEffect(() => {
    if (!sceneRef.current || !sunLightRef.current || !hemiLightRef.current) return;
    if (timeOfDay === 'evening') {
      sceneRef.current.background = new THREE.Color(0x232026);
      sunLightRef.current.color.setHex(0xFFA255);
      sunLightRef.current.intensity = 1.45;
      hemiLightRef.current.color.setHex(0x9E9BB8);
      hemiLightRef.current.groundColor.setHex(0x523C32);
      hemiLightRef.current.intensity = 0.55;
    } else {
      sceneRef.current.background = new THREE.Color(0xF5F2EB);
      sunLightRef.current.color.setHex(0xFFF4E0);
      sunLightRef.current.intensity = 1.35;
      hemiLightRef.current.color.setHex(0xFFF9EE);
      hemiLightRef.current.groundColor.setHex(0xD4C8B8);
      hemiLightRef.current.intensity = 0.7;
    }
  }, [timeOfDay]);

  // Smart Furniture Updates: only rebuild full 3D meshes if items were added/removed/type/material changed
  useEffect(() => {
    if (!furnitureGroupRef.current || !room?.items) return;

    // Create signature to detect structural changes (including elevation, mounting & lighting mode)
    const sig = room.items.map(it => `${it.id}:${it.type}:${it.material}:${it.w}:${it.d}:${it.elevation}:${it.mountType}`).join('|') + `:${timeOfDay}`;

    if (sig !== itemsSignatureRef.current) {
      itemsSignatureRef.current = sig;
      rebuildFurniture(room, furnitureGroupRef.current);
    } else {
      // Fast path: just update positions and rotations in O(1) time without rebuilding meshes!
      const rw = room.width / 100;
      const rl = room.length / 100;
      room.items.forEach(it => {
        const meshGroup = furnitureGroupRef.current.children.find(c => c.userData?.itemId === it.id);
        if (meshGroup) {
          const isFixture = it.type?.startsWith('door') || it.type?.startsWith('window');
          const elevY = getItemElevation(it) / 100;
          if (isFixture) {
            const cx = (it.x + it.w / 2) / 100;
            const cz = (it.y + it.d / 2) / 100;
            const distN = cz;
            const distS = rl - cz;
            const distW = cx;
            const distE = rw - cx;
            const minD = Math.min(distN, distS, distW, distE);
            if (minD === distS) {
              meshGroup.position.set(cx, elevY, rl);
              meshGroup.rotation.y = Math.PI;
            } else if (minD === distW) {
              meshGroup.position.set(0, elevY, cz);
              meshGroup.rotation.y = -Math.PI / 2;
            } else if (minD === distE) {
              meshGroup.position.set(rw, elevY, cz);
              meshGroup.rotation.y = Math.PI / 2;
            } else {
              meshGroup.position.set(cx, elevY, 0);
              meshGroup.rotation.y = 0;
            }
          } else {
            const posX = (it.x + it.w / 2) / 100;
            const posZ = (it.y + it.d / 2) / 100;
            meshGroup.position.set(posX, elevY, posZ);
            meshGroup.rotation.y = -((it.rot || 0) * Math.PI) / 180;
          }
        }
      });
    }
  }, [room?.items, timeOfDay]);

  // Update Selection Highlight Ring on Floor
  useEffect(() => {
    if (!selectionOutlineRef.current || !selectedItem) {
      if (selectionOutlineRef.current) selectionOutlineRef.current.visible = false;
      return;
    }
    const ring = selectionOutlineRef.current;
    const cx = (selectedItem.x + selectedItem.w / 2) / 100;
    const cz = (selectedItem.y + selectedItem.d / 2) / 100;
    const radius = (Math.max(selectedItem.w, selectedItem.d) / 200) * 1.15;

    ring.position.set(cx, 0.015, cz);
    ring.scale.set(radius / 0.24, radius / 0.24, radius / 0.24);
    ring.visible = true;
  }, [selectedItem]);

  // Camera Presets
  const setCameraPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current || !room) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const cx = room.width / 200;
    const cz = room.length / 200;
    controls.target.set(cx, 0.75, cz);

    if (preset === 'orbit') {
      camera.position.set(cx + (room.width / 100) * 0.9, 3.8, cz + (room.length / 100) * 1.15);
    } else if (preset === 'iso') {
      camera.position.set(cx + (room.width / 100) * 1.35, 4.8, cz + (room.length / 100) * 1.35);
    } else if (preset === 'top') {
      camera.position.set(cx, 7.8, cz + 0.01);
    } else if (preset === 'walk') {
      camera.position.set(cx, 1.45, cz + (room.length / 100) * 0.6);
    }
    controls.update();
    setCameraMode(preset);
  };

  // --- Click & Drag Raycasting Logic with 60 FPS Floor Snapping ---

  const handlePointerDown = (e) => {
    if (e.button !== 0 || !mountRef.current || !cameraRef.current || !furnitureGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(furnitureGroupRef.current.children, true);

    if (intersects.length > 0) {
      let topItem = intersects[0].object;
      while (topItem.parent && topItem.parent !== furnitureGroupRef.current) {
        topItem = topItem.parent;
      }

      if (topItem.userData && topItem.userData.itemId) {
        const clickedId = topItem.userData.itemId;
        onSelectItem(clickedId);

        // Prepare 3D floor drag
        raycasterRef.current.ray.intersectPlane(floorPlaneRef.current, dragPlaneIntersectRef.current);
        const itemData = room.items.find(x => x.id === clickedId);
        if (itemData) {
          isDraggingItemRef.current = true;
          activeDragIdRef.current = clickedId;
          draggedItemOffsetRef.current = {
            x: dragPlaneIntersectRef.current.x - (itemData.x + itemData.w / 2) / 100,
            z: dragPlaneIntersectRef.current.z - (itemData.y + itemData.d / 2) / 100
          };
          currentDragCoordsRef.current = { x: itemData.x, y: itemData.y };
          if (controlsRef.current) controlsRef.current.enabled = false;
        }
        return;
      }
    }

    // Clicked empty space
    onSelectItem(null);
  };

  const handlePointerMove = (e) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Real-Time 3D Dragging: direct mesh transform update (60 FPS, zero lag)
    if (isDraggingItemRef.current && activeDragIdRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      if (raycasterRef.current.ray.intersectPlane(floorPlaneRef.current, dragPlaneIntersectRef.current)) {
        const item = room.items.find(x => x.id === activeDragIdRef.current);
        if (item) {
          const isFixture = item.type?.startsWith('door') || item.type?.startsWith('window');
          if (isFixture) {
            const rawX = (dragPlaneIntersectRef.current.x - draggedItemOffsetRef.current.x) * 100;
            const rawZ = (dragPlaneIntersectRef.current.z - draggedItemOffsetRef.current.z) * 100;
            const L = Math.max(item.w, item.d);
            const T = 16;
            const curCx = rawX + item.w / 2;
            const curCz = rawZ + item.d / 2;

            const distN = curCz;
            const distS = room.length - curCz;
            const distW = curCx;
            const distE = room.width - curCx;
            const minD = Math.min(distN, distS, distW, distE);

            let snappedX, snappedY, snappedW, snappedD, wallName;
            if (minD === distS) {
              wallName = 'south';
              snappedW = L;
              snappedD = T;
              snappedX = Math.round(Math.max(0, Math.min(room.width - L, curCx - L / 2)));
              snappedY = Math.round(room.length - T);
            } else if (minD === distW) {
              wallName = 'west';
              snappedW = T;
              snappedD = L;
              snappedX = 0;
              snappedY = Math.round(Math.max(0, Math.min(room.length - L, curCz - L / 2)));
            } else if (minD === distE) {
              wallName = 'east';
              snappedW = T;
              snappedD = L;
              snappedX = Math.round(room.width - T);
              snappedY = Math.round(Math.max(0, Math.min(room.length - L, curCz - L / 2)));
            } else {
              wallName = 'north';
              snappedW = L;
              snappedD = T;
              snappedX = Math.round(Math.max(0, Math.min(room.width - L, curCx - L / 2)));
              snappedY = 0;
            }

            currentDragCoordsRef.current = {
              x: snappedX,
              y: snappedY,
              w: snappedW,
              d: snappedD,
              rot: 0
            };

            const meshGroup = furnitureGroupRef.current.children.find(c => c.userData?.itemId === item.id);
            if (meshGroup) {
              const elevY = getItemElevation(item) / 100;
              const mcx = (snappedX + snappedW / 2) / 100;
              const mcz = (snappedY + snappedD / 2) / 100;
              if (wallName === 'south') {
                meshGroup.position.set(mcx, elevY, room.length / 100);
                meshGroup.rotation.y = Math.PI;
              } else if (wallName === 'west') {
                meshGroup.position.set(0, elevY, mcz);
                meshGroup.rotation.y = -Math.PI / 2;
              } else if (wallName === 'east') {
                meshGroup.position.set(room.width / 100, elevY, mcz);
                meshGroup.rotation.y = Math.PI / 2;
              } else {
                meshGroup.position.set(mcx, elevY, 0);
                meshGroup.rotation.y = 0;
              }
            }

            if (selectionOutlineRef.current) {
              selectionOutlineRef.current.position.set((snappedX + snappedW / 2) / 100, 0.015, (snappedY + snappedD / 2) / 100);
            }
            return;
          }

          const newCenterX = (dragPlaneIntersectRef.current.x - draggedItemOffsetRef.current.x) * 100;
          const newCenterZ = (dragPlaneIntersectRef.current.z - draggedItemOffsetRef.current.z) * 100;

          const rad = ((item.rot || 0) * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rad));
          const sin = Math.abs(Math.sin(rad));
          const bbW = item.w * cos + item.d * sin;
          const bbH = item.w * sin + item.d * cos;

          const minCx = bbW / 2;
          const maxCx = room.width - bbW / 2;
          const minCy = bbH / 2;
          const maxCy = room.length - bbH / 2;

          const clampedCx = Math.max(minCx, Math.min(maxCx, newCenterX));
          const clampedCy = Math.max(minCy, Math.min(maxCy, newCenterZ));

          const newX = Math.round(clampedCx - item.w / 2);
          const newY = Math.round(clampedCy - item.d / 2);

          currentDragCoordsRef.current = { x: newX, y: newY };

          // Directly transform the Three.js mesh group
          const meshGroup = furnitureGroupRef.current.children.find(c => c.userData?.itemId === item.id);
          if (meshGroup) {
            const elevY = getItemElevation(item) / 100;
            meshGroup.position.set((newX + item.w / 2) / 100, elevY, (newY + item.d / 2) / 100);
          }

          // Directly transform the selection ring
          if (selectionOutlineRef.current) {
            selectionOutlineRef.current.position.set((newX + item.w / 2) / 100, 0.015, (newY + item.d / 2) / 100);
          }
        }
      }
      return;
    }

    // Hover cursor styling
    if (furnitureGroupRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObjects(furnitureGroupRef.current.children, true);
      mountRef.current.style.cursor = hits.length > 0 ? 'grab' : 'default';
    }
  };

  const handlePointerUp = () => {
    if (isDraggingItemRef.current && activeDragIdRef.current) {
      const updateData = currentDragCoordsRef.current;
      onUpdateItem(activeDragIdRef.current, updateData);

      const item = room.items.find(x => x.id === activeDragIdRef.current);
      if (item && (item.type?.startsWith('door') || item.type?.startsWith('window')) && architectureGroupRef.current) {
        const updatedItems = room.items.map(it => it.id === activeDragIdRef.current ? { ...it, ...updateData } : it);
        buildArchitecture({ ...room, items: updatedItems }, architectureGroupRef.current, showAllWalls);
      }
    }

    isDraggingItemRef.current = false;
    activeDragIdRef.current = null;
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  // --- Scene Architecture Builder ---

  const buildArchitecture = (curRoom, group, allWalls = false) => {
    while (group.children.length > 0) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
    }

    const rw = curRoom.width / 100;
    const rl = curRoom.length / 100;
    const rh = (curRoom.height || 260) / 100;
    const wt = 0.12;

    // Floor with cached texture or color
    let floorTexture;
    if (curRoom.floorType === 'tile_terrazzo' || curRoom.floorType === 'tile_cream') {
      floorTexture = getCachedTileTexture();
    } else if (curRoom.floorType === 'wood_walnut') {
      floorTexture = getCachedWoodTexture('#5E4432', '#3D2A1D');
    } else if (curRoom.floorType === 'wood_pine') {
      floorTexture = getCachedWoodTexture('#DFCEB9', '#BFA992');
    } else {
      floorTexture = getCachedWoodTexture('#C49C72', '#8C6B4B');
    }

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: curRoom.floorColor ? new THREE.Color(curRoom.floorColor) : 0xFFFFFF,
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, rl), floorMat);
    floor.position.set(rw / 2, -0.04, rl / 2);
    floor.receiveShadow = true;
    group.add(floor);

    // Dynamic Wall Openings Detection
    const openings = {
      north: [],
      south: [],
      west: [],
      east: []
    };

    const items = curRoom.items || [];
    const interactiveFixtures = items.filter(it => it.type?.startsWith('door') || it.type?.startsWith('window'));

    interactiveFixtures.forEach(it => {
      const isDoor = it.type?.startsWith('door');
      const isWindow = it.type?.startsWith('window');

      const cx = (it.x + it.w / 2) / 100;
      const cz = (it.y + it.d / 2) / 100;
      const fixtureLen = Math.max(it.w, it.d) / 100;

      // Distance to 4 walls
      const distNorth = cz;
      const distSouth = rl - cz;
      const distWest = cx;
      const distEast = rw - cx;

      const minDist = Math.min(distNorth, distSouth, distWest, distEast);

      let wallName = 'north';
      let start = 0;
      let end = 0;

      if (minDist === distSouth) {
        wallName = 'south';
        start = Math.max(0, cx - fixtureLen / 2);
        end = Math.min(rw, cx + fixtureLen / 2);
      } else if (minDist === distWest) {
        wallName = 'west';
        start = Math.max(0, cz - fixtureLen / 2);
        end = Math.min(rl, cz + fixtureLen / 2);
      } else if (minDist === distEast) {
        wallName = 'east';
        start = Math.max(0, cz - fixtureLen / 2);
        end = Math.min(rl, cz + fixtureLen / 2);
      } else {
        wallName = 'north';
        start = Math.max(0, cx - fixtureLen / 2);
        end = Math.min(rw, cx + fixtureLen / 2);
      }

      let bottomY = 0;
      let topY = rh;

      if (isDoor) {
        bottomY = 0;
        topY = Math.min(rh, (it.h || 210) / 100);
      } else if (isWindow) {
        bottomY = (it.elevation !== undefined ? it.elevation : 85) / 100;
        const winH = (it.h || 140) / 100;
        topY = Math.min(rh, bottomY + winH);
      }

      openings[wallName].push({
        id: it.id,
        isDoor,
        isWindow,
        start,
        end,
        bottomY,
        topY
      });
    });

    // Zero legacy fallbacks: walls without an interactive fixture are completely solid with no ghost holes!

    // Walls material
    const wallColor = curRoom.wallColor || '#F7F4EC';
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallColor),
      roughness: 0.88,
      side: THREE.DoubleSide
    });

    // --- Helper to build a wall with exact dynamic openings ---
    const buildSegmentedWall = (wallName, wallLen, wallH, openingsList) => {
      const isNorth = wallName === 'north';
      const isSouth = wallName === 'south';
      const isWest = wallName === 'west';
      const isEast = wallName === 'east';

      if (!openingsList || openingsList.length === 0) {
        // Solid wall
        if (isNorth) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallLen + wt * 2, wallH, wt), wallMat);
          mesh.position.set(wallLen / 2, wallH / 2, -wt / 2);
          mesh.receiveShadow = true;
          group.add(mesh);
        } else if (isSouth) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallLen + wt * 2, wallH, wt), wallMat);
          mesh.position.set(wallLen / 2, wallH / 2, rl + wt / 2);
          mesh.receiveShadow = true;
          group.add(mesh);
        } else if (isWest) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(wt, wallH, wallLen), wallMat);
          mesh.position.set(-wt / 2, wallH / 2, wallLen / 2);
          mesh.receiveShadow = true;
          group.add(mesh);
        } else if (isEast) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(wt, wallH, wallLen), wallMat);
          mesh.position.set(rw + wt / 2, wallH / 2, wallLen / 2);
          mesh.receiveShadow = true;
          group.add(mesh);
        }
        return;
      }

      // Sort openings from 0 to wallLen
      const sorted = [...openingsList].sort((a, b) => a.start - b.start);
      let cursor = 0;

      sorted.forEach((op, idx) => {
        // 1. Solid segment before this opening
        if (op.start > cursor + 0.02) {
          const segLen = op.start - cursor;
          if (isNorth || isSouth) {
            const extraLeft = cursor === 0 ? wt : 0;
            const extraRight = idx === sorted.length - 1 && op.end >= wallLen - 0.02 ? wt : 0;
            const segW = segLen + extraLeft + extraRight;
            const posX = cursor + segLen / 2 + (extraRight - extraLeft) / 2;
            const posZ = isNorth ? -wt / 2 : (rl + wt / 2);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(segW, wallH, wt), wallMat);
            mesh.position.set(posX, wallH / 2, posZ);
            mesh.receiveShadow = true;
            group.add(mesh);
          } else {
            const posZ = cursor + segLen / 2;
            const posX = isWest ? -wt / 2 : (rw + wt / 2);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(wt, wallH, segLen), wallMat);
            mesh.position.set(posX, wallH / 2, posZ);
            mesh.receiveShadow = true;
            group.add(mesh);
          }
        }

        // 2. Transom Header above opening
        const openSpan = op.end - op.start;
        const headerH = Math.max(0, wallH - op.topY);
        if (headerH > 0.03 && openSpan > 0.03) {
          const headerY = op.topY + headerH / 2;
          if (isNorth || isSouth) {
            const posX = op.start + openSpan / 2;
            const posZ = isNorth ? -wt / 2 : (rl + wt / 2);
            const header = new THREE.Mesh(new THREE.BoxGeometry(openSpan, headerH, wt), wallMat);
            header.position.set(posX, headerY, posZ);
            header.receiveShadow = true;
            group.add(header);
          } else {
            const posZ = op.start + openSpan / 2;
            const posX = isWest ? -wt / 2 : (rw + wt / 2);
            const header = new THREE.Mesh(new THREE.BoxGeometry(wt, headerH, openSpan), wallMat);
            header.position.set(posX, headerY, posZ);
            header.receiveShadow = true;
            group.add(header);
          }
        }

        // 3. Sill segment below window opening (if not a floor door)
        if (op.bottomY > 0.03 && openSpan > 0.03) {
          const sillH = Math.min(wallH, op.bottomY);
          const sillY = sillH / 2;
          if (isNorth || isSouth) {
            const posX = op.start + openSpan / 2;
            const posZ = isNorth ? -wt / 2 : (rl + wt / 2);
            const sill = new THREE.Mesh(new THREE.BoxGeometry(openSpan, sillH, wt), wallMat);
            sill.position.set(posX, sillY, posZ);
            sill.receiveShadow = true;
            group.add(sill);
          } else {
            const posZ = op.start + openSpan / 2;
            const posX = isWest ? -wt / 2 : (rw + wt / 2);
            const sill = new THREE.Mesh(new THREE.BoxGeometry(wt, sillH, openSpan), wallMat);
            sill.position.set(posX, sillY, posZ);
            sill.receiveShadow = true;
            group.add(sill);
          }
        }

        cursor = op.end;
      });

      // 4. Solid segment after the last opening to the end of the wall
      if (wallLen > cursor + 0.02) {
        const segLen = wallLen - cursor;
        if (isNorth || isSouth) {
          const extraRight = wt;
          const segW = segLen + extraRight;
          const posX = cursor + segLen / 2 + extraRight / 2;
          const posZ = isNorth ? -wt / 2 : (rl + wt / 2);
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(segW, wallH, wt), wallMat);
          mesh.position.set(posX, wallH / 2, posZ);
          mesh.receiveShadow = true;
          group.add(mesh);
        } else {
          const posZ = cursor + segLen / 2;
          const posX = isWest ? -wt / 2 : (rw + wt / 2);
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(wt, wallH, segLen), wallMat);
          mesh.position.set(posX, wallH / 2, posZ);
          mesh.receiveShadow = true;
          group.add(mesh);
        }
      }
    };

    // Build the 4 walls
    // 1. Back Wall (North)
    buildSegmentedWall('north', rw, rh, openings.north);

    // 2. Left Wall (West)
    buildSegmentedWall('west', rl, rh, openings.west);

    // 3. Right Wall (East)
    const rightWallHeight = allWalls ? rh : (openings.east.length > 0 ? rh : rh * 0.35);
    buildSegmentedWall('east', rl, rightWallHeight, openings.east);

    // 4. Front Wall (South) - renders when allWalls is toggled on
    if (allWalls) {
      buildSegmentedWall('south', rw, rh, openings.south);
    }

    // Baseboards (breaks at any door)
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.3 });
    const northDoor = openings.north.find(o => o.isDoor);
    if (!northDoor) {
      const bbBack = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.14, 0.02), baseboardMat);
      bbBack.position.set(rw / 2, 0.07, 0.01);
      group.add(bbBack);
    } else {
      if (northDoor.start > 0.05) {
        const bb1 = new THREE.Mesh(new THREE.BoxGeometry(northDoor.start, 0.14, 0.02), baseboardMat);
        bb1.position.set(northDoor.start / 2, 0.07, 0.01);
        group.add(bb1);
      }
      if (rw - northDoor.end > 0.05) {
        const bb2 = new THREE.Mesh(new THREE.BoxGeometry(rw - northDoor.end, 0.14, 0.02), baseboardMat);
        bb2.position.set(northDoor.end + (rw - northDoor.end) / 2, 0.07, 0.01);
        group.add(bb2);
      }
    }

    const westDoor = openings.west.find(o => o.isDoor);
    if (!westDoor) {
      const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl), baseboardMat);
      bbLeft.position.set(0.01, 0.07, rl / 2);
      group.add(bbLeft);
    } else {
      if (westDoor.start > 0.05) {
        const bb1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, westDoor.start), baseboardMat);
        bb1.position.set(0.01, 0.07, westDoor.start / 2);
        group.add(bb1);
      }
      if (rl - westDoor.end > 0.05) {
        const bb2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl - westDoor.end), baseboardMat);
        bb2.position.set(0.01, 0.07, westDoor.end + (rl - westDoor.end) / 2);
        group.add(bb2);
      }
    }

    if (allWalls) {
      const eastDoor = openings.east.find(o => o.isDoor);
      if (!eastDoor) {
        const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl), baseboardMat);
        bbRight.position.set(rw - 0.01, 0.07, rl / 2);
        group.add(bbRight);
      } else {
        if (eastDoor.start > 0.05) {
          const bb1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, eastDoor.start), baseboardMat);
          bb1.position.set(rw - 0.01, 0.07, eastDoor.start / 2);
          group.add(bb1);
        }
        if (rl - eastDoor.end > 0.05) {
          const bb2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl - eastDoor.end), baseboardMat);
          bb2.position.set(rw - 0.01, 0.07, eastDoor.end + (rl - eastDoor.end) / 2);
          group.add(bb2);
        }
      }

      const southDoor = openings.south.find(o => o.isDoor);
      if (!southDoor) {
        const bbFront = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.14, 0.02), baseboardMat);
        bbFront.position.set(rw / 2, 0.07, rl - 0.01);
        group.add(bbFront);
      } else {
        if (southDoor.start > 0.05) {
          const bb1 = new THREE.Mesh(new THREE.BoxGeometry(southDoor.start, 0.14, 0.02), baseboardMat);
          bb1.position.set(southDoor.start / 2, 0.07, rl - 0.01);
          group.add(bb1);
        }
        if (rw - southDoor.end > 0.05) {
          const bb2 = new THREE.Mesh(new THREE.BoxGeometry(rw - southDoor.end, 0.14, 0.02), baseboardMat);
          bb2.position.set(southDoor.end + (rw - southDoor.end) / 2, 0.07, rl - 0.01);
          group.add(bb2);
        }
      }
    }
  };

  // --- Full Furniture Mesh Rebuild ---

  const rebuildFurniture = (curRoom, group) => {
    while (group.children.length > 0) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
    }

    curRoom.items.forEach(it => {
      const cat = CATALOG[it.type] || { name: it.type, height: 75 };
      const matDef = MATERIALS.find(m => m.id === it.material) || { color: '#E8E3DA' };
      const meshGroup = createFurnitureMeshGroup(it, cat, matDef);
      meshGroup.userData = { itemId: it.id, itemType: it.type };
      group.add(meshGroup);
    });
  };

  // Helper to create tailored high-detail furniture models
  const createFurnitureMeshGroup = (it, cat, matDef) => {
    const itemGroup = new THREE.Group();
    const isFixture = it.type?.startsWith('door') || it.type?.startsWith('window');
    const fixtureW = isFixture ? (Math.max(it.w, it.d) / 100) : (it.w / 100);
    const fixtureD = isFixture ? (Math.min(it.w, it.d) / 100) : (it.d / 100);
    const w = fixtureW;
    const d = fixtureD;
    const h = (cat.height || (it.type?.startsWith('door') ? 210 : 75)) / 100;

    const fabricTex = getCachedFabricTexture(matDef.color || '#F4EFEA');
    const fabricMat = new THREE.MeshStandardMaterial({
      map: fabricTex,
      roughness: 0.75,
      metalness: 0.05
    });

    const woodColor = matDef.type === 'wood' ? matDef.color : '#8C6B4B';
    const woodTex = getCachedWoodTexture(woodColor, '#5E4432');
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.45
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xD4A86A,
      metalness: 0.9,
      roughness: 0.25
    });

    const elevationY = getItemElevation(it) / 100;
    if (isFixture) {
      const rw = (room?.width || 500) / 100;
      const rl = (room?.length || 420) / 100;
      const cx = (it.x + it.w / 2) / 100;
      const cz = (it.y + it.d / 2) / 100;
      const distN = cz;
      const distS = rl - cz;
      const distW = cx;
      const distE = rw - cx;
      const minD = Math.min(distN, distS, distW, distE);
      if (minD === distS) {
        itemGroup.position.set(cx, elevationY, rl);
        itemGroup.rotation.y = Math.PI;
      } else if (minD === distW) {
        itemGroup.position.set(0, elevationY, cz);
        itemGroup.rotation.y = -Math.PI / 2;
      } else if (minD === distE) {
        itemGroup.position.set(rw, elevationY, cz);
        itemGroup.rotation.y = Math.PI / 2;
      } else {
        itemGroup.position.set(cx, elevationY, 0);
        itemGroup.rotation.y = 0;
      }
    } else {
      const posX = (it.x + it.w / 2) / 100;
      const posZ = (it.y + it.d / 2) / 100;
      itemGroup.position.set(posX, elevationY, posZ);
      itemGroup.rotation.y = -((it.rot || 0) * Math.PI) / 180;
    }

    if (it.type.startsWith('window')) {
      const casingThick = 0.055;
      const trimW = 0.07;
      const sillDepth = 0.22;
      const sillH = 0.045;
      const casingMat = new THREE.MeshStandardMaterial({
        color: matDef.id === 'oak' || matDef.id === 'walnut' ? matDef.color : 0xFAF8F5,
        roughness: 0.35
      });
      const darkSashMat = new THREE.MeshStandardMaterial({
        color: 0x242728,
        roughness: 0.4
      });

      // 1. Deep Projecting Oak / Wood Interior Sill Shelf
      const sillMesh = new THREE.Mesh(
        createSoftBox(w + trimW * 2 + 0.08, sillH, sillDepth, 0.015, 2),
        woodMat
      );
      sillMesh.position.set(0, -sillH / 2, sillDepth / 2 - 0.02);
      sillMesh.castShadow = true;
      sillMesh.receiveShadow = true;
      itemGroup.add(sillMesh);

      // 2. Outer Moulded Casing (Top, Left, Right)
      const topCasing = new THREE.Mesh(
        new THREE.BoxGeometry(w + trimW * 2, trimW, casingThick),
        casingMat
      );
      topCasing.position.set(0, h + trimW / 2, 0);
      topCasing.castShadow = true;
      itemGroup.add(topCasing);

      const leftCasing = new THREE.Mesh(
        new THREE.BoxGeometry(trimW, h, casingThick),
        casingMat
      );
      leftCasing.position.set(-w / 2 - trimW / 2, h / 2, 0);
      leftCasing.castShadow = true;
      itemGroup.add(leftCasing);

      const rightCasing = new THREE.Mesh(
        new THREE.BoxGeometry(trimW, h, casingThick),
        casingMat
      );
      rightCasing.position.set(w / 2 + trimW / 2, h / 2, 0);
      rightCasing.castShadow = true;
      itemGroup.add(rightCasing);

      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(w + trimW * 1.6, 0.055, 0.02),
        casingMat
      );
      apron.position.set(0, -sillH - 0.055 / 2, 0.01);
      itemGroup.add(apron);

      // 3. Dual Casement Sashes (Left and Right panels)
      const sashW = (w - 0.03) / 2;
      const sashH = h - 0.02;
      const sashThick = 0.04;
      const sashRailW = 0.045;

      [-1, 1].forEach((dir) => {
        const sashCx = dir * (sashW / 2 + 0.0075);
        const sashGroup = new THREE.Group();
        sashGroup.position.set(sashCx, h / 2, 0.01);

        const sTop = new THREE.Mesh(new THREE.BoxGeometry(sashW, sashRailW, sashThick), darkSashMat);
        sTop.position.set(0, sashH / 2 - sashRailW / 2, 0);
        sashGroup.add(sTop);

        const sBot = new THREE.Mesh(new THREE.BoxGeometry(sashW, sashRailW, sashThick), darkSashMat);
        sBot.position.set(0, -sashH / 2 + sashRailW / 2, 0);
        sashGroup.add(sBot);

        const sLeft = new THREE.Mesh(new THREE.BoxGeometry(sashRailW, sashH, sashThick), darkSashMat);
        sLeft.position.set(-sashW / 2 + sashRailW / 2, 0, 0);
        sashGroup.add(sLeft);

        const sRight = new THREE.Mesh(new THREE.BoxGeometry(sashRailW, sashH, sashThick), darkSashMat);
        sRight.position.set(sashW / 2 - sashRailW / 2, 0, 0);
        sashGroup.add(sRight);

        const muntinH = new THREE.Mesh(new THREE.BoxGeometry(sashW - sashRailW * 2, 0.02, sashThick * 0.7), darkSashMat);
        sashGroup.add(muntinH);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.08), brassMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-dir * (sashW / 2 - sashRailW - 0.02), -0.04, sashThick / 2 + 0.015);
        sashGroup.add(handle);

        itemGroup.add(sashGroup);
      });

      const centerMullion = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, sashThick + 0.01), casingMat);
      centerMullion.position.set(0, h / 2, 0.005);
      itemGroup.add(centerMullion);

      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), brassMat);
      latch.position.set(0, h / 2, sashThick / 2 + 0.02);
      itemGroup.add(latch);

      // 4. Realistic Double-Pane Glass
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xE2F1FA,
        transmission: 0.92,
        opacity: 0.38,
        transparent: true,
        roughness: 0.03,
        ior: 1.5,
        reflectivity: 0.65
      });
      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 0.04, h - 0.04),
        glassMat
      );
      glassPane.position.set(0, h / 2, 0.008);
      itemGroup.add(glassPane);

      // 5. High-Definition Outdoor Scenery View Backdrop
      const sceneryTex = getCachedWindowSceneryTexture(timeOfDay === 'evening');
      const sceneryMat = new THREE.MeshBasicMaterial({
        map: sceneryTex,
        side: THREE.DoubleSide
      });
      const sceneryMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.98, h * 0.98),
        sceneryMat
      );
      sceneryMesh.position.set(0, h / 2, -0.02);
      itemGroup.add(sceneryMesh);

      // 6. Brushed Brass Curtain Rod & Rings
      const rodW = w + trimW * 2 + 0.32;
      const rodY = h + trimW + 0.12;
      const rodZ = sillDepth * 0.72;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, rodW, 16), brassMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(0, rodY, rodZ);
      rod.castShadow = true;
      itemGroup.add(rod);

      [-rodW / 2, rodW / 2].forEach(fx => {
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), brassMat);
        finial.position.set(fx, rodY, rodZ);
        itemGroup.add(finial);
      });

      // 7. Sheer Flowing Linen Side Drapery Panels (Left & Right)
      const drapeW = Math.max(0.24, w * 0.18);
      const drapeH = h + sillH + 0.18;
      const curtainMat = new THREE.MeshStandardMaterial({
        map: fabricTex,
        color: 0xFCFAF7,
        roughness: 0.85
      });

      [-1, 1].forEach(dir => {
        const cx = dir * (w / 2 + trimW + drapeW / 2 - 0.04);
        const foldGeo = createSoftBox(drapeW, drapeH, 0.06, 0.025, 3);
        const drape = new THREE.Mesh(foldGeo, curtainMat);
        drape.position.set(cx, drapeH / 2 - sillH, rodZ - 0.01);
        drape.castShadow = true;
        itemGroup.add(drape);

        for (let r = 0; r < 4; r++) {
          const rx = cx - drapeW / 2 + 0.03 + (r / 3) * (drapeW - 0.06);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), brassMat);
          ring.position.set(rx, rodY - 0.01, rodZ);
          itemGroup.add(ring);
        }
      });

    } else if (it.type.startsWith('door')) {
      const casingThick = 0.07;
      const trimW = 0.065;
      const casingMat = new THREE.MeshStandardMaterial({
        color: matDef.id === 'oak' || matDef.id === 'walnut' ? matDef.color : 0xFAF8F5,
        roughness: 0.35
      });
      const doorLeafMat = new THREE.MeshStandardMaterial({
        color: matDef.color || 0xD4B595,
        roughness: 0.42
      });
      const hardwareMat = (matDef.id === 'black_ash' || matDef.id === 'charcoal')
        ? new THREE.MeshStandardMaterial({ color: 0x1E2022, roughness: 0.35, metalness: 0.85 })
        : brassMat;
      const thresholdMat = new THREE.MeshStandardMaterial({
        color: 0xD8D4CB,
        metalness: 0.85,
        roughness: 0.28
      });

      // 1. Floor Transition Threshold Saddle Plate
      const saddleW = w + trimW * 2 + 0.02;
      const saddleH = 0.012;
      const saddleD = 0.14;
      const saddle = new THREE.Mesh(
        createSoftBox(saddleW, saddleH, saddleD, 0.003, 2),
        thresholdMat
      );
      saddle.position.set(0, saddleH / 2, 0);
      saddle.castShadow = true;
      saddle.receiveShadow = true;
      itemGroup.add(saddle);

      // 2. Perimeter Moulded Door Casing & Jambs
      // Left Jamb
      const leftJamb = new THREE.Mesh(
        createSoftBox(trimW, h, casingThick, 0.006, 2),
        casingMat
      );
      leftJamb.position.set(-w / 2 - trimW / 2, h / 2, 0);
      leftJamb.castShadow = true;
      leftJamb.receiveShadow = true;
      itemGroup.add(leftJamb);

      // Right Jamb
      const rightJamb = new THREE.Mesh(
        createSoftBox(trimW, h, casingThick, 0.006, 2),
        casingMat
      );
      rightJamb.position.set(w / 2 + trimW / 2, h / 2, 0);
      rightJamb.castShadow = true;
      rightJamb.receiveShadow = true;
      itemGroup.add(rightJamb);

      // Head Casing Lintel
      const headCasing = new THREE.Mesh(
        createSoftBox(w + trimW * 2 + 0.04, trimW, casingThick + 0.01, 0.006, 2),
        casingMat
      );
      headCasing.position.set(0, h + trimW / 2, 0);
      headCasing.castShadow = true;
      headCasing.receiveShadow = true;
      itemGroup.add(headCasing);

      // Inner Door Stop Rebate Strip
      const stopStrip = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.018, 0.02),
        casingMat
      );
      stopStrip.position.set(0, h - 0.01, -0.01);
      itemGroup.add(stopStrip);

      // 3. Hinged Door Leaf (Pivot Group with 12° realistic swing reveal)
      const leafW = w - 0.02;
      const leafH = h - 0.018;
      const leafThick = 0.042;
      const pivotX = -w / 2 + 0.01;
      const swingAngle = (12 * Math.PI) / 180; // slightly cracked open for realistic 3D depth & shadow

      const leafGroup = new THREE.Group();
      leafGroup.position.set(pivotX, 0, 0);
      leafGroup.rotation.y = swingAngle;

      // Base Door Leaf Core
      const leafCore = new THREE.Mesh(
        createSoftBox(leafW, leafH, leafThick, 0.004, 2),
        doorLeafMat
      );
      leafCore.position.set(leafW / 2, leafH / 2 + saddleH, 0);
      leafCore.castShadow = true;
      leafCore.receiveShadow = true;
      leafGroup.add(leafCore);

      // 4. Architectural 4-Panel Craftsman Detailing (Upper & Lower Inset Mouldings)
      const panelMargin = 0.06;
      const panelW = (leafW - panelMargin * 3) / 2;
      const upperPanelH = leafH * 0.42;
      const lowerPanelH = leafH * 0.34;
      const upperPanelY = leafH * 0.68;
      const lowerPanelY = leafH * 0.24;

      [-1, 1].forEach((col) => {
        const px = leafW / 2 + col * (panelW / 2 + panelMargin / 2);

        // Upper Panels (Front and Rear Faces)
        [-1, 1].forEach(side => {
          const upperPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelW, upperPanelH, 0.006),
            doorLeafMat
          );
          upperPanel.position.set(px, upperPanelY, side * (leafThick / 2 - 0.002));
          leafGroup.add(upperPanel);

          // Subtle Inner Moulding Bevel Frame
          const upperFrame = new THREE.Mesh(
            new THREE.BoxGeometry(panelW + 0.014, upperPanelH + 0.014, 0.003),
            doorLeafMat
          );
          upperFrame.position.set(px, upperPanelY, side * (leafThick / 2));
          leafGroup.add(upperFrame);
        });

        // Lower Panels (Front and Rear Faces)
        [-1, 1].forEach(side => {
          const lowerPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelW, lowerPanelH, 0.006),
            doorLeafMat
          );
          lowerPanel.position.set(px, lowerPanelY, side * (leafThick / 2 - 0.002));
          leafGroup.add(lowerPanel);

          const lowerFrame = new THREE.Mesh(
            new THREE.BoxGeometry(panelW + 0.014, lowerPanelH + 0.014, 0.003),
            doorLeafMat
          );
          lowerFrame.position.set(px, lowerPanelY, side * (leafThick / 2));
          leafGroup.add(lowerFrame);
        });
      });

      // 5. Dual-Sided Architectural Lever Hardware (Front and Rear Faces)
      const handleX = leafW - 0.07;
      const handleY = 1.0;

      [-1, 1].forEach(side => {
        const faceZ = side * (leafThick / 2 + 0.004);

        // Escutcheon Backplate
        const backplate = new THREE.Mesh(
          createSoftBox(0.045, 0.22, 0.006, 0.002, 2),
          hardwareMat
        );
        backplate.position.set(handleX, handleY, faceZ);
        backplate.castShadow = true;
        leafGroup.add(backplate);

        // Lever Hub Rose
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.016, 16),
          hardwareMat
        );
        hub.rotation.x = Math.PI / 2;
        hub.position.set(handleX, handleY + 0.035, faceZ + side * 0.008);
        leafGroup.add(hub);

        // Ergonomic Curved Lever Handle
        const leverShank = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.11, 16),
          hardwareMat
        );
        leverShank.rotation.z = Math.PI / 2;
        leverShank.position.set(handleX - 0.05, handleY + 0.035, faceZ + side * 0.016);
        leverShank.castShadow = true;
        leafGroup.add(leverShank);

        // Safety Return Curve
        const returnTip = new THREE.Mesh(
          new THREE.SphereGeometry(0.008, 12, 12),
          hardwareMat
        );
        returnTip.position.set(handleX - 0.105, handleY + 0.035, faceZ + side * 0.016);
        leafGroup.add(returnTip);

        // Keyhole / Thumbturn Snib
        const snib = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.024, 0.008),
          hardwareMat
        );
        snib.position.set(handleX, handleY - 0.04, faceZ + side * 0.004);
        leafGroup.add(snib);
      });

      // Latch Bolt Strike Edge
      const latchBolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.025, 0.018),
        hardwareMat
      );
      latchBolt.position.set(leafW + 0.002, handleY, 0);
      leafGroup.add(latchBolt);

      itemGroup.add(leafGroup);

      // 6. Solid Brass / Metal Butt Hinges along Jamb
      [0.28, 1.05, 1.88].forEach(hy => {
        const hinge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, 0.07, 16),
          hardwareMat
        );
        hinge.position.set(-w / 2 + 0.006, hy, 0.012);
        itemGroup.add(hinge);
      });

      // 7. Raycast Dragging Hit Box
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(w + trimW * 2, h, casingThick * 2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, h / 2, 0);
      itemGroup.add(hitBox);

    } else if (it.type.startsWith('sofa')) {
      const numCushions = it.type === 'sofa_3' ? 3 : 2;
      const armW = Math.max(0.12, w * 0.11);
      const legH = 0.13;
      const plinthH = 0.05;

      // 1. Tapered Mid-Century Wooden Legs with Brass Ferrules
      [
        [-w / 2 + 0.1, -d / 2 + 0.1],
        [w / 2 - 0.1, -d / 2 + 0.1],
        [-w / 2 + 0.1, d / 2 - 0.1],
        [w / 2 - 0.1, d / 2 - 0.1]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.rotation.z = lx < 0 ? 0.06 : -0.06;
        leg.rotation.x = lz < 0 ? -0.06 : 0.06;
        leg.castShadow = true;
        itemGroup.add(leg);

        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.03, 16), brassMat);
        ferrule.position.set(lx, 0.015, lz);
        itemGroup.add(ferrule);
      });

      // 2. Chamfered Oak/Wood Sub-plinth Base
      const plinth = new THREE.Mesh(createSoftBox(w * 0.98, plinthH, d * 0.94, 0.02, 2), woodMat);
      plinth.position.set(0, legH + plinthH / 2, 0);
      plinth.castShadow = true;
      itemGroup.add(plinth);

      // 3. Main Lower Upholstered Seat Deck
      const deckH = 0.08;
      const deck = new THREE.Mesh(createSoftBox(w, deckH, d * 0.94, 0.03, 3), fabricMat);
      deck.position.set(0, legH + plinthH + deckH / 2, 0);
      deck.castShadow = true;
      itemGroup.add(deck);

      // 4. Soft Pillowy Seat Cushions & Back Cushions
      const seatY = legH + plinthH + deckH;
      const cushionW = (w - armW * 2 - 0.02) / numCushions;
      const cushionH = h * 0.22;
      const cushionD = d * 0.72;

      for (let c = 0; c < numCushions; c++) {
        const cx = -w / 2 + armW + cushionW / 2 + c * (cushionW + 0.008);
        const cushionGeo = createSoftBox(cushionW - 0.015, cushionH, cushionD, 0.035, 4);
        const cushion = new THREE.Mesh(cushionGeo, fabricMat);
        cushion.position.set(cx, seatY + cushionH / 2, d * 0.04);
        cushion.castShadow = true;
        cushion.receiveShadow = true;
        itemGroup.add(cushion);

        const backCushionH = h * 0.44;
        const backCushionD = d * 0.18;
        const backCushionGeo = createSoftBox(cushionW - 0.02, backCushionH, backCushionD, 0.03, 4);
        const backCushion = new THREE.Mesh(backCushionGeo, fabricMat);
        backCushion.position.set(cx, seatY + cushionH + backCushionH / 2 - 0.04, -d * 0.28);
        backCushion.rotation.x = -0.12;
        backCushion.castShadow = true;
        itemGroup.add(backCushion);
      }

      // 5. Contoured Slanted Main Back Frame
      const backH = h * 0.65;
      const backD = d * 0.20;
      const backFrame = new THREE.Mesh(createSoftBox(w, backH, backD, 0.04, 3), fabricMat);
      backFrame.position.set(0, legH + plinthH + backH / 2, -d * 0.38);
      backFrame.rotation.x = -0.06;
      backFrame.castShadow = true;
      itemGroup.add(backFrame);

      // 6. Rounded Contoured Armrests
      const armH = h * 0.52;
      const armD = d * 0.96;
      [-1, 1].forEach(dir => {
        const armGeo = createSoftBox(armW, armH, armD, 0.035, 4);
        const arm = new THREE.Mesh(armGeo, fabricMat);
        arm.position.set(dir * (w / 2 - armW / 2), legH + plinthH + armH / 2, 0);
        arm.castShadow = true;
        itemGroup.add(arm);
      });

      // 7. Accent Designer Throw Pillows
      const accentMat = new THREE.MeshStandardMaterial({
        color: matDef.id === 'terracotta' ? 0x688871 : 0xC8785E,
        roughness: 0.8
      });
      const pillowGeo = createSoftBox(0.34, 0.34, 0.12, 0.05, 4);

      const p1 = new THREE.Mesh(pillowGeo, accentMat);
      p1.position.set(-w / 2 + armW + 0.16, seatY + cushionH + 0.12, -d * 0.18);
      p1.rotation.set(-0.15, 0.42, 0.08);
      p1.castShadow = true;
      itemGroup.add(p1);

      const p2 = new THREE.Mesh(pillowGeo, fabricMat);
      p2.position.set(w / 2 - armW - 0.16, seatY + cushionH + 0.12, -d * 0.18);
      p2.rotation.set(-0.15, -0.42, -0.08);
      p2.castShadow = true;
      itemGroup.add(p2);

    } else if (it.type.startsWith('bed')) {
      const plinthH = 0.18;
      const mattressH = 0.26;
      const headboardH = h;
      const headboardD = 0.16;

      // 1. Recessed Floating Platform Base with Rounded Hardwood Trim
      const base = new THREE.Mesh(createSoftBox(w, plinthH, d, 0.03, 3), woodMat);
      base.position.set(0, plinthH / 2, 0);
      base.castShadow = true;
      itemGroup.add(base);

      // 2. Channel-Tufted Luxury Hotel Headboard
      const headboard = new THREE.Mesh(
        createSoftBox(w, headboardH, headboardD, 0.04, 4),
        fabricMat
      );
      headboard.position.set(0, headboardH / 2, -d / 2 + headboardD / 2);
      headboard.castShadow = true;
      itemGroup.add(headboard);

      const numChannels = it.type === 'bed_king' ? 6 : 5;
      const chW = (w - 0.08) / numChannels;
      for (let ch = 0; ch < numChannels; ch++) {
        const cx = -w / 2 + 0.04 + chW / 2 + ch * chW;
        const flute = new THREE.Mesh(
          createSoftBox(chW - 0.015, headboardH * 0.88, 0.035, 0.018, 3),
          fabricMat
        );
        flute.position.set(cx, headboardH / 2 + 0.02, -d / 2 + headboardD + 0.01);
        itemGroup.add(flute);
      }

      // 3. Deep Beveled Luxury Mattress
      const matW = w * 0.94;
      const matD = d * 0.88;
      const mattressMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.9 });
      const mattress = new THREE.Mesh(
        createSoftBox(matW, mattressH, matD, 0.045, 4),
        mattressMat
      );
      mattress.position.set(0, plinthH + mattressH / 2, d * 0.04);
      mattress.castShadow = true;
      itemGroup.add(mattress);

      // 4. Puffy Layered Duvet with Folded Sheeting Top Cuff
      const duvetW = matW * 0.98;
      const duvetD = matD * 0.64;
      const duvetH = 0.12;
      const duvet = new THREE.Mesh(
        createSoftBox(duvetW, duvetH, duvetD, 0.05, 4),
        fabricMat
      );
      duvet.position.set(0, plinthH + mattressH + duvetH / 2 - 0.02, d * 0.16);
      duvet.castShadow = true;
      itemGroup.add(duvet);

      const sheetMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.75 });
      const sheetCuff = new THREE.Mesh(
        createSoftBox(duvetW * 0.96, 0.04, 0.18, 0.02, 3),
        sheetMat
      );
      sheetCuff.position.set(0, plinthH + mattressH + duvetH - 0.01, -duvetD / 2 + d * 0.16);
      itemGroup.add(sheetCuff);

      const runnerMat = new THREE.MeshStandardMaterial({ color: 0xC8785E, roughness: 0.85 });
      const runner = new THREE.Mesh(
        createSoftBox(duvetW * 0.99, 0.025, 0.38, 0.015, 2),
        runnerMat
      );
      runner.position.set(0, plinthH + mattressH + duvetH + 0.005, d * 0.32);
      itemGroup.add(runner);

      // 5. Layered Hotel Pillows
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
      const pW = matW * 0.42;
      const pD = 0.34;
      const pH = 0.13;
      const pillowGeo = createSoftBox(pW, pH, pD, 0.045, 4);

      [-1, 1].forEach(side => {
        const px = side * (matW * 0.24);
        const pFlat = new THREE.Mesh(pillowGeo, pillowMat);
        pFlat.position.set(px, plinthH + mattressH + pH / 2, -matD * 0.3);
        pFlat.castShadow = true;
        itemGroup.add(pFlat);

        const pAngled = new THREE.Mesh(pillowGeo, pillowMat);
        pAngled.position.set(px, plinthH + mattressH + pH + 0.04, -matD * 0.34);
        pAngled.rotation.x = 0.38;
        pAngled.castShadow = true;
        itemGroup.add(pAngled);
      });

      const decPillow = new THREE.Mesh(
        createSoftBox(0.42, 0.11, 0.24, 0.04, 3),
        runnerMat
      );
      decPillow.position.set(0, plinthH + mattressH + 0.12, -matD * 0.24);
      decPillow.rotation.x = 0.25;
      itemGroup.add(decPillow);

    } else if (it.type.startsWith('chair')) {
      if (it.type === 'chair_arm') {
        // Nordic Tub Accent Armchair
        const seatH = 0.14;
        const legH = 0.28;

        [
          [-w / 2 + 0.09, -d / 2 + 0.09],
          [w / 2 - 0.09, -d / 2 + 0.09],
          [-w / 2 + 0.09, d / 2 - 0.09],
          [w / 2 - 0.09, d / 2 - 0.09]
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.011, legH, 16), woodMat);
          leg.position.set(lx, legH / 2, lz);
          leg.rotation.z = lx < 0 ? 0.08 : -0.08;
          leg.rotation.x = lz < 0 ? -0.08 : 0.08;
          leg.castShadow = true;
          itemGroup.add(leg);

          const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.03, 16), brassMat);
          ferrule.position.set(lx, 0.015, lz);
          itemGroup.add(ferrule);
        });

        const cushion = new THREE.Mesh(createSoftBox(w * 0.78, seatH, d * 0.76, 0.06, 4), fabricMat);
        cushion.position.set(0, legH + seatH / 2, d * 0.04);
        cushion.castShadow = true;
        cushion.receiveShadow = true;
        itemGroup.add(cushion);

        const tubH = h - legH;
        const tubBack = new THREE.Mesh(createSoftBox(w, tubH * 0.72, d * 0.22, 0.06, 4), fabricMat);
        tubBack.position.set(0, legH + tubH * 0.42, -d * 0.36);
        tubBack.rotation.x = -0.08;
        tubBack.castShadow = true;
        itemGroup.add(tubBack);

        [-1, 1].forEach(dir => {
          const arm = new THREE.Mesh(createSoftBox(0.12, tubH * 0.58, d * 0.82, 0.04, 4), fabricMat);
          arm.position.set(dir * (w / 2 - 0.06), legH + tubH * 0.32, 0);
          arm.castShadow = true;
          itemGroup.add(arm);
        });

        const bolster = new THREE.Mesh(createSoftBox(w * 0.48, 0.16, 0.14, 0.05, 3), fabricMat);
        bolster.position.set(0, legH + seatH + 0.08, -d * 0.22);
        itemGroup.add(bolster);

      } else if (it.type === 'chair_office') {
        // Ergonomic 5-Star Swivel Office Chair
        const starBaseY = 0.06;
        const cylinderH = 0.32;
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x222629, metalness: 0.85, roughness: 0.2 });

        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2;
          const starLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.035), metalMat);
          starLeg.position.set(Math.cos(ang) * 0.12, starBaseY, Math.sin(ang) * 0.12);
          starLeg.rotation.y = -ang;
          itemGroup.add(starLeg);

          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 12), metalMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(Math.cos(ang) * 0.24, 0.022, Math.sin(ang) * 0.24);
          itemGroup.add(wheel);
        }

        const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, cylinderH, 16), metalMat);
        piston.position.set(0, starBaseY + cylinderH / 2, 0);
        itemGroup.add(piston);

        const seatY = starBaseY + cylinderH;
        const seat = new THREE.Mesh(createSoftBox(w * 0.82, 0.075, d * 0.82, 0.03, 3), fabricMat);
        seat.position.set(0, seatY + 0.035, 0);
        seat.castShadow = true;
        itemGroup.add(seat);

        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, h * 0.52, 0.03), metalMat);
        spine.position.set(0, seatY + h * 0.28, -d * 0.36);
        spine.rotation.x = -0.12;
        itemGroup.add(spine);

        const backMesh = new THREE.Mesh(createSoftBox(w * 0.76, h * 0.44, 0.04, 0.03, 3), fabricMat);
        backMesh.position.set(0, seatY + h * 0.32, -d * 0.32);
        backMesh.rotation.x = -0.08;
        backMesh.castShadow = true;
        itemGroup.add(backMesh);

        [-1, 1].forEach(dir => {
          const arm = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 16, Math.PI), metalMat);
          arm.position.set(dir * (w * 0.42), seatY + 0.16, 0);
          arm.rotation.y = Math.PI / 2;
          itemGroup.add(arm);
        });

      } else {
        // Curved Dining Chair
        const seatH = 0.055;
        const legH = h * 0.52;

        [
          [-w / 2 + 0.04, -d / 2 + 0.04],
          [w / 2 - 0.04, -d / 2 + 0.04],
          [-w / 2 + 0.04, d / 2 - 0.04],
          [w / 2 - 0.04, d / 2 - 0.04]
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.011, legH, 16), woodMat);
          leg.position.set(lx, legH / 2, lz);
          leg.rotation.z = lx < 0 ? 0.04 : -0.04;
          leg.castShadow = true;
          itemGroup.add(leg);
        });

        const seat = new THREE.Mesh(createSoftBox(w, seatH, d * 0.94, 0.03, 3), fabricMat);
        seat.position.set(0, legH + seatH / 2, 0);
        seat.castShadow = true;
        itemGroup.add(seat);

        const back = new THREE.Mesh(createSoftBox(w * 0.92, h * 0.42, 0.04, 0.02, 3), woodMat);
        back.position.set(0, legH + seatH + h * 0.22, -d / 2 + 0.04);
        back.rotation.x = -0.08;
        back.castShadow = true;
        itemGroup.add(back);
      }

    } else if (it.type === 'table_coffee') {
      const topH = 0.035;
      const legH = h - topH;

      // 1. Organic Rounded Pill / Oval Bullnose Top
      const topGeo = createSoftBox(w, topH, d, Math.min(d * 0.35, 0.12), 4);
      const top = new THREE.Mesh(topGeo, woodMat);
      top.position.set(0, h - topH / 2, 0);
      top.castShadow = true;
      itemGroup.add(top);

      // 2. Inset Lower Slatted Shelf
      const shelf = new THREE.Mesh(
        createSoftBox(w * 0.78, 0.018, d * 0.72, 0.06, 3),
        woodMat
      );
      shelf.position.set(0, legH * 0.45, 0);
      shelf.castShadow = true;
      itemGroup.add(shelf);

      // 3. Tapered Wooden Legs with Brass Ferrules
      [
        [-w * 0.34, -d * 0.3],
        [w * 0.34, -d * 0.3],
        [-w * 0.34, d * 0.3],
        [w * 0.34, d * 0.3]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.rotation.z = lx < 0 ? 0.06 : -0.06;
        leg.castShadow = true;
        itemGroup.add(leg);

        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.014, 0.025, 16), brassMat);
        ferrule.position.set(lx, 0.012, lz);
        itemGroup.add(ferrule);
      });

      // 4. Styling: Architectural Coffee Table Hardcover Book & Ceramic Bowl
      const bookCoverMat = new THREE.MeshStandardMaterial({ color: 0x3A3F3B, roughness: 0.6 });
      const book = new THREE.Mesh(createSoftBox(0.26, 0.022, 0.2, 0.008, 2), bookCoverMat);
      book.position.set(-w * 0.18, h + 0.011, 0.02);
      book.rotation.y = 0.12;
      itemGroup.add(book);

      const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xFAF8F5, roughness: 0.4 });
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.035, 24), ceramicMat);
      bowl.position.set(w * 0.2, h + 0.0175, -0.02);
      itemGroup.add(bowl);

    } else if (it.type === 'table_dining_round') {
      const topH = 0.04;
      const radius = w / 2;

      // 1. Smooth Circular Top with Chamfered Bullnose Rim
      const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, topH, 48), woodMat);
      top.position.set(0, h - topH / 2, 0);
      top.castShadow = true;
      itemGroup.add(top);

      // 2. Sculptural Conical Pedestal Base
      const pedH = h - topH;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, pedH, 36), woodMat);
      ped.position.set(0, pedH / 2, 0);
      ped.castShadow = true;
      itemGroup.add(ped);

      const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 36), brassMat);
      baseRing.position.set(0, 0.0125, 0);
      itemGroup.add(baseRing);

      const vaseMat = new THREE.MeshStandardMaterial({ color: 0xECE8E0, roughness: 0.3 });
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.18, 24), vaseMat);
      vase.position.set(0, h + 0.09, 0);
      itemGroup.add(vase);

    } else if (it.type.startsWith('desk') || it.type === 'table_dining') {
      const topH = 0.045;
      const legH = h - topH;

      // 1. Solid Hardwood Top with Chamfered Bullnose Edges
      const top = new THREE.Mesh(createSoftBox(w, topH, d, 0.02, 3), woodMat);
      top.position.set(0, h - topH / 2, 0);
      top.castShadow = true;
      itemGroup.add(top);

      // 2. Tapered Wooden Legs with Brass Ferrules
      [
        [-w / 2 + 0.07, -d / 2 + 0.07],
        [w / 2 - 0.07, -d / 2 + 0.07],
        [-w / 2 + 0.07, d / 2 - 0.07],
        [w / 2 - 0.07, d / 2 - 0.07]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.016, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.castShadow = true;
        itemGroup.add(leg);

        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.03, 16), brassMat);
        ferrule.position.set(lx, 0.015, lz);
        itemGroup.add(ferrule);
      });

      if (it.type.startsWith('desk')) {
        const drawerW = 0.38;
        const drawerH = 0.16;
        const drawerD = d * 0.84;
        const drawer = new THREE.Mesh(createSoftBox(drawerW, drawerH, drawerD, 0.015, 2), woodMat);
        drawer.position.set(w / 2 - drawerW / 2 - 0.06, h - topH - drawerH / 2, 0);
        drawer.castShadow = true;
        itemGroup.add(drawer);

        const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14), brassMat);
        pull.rotation.z = Math.PI / 2;
        pull.position.set(w / 2 - drawerW / 2 - 0.06, h - topH - drawerH / 2, drawerD / 2 + 0.015);
        itemGroup.add(pull);

        const aluMat = new THREE.MeshStandardMaterial({ color: 0xDCDCDC, metalness: 0.85, roughness: 0.2 });
        const laptopBase = new THREE.Mesh(createSoftBox(0.32, 0.008, 0.22, 0.01, 2), aluMat);
        laptopBase.position.set(0, h + 0.004, 0.04);
        itemGroup.add(laptopBase);

        const screen = new THREE.Mesh(createSoftBox(0.32, 0.21, 0.006, 0.01, 2), aluMat);
        screen.position.set(0, h + 0.105, -0.07);
        screen.rotation.x = -0.18;
        itemGroup.add(screen);

        const screenGlass = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3, 0.19),
          new THREE.MeshBasicMaterial({ color: 0x1E2B37 })
        );
        screenGlass.position.set(0, h + 0.105, -0.066);
        screenGlass.rotation.x = -0.18;
        itemGroup.add(screenGlass);

        const mugMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.3 });
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16), mugMat);
        mug.position.set(w * 0.3, h + 0.04, 0.05);
        itemGroup.add(mug);
      }

    } else if (it.type === 'media_console') {
      const legH = 0.14;
      const bodyH = h - legH;

      [
        [-w / 2 + 0.1, -d / 2 + 0.08],
        [w / 2 - 0.1, -d / 2 + 0.08],
        [-w / 2 + 0.1, d / 2 - 0.08],
        [w / 2 - 0.1, d / 2 - 0.08]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.rotation.z = lx < 0 ? 0.06 : -0.06;
        leg.castShadow = true;
        itemGroup.add(leg);

        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.025, 16), brassMat);
        ferrule.position.set(lx, 0.012, lz);
        itemGroup.add(ferrule);
      });

      const body = new THREE.Mesh(createSoftBox(w, bodyH, d, 0.03, 3), woodMat);
      body.position.set(0, legH + bodyH / 2, 0);
      body.castShadow = true;
      itemGroup.add(body);

      const numSlats = 16;
      const slatW = (w - 0.08) / numSlats;
      for (let s = 0; s < numSlats; s++) {
        const sx = -w / 2 + 0.04 + slatW / 2 + s * slatW;
        const slat = new THREE.Mesh(createSoftBox(slatW * 0.75, bodyH * 0.84, 0.012, 0.005, 2), woodMat);
        slat.position.set(sx, legH + bodyH / 2, d / 2 + 0.006);
        itemGroup.add(slat);
      }

      [-0.12, 0.12].forEach(hx => {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16), brassMat);
        handle.position.set(hx, legH + bodyH / 2, d / 2 + 0.02);
        itemGroup.add(handle);
      });

    } else if (it.type === 'nightstand') {
      const legH = 0.16;
      const bodyH = h - legH;

      [
        [-w / 2 + 0.06, -d / 2 + 0.06],
        [w / 2 - 0.06, -d / 2 + 0.06],
        [-w / 2 + 0.06, d / 2 - 0.06],
        [w / 2 - 0.06, d / 2 - 0.06]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, legH, 16), woodMat);
        leg.position.set(lx, legH / 2, lz);
        leg.castShadow = true;
        itemGroup.add(leg);
      });

      const caseMesh = new THREE.Mesh(createSoftBox(w, bodyH, d, 0.025, 3), woodMat);
      caseMesh.position.set(0, legH + bodyH / 2, 0);
      caseMesh.castShadow = true;
      itemGroup.add(caseMesh);

      const drawer = new THREE.Mesh(createSoftBox(w * 0.88, bodyH * 0.44, 0.015, 0.01, 2), woodMat);
      drawer.position.set(0, legH + bodyH * 0.72, d / 2 + 0.008);
      itemGroup.add(drawer);

      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), brassMat);
      knob.position.set(0, legH + bodyH * 0.72, d / 2 + 0.025);
      itemGroup.add(knob);

    } else if (it.type.startsWith('lamp_floor')) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.38, w * 0.4, 0.035, 32), brassMat);
      base.position.set(0, 0.0175, 0);
      base.castShadow = true;
      itemGroup.add(base);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.035, 0),
        new THREE.Vector3(0, h * 0.6, 0),
        new THREE.Vector3(w * 0.15, h * 0.9, 0),
        new THREE.Vector3(w * 0.35, h * 0.98, 0),
        new THREE.Vector3(w * 0.48, h * 0.88, 0)
      ]);
      const archGeo = new THREE.TubeGeometry(curve, 32, 0.014, 16, false);
      const archMesh = new THREE.Mesh(archGeo, brassMat);
      archMesh.castShadow = true;
      itemGroup.add(archMesh);

      const shadeMat = new THREE.MeshStandardMaterial({
        map: fabricTex,
        color: 0xFFF9EE,
        roughness: 0.7,
        side: THREE.DoubleSide
      });
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(w * 0.34, w * 0.38, 0.28, 32, 1, true),
        shadeMat
      );
      shade.position.set(w * 0.48, h * 0.76, 0);
      shade.castShadow = true;
      itemGroup.add(shade);

      const shadeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), brassMat);
      shadeCap.position.set(w * 0.48, h * 0.9, 0);
      itemGroup.add(shadeCap);

      const pointLight = new THREE.PointLight(0xFFE5A8, timeOfDay === 'evening' ? 2.4 : 1.6, 6.0);
      pointLight.position.set(w * 0.48, h * 0.76, 0);
      itemGroup.add(pointLight);

    } else if (it.type.startsWith('plant')) {
      const potMat = new THREE.MeshStandardMaterial({ color: 0xC8785E, roughness: 0.65 });
      const standH = 0.12;

      const standMat = woodMat;
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.03, 0.03), standMat);
      leg1.position.set(0, standH * 0.6, 0);
      itemGroup.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, w * 0.72), standMat);
      leg2.position.set(0, standH * 0.6, 0);
      itemGroup.add(leg2);

      [
        [-w * 0.34, 0], [w * 0.34, 0], [0, -w * 0.34], [0, w * 0.34]
      ].forEach(([sx, sz]) => {
        const sLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, standH + 0.1), standMat);
        sLeg.position.set(sx, (standH + 0.1) / 2, sz);
        itemGroup.add(sLeg);
      });

      const potH = h * 0.34;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.38, w * 0.28, potH, 24), potMat);
      pot.position.set(0, standH + potH / 2, 0);
      pot.castShadow = true;
      itemGroup.add(pot);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(w * 0.38, 0.018, 12, 24), potMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, standH + potH, 0);
      itemGroup.add(rim);

      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(w * 0.36, w * 0.36, 0.03, 24),
        new THREE.MeshStandardMaterial({ color: 0x241914, roughness: 0.95 })
      );
      soil.position.set(0, standH + potH - 0.01, 0);
      itemGroup.add(soil);

      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.8 });
      const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, h * 0.62, 12), stemMat);
      mainStem.position.set(0, standH + potH + (h * 0.62) / 2, 0);
      mainStem.rotation.z = 0.05;
      itemGroup.add(mainStem);

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x33633C,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + (i % 2) * 0.4;
        const leafY = standH + potH + 0.12 + (i / 12) * (h * 0.52);
        const leafDist = w * (0.22 + (i % 3) * 0.06);

        const leaf = new THREE.Mesh(new THREE.SphereGeometry(w * 0.22, 10, 10), leafMat);
        leaf.scale.set(1.1, 0.14, 0.75);
        leaf.position.set(Math.cos(ang) * leafDist, leafY, Math.sin(ang) * leafDist);
        leaf.rotation.y = ang + Math.PI / 4;
        leaf.rotation.z = 0.38;
        leaf.castShadow = true;
        itemGroup.add(leaf);
      }

    } else if (it.type.startsWith('rug')) {
      const rugMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matDef.color || '#E8E3DA'),
        roughness: 0.95
      });
      const rug = new THREE.Mesh(createSoftBox(w, 0.014, d, 0.02, 2), rugMat);
      rug.position.set(0, 0.007, 0);
      rug.receiveShadow = true;
      itemGroup.add(rug);

      const fringeMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.95 });
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.008, 0.04), fringeMat);
      f1.position.set(0, 0.004, -d / 2 - 0.02);
      itemGroup.add(f1);

      const f2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.008, 0.04), fringeMat);
      f2.position.set(0, 0.004, d / 2 + 0.02);
      itemGroup.add(f2);

    } else if (it.type.startsWith('wardrobe')) {
      const wardrobe = new THREE.Mesh(createSoftBox(w, h, d, 0.02, 3), woodMat);
      wardrobe.position.set(0, h / 2, 0);
      wardrobe.castShadow = true;
      wardrobe.receiveShadow = true;
      itemGroup.add(wardrobe);

      [-0.04, 0.04].forEach(hx => {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35), brassMat);
        handle.position.set(hx, h * 0.52, d / 2 + 0.02);
        itemGroup.add(handle);
      });

    } else if (it.type.startsWith('bookshelf')) {
      const shelfFrame = new THREE.Mesh(createSoftBox(w, h, d, 0.015, 2), woodMat);
      shelfFrame.position.set(0, h / 2, 0);
      shelfFrame.castShadow = true;
      itemGroup.add(shelfFrame);

      const bookColors = [0x466352, 0xC8785E, 0xD4B595, 0x3A3F3B, 0x2A3D34];
      for (let s = 1; s <= 4; s++) {
        for (let b = 0; b < 5; b++) {
          const bookH = 0.18 + (b % 3) * 0.04;
          const book = new THREE.Mesh(
            createSoftBox(0.04, bookH, d * 0.72, 0.006, 2),
            new THREE.MeshStandardMaterial({ color: bookColors[(s + b) % bookColors.length], roughness: 0.7 })
          );
          book.position.set(-w * 0.38 + b * 0.065, (h / 5) * s - (h / 10) + bookH / 2, 0);
          itemGroup.add(book);
        }
      }

    } else if (it.type.startsWith('tv')) {
      const isWallMounted = it.mountType === 'wall' || elevationY >= 0.95;

      if (!isWallMounted) {
        const standMat = new THREE.MeshStandardMaterial({ color: 0x2E3430, metalness: 0.8, roughness: 0.2 });
        [-w * 0.35, w * 0.35].forEach(fx => {
          const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, Math.max(0.18, d * 0.9)), standMat);
          foot.position.set(fx, 0.02, 0);
          foot.castShadow = true;
          itemGroup.add(foot);
        });
      } else {
        const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1A1E1C, metalness: 0.9, roughness: 0.3 });
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, h * 0.45, 0.05), bracketMat);
        bracket.position.set(0, h * 0.52, -0.03);
        bracket.castShadow = true;
        itemGroup.add(bracket);
      }

      const tvFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
      const tvFrame = new THREE.Mesh(createSoftBox(w, h * 0.88, 0.04, 0.008, 2), tvFrameMat);
      tvFrame.position.set(0, h * 0.52, 0);
      tvFrame.castShadow = true;
      itemGroup.add(tvFrame);

      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x141c22,
        metalness: 0.9,
        roughness: 0.08,
        emissive: 0x0c151c,
        emissiveIntensity: 0.4
      });
      const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.82, 0.005), screenMat);
      screenMesh.position.set(0, h * 0.52, 0.022);
      itemGroup.add(screenMesh);

    } else {
      const top = new THREE.Mesh(createSoftBox(w, 0.04, d, 0.015, 2), woodMat);
      top.position.set(0, h - 0.02, 0);
      top.castShadow = true;
      itemGroup.add(top);

      [
        [-w / 2 + 0.05, -d / 2 + 0.05],
        [w / 2 - 0.05, -d / 2 + 0.05],
        [-w / 2 + 0.05, d / 2 - 0.05],
        [w / 2 - 0.05, d / 2 - 0.05]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, h - 0.04, 16), woodMat);
        leg.position.set(lx, (h - 0.04) / 2, lz);
        leg.castShadow = true;
        itemGroup.add(leg);
      });
    }

    return itemGroup;
  };

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Floating 3D Camera & Light Controls (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: '1.85rem',
        left: '1.25rem',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'rgba(255, 255, 255, 0.94)',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid #ECE8E0',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(8px)'
      }}>
        <button
          className={`view-mode-btn ${cameraMode === 'orbit' ? 'active' : ''}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          onClick={() => setCameraPreset('orbit')}
          title="Orbit 3D View"
        >
          <Compass size={13} /> Orbit
        </button>
        <button
          className={`view-mode-btn ${cameraMode === 'iso' ? 'active' : ''}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          onClick={() => setCameraPreset('iso')}
          title="Isometric View"
        >
          <Box size={13} /> Isometric
        </button>
        <button
          className={`view-mode-btn ${cameraMode === 'top' ? 'active' : ''}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          onClick={() => setCameraPreset('top')}
          title="Top-Down Plan"
        >
          <Layers size={13} /> Top
        </button>
        <button
          className={`view-mode-btn ${cameraMode === 'walk' ? 'active' : ''}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          onClick={() => setCameraPreset('walk')}
          title="Walk-in Eye-Level"
        >
          <Eye size={13} /> Walk-in
        </button>

        <div style={{ width: 1, height: 20, background: '#ECE8E0', margin: '0 2px' }} />

        <button
          className={`view-mode-btn ${timeOfDay === 'evening' ? 'active' : ''}`}
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          onClick={() => setTimeOfDay(t => t === 'day' ? 'evening' : 'day')}
          title={timeOfDay === 'day' ? 'Switch to Warm Golden Hour Evening' : 'Switch to Bright Daylight'}
        >
          {timeOfDay === 'day' ? <Sun size={13} color="#D4A86A" /> : <Moon size={13} color="#9E9BB8" />}
          <span>{timeOfDay === 'day' ? 'Daylight' : 'Evening'}</span>
        </button>

        <div style={{ width: 1, height: 20, background: '#ECE8E0', margin: '0 2px' }} />

        <button
          className={`view-mode-btn ${showAllWalls ? 'active' : ''}`}
          style={{ 
            padding: '0.35rem 0.75rem', 
            fontSize: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            background: showAllWalls ? '#466352' : undefined,
            color: showAllWalls ? '#FFFFFF' : undefined
          }}
          onClick={() => setShowAllWalls(v => !v)}
          title={showAllWalls ? 'Switch to cutaway open walls view' : 'Show all 4 enclosed walls of the room'}
        >
          <Box size={13} />
          <span>{showAllWalls ? 'All 4 Walls (Enclosed)' : 'Show All 4 Walls'}</span>
        </button>
      </div>



      {/* Three.js Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
