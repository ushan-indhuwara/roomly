// Roomly - 2D Floor Plan Canvas Component
// Architectural SVG rendering, real scale (cm), instant click-select, drag-to-move, 
// floating quick-action toolbar (Rotate, Duplicate, Remove), collision detection, snap-to-grid

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CATALOG, MATERIALS } from '../data/roomData';
import { 
  ZoomIn, ZoomOut, Maximize2, Grid, Magnet, AlertTriangle, 
  RotateCw, Trash2, Copy, ShoppingBag, Move 
} from 'lucide-react';

export default function Planner2D({
  room,
  selectedId,
  onSelectItem,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  unit = 'm',
  onCollisionChange
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [collisions, setCollisions] = useState([]);

  // Dragging state
  const dragRef = useRef(null);
  const rotateRef = useRef(null);
  const resizeRef = useRef(null);
  const panRef = useRef(null);

  const wallThickness = 15; // 15 cm walls

  // Calculate base scale (pixels per cm) to fit room in container
  const getBaseScale = useCallback(() => {
    if (!containerRef.current || !room) return 1;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 450;
    const margin = 70;
    const scaleX = (w - margin * 2) / room.width;
    const scaleY = (h - margin * 2) / room.length;
    return Math.min(scaleX, scaleY, 1.4);
  }, [room]);

  // Center room in viewport
  const centerView = useCallback(() => {
    if (!containerRef.current || !room) return;
    const rect = containerRef.current.getBoundingClientRect();
    const baseScale = getBaseScale();
    const roomPxW = room.width * baseScale;
    const roomPxH = room.length * baseScale;
    setZoom(1.0);
    setPan({
      x: (rect.width - roomPxW) / 2,
      y: (rect.height - roomPxH) / 2
    });
  }, [room, getBaseScale]);

  // Initial centering
  useEffect(() => {
    centerView();
  }, [room?.id, centerView]);

  // Format measurement according to unit
  const formatMeasure = (cm) => {
    if (unit === 'ft') {
      const totalIn = cm / 2.54;
      const feet = Math.floor(totalIn / 12);
      const inches = Math.round(totalIn % 12);
      return `${feet}′ ${inches}″`;
    }
    const m = cm / 100;
    return `${m >= 10 ? m.toFixed(1) : m.toFixed(2)} m`;
  };

  // Check collisions & boundaries
  useEffect(() => {
    if (!room || !room.items) return;
    const collidingSet = new Set();
    const warnings = [];

    const getBounds = (it) => {
      const rad = ((it.rot || 0) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const cx = it.x + it.w / 2;
      const cy = it.y + it.d / 2;
      const bbW = it.w * cos + it.d * sin;
      const bbH = it.w * sin + it.d * cos;
      return {
        x1: cx - bbW / 2,
        y1: cy - bbH / 2,
        x2: cx + bbW / 2,
        y2: cy + bbH / 2
      };
    };

    // 1. Check room bounds
    room.items.forEach(it => {
      const b = getBounds(it);
      const margin = 2;
      if (b.x1 < -margin || b.y1 < -margin || b.x2 > room.width + margin || b.y2 > room.length + margin) {
        collidingSet.add(it.id);
        const name = CATALOG[it.type]?.name || it.type;
        warnings.push(`${name} extends outside room walls`);
      }
    });

    // 2. Check overlap between non-rug items
    for (let i = 0; i < room.items.length; i++) {
      const itA = room.items[i];
      if (itA.type?.startsWith('rug_')) continue;
      const bA = getBounds(itA);

      for (let j = i + 1; j < room.items.length; j++) {
        const itB = room.items[j];
        if (itB.type?.startsWith('rug_')) continue;
        const bB = getBounds(itB);

        const overlapX = Math.min(bA.x2, bB.x2) - Math.max(bA.x1, bB.x1);
        const overlapY = Math.min(bA.y2, bB.y2) - Math.max(bA.y1, bB.y1);

        if (overlapX > 4 && overlapY > 4) {
          collidingSet.add(itA.id);
          collidingSet.add(itB.id);
          const nameA = CATALOG[itA.type]?.name || itA.type;
          const nameB = CATALOG[itB.type]?.name || itB.type;
          warnings.push(`${nameA} overlaps with ${nameB}`);
        }
      }
    }

    const collisionList = Array.from(collidingSet);
    setCollisions(collisionList);
    if (onCollisionChange) onCollisionChange(warnings, collisionList);
  }, [room?.items, room?.width, room?.length, onCollisionChange]);

  // Convert screen coords (clientX, clientY) to room cm
  const screenToRoom = (clientX, clientY) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scale = getBaseScale() * zoom;
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  };

  // Auto-separate overlapping items
  const autoSeparate = () => {
    if (!collisions.length || !room?.items) return;
    const updated = room.items.map(it => {
      if (collisions.includes(it.id)) {
        const cx = room.width / 2;
        const cy = room.length / 2;
        const dx = (cx - it.x) * 0.15;
        const dy = (cy - it.y) * 0.15;
        return {
          ...it,
          x: Math.max(0, Math.min(room.width - it.w, it.x + dx)),
          y: Math.max(0, Math.min(room.length - it.d, it.y + dy))
        };
      }
      return it;
    });
    updated.forEach(item => onUpdateItem(item.id, item));
  };

  // --- Pointer Interaction Handlers ---

  const handlePointerDownBackground = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.furniture-svg-item') || e.target.closest('.handle-ctrl') || e.target.closest('.quick-action-pill')) return;

    onSelectItem(null);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y
    };
  };

  const handlePointerDownItem = (e, item) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectItem(item.id);
    dragRef.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    };
  };

  const handleRotateDown = (e, item) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const scale = getBaseScale() * zoom;
    const cx = item.x + item.w / 2;
    const cy = item.y + item.d / 2;

    rotateRef.current = {
      id: item.id,
      centerRoom: { x: cx, y: cy },
      initialRot: item.rot || 0
    };
  };

  const handleResizeDown = (e, item, handleType) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    resizeRef.current = {
      id: item.id,
      handleType,
      startX: e.clientX,
      startY: e.clientY,
      initialW: item.w,
      initialD: item.d
    };
  };

  // Global pointer move & up
  useEffect(() => {
    const handlePointerMove = (e) => {
      // 1. Panning canvas background
      if (panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setPan({
          x: panRef.current.initialPanX + dx,
          y: panRef.current.initialPanY + dy
        });
        return;
      }

      const scale = getBaseScale() * zoom;

      // 2. Dragging item
      if (dragRef.current) {
        const dx = (e.clientX - dragRef.current.startX) / scale;
        const dy = (e.clientY - dragRef.current.startY) / scale;
        let newX = dragRef.current.initialX + dx;
        let newY = dragRef.current.initialY + dy;

        if (snapToGrid) {
          const step = 10;
          newX = Math.round(newX / step) * step;
          newY = Math.round(newY / step) * step;
        }

        const it = room.items.find(x => x.id === dragRef.current.id);
        if (it) {
          const isFixture = it.type?.startsWith('door') || it.type?.startsWith('window');
          if (isFixture) {
            const L = Math.max(it.w, it.d);
            const T = 16;
            const curCx = newX + it.w / 2;
            const curCy = newY + it.d / 2;

            const distN = curCy;
            const distS = room.length - curCy;
            const distW = curCx;
            const distE = room.width - curCx;
            const minD = Math.min(distN, distS, distW, distE);

            let snappedX, snappedY, snappedW, snappedD;
            if (minD === distS) {
              snappedW = L;
              snappedD = T;
              snappedX = Math.round(Math.max(0, Math.min(room.width - L, curCx - L / 2)));
              snappedY = Math.round(room.length - T);
            } else if (minD === distW) {
              snappedW = T;
              snappedD = L;
              snappedX = 0;
              snappedY = Math.round(Math.max(0, Math.min(room.length - L, curCy - L / 2)));
            } else if (minD === distE) {
              snappedW = T;
              snappedD = L;
              snappedX = Math.round(room.width - T);
              snappedY = Math.round(Math.max(0, Math.min(room.length - L, curCy - L / 2)));
            } else {
              snappedW = L;
              snappedD = T;
              snappedX = Math.round(Math.max(0, Math.min(room.width - L, curCx - L / 2)));
              snappedY = 0;
            }

            onUpdateItem(it.id, {
              x: snappedX,
              y: snappedY,
              w: snappedW,
              d: snappedD,
              rot: 0
            });
            return;
          }

          const rad = ((it.rot || 0) * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rad));
          const sin = Math.abs(Math.sin(rad));
          const bbW = it.w * cos + it.d * sin;
          const bbH = it.w * sin + it.d * cos;

          const minCx = bbW / 2;
          const maxCx = room.width - bbW / 2;
          const minCy = bbH / 2;
          const maxCy = room.length - bbH / 2;

          const desiredCx = newX + it.w / 2;
          const desiredCy = newY + it.d / 2;

          const clampedCx = Math.max(minCx, Math.min(maxCx, desiredCx));
          const clampedCy = Math.max(minCy, Math.min(maxCy, desiredCy));

          onUpdateItem(it.id, {
            x: Math.round(clampedCx - it.w / 2),
            y: Math.round(clampedCy - it.d / 2)
          });
        }
        return;
      }

      // 3. Rotating item
      if (rotateRef.current) {
        const pt = screenToRoom(e.clientX, e.clientY);
        const center = rotateRef.current.centerRoom;
        const rad = Math.atan2(pt.y - center.y, pt.x - center.x);
        let deg = (rad * 180) / Math.PI + 90;
        if (deg < 0) deg += 360;

        if (e.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        } else {
          deg = Math.round(deg / 15) * 15;
        }
        deg = Math.round(deg) % 360;

        const it = room.items.find(x => x.id === rotateRef.current.id);
        if (it) {
          const rotRad = (deg * Math.PI) / 180;
          const cos = Math.abs(Math.cos(rotRad));
          const sin = Math.abs(Math.sin(rotRad));
          const bbW = it.w * cos + it.d * sin;
          const bbH = it.w * sin + it.d * cos;

          const minCx = bbW / 2;
          const maxCx = room.width - bbW / 2;
          const minCy = bbH / 2;
          const maxCy = room.length - bbH / 2;

          const cx = it.x + it.w / 2;
          const cy = it.y + it.d / 2;

          const clampedCx = Math.max(minCx, Math.min(maxCx, cx));
          const clampedCy = Math.max(minCy, Math.min(maxCy, cy));

          onUpdateItem(it.id, {
            rot: deg,
            x: Math.round(clampedCx - it.w / 2),
            y: Math.round(clampedCy - it.d / 2)
          });
        }
        return;
      }

      // 4. Resizing item
      if (resizeRef.current) {
        const dx = (e.clientX - resizeRef.current.startX) / scale;
        const dy = (e.clientY - resizeRef.current.startY) / scale;
        const step = snapToGrid ? 5 : 1;

        const it = room.items.find(x => x.id === resizeRef.current.id);
        if (it) {
          let nw = it.w;
          let nd = it.d;

          if (resizeRef.current.handleType.includes('e')) {
            nw = Math.max(30, Math.min(300, resizeRef.current.initialW + dx));
            nw = Math.round(nw / step) * step;
          }
          if (resizeRef.current.handleType.includes('s')) {
            nd = Math.max(30, Math.min(300, resizeRef.current.initialD + dy));
            nd = Math.round(nd / step) * step;
          }

          onUpdateItem(it.id, { w: nw, d: nd });
        }
      }
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      rotateRef.current = null;
      resizeRef.current = null;
      panRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [zoom, snapToGrid, room, getBaseScale, onUpdateItem]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(prev => Math.max(0.45, Math.min(2.5, prev + delta)));
  };

  const selectedItem = room?.items?.find(x => x.id === selectedId);
  const currentScale = getBaseScale() * zoom;

  return (
    <div 
      className="canvas-container" 
      ref={containerRef}
      onPointerDown={handlePointerDownBackground}
      onWheel={handleWheel}
      style={{ cursor: panRef.current ? 'grabbing' : 'default', position: 'relative' }}
    >
      {/* Collision warning banner */}
      {collisions.length > 0 && (
        <div className="collision-banner">
          <AlertTriangle size={16} />
          <span>{collisions.length} {collisions.length === 1 ? 'piece is' : 'pieces are'} overlapping or out of bounds</span>
          <button 
            className="btn btn-sage-subtle" 
            style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
            onClick={autoSeparate}
          >
            Auto-separate
          </button>
        </div>
      )}



      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="stage-floating-tools">
        <button 
          className={`btn-icon ${showGrid ? 'active' : ''}`} 
          title="Toggle Grid"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid size={16} color={showGrid ? '#466352' : '#88948B'} />
        </button>
        <button 
          className={`btn-icon ${snapToGrid ? 'active' : ''}`} 
          title="Toggle Snap to Grid (10cm)"
          onClick={() => setSnapToGrid(!snapToGrid)}
        >
          <Magnet size={16} color={snapToGrid ? '#466352' : '#88948B'} />
        </button>
        <div style={{ width: 1, height: 20, background: '#ECE8E0', margin: '0 2px' }} />
        <button className="btn-icon" title="Zoom Out" onClick={() => setZoom(z => Math.max(0.45, z - 0.15))}>
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 38, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn-icon" title="Zoom In" onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}>
          <ZoomIn size={16} />
        </button>
        <button className="btn-icon" title="Center & Reset View" onClick={centerView}>
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Main SVG Floor Plan Canvas */}
      <svg className="planner2d-svg">
        <defs>
          <pattern id="svgGridFine" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(70,99,82,0.06)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="svgGridMajor" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#svgGridFine)"/>
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(70,99,82,0.14)" strokeWidth="1"/>
          </pattern>
          <filter id="svgFurnitureShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(29,35,31,0.12)"/>
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${currentScale})`}>
          {/* Room Floor */}
          <rect
            x={0}
            y={0}
            width={room.width}
            height={room.length}
            fill={room.floorColor || (room.floorType === 'wood_walnut' ? '#D6C4B2' : (room.floorType === 'wood_pine' ? '#FAF2E6' : (room.floorType === 'tile_terrazzo' ? '#ECE7DF' : '#F7F3EB')))}
          />

          {/* Grid Layer */}
          {showGrid && (
            <rect
              x={0}
              y={0}
              width={room.width}
              height={room.length}
              fill="url(#svgGridMajor)"
              pointerEvents="none"
            />
          )}

          {/* Subtle wood plank or tile lines */}
          <g opacity="0.25">
            {Array.from({ length: Math.floor(room.width / 35) }).map((_, i) => (
              <line
                key={`plank-${i}`}
                x1={(i + 1) * 35}
                y1={0}
                x2={(i + 1) * 35}
                y2={room.length}
                stroke="#C5BDB0"
                strokeWidth="0.75"
              />
            ))}
          </g>

          {/* Outer Architectural Walls */}
          {/* Top Wall */}
          <rect
            x={-wallThickness}
            y={-wallThickness}
            width={room.width + wallThickness * 2}
            height={wallThickness}
            fill="#27382F"
          />
          {/* Bottom Wall */}
          <rect
            x={-wallThickness}
            y={room.length}
            width={room.width + wallThickness * 2}
            height={wallThickness}
            fill="#27382F"
          />
          {/* Left Wall */}
          <rect
            x={-wallThickness}
            y={0}
            width={wallThickness}
            height={room.length}
            fill="#27382F"
          />
          {/* Right Wall */}
          <rect
            x={room.width}
            y={0}
            width={wallThickness}
            height={room.length}
            fill="#27382F"
          />

          {/* Interior wall finish color lining */}
          <rect
            x={-2}
            y={-2}
            width={room.width + 4}
            height={room.length + 4}
            fill="none"
            stroke={room.wallColor || '#F7F4EC'}
            strokeWidth={3}
            pointerEvents="none"
          />

          {/* Windows (legacy fallback only if no movable window item exists in room) */}
          {!room.items?.some(it => it.type?.startsWith('window')) && (room.windows || []).map((win, idx) => (
            <g key={`win-${idx}`}>
              <rect
                x={win.offset}
                y={-wallThickness}
                width={win.width}
                height={wallThickness}
                fill="#FAF7F0"
              />
              <rect
                x={win.offset + 2}
                y={-wallThickness + 4}
                width={win.width - 4}
                height={wallThickness - 8}
                fill="#A8D5E5"
                stroke="#64B5D6"
                strokeWidth="1"
                rx="1"
              />
              <text
                x={win.offset + win.width / 2}
                y={-wallThickness / 2 + 3}
                textAnchor="middle"
                fontSize="8"
                fontFamily="Plus Jakarta Sans"
                fontWeight="700"
                fill="#1B5B6E"
              >
                WINDOW
              </text>
            </g>
          ))}

          {/* Doors with Swing Arc (legacy fallback only if no movable door item exists in room) */}
          {!room.items?.some(it => it.type?.startsWith('door')) && (room.doors || []).map((door, idx) => (
            <g key={`door-${idx}`}>
              {/* Wall cutout */}
              <rect
                x={door.offset}
                y={room.length}
                width={door.width}
                height={wallThickness}
                fill="#FAF7F0"
              />
              {/* Swing arc */}
              <path
                d={`M ${door.offset + door.width} ${room.length} A ${door.width} ${door.width} 0 0 0 ${door.offset} ${room.length - door.width}`}
                fill="none"
                stroke="#C7A779"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {/* Door leaf */}
              <line
                x1={door.offset}
                y1={room.length}
                x2={door.offset}
                y2={room.length - door.width}
                stroke="#8A6841"
                strokeWidth="3"
              />
            </g>
          ))}

          {/* Dimension Labels */}
          {/* Top Width */}
          <text
            x={room.width / 2}
            y={-wallThickness - 10}
            textAnchor="middle"
            fontSize="11"
            fontFamily="Plus Jakarta Sans"
            fontWeight="600"
            fill="#466352"
          >
            Width: {formatMeasure(room.width)}
          </text>
          {/* Left Length */}
          <text
            x={-wallThickness - 10}
            y={room.length / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${-wallThickness - 10}, ${room.length / 2})`}
            fontSize="11"
            fontFamily="Plus Jakarta Sans"
            fontWeight="600"
            fill="#466352"
          >
            Length: {formatMeasure(room.length)}
          </text>

          {/* Furniture Layer (Rugs first, then others) */}
          {[...room.items]
            .sort((a, b) => {
              const za = a.type?.startsWith('rug_') ? 0 : (a.zIndex || 2);
              const zb = b.type?.startsWith('rug_') ? 0 : (b.zIndex || 2);
              return za - zb;
            })
            .map(it => {
              const cat = CATALOG[it.type] || { name: it.type, icon: '📦' };
              const mat = MATERIALS.find(m => m.id === it.material) || { color: '#E8E3DA' };
              const isSelected = it.id === selectedId;
              const isColliding = collisions.includes(it.id);

              return (
                <g
                  key={it.id}
                  className={`furniture-svg-item ${isSelected ? 'is-selected' : ''} ${isColliding ? 'is-colliding' : ''}`}
                  transform={`translate(${it.x}, ${it.y}) rotate(${it.rot || 0}, ${it.w / 2}, ${it.d / 2})`}
                  filter={isColliding ? 'none' : 'url(#svgFurnitureShadow)'}
                  onPointerDown={(e) => handlePointerDownItem(e, it)}
                  style={{ cursor: 'grab' }}
                >
                  {/* Furniture base body */}
                  <rect
                    x={0}
                    y={0}
                    width={it.w}
                    height={it.d}
                    fill={mat.color}
                    stroke={isColliding ? '#D9534F' : (isSelected ? '#466352' : '#8A8D84')}
                    strokeWidth={isColliding ? '2.5' : (isSelected ? '2.2' : '1.2')}
                    rx={it.type?.startsWith('table_coffee') || it.type?.startsWith('rug') ? 12 : 4}
                  />

                  {/* Architectural detail flourishes based on item type */}
                  {it.type?.startsWith('sofa') && (
                    <>
                      {/* Backrest */}
                      <rect x={0} y={0} width={it.w} height={it.d * 0.28} fill="rgba(0,0,0,0.12)" rx={3} />
                      {/* Left Armrest */}
                      <rect x={0} y={0} width={Math.max(12, it.w * 0.08)} height={it.d} fill="rgba(0,0,0,0.08)" rx={3} />
                      {/* Right Armrest */}
                      <rect x={it.w - Math.max(12, it.w * 0.08)} y={0} width={Math.max(12, it.w * 0.08)} height={it.d} fill="rgba(0,0,0,0.08)" rx={3} />
                    </>
                  )}

                  {it.type?.startsWith('bed') && (
                    <>
                      {/* Headboard */}
                      <rect x={0} y={0} width={it.w} height={it.d * 0.16} fill="rgba(0,0,0,0.18)" rx={2} />
                      {/* Pillows */}
                      <rect x={it.w * 0.08} y={it.d * 0.18} width={it.w * 0.38} height={it.d * 0.18} fill="#FFFFFF" rx={4} />
                      <rect x={it.w * 0.54} y={it.d * 0.18} width={it.w * 0.38} height={it.d * 0.18} fill="#FFFFFF" rx={4} />
                      {/* Fold line */}
                      <line x1={2} y1={it.d * 0.44} x2={it.w - 2} y2={it.d * 0.44} stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />
                    </>
                  )}

                  {it.type?.startsWith('plant') && (
                    <>
                      <circle cx={it.w / 2} cy={it.d / 2} r={(it.w / 2) * 0.8} fill="#4A7C59" />
                      <circle cx={it.w / 2} cy={it.d / 2} r={(it.w / 2) * 0.35} fill="#C8785E" />
                    </>
                  )}

                  {it.type?.startsWith('lamp') && (
                    <>
                      <circle cx={it.w / 2} cy={it.d / 2} r={(it.w / 2) * 0.8} fill="#FFF9E6" stroke="#D4A86A" strokeWidth={1} />
                      <circle cx={it.w / 2} cy={it.d / 2} r={(it.w / 2) * 0.3} fill="#D4A86A" />
                    </>
                  )}

                  {it.type?.startsWith('tv') && (
                    <>
                      <rect x={it.w * 0.04} y={it.d * 0.25} width={it.w * 0.92} height={it.d * 0.45} fill="#1D231F" rx={1} />
                      {it.mountType === 'wall' || (it.elevation !== undefined ? it.elevation : 54) >= 95 ? (
                        /* Rear wall mount bracket */
                        <rect x={it.w * 0.35} y={0} width={it.w * 0.3} height={Math.max(6, it.d * 0.3)} fill="#3A3F3B" rx={1} />
                      ) : (
                        /* Tabletop stand feet */
                        <>
                          <line x1={it.w * 0.2} y1={it.d * 0.08} x2={it.w * 0.2} y2={it.d * 0.92} stroke="#3A3F3B" strokeWidth="2.5" />
                          <line x1={it.w * 0.8} y1={it.d * 0.08} x2={it.w * 0.8} y2={it.d * 0.92} stroke="#3A3F3B" strokeWidth="2.5" />
                        </>
                      )}
                      <line x1={it.w * 0.1} y1={it.d * 0.35} x2={it.w * 0.9} y2={it.d * 0.35} stroke="#555555" strokeWidth="1" />
                    </>
                  )}

                  {it.type?.startsWith('window') && (
                    it.d > it.w ? (
                      <>
                        {/* Architectural Window Casing & Sill (Vertical) */}
                        <rect x={0} y={0} width={it.w} height={it.d} fill="#FAF9F6" stroke="#2B2E2C" strokeWidth="1.5" />
                        <rect x={it.w * 0.2} y={it.d * 0.05} width={it.w * 0.6} height={it.d * 0.9} fill="#D9EDF7" stroke="#68B4D4" strokeWidth="1" rx={1} />
                        <line x1={0} y1={it.d / 2} x2={it.w} y2={it.d / 2} stroke="#2B2E2C" strokeWidth="2" />
                        <line x1={it.x === 0 ? it.w : 0} y1={0} x2={it.x === 0 ? it.w : 0} y2={it.d} stroke="#C8785E" strokeWidth="3" />
                      </>
                    ) : (
                      <>
                        {/* Architectural Window Casing & Sill (Horizontal) */}
                        <rect x={0} y={0} width={it.w} height={it.d} fill="#FAF9F6" stroke="#2B2E2C" strokeWidth="1.5" />
                        <rect x={it.w * 0.05} y={it.d * 0.2} width={it.w * 0.9} height={it.d * 0.55} fill="#D9EDF7" stroke="#68B4D4" strokeWidth="1" rx={1} />
                        <line x1={it.w / 2} y1={0} x2={it.w / 2} y2={it.d} stroke="#2B2E2C" strokeWidth="2" />
                        <line x1={0} y1={it.y === 0 ? it.d : 0} x2={it.w} y2={it.y === 0 ? it.d : 0} stroke="#C8785E" strokeWidth="3" />
                      </>
                    )
                  )}

                  {it.type?.startsWith('door') && (
                    it.d > it.w ? (
                      // Vertical Door (West / East Wall)
                      <>
                        <rect x={0} y={0} width={it.w} height={it.d} fill="#FDFBF7" stroke="#5C4033" strokeWidth="1.2" strokeDasharray="3 3" />
                        <rect x={0} y={0} width={it.w} height={6} fill="#6E533E" stroke="#2B2E2C" strokeWidth="1" rx={1} />
                        <rect x={0} y={it.d - 6} width={it.w} height={6} fill="#6E533E" stroke="#2B2E2C" strokeWidth="1" rx={1} />
                        {it.x === 0 ? (
                          // West wall: swing into room (+X)
                          <>
                            <rect x={it.w} y={3} width={it.d - 12} height={5} fill="#A67C52" stroke="#2B2E2C" strokeWidth="1.4" rx={1} />
                            <path d={`M ${it.w} ${it.d - 6} A ${it.d - 12} ${it.d - 12} 0 0 0 ${it.w + (it.d - 12)} ${6}`} fill="none" stroke="#466352" strokeDasharray="4 3" strokeWidth="1.4" />
                            <circle cx={it.w + (it.d - 12) - 14} cy={5.5} r={3.2} fill="#D4A86A" stroke="#8A6841" strokeWidth="1" />
                          </>
                        ) : (
                          // East wall: swing into room (-X)
                          <>
                            <rect x={-(it.d - 12)} y={3} width={it.d - 12} height={5} fill="#A67C52" stroke="#2B2E2C" strokeWidth="1.4" rx={1} />
                            <path d={`M ${0} ${it.d - 6} A ${it.d - 12} ${it.d - 12} 0 0 1 ${-(it.d - 12)} ${6}`} fill="none" stroke="#466352" strokeDasharray="4 3" strokeWidth="1.4" />
                            <circle cx={-(it.d - 12) + 14} cy={5.5} r={3.2} fill="#D4A86A" stroke="#8A6841" strokeWidth="1" />
                          </>
                        )}
                      </>
                    ) : (
                      // Horizontal Door (North / South Wall)
                      <>
                        <rect x={0} y={0} width={it.w} height={it.d} fill="#FDFBF7" stroke="#5C4033" strokeWidth="1.2" strokeDasharray="3 3" />
                        <rect x={0} y={0} width={6} height={it.d} fill="#6E533E" stroke="#2B2E2C" strokeWidth="1" rx={1} />
                        <rect x={it.w - 6} y={0} width={6} height={it.d} fill="#6E533E" stroke="#2B2E2C" strokeWidth="1" rx={1} />
                        {it.y === 0 ? (
                          // North wall: swing down (+Y)
                          <>
                            <rect x={3} y={it.d} width={5} height={it.w - 12} fill="#A67C52" stroke="#2B2E2C" strokeWidth="1.4" rx={1} />
                            <path d={`M ${it.w - 6} ${it.d} A ${it.w - 12} ${it.w - 12} 0 0 1 ${6} ${it.d + (it.w - 12)}`} fill="none" stroke="#466352" strokeDasharray="4 3" strokeWidth="1.4" />
                            <circle cx={5.5} cy={it.d + (it.w - 12) - 14} r={3.2} fill="#D4A86A" stroke="#8A6841" strokeWidth="1" />
                          </>
                        ) : (
                          // South wall: swing up (-Y)
                          <>
                            <rect x={3} y={-(it.w - 12) + it.d} width={5} height={it.w - 12} fill="#A67C52" stroke="#2B2E2C" strokeWidth="1.4" rx={1} />
                            <path d={`M ${it.w - 6} ${0} A ${it.w - 12} ${it.w - 12} 0 0 0 ${6} ${-(it.w - 12) + it.d}`} fill="none" stroke="#466352" strokeDasharray="4 3" strokeWidth="1.4" />
                            <circle cx={5.5} cy={it.d - (it.w - 12) + 14} r={3.2} fill="#D4A86A" stroke="#8A6841" strokeWidth="1" />
                          </>
                        )}
                      </>
                    )
                  )}

                  {/* Item Label */}
                  {it.w >= 40 && it.d >= 16 && !it.type?.startsWith('rug') && (
                    <text
                      x={it.w / 2}
                      y={it.d / 2 + 3}
                      textAnchor="middle"
                      fontSize={Math.min(10, Math.floor(it.d * 0.22))}
                      fontFamily="Plus Jakarta Sans"
                      fontWeight="600"
                      fill="#202421"
                      pointerEvents="none"
                    >
                      {cat.name.split(' ')[0]}
                    </text>
                  )}

                  {/* Warning circle badge if colliding */}
                  {isColliding && (
                    <g transform={`translate(${it.w - 8}, 8)`}>
                      <circle cx={0} cy={0} r={7} fill="#D9534F" />
                      <text x={0} y={3} textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="800">!</text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* Selected Item Controls Overlay (Bounding box, rotate stalk, resize handles) */}
          {selectedItem && (
            <g
              className="selection-overlay-group"
              transform={`translate(${selectedItem.x}, ${selectedItem.y}) rotate(${selectedItem.rot || 0}, ${selectedItem.w / 2}, ${selectedItem.d / 2})`}
            >
              {/* Dashed selection outline */}
              <rect
                x={-3}
                y={-3}
                width={selectedItem.w + 6}
                height={selectedItem.d + 6}
                fill="none"
                stroke="#466352"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                rx={5}
                pointerEvents="none"
              />

              {/* Dimension pill badge */}
              <g transform={`translate(${selectedItem.w / 2}, -20)`}>
                <rect
                  x={-45}
                  y={-9}
                  width={90}
                  height={18}
                  fill="#1D231F"
                  rx={9}
                />
                <text
                  x={0}
                  y={3}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="Plus Jakarta Sans"
                  fontWeight="600"
                  fill="#FAF8F5"
                >
                  {formatMeasure(selectedItem.w)} × {formatMeasure(selectedItem.d)}
                </text>
              </g>

              {/* Rotate Stalk & Handle */}
              <line
                x1={selectedItem.w / 2}
                y1={-20}
                x2={selectedItem.w / 2}
                y2={-38}
                stroke="#466352"
                strokeWidth="1.5"
              />
              <g
                className="handle-ctrl handle-rotate"
                transform={`translate(${selectedItem.w / 2}, -38)`}
                onPointerDown={(e) => handleRotateDown(e, selectedItem)}
                style={{ cursor: 'grab' }}
              >
                <circle cx={0} cy={0} r={8} fill="#FAF8F5" stroke="#466352" strokeWidth="2" />
                <text x={0} y={2.5} textAnchor="middle" fontSize="9" fill="#466352" pointerEvents="none">↻</text>
              </g>

              {/* Resize Handle: Bottom Right (SE) */}
              <rect
                className="handle-ctrl handle-resize-se"
                x={selectedItem.w - 4}
                y={selectedItem.d - 4}
                width={8}
                height={8}
                fill="#466352"
                stroke="#FAF8F5"
                strokeWidth="1.5"
                rx={2}
                style={{ cursor: 'nwse-resize' }}
                onPointerDown={(e) => handleResizeDown(e, selectedItem, 'se')}
              />
              {/* Resize Handle: Right (E) */}
              <rect
                className="handle-ctrl handle-resize-e"
                x={selectedItem.w - 4}
                y={selectedItem.d / 2 - 4}
                width={8}
                height={8}
                fill="#466352"
                stroke="#FAF8F5"
                strokeWidth="1.5"
                rx={2}
                style={{ cursor: 'ew-resize' }}
                onPointerDown={(e) => handleResizeDown(e, selectedItem, 'e')}
              />
              {/* Resize Handle: Bottom (S) */}
              <rect
                className="handle-ctrl handle-resize-s"
                x={selectedItem.w / 2 - 4}
                y={selectedItem.d - 4}
                width={8}
                height={8}
                fill="#466352"
                stroke="#FAF8F5"
                strokeWidth="1.5"
                rx={2}
                style={{ cursor: 'ns-resize' }}
                onPointerDown={(e) => handleResizeDown(e, selectedItem, 's')}
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
