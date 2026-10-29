// Roomly - Core Three.js Scene Builder & Snapshot Renderer for Studio & PDF Exports
// Generates accurate 3D architecture, furniture meshes, and multi-angle renders

import * as THREE from 'three';
import { CATALOG, MATERIALS } from '../data/roomData';

// --- Shared Texture Caches ---
const textureCache = new Map();

export function getCachedWoodTexture(baseColor = '#D4B595', grainColor = '#B89775') {
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
    ctx.fillStyle = grainColor;
    ctx.fillRect(0, y + plankH - 2, 512, 2);

    ctx.strokeStyle = grainColor;
    ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 8 + g * 16);
      ctx.bezierCurveTo(128, y + 10 + g * 14, 384, y + 6 + g * 18, 512, y + 8 + g * 16);
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

export function getCachedFabricTexture(color = '#F4EFEA') {
  const key = `fabric_${color}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let x = 0; x < 256; x += 4) {
    ctx.fillRect(x, 0, 2, 256);
  }
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache.set(key, texture);
  return texture;
}

export function getCachedTileTexture() {
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

// --- Scene Architecture Builder ---
export function buildRoomArchitecture(curRoom, group, allWalls = false) {
  while (group.children.length > 0) {
    const c = group.children[0];
    group.remove(c);
    if (c.geometry) c.geometry.dispose();
  }

  const rw = curRoom.width / 100;
  const rl = curRoom.length / 100;
  const rh = (curRoom.height || 260) / 100;
  const wt = 0.12;

  // Floor
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

  // Baseboards
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.3 });
  const bbBack = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.14, 0.02), baseboardMat);
  bbBack.position.set(rw / 2, 0.07, 0.01);
  group.add(bbBack);

  const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl), baseboardMat);
  bbLeft.position.set(0.01, 0.07, rl / 2);
  group.add(bbLeft);

  if (allWalls) {
    const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, rl), baseboardMat);
    bbRight.position.set(rw - 0.01, 0.07, rl / 2);
    group.add(bbRight);
  }

  // Walls
  const wallColor = curRoom.wallColor || '#F7F4EC';
  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wallColor),
    roughness: 0.88,
    side: THREE.DoubleSide
  });

  // Back Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(rw + wt * 2, rh, wt), wallMat);
  backWall.position.set(rw / 2, rh / 2, -wt / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wt, rh, rl), wallMat);
  leftWall.position.set(-wt / 2, rh / 2, rl / 2);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right Wall
  const rightWallHeight = allWalls ? rh : rh * 0.35;
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wt, rightWallHeight, rl), wallMat);
  rightWall.position.set(rw + wt / 2, rightWallHeight / 2, rl / 2);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Front Wall (when allWalls is true)
  if (allWalls) {
    if (curRoom.doors && curRoom.doors[0]) {
      const door = curRoom.doors[0];
      const doorW = door.width / 100;
      const doorH = 2.1;
      const doorLeft = door.offset / 100;
      const doorRight = doorLeft + doorW;

      if (doorLeft > 0.05) {
        const segLeft = new THREE.Mesh(new THREE.BoxGeometry(doorLeft + wt, rh, wt), wallMat);
        segLeft.position.set((doorLeft - wt) / 2, rh / 2, rl + wt / 2);
        segLeft.receiveShadow = true;
        group.add(segLeft);
      }

      const rightWidth = rw - doorRight;
      if (rightWidth > 0.05) {
        const segRight = new THREE.Mesh(new THREE.BoxGeometry(rightWidth + wt, rh, wt), wallMat);
        segRight.position.set(doorRight + rightWidth / 2 + wt / 2, rh / 2, rl + wt / 2);
        segRight.receiveShadow = true;
        group.add(segRight);
      }

      const headerH = Math.max(0.1, rh - doorH);
      const header = new THREE.Mesh(new THREE.BoxGeometry(doorW, headerH, wt), wallMat);
      header.position.set(doorLeft + doorW / 2, doorH + headerH / 2, rl + wt / 2);
      header.receiveShadow = true;
      group.add(header);
    } else {
      const frontWall = new THREE.Mesh(new THREE.BoxGeometry(rw + wt * 2, rh, wt), wallMat);
      frontWall.position.set(rw / 2, rh / 2, rl + wt / 2);
      frontWall.receiveShadow = true;
      group.add(frontWall);
    }
  }

  // Window
  if (curRoom.windows && curRoom.windows[0]) {
    const win = curRoom.windows[0];
    const winW = win.width / 100;
    const winH = win.height / 100;
    const winX = win.offset / 100 + winW / 2;
    const winY = (win.elevation || 90) / 100 + winH / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(winW, winH, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25 })
    );
    frame.position.set(winX, winY, 0.02);
    group.add(frame);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winW * 0.92, winH * 0.92),
      new THREE.MeshPhysicalMaterial({
        color: 0xA0D8F4,
        transparent: true,
        opacity: 0.55,
        roughness: 0.05,
        transmission: 0.85
      })
    );
    glass.position.set(winX, winY, 0.03);
    group.add(glass);
  }

  // Door
  if (curRoom.doors && curRoom.doors[0]) {
    const door = curRoom.doors[0];
    const doorW = door.width / 100;
    const doorH = 2.1;
    const doorX = door.offset / 100 + doorW / 2;

    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, doorH, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xDAC5AB, roughness: 0.5 })
    );
    doorMesh.position.set(doorX, doorH / 2, rl - 0.02);
    group.add(doorMesh);

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xD4A86A, metalness: 0.9, roughness: 0.2 });
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12), brassMat);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(doorX - doorW * 0.35, 1.0, rl - 0.06);
    group.add(lever);
  }
}

// --- Tailored Furniture Mesh Builder ---
export function createFurnitureMeshGroup(it, cat, matDef) {
  const itemGroup = new THREE.Group();
  const w = it.w / 100;
  const d = it.d / 100;
  const h = (cat.height || 75) / 100;

  const fabricTex = getCachedFabricTexture(matDef.color || '#F4EFEA');
  const fabricMat = new THREE.MeshStandardMaterial({
    map: fabricTex,
    roughness: 0.75,
    metalness: 0.05
  });

  const woodTex = getCachedWoodTexture('#8C6B4B', '#6E533E');
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.45
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xD4A86A,
    metalness: 0.9,
    roughness: 0.25
  });

  const elevationY = (it.elevation !== undefined ? it.elevation : (it.type?.startsWith('tv') ? 54 : 0)) / 100;
  const posX = (it.x + it.w / 2) / 100;
  const posZ = (it.y + it.d / 2) / 100;
  itemGroup.position.set(posX, elevationY, posZ);
  itemGroup.rotation.y = -((it.rot || 0) * Math.PI) / 180;

  if (it.type.startsWith('sofa')) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.08, d * 0.9), woodMat);
    plinth.position.set(0, 0.08, 0);
    plinth.castShadow = true;
    itemGroup.add(plinth);

    const numCushions = it.type === 'sofa_3' ? 3 : 2;
    const armW = Math.max(0.12, w * 0.1);
    const cushionW = (w - armW * 2 - 0.02) / numCushions;
    for (let c = 0; c < numCushions; c++) {
      const cx = -w / 2 + armW + cushionW / 2 + c * cushionW + (c > 0 ? 0.01 : 0);
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(cushionW - 0.015, h * 0.28, d * 0.72),
        fabricMat
      );
      cushion.position.set(cx, 0.12 + h * 0.14, d * 0.04);
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      itemGroup.add(cushion);
    }

    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.62, d * 0.22), fabricMat);
    back.position.set(0, 0.12 + h * 0.31, -d * 0.38);
    back.rotation.x = -0.06;
    back.castShadow = true;
    itemGroup.add(back);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(armW, h * 0.48, d), fabricMat);
    leftArm.position.set(-w / 2 + armW / 2, 0.08 + (h * 0.48) / 2, 0);
    leftArm.castShadow = true;
    itemGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(armW, h * 0.48, d), fabricMat);
    rightArm.position.set(w / 2 - armW / 2, 0.08 + (h * 0.48) / 2, 0);
    rightArm.castShadow = true;
    itemGroup.add(rightArm);

  } else if (it.type.startsWith('chair')) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.08, d * 0.85), fabricMat);
    seat.position.set(0, h * 0.45, 0);
    seat.castShadow = true;
    itemGroup.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, h * 0.52, 0.06), fabricMat);
    back.position.set(0, h * 0.72, -d * 0.38);
    back.rotation.x = -0.05;
    back.castShadow = true;
    itemGroup.add(back);

    const legGeo = new THREE.CylinderGeometry(0.018, 0.012, h * 0.45);
    const legPositions = [
      [-w * 0.38, (h * 0.45) / 2, -d * 0.35],
      [w * 0.38, (h * 0.45) / 2, -d * 0.35],
      [-w * 0.38, (h * 0.45) / 2, d * 0.35],
      [w * 0.38, (h * 0.45) / 2, d * 0.35]
    ];
    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(...p);
      leg.castShadow = true;
      itemGroup.add(leg);
    });

  } else if (it.type.startsWith('bed')) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), woodMat);
    frame.position.set(0, 0.14, 0);
    frame.castShadow = true;
    itemGroup.add(frame);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.26, d * 0.94), fabricMat);
    mattress.position.set(0, 0.4, 0);
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    itemGroup.add(mattress);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.65, 0.12), fabricMat);
    headboard.position.set(0, (h * 0.65) / 2 + 0.14, -d / 2 + 0.06);
    headboard.castShadow = true;
    itemGroup.add(headboard);

    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.8 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, 0.12, d * 0.22), pillowMat);
    p1.position.set(-w * 0.22, 0.58, -d * 0.28);
    itemGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, 0.12, d * 0.22), pillowMat);
    p2.position.set(w * 0.22, 0.58, -d * 0.28);
    itemGroup.add(p2);

  } else if (it.type.startsWith('table') || it.type.startsWith('desk') || it.type === 'nightstand') {
    const isRound = it.type === 'table_dining_round';
    if (isRound) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.04, 32), woodMat);
      top.position.set(0, h - 0.02, 0);
      top.castShadow = true;
      itemGroup.add(top);

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, h - 0.04, 24), woodMat);
      pedestal.position.set(0, (h - 0.04) / 2, 0);
      pedestal.castShadow = true;
      itemGroup.add(pedestal);
    } else {
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), woodMat);
      top.position.set(0, h - 0.02, 0);
      top.castShadow = true;
      itemGroup.add(top);

      const legGeo = new THREE.CylinderGeometry(0.025, 0.018, h - 0.04, 16);
      const legPositions = [
        [-w / 2 + 0.06, (h - 0.04) / 2, -d / 2 + 0.06],
        [w / 2 - 0.06, (h - 0.04) / 2, -d / 2 + 0.06],
        [-w / 2 + 0.06, (h - 0.04) / 2, d / 2 + 0.06],
        [w / 2 - 0.06, (h - 0.04) / 2, d / 2 + 0.06]
      ];
      legPositions.forEach(p => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(...p);
        leg.castShadow = true;
        itemGroup.add(leg);
      });
    }

  } else if (it.type.startsWith('media_console')) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.72, d), woodMat);
    body.position.set(0, h * 0.5, 0);
    body.castShadow = true;
    itemGroup.add(body);

    const legGeo = new THREE.CylinderGeometry(0.02, 0.015, h * 0.28, 12);
    [[-w * 0.42, (h * 0.28) / 2, -d * 0.35], [w * 0.42, (h * 0.28) / 2, -d * 0.35],
     [-w * 0.42, (h * 0.28) / 2, d * 0.35], [w * 0.42, (h * 0.28) / 2, d * 0.35]].forEach(p => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(...p);
      itemGroup.add(leg);
    });

  } else if (it.type.startsWith('lamp')) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24), brassMat);
    base.position.set(0, 0.015, 0);
    itemGroup.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, h - 0.3, 16), brassMat);
    pole.position.set(0, (h - 0.3) / 2, 0);
    itemGroup.add(pole);

    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFFF9E6, roughness: 0.85 });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.32, 24, 1, true), shadeMat);
    shade.position.set(0, h - 0.16, 0);
    itemGroup.add(shade);

  } else if (it.type.startsWith('plant')) {
    const potMat = new THREE.MeshStandardMaterial({ color: 0xC8785E, roughness: 0.6 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.24, h * 0.36, 20), potMat);
    pot.position.set(0, (h * 0.36) / 2, 0);
    pot.castShadow = true;
    itemGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3F6848, roughness: 0.6 });
    for (let l = 0; l < 7; l++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(w * 0.28, 8, 8), leafMat);
      leaf.scale.set(0.4, 0.9, 0.2);
      leaf.rotation.set((l * 0.4) - 0.6, (l * Math.PI) / 3.5, 0.2);
      leaf.position.set(0, h * 0.36 + (l * 0.09), 0);
      leaf.castShadow = true;
      itemGroup.add(leaf);
    }

  } else if (it.type.startsWith('rug')) {
    const rugMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(matDef.color || '#E8E3DA'), roughness: 0.95 });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, d), rugMat);
    rug.position.set(0, 0.007, 0);
    rug.receiveShadow = true;
    itemGroup.add(rug);

  } else if (it.type.startsWith('wardrobe')) {
    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
    wardrobe.position.set(0, h / 2, 0);
    wardrobe.castShadow = true;
    itemGroup.add(wardrobe);

  } else if (it.type.startsWith('bookshelf')) {
    const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
    shelfFrame.position.set(0, h / 2, 0);
    shelfFrame.castShadow = true;
    itemGroup.add(shelfFrame);

  } else if (it.type.startsWith('tv')) {
    const isWallMounted = it.mountType === 'wall' || elevationY >= 0.95;

    if (!isWallMounted) {
      const standMat = new THREE.MeshStandardMaterial({ color: 0x2E3430, metalness: 0.8, roughness: 0.2 });
      const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, Math.max(0.18, d * 0.9)), standMat);
      leftFoot.position.set(-w * 0.35, 0.02, 0);
      leftFoot.castShadow = true;
      itemGroup.add(leftFoot);

      const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, Math.max(0.18, d * 0.9)), standMat);
      rightFoot.position.set(w * 0.35, 0.02, 0);
      rightFoot.castShadow = true;
      itemGroup.add(rightFoot);
    } else {
      const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1A1E1C, metalness: 0.9, roughness: 0.3 });
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, h * 0.45, 0.05), bracketMat);
      bracket.position.set(0, h * 0.52, -0.03);
      bracket.castShadow = true;
      itemGroup.add(bracket);
    }

    const tvFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.88, 0.04), tvFrameMat);
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
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.82), screenMat);
    screen.position.set(0, h * 0.52, 0.022);
    itemGroup.add(screen);

  } else {
    // Default architectural box
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
    mesh.position.set(0, h / 2, 0);
    itemGroup.add(mesh);
  }

  return itemGroup;
}

// --- Multi-Angle Snapshot Generator for PDF Exports ---
export async function renderRoomSnapshots(room) {
  const width = 640;
  const height = 440;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF5F2EB);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xFFF9EE, 0xD4C8B8, 0.75);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xFFF4E0, 1.4);
  sunLight.position.set((room.width / 100) * 1.2, 7.5, (room.length / 100) * 0.8);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const windowLight = new THREE.DirectionalLight(0xDCEEFF, 0.4);
  windowLight.position.set(room.width / 200, 3, -1);
  scene.add(windowLight);

  // Architecture and Furniture groups
  const archGroup = new THREE.Group();
  scene.add(archGroup);

  const furnitureGroup = new THREE.Group();
  scene.add(furnitureGroup);

  // Build furniture
  (room.items || []).forEach(it => {
    const cat = CATALOG[it.type] || { name: it.type, height: 75 };
    const matDef = MATERIALS.find(m => m.id === it.material) || { color: '#E8E3DA' };
    const meshGroup = createFurnitureMeshGroup(it, cat, matDef);
    furnitureGroup.add(meshGroup);
  });

  const cx = room.width / 200;
  const cz = room.length / 200;

  // Camera setup
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);

  // 1. Snapshot 1: 3D Top-Down View (Top Look)
  buildRoomArchitecture(room, archGroup, false);
  camera.position.set(cx, (Math.max(room.width, room.length) / 100) * 1.5 + 2.5, cz + 0.01);
  camera.lookAt(cx, 0, cz);
  renderer.render(scene, camera);
  const topImg = canvas.toDataURL('image/jpeg', 0.88);

  // 2. Snapshot 2: 3D Walk-in View (Eye-Level inside room)
  buildRoomArchitecture(room, archGroup, true);
  camera.position.set(cx - 0.15, 1.45, cz + (room.length / 100) * 0.42);
  camera.lookAt(cx, 1.15, cz - (room.length / 100) * 0.28);
  renderer.render(scene, camera);
  const walkImg = canvas.toDataURL('image/jpeg', 0.88);

  // 3. Snapshot 3: 3D Perspective with All 4 Walls Enclosed
  buildRoomArchitecture(room, archGroup, true);
  camera.position.set(cx + (room.width / 100) * 0.98, 4.2, cz + (room.length / 100) * 1.25);
  camera.lookAt(cx, 0.75, cz);
  renderer.render(scene, camera);
  const fourWallsImg = canvas.toDataURL('image/jpeg', 0.88);

  // 4. Snapshot 4: 3D Perspective with 2 Walls (Cutaway Open View)
  buildRoomArchitecture(room, archGroup, false);
  camera.position.set(cx + (room.width / 100) * 0.95, 3.8, cz + (room.length / 100) * 1.15);
  camera.lookAt(cx, 0.75, cz);
  renderer.render(scene, camera);
  const twoWallsImg = canvas.toDataURL('image/jpeg', 0.88);

  // Cleanup
  renderer.dispose();

  return {
    topImg,
    walkImg,
    fourWallsImg,
    twoWallsImg
  };
}
