// Roomly - Interactive 2D Floor Plan Engine
// Features: Architectural SVG rendering, scaling in cm, collision detection, snap-to-grid, undo/redo

const getCatalogData = () => (typeof window !== 'undefined' && window.ROOMLY_DATA?.catalog) || {};
const getMaterialsData = () => (typeof window !== 'undefined' && window.ROOMLY_DATA?.materials) || [];

class Planner2D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.options = Object.assign({
      gridSize: 25, // cm grid size
      snapToGrid: true,
      wallThickness: 15, // cm
      onSelect: () => { },
      onChange: () => { },
      onCollision: () => { }
    }, options);

    this.room = null; // active room data
    this.selectedId = -1; // index of selected item
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.unit = 'm'; // 'm' or 'ft'
    this.showGrid = true;
    this.collisions = []; // items currently in collision

    // Undo / Redo history stack
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 40;

    // Interaction states
    this.isDragging = false;
    this.dragTarget = null;
    this.dragStart = { x: 0, y: 0 };
    this.itemStartPos = { x: 0, y: 0 };

    this.isRotating = false;
    this.rotateCenter = { x: 0, y: 0 };

    this.isResizing = false;
    this.resizeHandle = null;
    this.itemStartDim = { w: 0, d: 0, x: 0, y: 0 };

    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="planner2d-viewport" id="p2dViewport" tabindex="0">
        <svg class="planner2d-svg" id="p2dSvg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridPatternFine" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(70,99,82,0.06)" stroke-width="0.5"/>
            </pattern>
            <pattern id="gridPatternMajor" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#gridPatternFine)"/>
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(70,99,82,0.14)" stroke-width="1"/>
            </pattern>
            <filter id="furnitureShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(32,36,33,0.12)"/>
            </filter>
            <filter id="warningGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#D9534F" flood-opacity="0.7"/>
            </filter>
          </defs>
          <g id="p2dSceneGroup">
            <g id="p2dGridLayer"></g>
            <g id="p2dRoomLayer"></g>
            <g id="p2dWindowDoorLayer"></g>
            <g id="p2dFurnitureLayer"></g>
            <g id="p2dOverlayLayer"></g>
          </g>
        </svg>
      </div>
    `;

    this.viewport = document.getElementById('p2dViewport');
    this.svg = document.getElementById('p2dSvg');
    this.sceneGroup = document.getElementById('p2dSceneGroup');
    this.gridLayer = document.getElementById('p2dGridLayer');
    this.roomLayer = document.getElementById('p2dRoomLayer');
    this.windowDoorLayer = document.getElementById('p2dWindowDoorLayer');
    this.furnitureLayer = document.getElementById('p2dFurnitureLayer');
    this.overlayLayer = document.getElementById('p2dOverlayLayer');
  }

  loadRoom(roomData, pushHistory = true) {
    this.room = JSON.parse(JSON.stringify(roomData));
    this.selectedId = -1;
    this.centerView();
    if (pushHistory) {
      this.history = [];
      this.historyIndex = -1;
      this.recordState();
    }
    this.render();
    this.options.onSelect(null);
  }

  recordState() {
    if (!this.room) return;
    // Discard any redos
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const snapshot = JSON.stringify(this.room);
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
    this.options.onChange(this.room);
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.room = JSON.parse(this.history[this.historyIndex]);
      this.selectedId = -1;
      this.render();
      this.options.onSelect(null);
      this.options.onChange(this.room);
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.room = JSON.parse(this.history[this.historyIndex]);
      this.selectedId = -1;
      this.render();
      this.options.onSelect(null);
      this.options.onChange(this.room);
      return true;
    }
    return false;
  }

  canUndo() { return this.historyIndex > 0; }
  canRedo() { return this.historyIndex < this.history.length - 1; }

  setUnit(unit) {
    this.unit = unit;
    this.render();
  }

  setSnap(snap) {
    this.options.snapToGrid = snap;
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.render();
  }

  // Calculate pixels-per-centimeter scale to fit room into viewport with margins
  getScale() {
    if (!this.room) return 1;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 450;
    const margin = 80; // room for dimension labels and wall thickness
    const scaleX = (w - margin * 2) / this.room.width;
    const scaleY = (h - margin * 2) / this.room.length;
    return Math.min(scaleX, scaleY, 1.4); // max initial scale
  }

  centerView() {
    if (!this.room) return;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 450;
    const scale = this.getScale();
    this.zoom = 1.0;
    // Center of room in pixels at 1.0 scale
    const roomPxW = this.room.width * scale;
    const roomPxH = this.room.length * scale;
    this.panX = (w - roomPxW) / 2;
    this.panY = (h - roomPxH) / 2;
    this.updateTransform();
  }

  setZoom(delta, originX, originY) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.45, Math.min(2.5, this.zoom + delta));

    // Zoom toward viewport center or origin
    const rect = this.container.getBoundingClientRect();
    const ox = originX !== undefined ? originX : rect.width / 2;
    const oy = originY !== undefined ? originY : rect.height / 2;

    this.panX = ox - (ox - this.panX) * (this.zoom / oldZoom);
    this.panY = oy - (oy - this.panY) * (this.zoom / oldZoom);
    this.updateTransform();
  }

  updateTransform() {
    const scale = this.getScale() * this.zoom;
    this.sceneGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${scale})`);
  }

  // Convert screen coordinates (clientX, clientY) to room coordinates (cm)
  screenToRoom(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const scale = this.getScale() * this.zoom;
    const px = clientX - rect.left - this.panX;
    const py = clientY - rect.top - this.panY;
    return {
      x: px / scale,
      y: py / scale
    };
  }

  formatMeasurement(cm) {
    if (this.unit === 'ft') {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}′ ${inches}″`;
    }
    const meters = cm / 100;
    return `${meters.toFixed(meters >= 10 ? 1 : 2)} m`;
  }

  // Overlap and boundary collision check
  checkCollisions() {
    if (!this.room || !this.room.items) return [];
    const items = this.room.items;
    const colliding = new Set();
    const warnings = [];

    // Helper: calculate Axis-Aligned Bounding Box (AABB) taking rotation into account
    const getBounds = (it) => {
      const rad = ((it.rot || 0) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      // center
      const cx = it.x + it.w / 2;
      const cy = it.y + it.d / 2;
      const bbW = it.w * cos + it.d * sin;
      const bbH = it.w * sin + it.d * cos;
      return {
        x1: cx - bbW / 2,
        y1: cy - bbH / 2,
        x2: cx + bbW / 2,
        y2: cy + bbH / 2,
        w: bbW,
        h: bbH
      };
    };

    // 1. Boundary check (items sticking out of walls)
    items.forEach((it, idx) => {
      const b = getBounds(it);
      const margin = 1; // 1cm tolerance
      if (b.x1 < -margin || b.y1 < -margin || b.x2 > this.room.width + margin || b.y2 > this.room.length + margin) {
        colliding.add(idx);
        const name = (getCatalogData()[it.type] || {}).name || it.type;
        warnings.push(`${name} extends outside room walls`);
      }
    });

    // 2. Inter-item overlap check
    // (Note: Rugs are floor coverings, so items on top of rugs do NOT trigger overlap!)
    for (let i = 0; i < items.length; i++) {
      const itA = items[i];
      if (itA.type && itA.type.startsWith('rug_')) continue; // rugs can have furniture on them
      const bA = getBounds(itA);

      for (let j = i + 1; j < items.length; j++) {
        const itB = items[j];
        if (itB.type && itB.type.startsWith('rug_')) continue;
        const bB = getBounds(itB);

        // Check AABB intersection with a small 3cm forgiveness margin
        const overlapX = Math.min(bA.x2, bB.x2) - Math.max(bA.x1, bB.x1);
        const overlapY = Math.min(bA.y2, bB.y2) - Math.max(bA.y1, bB.y1);

        if (overlapX > 4 && overlapY > 4) {
          colliding.add(i);
          colliding.add(j);
          const nameA = (getCatalogData()[itA.type] || {}).name || itA.type;
          const nameB = (getCatalogData()[itB.type] || {}).name || itB.type;
          warnings.push(`${nameA} overlaps with ${nameB}`);
        }
      }
    }

    this.collisions = Array.from(colliding);
    this.options.onCollision(warnings, this.collisions);
    return this.collisions;
  }

  render() {
    if (!this.room) return;
    this.updateTransform();
    this.renderGrid();
    this.renderRoomShell();
    this.renderWindowsAndDoors();
    this.checkCollisions();
    this.renderFurniture();
    this.renderOverlay();
  }

  renderGrid() {
    this.gridLayer.innerHTML = '';
    if (!this.showGrid) return;

    const rw = this.room.width;
    const rl = this.room.length;

    // Grid over the room floor
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', rw);
    rect.setAttribute('height', rl);
    rect.setAttribute('fill', 'url(#gridPatternMajor)');
    rect.setAttribute('pointer-events', 'none');
    this.gridLayer.appendChild(rect);
  }

  renderRoomShell() {
    this.roomLayer.innerHTML = '';
    const rw = this.room.width;
    const rl = this.room.length;
    const wt = this.options.wallThickness; // 15 cm

    // Room Floor
    const floor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    floor.setAttribute('x', 0);
    floor.setAttribute('y', 0);
    floor.setAttribute('width', rw);
    floor.setAttribute('height', rl);
    floor.setAttribute('fill', this.room.wallColor ? '#FAF7F0' : '#FAF8F5');
    floor.setAttribute('stroke', 'none');
    this.roomLayer.appendChild(floor);

    // Floor texture lines (subtle parquet / wood plank look)
    const plankGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    plankGroup.setAttribute('opacity', '0.35');
    for (let x = 30; x < rw; x += 30) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', rl);
      line.setAttribute('stroke', '#E2DCD0');
      line.setAttribute('stroke-width', '0.7');
      plankGroup.appendChild(line);
    }
    this.roomLayer.appendChild(plankGroup);

    // Outer Walls (thick architectural walls with baseboard)
    // Wall paths around perimeter
    const wallColor = '#466352'; // sage charcoal architectural wall
    const wallBg = '#27382F';

    // Top wall
    this.createWallRect(-wt, -wt, rw + wt * 2, wt, wallBg);
    // Bottom wall
    this.createWallRect(-wt, rl, rw + wt * 2, wt, wallBg);
    // Left wall
    this.createWallRect(-wt, 0, wt, rl, wallBg);
    // Right wall
    this.createWallRect(rw, 0, wt, rl, wallBg);

    // Dimension labels & guide arrows
    this.renderDimensionGuides(rw, rl, wt);
  }

  createWallRect(x, y, w, h, fill) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', fill);
    rect.setAttribute('rx', '2');
    this.roomLayer.appendChild(rect);
  }

  renderDimensionGuides(rw, rl, wt) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'dimension-guides');

    // Width label (top)
    const textW = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textW.setAttribute('x', rw / 2);
    textW.setAttribute('y', -wt - 10);
    textW.setAttribute('text-anchor', 'middle');
    textW.setAttribute('font-size', '12');
    textW.setAttribute('font-family', 'Plus Jakarta Sans, sans-serif');
    textW.setAttribute('font-weight', '600');
    textW.setAttribute('fill', '#557763');
    textW.textContent = `Width: ${this.formatMeasurement(rw)}`;
    group.appendChild(textW);

    // Length label (left)
    const textL = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textL.setAttribute('x', -wt - 12);
    textL.setAttribute('y', rl / 2);
    textL.setAttribute('text-anchor', 'middle');
    textL.setAttribute('transform', `rotate(-90, ${-wt - 12}, ${rl / 2})`);
    textL.setAttribute('font-size', '12');
    textL.setAttribute('font-family', 'Plus Jakarta Sans, sans-serif');
    textL.setAttribute('font-weight', '600');
    textL.setAttribute('fill', '#557763');
    textL.textContent = `Length: ${this.formatMeasurement(rl)}`;
    group.appendChild(textL);

    this.roomLayer.appendChild(group);
  }

  renderWindowsAndDoors() {
    this.windowDoorLayer.innerHTML = '';
    const wt = this.options.wallThickness;

    // Render Windows
    (this.room.windows || []).forEach((win, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'room-window');
      let wx = 0, wy = 0, ww = win.width, wh = wt;

      if (win.wall === 'top') {
        wx = win.offset;
        wy = -wt;
        ww = win.width;
        wh = wt;
      } else if (win.wall === 'bottom') {
        wx = win.offset;
        wy = this.room.length;
        ww = win.width;
        wh = wt;
      } else if (win.wall === 'left') {
        wx = -wt;
        wy = win.offset;
        ww = wt;
        wh = win.width;
      } else if (win.wall === 'right') {
        wx = this.room.width;
        wy = win.offset;
        ww = wt;
        wh = win.width;
      }

      // Cutout backdrop
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', wx);
      bg.setAttribute('y', wy);
      bg.setAttribute('width', ww);
      bg.setAttribute('height', wh);
      bg.setAttribute('fill', '#FAF7F0');
      g.appendChild(bg);

      // Glass line
      const glass = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      glass.setAttribute('x', wx + (win.wall === 'left' || win.wall === 'right' ? wt * 0.35 : 2));
      glass.setAttribute('y', wy + (win.wall === 'top' || win.wall === 'bottom' ? wt * 0.35 : 2));
      glass.setAttribute('width', win.wall === 'left' || win.wall === 'right' ? wt * 0.3 : ww - 4);
      glass.setAttribute('height', win.wall === 'top' || win.wall === 'bottom' ? wt * 0.3 : wh - 4);
      glass.setAttribute('fill', '#A8D5E5');
      glass.setAttribute('stroke', '#64B5D6');
      glass.setAttribute('stroke-width', '1');
      glass.setAttribute('rx', '1');
      g.appendChild(glass);

      // Label
      const tag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tag.setAttribute('x', wx + ww / 2);
      tag.setAttribute('y', wy + wh / 2 + 3);
      tag.setAttribute('text-anchor', 'middle');
      tag.setAttribute('font-size', '8');
      tag.setAttribute('font-family', 'Plus Jakarta Sans');
      tag.setAttribute('fill', '#266E85');
      tag.setAttribute('font-weight', '700');
      tag.textContent = 'WINDOW';
      g.appendChild(tag);

      this.windowDoorLayer.appendChild(g);
    });

    // Render Doors with realistic swing arc
    (this.room.doors || []).forEach((door, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'room-door');
      let dx = door.offset, dy = this.room.length, dw = door.width;

      if (door.wall === 'bottom') {
        dx = door.offset;
        dy = this.room.length;

        // Wall opening cutout
        const cutout = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cutout.setAttribute('x', dx);
        cutout.setAttribute('y', dy);
        cutout.setAttribute('width', dw);
        cutout.setAttribute('height', wt);
        cutout.setAttribute('fill', '#FAF7F0');
        g.appendChild(cutout);

        // Door swing arc (into room)
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // Arc from door edge swinging inward
        arc.setAttribute('d', `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 0 ${dx} ${dy - dw}`);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', '#C7A779');
        arc.setAttribute('stroke-dasharray', '3 3');
        arc.setAttribute('stroke-width', '1.2');
        g.appendChild(arc);

        // Open door leaf
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leaf.setAttribute('x1', dx);
        leaf.setAttribute('y1', dy);
        leaf.setAttribute('x2', dx);
        leaf.setAttribute('y2', dy - dw);
        leaf.setAttribute('stroke', '#8A6841');
        leaf.setAttribute('stroke-width', '3');
        g.appendChild(leaf);

      } else if (door.wall === 'right') {
        dx = this.room.width;
        dy = door.offset;

        const cutout = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cutout.setAttribute('x', dx);
        cutout.setAttribute('y', dy);
        cutout.setAttribute('width', wt);
        cutout.setAttribute('height', dw);
        cutout.setAttribute('fill', '#FAF7F0');
        g.appendChild(cutout);

        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', `M ${dx} ${dy} A ${dw} ${dw} 0 0 0 ${dx - dw} ${dy + dw}`);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', '#C7A779');
        arc.setAttribute('stroke-dasharray', '3 3');
        arc.setAttribute('stroke-width', '1.2');
        g.appendChild(arc);

        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leaf.setAttribute('x1', dx);
        leaf.setAttribute('y1', dy + dw);
        leaf.setAttribute('x2', dx - dw);
        leaf.setAttribute('y2', dy + dw);
        leaf.setAttribute('stroke', '#8A6841');
        leaf.setAttribute('stroke-width', '3');
        g.appendChild(leaf);
      }

      this.windowDoorLayer.appendChild(g);
    });
  }

  renderFurniture() {
    this.furnitureLayer.innerHTML = '';
    const catalog = getCatalogData();
    const materials = getMaterialsData();

    // Sort by z-index: rugs first, then standard pieces
    const sortedIndices = this.room.items
      .map((it, idx) => ({ it, idx }))
      .sort((a, b) => {
        const za = (a.it.type && a.it.type.startsWith('rug_')) ? 0 : (a.it.zIndex || 2);
        const zb = (b.it.type && b.it.type.startsWith('rug_')) ? 0 : (b.it.zIndex || 2);
        return za - zb;
      })
      .map(x => x.idx);

    sortedIndices.forEach(i => {
      const it = this.room.items[i];
      const cat = catalog[it.type] || { name: it.type, icon: '📦' };
      const mat = materials.find(m => m.id === it.material) || { color: '#E8E3DA' };
      const isSelected = (i === this.selectedId);
      const isColliding = this.collisions.includes(i);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `furniture-item ${isSelected ? 'is-selected' : ''} ${isColliding ? 'is-colliding' : ''}`);
      g.setAttribute('data-index', i);
      g.setAttribute('transform', `translate(${it.x}, ${it.y}) rotate(${it.rot || 0}, ${it.w / 2}, ${it.d / 2})`);
      g.setAttribute('filter', isColliding ? 'url(#warningGlow)' : 'url(#furnitureShadow)');

      // Draw custom architectural 2D representation based on piece type
      this.drawFurnitureItem(g, it, cat, mat, isSelected, isColliding);

      // Event listener for item selection & dragging
      g.addEventListener('pointerdown', (e) => this.onItemPointerDown(e, i));

      this.furnitureLayer.appendChild(g);
    });
  }

  drawFurnitureItem(g, it, cat, mat, isSelected, isColliding) {
    const w = it.w;
    const d = it.d;
    const type = it.type;

    // Base background
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', 0);
    body.setAttribute('y', 0);
    body.setAttribute('width', w);
    body.setAttribute('height', d);
    body.setAttribute('fill', mat.color || '#E8E3DA');
    body.setAttribute('stroke', isColliding ? '#D9534F' : (isSelected ? '#466352' : '#8A8D84'));
    body.setAttribute('stroke-width', isColliding ? '2.5' : (isSelected ? '2' : '1.2'));
    body.setAttribute('rx', (type.startsWith('table_coffee') || type.startsWith('rug') || type.startsWith('chair_arm')) ? '12' : '4');
    g.appendChild(body);

    // Architectural styling details based on type
    if (type.startsWith('sofa')) {
      // Sofa backrest
      const back = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      back.setAttribute('x', 0);
      back.setAttribute('y', 0);
      back.setAttribute('width', w);
      back.setAttribute('height', d * 0.28);
      back.setAttribute('fill', 'rgba(0,0,0,0.12)');
      back.setAttribute('rx', '3');
      g.appendChild(back);

      // Armrests
      const armW = Math.max(12, w * 0.08);
      const armL = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      armL.setAttribute('x', 0);
      armL.setAttribute('y', 0);
      armL.setAttribute('width', armW);
      armL.setAttribute('height', d);
      armL.setAttribute('fill', 'rgba(0,0,0,0.08)');
      armL.setAttribute('rx', '3');
      g.appendChild(armL);

      const armR = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      armR.setAttribute('x', w - armW);
      armR.setAttribute('y', 0);
      armR.setAttribute('width', armW);
      armR.setAttribute('height', d);
      armR.setAttribute('fill', 'rgba(0,0,0,0.08)');
      armR.setAttribute('rx', '3');
      g.appendChild(armR);

      // Cushions divider lines
      const numCushions = type === 'sofa_3' ? 3 : 2;
      const cushionW = (w - armW * 2) / numCushions;
      for (let c = 1; c < numCushions; c++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', armW + c * cushionW);
        line.setAttribute('y1', d * 0.28);
        line.setAttribute('x2', armW + c * cushionW);
        line.setAttribute('y2', d - 2);
        line.setAttribute('stroke', 'rgba(0,0,0,0.15)');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);
      }
    } else if (type.startsWith('bed')) {
      // Bed Headboard
      const hb = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hb.setAttribute('x', 0);
      hb.setAttribute('y', 0);
      hb.setAttribute('width', w);
      hb.setAttribute('height', d * 0.16);
      hb.setAttribute('fill', 'rgba(0,0,0,0.2)');
      hb.setAttribute('rx', '2');
      g.appendChild(hb);

      // Two Pillows
      const pillowW = w * 0.38;
      const pillowH = d * 0.18;
      const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      p1.setAttribute('x', w * 0.08);
      p1.setAttribute('y', d * 0.18);
      p1.setAttribute('width', pillowW);
      p1.setAttribute('height', pillowH);
      p1.setAttribute('fill', '#FFFFFF');
      p1.setAttribute('stroke', 'rgba(0,0,0,0.1)');
      p1.setAttribute('rx', '4');
      g.appendChild(p1);

      const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      p2.setAttribute('x', w * 0.54);
      p2.setAttribute('y', d * 0.18);
      p2.setAttribute('width', pillowW);
      p2.setAttribute('height', pillowH);
      p2.setAttribute('fill', '#FFFFFF');
      p2.setAttribute('stroke', 'rgba(0,0,0,0.1)');
      p2.setAttribute('rx', '4');
      g.appendChild(p2);

      // Duvet fold line
      const duvet = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      duvet.setAttribute('x1', 2);
      duvet.setAttribute('y1', d * 0.44);
      duvet.setAttribute('x2', w - 2);
      duvet.setAttribute('y2', d * 0.44);
      duvet.setAttribute('stroke', 'rgba(0,0,0,0.15)');
      duvet.setAttribute('stroke-width', '1.5');
      g.appendChild(duvet);
    } else if (type.startsWith('plant')) {
      // Plant pot circle + leaves
      body.setAttribute('rx', `${w / 2}`);
      body.setAttribute('fill', '#C27357'); // terracotta pot

      const leaves = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      leaves.setAttribute('cx', w / 2);
      leaves.setAttribute('cy', d / 2);
      leaves.setAttribute('r', (w / 2) * 0.8);
      leaves.setAttribute('fill', '#4A7C59');
      g.appendChild(leaves);

      // Leaf veins
      const leafGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      leafGroup.setAttribute('stroke', '#6BA37B');
      leafGroup.setAttribute('stroke-width', '1.5');
      for (let angle = 0; angle < 360; angle += 60) {
        const rad = (angle * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', w / 2);
        line.setAttribute('y1', d / 2);
        line.setAttribute('x2', w / 2 + Math.cos(rad) * (w * 0.38));
        line.setAttribute('y2', d / 2 + Math.sin(rad) * (d * 0.38));
        leafGroup.appendChild(line);
      }
      g.appendChild(leafGroup);
    } else if (type.startsWith('rug')) {
      // Rug texture lines
      body.setAttribute('stroke-dasharray', '4 4');
      body.setAttribute('fill-opacity', '0.85');
      const inner = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      inner.setAttribute('x', 6);
      inner.setAttribute('y', 6);
      inner.setAttribute('width', w - 12);
      inner.setAttribute('height', d - 12);
      inner.setAttribute('fill', 'none');
      inner.setAttribute('stroke', 'rgba(0,0,0,0.08)');
      inner.setAttribute('stroke-width', '1');
      inner.setAttribute('rx', '6');
      g.appendChild(inner);
    } else if (type.startsWith('lamp_floor')) {
      // Floor lamp circular shade & base
      body.setAttribute('rx', `${w / 2}`);
      body.setAttribute('fill', '#CCA262'); // brass base
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', w / 2);
      glow.setAttribute('cy', d / 2);
      glow.setAttribute('r', (w / 2) * 0.65);
      glow.setAttribute('fill', '#FFF9E6');
      glow.setAttribute('stroke', '#B38B42');
      glow.setAttribute('stroke-width', '1');
      g.appendChild(glow);
    } else if (type.startsWith('wardrobe')) {
      // Wardrobe split door lines
      const doorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      doorLine.setAttribute('x1', w / 2);
      doorLine.setAttribute('y1', 0);
      doorLine.setAttribute('x2', w / 2);
      doorLine.setAttribute('y2', d);
      doorLine.setAttribute('stroke', 'rgba(0,0,0,0.2)');
      doorLine.setAttribute('stroke-width', '1.2');
      g.appendChild(doorLine);

      // Handle dots
      const h1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      h1.setAttribute('cx', w / 2 - 5);
      h1.setAttribute('cy', d / 2);
      h1.setAttribute('r', '2.5');
      h1.setAttribute('fill', '#CCA262');
      g.appendChild(h1);

      const h2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      h2.setAttribute('cx', w / 2 + 5);
      h2.setAttribute('cy', d / 2);
      h2.setAttribute('r', '2.5');
      h2.setAttribute('fill', '#CCA262');
      g.appendChild(h2);
    }

    // Label with item name / icon if space permits
    if (w >= 40 && d >= 24 && !type.startsWith('rug')) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', w / 2);
      text.setAttribute('y', d / 2 + 3);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', Math.min(10, Math.floor(d * 0.22)));
      text.setAttribute('font-family', 'Plus Jakarta Sans, sans-serif');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#202421');
      text.setAttribute('pointer-events', 'none');
      text.textContent = cat.name.split(' ')[0]; // first word
      g.appendChild(text);
    }

    // Warning badge if colliding
    if (isColliding) {
      const warnBadge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      warnBadge.setAttribute('cx', w);
      warnBadge.setAttribute('cy', 0);
      warnBadge.setAttribute('r', '8');
      warnBadge.setAttribute('fill', '#D9534F');
      g.appendChild(warnBadge);

      const warnIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      warnIcon.setAttribute('x', w);
      warnIcon.setAttribute('y', 3.5);
      warnIcon.setAttribute('text-anchor', 'middle');
      warnIcon.setAttribute('font-size', '10');
      warnIcon.setAttribute('fill', '#FFFFFF');
      warnIcon.setAttribute('font-weight', '800');
      warnIcon.textContent = '!';
      g.appendChild(warnIcon);
    }
  }

  renderOverlay() {
    this.overlayLayer.innerHTML = '';
    if (this.selectedId < 0 || this.selectedId >= this.room.items.length) return;

    const it = this.room.items[this.selectedId];
    const cat = getCatalogData()[it.type] || { name: it.type };
    const w = it.w;
    const d = it.d;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'selection-handles-group');
    g.setAttribute('transform', `translate(${it.x}, ${it.y}) rotate(${it.rot || 0}, ${w / 2}, ${d / 2})`);

    // Selection bounding box
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    box.setAttribute('x', -3);
    box.setAttribute('y', -3);
    box.setAttribute('width', w + 6);
    box.setAttribute('height', d + 6);
    box.setAttribute('fill', 'none');
    box.setAttribute('stroke', '#557763');
    box.setAttribute('stroke-width', '1.5');
    box.setAttribute('stroke-dasharray', '4 3');
    box.setAttribute('rx', '5');
    box.setAttribute('pointer-events', 'none');
    g.appendChild(box);

    // Dimension badge pill above item
    const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const badgeText = `${this.formatMeasurement(w)} × ${this.formatMeasurement(d)}`;
    const badgeW = badgeText.length * 6.5 + 16;
    const badgeH = 18;

    const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badgeRect.setAttribute('x', w / 2 - badgeW / 2);
    badgeRect.setAttribute('y', -24);
    badgeRect.setAttribute('width', badgeW);
    badgeRect.setAttribute('height', badgeH);
    badgeRect.setAttribute('fill', '#202421');
    badgeRect.setAttribute('rx', '9');
    badgeG.appendChild(badgeRect);

    const badgeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badgeLabel.setAttribute('x', w / 2);
    badgeLabel.setAttribute('y', -12);
    badgeLabel.setAttribute('text-anchor', 'middle');
    badgeLabel.setAttribute('font-size', '9');
    badgeLabel.setAttribute('font-family', 'Plus Jakarta Sans');
    badgeLabel.setAttribute('font-weight', '600');
    badgeLabel.setAttribute('fill', '#FAF8F5');
    badgeLabel.textContent = badgeText;
    badgeG.appendChild(badgeLabel);
    g.appendChild(badgeG);

    // Rotation Handle (stalk + circle button above item)
    const rotStalk = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rotStalk.setAttribute('x1', w / 2);
    rotStalk.setAttribute('y1', -24);
    rotStalk.setAttribute('x2', w / 2);
    rotStalk.setAttribute('y2', -40);
    rotStalk.setAttribute('stroke', '#557763');
    rotStalk.setAttribute('stroke-width', '1.5');
    g.appendChild(rotStalk);

    const rotHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rotHandle.setAttribute('class', 'handle-rotate');
    rotHandle.setAttribute('cx', w / 2);
    rotHandle.setAttribute('cy', -40);
    rotHandle.setAttribute('r', '7.5');
    rotHandle.setAttribute('fill', '#FAF8F5');
    rotHandle.setAttribute('stroke', '#557763');
    rotHandle.setAttribute('stroke-width', '2');
    rotHandle.setAttribute('cursor', 'grab');
    rotHandle.addEventListener('pointerdown', (e) => this.onRotatePointerDown(e));
    g.appendChild(rotHandle);

    // Rotation icon inside handle
    const rotIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rotIcon.setAttribute('x', w / 2);
    rotIcon.setAttribute('y', -37.5);
    rotIcon.setAttribute('text-anchor', 'middle');
    rotIcon.setAttribute('font-size', '8');
    rotIcon.setAttribute('fill', '#557763');
    rotIcon.setAttribute('pointer-events', 'none');
    rotIcon.textContent = '↻';
    g.appendChild(rotIcon);

    // Resize Handles on corners and edges
    const handles = [
      { id: 'se', x: w + 3, y: d + 3, cursor: 'nwse-resize' },
      { id: 'e', x: w + 3, y: d / 2, cursor: 'ew-resize' },
      { id: 's', x: w / 2, y: d + 3, cursor: 'ns-resize' }
    ];

    handles.forEach(h => {
      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      circ.setAttribute('class', `handle-resize handle-${h.id}`);
      circ.setAttribute('x', h.x - 4);
      circ.setAttribute('y', h.y - 4);
      circ.setAttribute('width', '8');
      circ.setAttribute('height', '8');
      circ.setAttribute('fill', '#557763');
      circ.setAttribute('stroke', '#FAF8F5');
      circ.setAttribute('stroke-width', '1.5');
      circ.setAttribute('rx', '2');
      circ.setAttribute('cursor', h.cursor);
      circ.addEventListener('pointerdown', (e) => this.onResizePointerDown(e, h.id));
      g.appendChild(circ);
    });

    this.overlayLayer.appendChild(g);
  }

  // --- Interaction Handlers ---

  onItemPointerDown(e, index) {
    if (e.button !== 0) return; // left click only
    e.stopPropagation();

    this.selectedId = index;
    const it = this.room.items[index];
    this.options.onSelect(it, index);

    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.itemStartPos = { x: it.x, y: it.y };

    e.target.setPointerCapture(e.pointerId);
    this.render();
  }

  onRotatePointerDown(e) {
    if (e.button !== 0) return;
    e.stopPropagation();

    this.isRotating = true;
    const it = this.room.items[this.selectedId];
    // Center of item in room cm
    const cx = it.x + it.w / 2;
    const cy = it.y + it.d / 2;
    this.rotateCenter = { x: cx, y: cy };

    e.target.setPointerCapture(e.pointerId);
  }

  onResizePointerDown(e, handleId) {
    if (e.button !== 0) return;
    e.stopPropagation();

    this.isResizing = true;
    this.resizeHandle = handleId;
    const it = this.room.items[this.selectedId];
    this.itemStartDim = { w: it.w, d: it.d, x: it.x, y: it.y };
    this.dragStart = { x: e.clientX, y: e.clientY };

    e.target.setPointerCapture(e.pointerId);
  }

  bindEvents() {
    // Canvas background pointer down -> panning or deselecting
    this.container.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.furniture-item') || e.target.closest('.handle-rotate') || e.target.closest('.handle-resize')) {
        return;
      }
      // Clicked empty background
      this.selectedId = -1;
      this.options.onSelect(null);
      this.render();

      // Start panning
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
      this.container.style.cursor = 'grabbing';
    });

    // Pointer move across container
    window.addEventListener('pointermove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStart.x;
        this.panY = e.clientY - this.panStart.y;
        this.updateTransform();
        return;
      }

      if (this.isDragging && this.selectedId >= 0) {
        const scale = this.getScale() * this.zoom;
        const dx = (e.clientX - this.dragStart.x) / scale;
        const dy = (e.clientY - this.dragStart.y) / scale;

        let newX = this.itemStartPos.x + dx;
        let newY = this.itemStartPos.y + dy;

        // Snap to grid (10 cm or 25 cm)
        if (this.options.snapToGrid) {
          const step = this.options.gridSize || 25;
          newX = Math.round(newX / step) * step;
          newY = Math.round(newY / step) * step;
        }

        const it = this.room.items[this.selectedId];
        it.x = Math.max(0, Math.min(this.room.width - it.w, newX));
        it.y = Math.max(0, Math.min(this.room.length - it.d, newY));

        this.render();
        this.options.onSelect(it, this.selectedId);
        return;
      }

      if (this.isRotating && this.selectedId >= 0) {
        const pt = this.screenToRoom(e.clientX, e.clientY);
        const it = this.room.items[this.selectedId];
        const rad = Math.atan2(pt.y - this.rotateCenter.y, pt.x - this.rotateCenter.x);
        let deg = (rad * 180) / Math.PI + 90; // offset so top handle is 0
        if (deg < 0) deg += 360;

        // Snap to 15 degrees if Shift is pressed or default 15°
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        } else {
          deg = Math.round(deg / 5) * 5;
        }

        it.rot = Math.round(deg) % 360;
        this.render();
        this.options.onSelect(it, this.selectedId);
        return;
      }

      if (this.isResizing && this.selectedId >= 0) {
        const scale = this.getScale() * this.zoom;
        const dx = (e.clientX - this.dragStart.x) / scale;
        const dy = (e.clientY - this.dragStart.y) / scale;
        const it = this.room.items[this.selectedId];

        const step = this.options.snapToGrid ? 5 : 1;

        if (this.resizeHandle === 'se' || this.resizeHandle === 'e') {
          let nw = Math.max(30, Math.min(300, this.itemStartDim.w + dx));
          it.w = Math.round(nw / step) * step;
        }
        if (this.resizeHandle === 'se' || this.resizeHandle === 's') {
          let nd = Math.max(30, Math.min(300, this.itemStartDim.d + dy));
          it.d = Math.round(nd / step) * step;
        }

        this.render();
        this.options.onSelect(it, this.selectedId);
      }
    });

    // Pointer up
    window.addEventListener('pointerup', (e) => {
      let changed = false;
      if (this.isDragging || this.isRotating || this.isResizing) {
        changed = true;
      }
      this.isDragging = false;
      this.isRotating = false;
      this.isResizing = false;
      this.isPanning = false;
      this.container.style.cursor = 'default';

      if (changed) {
        this.recordState();
      }
    });

    // Wheel zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const rect = this.container.getBoundingClientRect();
      this.setZoom(delta, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in text inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        this.redo();
        return;
      }

      // Delete selected piece
      if (this.selectedId >= 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        this.deleteSelected();
        return;
      }

      // Rotate selected piece (R key rotates 45°)
      if (this.selectedId >= 0 && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        const it = this.room.items[this.selectedId];
        it.rot = ((it.rot || 0) + 45) % 360;
        this.render();
        this.options.onSelect(it, this.selectedId);
        this.recordState();
        return;
      }

      // Arrow keys to nudge selected piece (5cm or 20cm with Shift)
      if (this.selectedId >= 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 25 : 5;
        const it = this.room.items[this.selectedId];

        if (e.key === 'ArrowLeft') it.x = Math.max(0, it.x - step);
        if (e.key === 'ArrowRight') it.x = Math.min(this.room.width - it.w, it.x + step);
        if (e.key === 'ArrowUp') it.y = Math.max(0, it.y - step);
        if (e.key === 'ArrowDown') it.y = Math.min(this.room.length - it.d, it.y + step);

        this.render();
        this.options.onSelect(it, this.selectedId);
        this.recordState();
        return;
      }

      // Deselect on Escape
      if (e.key === 'Escape') {
        this.selectedId = -1;
        this.options.onSelect(null);
        this.render();
      }
    });

    // Window resize observer
    const resizeObserver = new ResizeObserver(() => {
      this.updateTransform();
    });
    resizeObserver.observe(this.container);
  }

  // --- Public Action Methods ---

  addItem(type, customProps = {}) {
    if (!this.room) return;
    const cat = getCatalogData()[type];
    if (!cat) return;

    // Place near center of room
    const targetX = Math.round((this.room.width - cat.width) / 2);
    const targetY = Math.round((this.room.length - cat.depth) / 2);

    const newItem = Object.assign({
      type: type,
      x: targetX,
      y: targetY,
      w: cat.width,
      d: cat.depth,
      rot: 0,
      material: cat.defaultMaterial || 'boucle',
      zIndex: type.startsWith('rug_') ? 1 : 2
    }, customProps);

    this.room.items.push(newItem);
    this.selectedId = this.room.items.length - 1;
    this.render();
    this.options.onSelect(newItem, this.selectedId);
    this.recordState();
    return newItem;
  }

  updateSelectedItem(props) {
    if (this.selectedId < 0 || !this.room.items[this.selectedId]) return;
    Object.assign(this.room.items[this.selectedId], props);
    this.render();
    this.options.onSelect(this.room.items[this.selectedId], this.selectedId);
    this.recordState();
  }

  rotateSelected(degDelta = 45) {
    if (this.selectedId < 0) return;
    const it = this.room.items[this.selectedId];
    it.rot = ((it.rot || 0) + degDelta) % 360;
    this.render();
    this.options.onSelect(it, this.selectedId);
    this.recordState();
  }

  duplicateSelected() {
    if (this.selectedId < 0) return;
    const it = this.room.items[this.selectedId];
    const copy = JSON.parse(JSON.stringify(it));
    copy.x = Math.min(this.room.width - copy.w, copy.x + 20);
    copy.y = Math.min(this.room.length - copy.d, copy.y + 20);
    this.room.items.push(copy);
    this.selectedId = this.room.items.length - 1;
    this.render();
    this.options.onSelect(copy, this.selectedId);
    this.recordState();
  }

  deleteSelected() {
    if (this.selectedId < 0) return;
    this.room.items.splice(this.selectedId, 1);
    this.selectedId = -1;
    this.render();
    this.options.onSelect(null);
    this.recordState();
  }

  bringForward() {
    if (this.selectedId < 0) return;
    const it = this.room.items[this.selectedId];
    it.zIndex = (it.zIndex || 2) + 1;
    this.render();
    this.recordState();
  }

  sendBackward() {
    if (this.selectedId < 0) return;
    const it = this.room.items[this.selectedId];
    it.zIndex = Math.max(1, (it.zIndex || 2) - 1);
    this.render();
    this.recordState();
  }

  // Update room dimensions (width & length in cm)
  updateRoomDimensions(newWidthCm, newLengthCm) {
    if (!this.room) return;
    this.room.width = Math.max(200, Math.min(1500, newWidthCm));
    this.room.length = Math.max(200, Math.min(2000, newLengthCm));
    this.centerView();
    this.render();
    this.recordState();
  }
}

if (typeof window !== 'undefined') {
  window.Planner2D = Planner2D;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Planner2D;
}
