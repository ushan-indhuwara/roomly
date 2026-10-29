// Roomly - Smart Natural Language Layout Suggestions & Spatial Planner
// Features: Full natural language parsing ("move desk to corner", "i want more space",
// "center table", "rotate chair"), spatial perimeter optimization, corner detection,
// collision-safe wall clamping, and instant designer grouping placements.

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { CATALOG } from '../data/roomData';

const WALL_MARGIN = 20; // 20cm clearance from walls

export const QUICK_SUGGESTIONS = [
  { label: 'Maximize Space', query: 'i want more space', icon: '✨' },
  { label: 'Desk to Corner', query: 'move desk into the corner', icon: '💻' },
  { label: 'Reading Corner', query: 'reading corner', icon: '🪑' },
  { label: 'Work Desk Zone', query: 'workspace desk', icon: '💻' },
  { label: 'Plant Sanctuary', query: 'plant sanctuary with lamp', icon: '🪴' },
  { label: 'Dining Nook', query: 'dining nook table', icon: '🍽️' },
  { label: 'Media Entertainment', query: 'media entertainment console', icon: '📺' }
];

export function solveSpatialCommand(queryText, room, selectedItem) {
  const text = (queryText || '').toLowerCase().trim();
  if (!text) return { success: false, error: 'Please enter a spatial command.' };

  const rw = room?.width || 480;
  const rl = room?.length || 380;
  const items = room?.items || [];

  // Helper: Clamp item bounding box strictly inside room boundaries
  const clampItem = (it, roomW = rw, roomL = rl, margin = WALL_MARGIN) => {
    const rad = ((it.rot || 0) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bbW = Math.round(it.w * cos + it.d * sin);
    const bbD = Math.round(it.w * sin + it.d * cos);

    const maxX = Math.max(margin, roomW - bbW - margin);
    const maxY = Math.max(margin, roomL - bbD - margin);
    const safeX = Math.max(margin, Math.min(maxX, it.x));
    const safeY = Math.max(margin, Math.min(maxY, it.y));

    return {
      ...it,
      x: Math.round(safeX),
      y: Math.round(safeY)
    };
  };

  // Helper: Resolve which item in the room is targeted by the user query
  const resolveTargetItem = (text) => {
    if (!items.length) return null;

    if (selectedItem && (text.includes('this') || text.includes('selected') || text.includes('it') || text.includes('piece'))) {
      return items.find(i => i.id === selectedItem.id);
    }

    if (text.includes('desk') || text.includes('workstation') || text.includes('study table') || text.includes('writing table')) {
      return items.find(i => i.type.startsWith('desk'));
    }

    if (text.includes('sofa') || text.includes('couch') || text.includes('loveseat') || text.includes('lounge')) {
      return items.find(i => i.type.startsWith('sofa'));
    }

    if (text.includes('bed') || text.includes('mattress')) {
      return items.find(i => i.type.startsWith('bed'));
    }

    if (text.includes('coffee table') || text.includes('coffee')) {
      return items.find(i => i.type === 'table_coffee');
    }
    if (text.includes('dining table') || text.includes('dining')) {
      return items.find(i => i.type.startsWith('table_dining'));
    }
    if (text.includes('table')) {
      return items.find(i => i.type.startsWith('table'));
    }

    if (text.includes('armchair') || text.includes('accent chair')) {
      return items.find(i => i.type === 'chair_arm');
    }
    if (text.includes('office chair') || text.includes('desk chair')) {
      return items.find(i => i.type === 'chair_office');
    }
    if (text.includes('dining chair')) {
      return items.find(i => i.type === 'chair_dining');
    }
    if (text.includes('chair')) {
      return items.find(i => i.type.startsWith('chair'));
    }

    if (text.includes('tv') || text.includes('television') || text.includes('screen')) {
      return items.find(i => i.type.startsWith('tv')) || items.find(i => i.type === 'media_console');
    }
    if (text.includes('console') || text.includes('credenza') || text.includes('sideboard') || text.includes('media')) {
      return items.find(i => i.type === 'media_console');
    }

    if (text.includes('bookshelf') || text.includes('bookcase') || text.includes('shelf')) {
      return items.find(i => i.type.startsWith('bookshelf'));
    }
    if (text.includes('wardrobe') || text.includes('closet')) {
      return items.find(i => i.type.startsWith('wardrobe'));
    }
    if (text.includes('nightstand') || text.includes('bedside')) {
      return items.find(i => i.type === 'nightstand');
    }

    if (text.includes('plant') || text.includes('fig') || text.includes('tree') || text.includes('pot')) {
      return items.find(i => i.type.startsWith('plant'));
    }
    if (text.includes('lamp') || text.includes('light')) {
      return items.find(i => i.type.startsWith('lamp'));
    }
    if (text.includes('rug') || text.includes('carpet')) {
      return items.find(i => i.type.startsWith('rug'));
    }
    if (text.includes('window')) {
      return items.find(i => i.type.startsWith('window'));
    }

    if (selectedItem) {
      return items.find(i => i.id === selectedItem.id);
    }

    return null;
  };

  // Helper: Find the best, most spacious corner in the room
  const findBestCorner = (targetItem, cornerPref = null) => {
    const w = targetItem.w || 80;
    const d = targetItem.d || 80;

    const corners = {
      tl: { id: 'tl', name: 'Top-Left', x: WALL_MARGIN, y: WALL_MARGIN },
      tr: { id: 'tr', name: 'Top-Right', x: rw - w - WALL_MARGIN, y: WALL_MARGIN },
      bl: { id: 'bl', name: 'Bottom-Left', x: WALL_MARGIN, y: rl - d - WALL_MARGIN },
      br: { id: 'br', name: 'Bottom-Right', x: rw - w - WALL_MARGIN, y: rl - d - WALL_MARGIN }
    };

    if (cornerPref && corners[cornerPref]) {
      return corners[cornerPref];
    }

    const otherItems = items.filter(i => i.id !== targetItem.id);
    if (!otherItems.length) return corners.tr;

    let bestCorner = corners.tr;
    let maxMinDist = -1;

    Object.values(corners).forEach(c => {
      let minDist = Infinity;
      otherItems.forEach(it => {
        const itDist = Math.hypot(c.x - it.x, c.y - it.y);
        if (itDist < minDist) minDist = itDist;
      });
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestCorner = c;
      }
    });

    return bestCorner;
  };

  const parseCornerPref = (text) => {
    if (text.includes('top left') || text.includes('upper left') || text.includes('northwest') || text.includes('north-west')) return 'tl';
    if (text.includes('top right') || text.includes('upper right') || text.includes('northeast') || text.includes('north-east')) return 'tr';
    if (text.includes('bottom left') || text.includes('lower left') || text.includes('southwest') || text.includes('south-west')) return 'bl';
    if (text.includes('bottom right') || text.includes('lower right') || text.includes('southeast') || text.includes('south-east')) return 'br';
    return null;
  };

  const parseWallPref = (text) => {
    if (text.includes('top wall') || text.includes('north wall') || text.includes('back wall') || text.includes('north') || text.includes('top')) return 'north';
    if (text.includes('bottom wall') || text.includes('south wall') || text.includes('front wall') || text.includes('south') || text.includes('bottom')) return 'south';
    if (text.includes('left wall') || text.includes('west wall') || text.includes('west') || text.includes('left')) return 'west';
    if (text.includes('right wall') || text.includes('east wall') || text.includes('east') || text.includes('right')) return 'east';
    return 'nearest';
  };

  // Comprehensive Spatial Optimizer: Maximizes central open space & clears walkways
  const maximizeRoomSpace = () => {
    const updated = items.map(it => ({ ...it }));

    let bed = updated.find(i => i.type.startsWith('bed'));
    let sofa = updated.find(i => i.type.startsWith('sofa'));
    let desk = updated.find(i => i.type.startsWith('desk'));
    let officeChair = updated.find(i => i.type === 'chair_office');
    let mediaConsole = updated.find(i => i.type === 'media_console');
    let tv = updated.find(i => i.type.startsWith('tv'));
    let coffeeTable = updated.find(i => i.type === 'table_coffee');
    let rug = updated.find(i => i.type.startsWith('rug'));
    let diningTable = updated.find(i => i.type.startsWith('table_dining'));
    let diningChairs = updated.filter(i => i.type === 'chair_dining');
    let armchairs = updated.filter(i => i.type === 'chair_arm');
    let bookshelves = updated.filter(i => i.type.startsWith('bookshelf'));
    let wardrobes = updated.filter(i => i.type.startsWith('wardrobe'));
    let nightstands = updated.filter(i => i.type === 'nightstand');
    let plants = updated.filter(i => i.type.startsWith('plant'));
    let lamps = updated.filter(i => i.type.startsWith('lamp'));

    // 1. Bed: Anchor flush against North (top) wall, centered
    if (bed) {
      bed.x = Math.round((rw - bed.w) / 2);
      bed.y = WALL_MARGIN;
      bed.rot = 0;

      nightstands.forEach((ns, idx) => {
        if (idx === 0) {
          ns.x = Math.max(WALL_MARGIN, bed.x - ns.w - 10);
        } else {
          ns.x = Math.min(rw - ns.w - WALL_MARGIN, bed.x + bed.w + 10);
        }
        ns.y = WALL_MARGIN;
        ns.rot = 0;
      });
    }

    // 2. Sofa: Anchor along South (bottom) wall facing into the room
    if (sofa) {
      sofa.x = Math.round((rw - sofa.w) / 2);
      sofa.y = rl - sofa.d - WALL_MARGIN;
      sofa.rot = 180;

      if (coffeeTable) {
        coffeeTable.x = Math.round((rw - coffeeTable.w) / 2);
        coffeeTable.y = sofa.y - coffeeTable.d - 35;
        coffeeTable.rot = 0;
      }

      if (rug) {
        rug.x = Math.round((rw - rug.w) / 2);
        rug.y = rl - rug.d - WALL_MARGIN;
        rug.rot = 0;
      }
    } else if (rug && bed) {
      rug.x = Math.round((rw - rug.w) / 2);
      rug.y = bed.y + bed.d - Math.round(rug.d * 0.4);
      rug.rot = 0;
    }

    // 3. Media Console & TV
    if (mediaConsole) {
      if (!bed) {
        mediaConsole.x = Math.round((rw - mediaConsole.w) / 2);
        mediaConsole.y = WALL_MARGIN;
        mediaConsole.rot = 0;
      } else {
        mediaConsole.x = rw - mediaConsole.w - WALL_MARGIN;
        mediaConsole.y = Math.round((rl - mediaConsole.d) / 2);
        mediaConsole.rot = 270;
      }

      if (tv) {
        tv.x = mediaConsole.x + Math.round((mediaConsole.w - tv.w) / 2);
        tv.y = mediaConsole.y + Math.round((mediaConsole.d - tv.d) / 2);
        tv.rot = mediaConsole.rot;
      }
    }

    // 4. Desk: push into Top-Right corner
    if (desk) {
      desk.x = rw - desk.w - WALL_MARGIN;
      desk.y = WALL_MARGIN;
      desk.rot = 0;

      if (officeChair) {
        officeChair.x = desk.x + Math.round((desk.w - officeChair.w) / 2);
        officeChair.y = desk.y + desk.d + 10;
        officeChair.rot = 0;
      }
    }

    // 5. Dining Table: push along East wall
    if (diningTable) {
      diningTable.x = rw - diningTable.w - WALL_MARGIN;
      diningTable.y = Math.round((rl - diningTable.d) / 2);
      diningTable.rot = 0;

      diningChairs.forEach((ch, cIndex) => {
        if (cIndex === 0) {
          ch.x = diningTable.x - ch.w - 10;
          ch.y = diningTable.y + Math.round((diningTable.d - ch.d) / 2);
          ch.rot = 90;
        } else if (cIndex === 1) {
          ch.x = diningTable.x + Math.round((diningTable.w - ch.w) / 2);
          ch.y = diningTable.y - ch.d - 10;
          ch.rot = 180;
        }
      });
    }

    // 6. Wardrobes & Bookshelves: push flat against West wall
    let westOffset = WALL_MARGIN;
    [...wardrobes, ...bookshelves].forEach(storage => {
      storage.x = WALL_MARGIN;
      storage.y = Math.min(rl - storage.d - WALL_MARGIN, westOffset);
      storage.rot = 90;
      westOffset += storage.d + 20;
    });

    // 7. Armchairs: tuck into corners at 45-degree angle
    armchairs.forEach((ac, aIdx) => {
      if (aIdx === 0) {
        ac.x = WALL_MARGIN + 15;
        ac.y = rl - ac.d - WALL_MARGIN - 15;
        ac.rot = 45;
      } else {
        ac.x = rw - ac.w - WALL_MARGIN - 15;
        ac.y = rl - ac.d - WALL_MARGIN - 15;
        ac.rot = 315;
      }
    });

    // 8. Plants & Floor Lamps: tuck cleanly into corners
    plants.forEach((p, idx) => {
      if (idx === 0) {
        p.x = rw - p.w - WALL_MARGIN;
        p.y = rl - p.d - WALL_MARGIN;
      } else {
        p.x = WALL_MARGIN;
        p.y = rl - p.d - WALL_MARGIN;
      }
    });

    lamps.forEach((l, idx) => {
      if (idx === 0) {
        l.x = WALL_MARGIN + 10;
        l.y = rl - l.d - WALL_MARGIN - 35;
      } else {
        l.x = rw - l.w - WALL_MARGIN - 10;
        l.y = WALL_MARGIN + 15;
      }
    });

    return updated.map(it => clampItem(it));
  };

  let updatedItems = [...items];
  let message = '';

  // =========================================================================
  // 1. SPACE OPTIMIZATION INTENT ("i want more space", "more space", "clear floor")
  // =========================================================================
  const isSpaceIntent = /space|open|clear|spacious|perimeter|walkway|declutter|roomy|traffic/.test(text);
  const isAllFurniture = /all|everything|furniture|room/.test(text);

  if (isSpaceIntent || (isAllFurniture && /wall|push|move|tidy/.test(text))) {
    const optimized = maximizeRoomSpace();
    return {
      success: true,
      items: optimized,
      message: 'Maximized open floor space! Arranged furniture along perimeter walls and cleared central walkways.'
    };
  }

    // =========================================================================
    // 2. TARGET IDENTIFICATION & CORNER INTENT ("move desk into the corner")
    // =========================================================================
    const target = resolveTargetItem(text);

    if (text.includes('corner') || text.includes('nook')) {
      if (target) {
        const cornerPref = parseCornerPref(text);
        const bestCorner = findBestCorner(target, cornerPref);
        const targetIdx = updatedItems.findIndex(i => i.id === target.id);

        if (targetIdx !== -1) {
          updatedItems[targetIdx] = {
            ...updatedItems[targetIdx],
            x: bestCorner.x,
            y: bestCorner.y
          };

          if (target.type.startsWith('desk')) {
            const chair = updatedItems.find(i => i.type === 'chair_office');
            if (chair) {
              chair.x = bestCorner.x + Math.round((target.w - chair.w) / 2);
              chair.y = bestCorner.y + target.d + 10;
              chair.rot = 0;
            }
          }

          const safe = updatedItems.map(it => clampItem(it));
          const catName = CATALOG[target.type]?.name || 'Piece';
          return {
            success: true,
            items: safe,
            message: `Moved ${catName} into the ${bestCorner.name} corner with clean wall clearance!`
          };
        }
      } else {
        if (text.includes('desk') || text.includes('work') || text.includes('office')) {
          const deskW = 140;
          const deskD = 70;
          const cornerX = rw - deskW - WALL_MARGIN;
          const cornerY = WALL_MARGIN;

          const newDesk = {
            id: `desk-${Date.now()}-1`,
            type: 'desk_large',
            x: cornerX,
            y: cornerY,
            w: deskW,
            d: deskD,
            rot: 0,
            material: 'oak',
            zIndex: 2
          };

          const newChair = {
            id: `chair-${Date.now()}-2`,
            type: 'chair_office',
            x: cornerX + Math.round((deskW - 62) / 2),
            y: cornerY + deskD + 10,
            w: 62,
            d: 62,
            rot: 0,
            material: 'charcoal',
            zIndex: 3
          };

          const safe = [...updatedItems, newDesk, newChair].map(it => clampItem(it));
          return {
            success: true,
            items: safe,
            message: 'Added and positioned Solid Oak Desk & Ergonomic Chair in the corner!'
          };
        }
      }
    }

    // =========================================================================
    // 3. WALL INTENT ("move sofa against wall", "put bed against north wall")
    // =========================================================================
    if (text.includes('wall') || text.includes('side') || text.includes('edge')) {
      if (target) {
        const wall = parseWallPref(text);
        const targetIdx = updatedItems.findIndex(i => i.id === target.id);
        if (targetIdx !== -1) {
          if (wall === 'north') {
            updatedItems[targetIdx].y = WALL_MARGIN;
            updatedItems[targetIdx].rot = 0;
          } else if (wall === 'south') {
            updatedItems[targetIdx].y = rl - target.d - WALL_MARGIN;
            updatedItems[targetIdx].rot = 180;
          } else if (wall === 'west') {
            updatedItems[targetIdx].x = WALL_MARGIN;
            updatedItems[targetIdx].rot = 90;
          } else if (wall === 'east') {
            updatedItems[targetIdx].x = rw - target.w - WALL_MARGIN;
            updatedItems[targetIdx].rot = 270;
          } else {
            const distTop = target.y;
            const distBottom = rl - (target.y + target.d);
            const distLeft = target.x;
            const distRight = rw - (target.x + target.w);
            const min = Math.min(distTop, distBottom, distLeft, distRight);
            if (min === distTop) updatedItems[targetIdx].y = WALL_MARGIN;
            else if (min === distBottom) updatedItems[targetIdx].y = rl - target.d - WALL_MARGIN;
            else if (min === distLeft) updatedItems[targetIdx].x = WALL_MARGIN;
            else updatedItems[targetIdx].x = rw - target.w - WALL_MARGIN;
          }

          const safe = updatedItems.map(it => clampItem(it));
          const catName = CATALOG[target.type]?.name || 'Piece';
          return {
            success: true,
            items: safe,
            message: `Aligned ${catName} flush against the wall!`
          };
        }
      }
    }

    // =========================================================================
    // 4. CENTERING INTENT ("center the table", "move sofa to center")
    // =========================================================================
    if (text.includes('center') || text.includes('middle') || text.includes('centre')) {
      if (target) {
        const targetIdx = updatedItems.findIndex(i => i.id === target.id);
        if (targetIdx !== -1) {
          updatedItems[targetIdx].x = Math.round((rw - target.w) / 2);
          if (text.includes('room') || text.includes('middle')) {
            updatedItems[targetIdx].y = Math.round((rl - target.d) / 2);
          }

          if (target.type.startsWith('sofa')) {
            const ct = updatedItems.find(i => i.type === 'table_coffee');
            if (ct) {
              ct.x = Math.round((rw - ct.w) / 2);
              ct.y = updatedItems[targetIdx].y + (updatedItems[targetIdx].rot === 180 ? -ct.d - 35 : target.d + 35);
            }
          }

          const safe = updatedItems.map(it => clampItem(it));
          const catName = CATALOG[target.type]?.name || 'Piece';
          return {
            success: true,
            items: safe,
            message: `Centered ${catName} in the room!`
          };
        }
      }
    }

    // =========================================================================
    // 5. ROTATION INTENT ("rotate chair 90", "turn sofa to face room")
    // =========================================================================
    if (text.includes('rotate') || text.includes('turn') || text.includes('spin') || text.includes('face') || text.includes('flip')) {
      if (target) {
        const targetIdx = updatedItems.findIndex(i => i.id === target.id);
        if (targetIdx !== -1) {
          let deg = 90;
          if (text.includes('180') || text.includes('flip') || text.includes('opposite')) deg = 180;
          else if (text.includes('270')) deg = 270;
          else if (text.includes('45')) deg = 45;

          updatedItems[targetIdx].rot = ((updatedItems[targetIdx].rot || 0) + deg) % 360;

          const safe = updatedItems.map(it => clampItem(it));
          const catName = CATALOG[target.type]?.name || 'Piece';
          return {
            success: true,
            items: safe,
            message: `Rotated ${catName} by ${deg}°!`
          };
        }
      }
    }

    // =========================================================================
    // 6. CURATED DESIGNER GROUPINGS (Add new coordinated furniture sets)
    // =========================================================================
    let newItems = [];

    if (/reading|cozy|armchair|book/.test(text)) {
      const chairW = 82;
      const chairD = 82;
      const chairX = rw - chairW - 35;
      const chairY = rl - chairD - 35;

      newItems.push({
        id: `assist-${Date.now()}-1`,
        type: 'chair_arm',
        x: chairX,
        y: chairY,
        w: chairW,
        d: chairD,
        rot: 45,
        material: 'terracotta',
        zIndex: 2
      });

      newItems.push({
        id: `assist-${Date.now()}-2`,
        type: 'lamp_floor',
        x: Math.max(20, chairX - 40),
        y: Math.max(20, chairY - 10),
        w: 45,
        d: 45,
        rot: 0,
        material: 'brass',
        zIndex: 3
      });

      newItems.push({
        id: `assist-${Date.now()}-3`,
        type: 'rug_runner',
        x: Math.max(20, chairX - 90),
        y: Math.max(20, chairY - 20),
        w: 160,
        d: 90,
        rot: 0,
        material: 'boucle',
        zIndex: 1
      });

      message = 'Arranged cozy reading nook with accent armchair, brass lamp, and runner rug!';

    } else if (/desk|work|office|study|laptop|pc/.test(text)) {
      const deskW = 140;
      const deskD = 65;
      const posX = Math.max(25, rw - deskW - 35);
      const posY = 35;

      newItems.push({
        id: `assist-${Date.now()}-1`,
        type: 'desk_large',
        x: posX,
        y: posY,
        w: deskW,
        d: deskD,
        rot: 0,
        material: 'oak',
        zIndex: 2
      });

      newItems.push({
        id: `assist-${Date.now()}-2`,
        type: 'chair_office',
        x: posX + Math.round((deskW - 62) / 2),
        y: posY + deskD + 12,
        w: 62,
        d: 62,
        rot: 0,
        material: 'charcoal',
        zIndex: 3
      });

      message = 'Positioned focused oak workspace with ergonomic chair inside wall clearances!';

    } else if (/plant|nature|green|botanical|oasis/.test(text)) {
      newItems.push({
        id: `assist-${Date.now()}-1`,
        type: 'plant_large',
        x: Math.max(25, rw - 75),
        y: 35,
        w: 50,
        d: 50,
        rot: 0,
        material: 'sage',
        zIndex: 3
      });

      newItems.push({
        id: `assist-${Date.now()}-2`,
        type: 'lamp_floor',
        x: 35,
        y: Math.max(25, rl - 75),
        w: 45,
        d: 45,
        rot: 0,
        material: 'brass',
        zIndex: 3
      });

      message = 'Placed biophilic statement plant & ambient floor lamp in clear room corners!';

    } else if (/dining|nook|eat|bistro|table/.test(text)) {
      const tableW = 110;
      const centerX = Math.round((rw - tableW) / 2);
      const centerY = Math.round((rl - tableW) / 2);

      newItems.push({
        id: `assist-${Date.now()}-1`,
        type: 'table_dining_round',
        x: centerX,
        y: centerY,
        w: tableW,
        d: tableW,
        rot: 0,
        material: 'oak',
        zIndex: 2
      });

      newItems.push({
        id: `assist-${Date.now()}-2`,
        type: 'chair_dining',
        x: centerX + Math.round((tableW - 48) / 2),
        y: centerY - 55,
        w: 48,
        d: 52,
        rot: 180,
        material: 'boucle',
        zIndex: 2
      });

      newItems.push({
        id: `assist-${Date.now()}-3`,
        type: 'chair_dining',
        x: centerX + Math.round((tableW - 48) / 2),
        y: centerY + tableW + 8,
        w: 48,
        d: 52,
        rot: 0,
        material: 'boucle',
        zIndex: 2
      });

      message = 'Placed circular dining table with dual upholstered chairs!';

    } else if (/entertainment|media|tv|credenza|console/.test(text)) {
      const consoleW = Math.min(160, rw - 50);
      const posX = Math.round((rw - consoleW) / 2);
      const posY = rl - 65;

      newItems.push({
        id: `assist-${Date.now()}-1`,
        type: 'media_console',
        x: posX,
        y: posY,
        w: consoleW,
        d: 45,
        rot: 0,
        material: 'walnut',
        zIndex: 2
      });

      newItems.push({
        id: `assist-${Date.now()}-2`,
        type: 'tv_unit',
        x: posX + Math.round((consoleW - 145) / 2),
        y: posY + 10,
        w: 145,
        d: 20,
        rot: 0,
        elevation: 54,
        material: 'charcoal',
        zIndex: 3
      });

      message = 'Placed low media credenza & 65" 4K OLED TV along the main viewing wall!';

    } else {
      return {
        success: false,
        error: `We don't have an automated layout rule for "${text}" yet. Try: "move desk into corner", "i want more space", or one of the quick suggestions below:`
      };
    }

    const safe = newItems.map(it => clampItem(it));
    return {
      success: true,
      items: safe,
      message
    };
}

export default function AIAssistant({ room, selectedItem, onApplySuggestions, onNotify }) {
  const [prompt, setPrompt] = useState('');
  const [lastApplied, setLastApplied] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  const handleApply = (queryText) => {
    const text = (queryText || prompt).trim();
    if (!text) return;

    const res = solveSpatialCommand(text, room, selectedItem);
    if (!res.success) {
      setErrorNotice(res.error);
      return;
    }

    setErrorNotice(null);
    onApplySuggestions(res.items);
    setLastApplied({ query: text, message: res.message, type: 'spatial' });
    setPrompt('');
    if (onNotify) onNotify(res.message);
  };

  return (
    <div className="assistant-panel" aria-label="Smart Layout Suggestions">
      {/* Honest Header */}
      <div className="assistant-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <Sparkles size={16} color="#466352" />
          <span style={{ fontWeight: 700 }}>Layout Suggestions</span>
        </div>
        <span className="assistant-rule-badge">
          Smart Spatial Rules
        </span>
      </div>

      {/* Input box */}
      <div className="assistant-prompt-box">
        <input
          type="text"
          className="assistant-input"
          placeholder="e.g. Move desk into corner, I want more space..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (errorNotice) setErrorNotice(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
          aria-label="Layout suggestion prompt"
        />
        <button 
          className="btn btn-primary assistant-submit-btn"
          onClick={() => handleApply()}
          title="Apply layout grouping or command"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Graceful Feedback when prompt is unmatched */}
      {errorNotice && (
        <div className="assistant-error-notice">
          <AlertCircle size={14} color="#C8785E" style={{ flexShrink: 0 }} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Quick Suggestion Chips */}
      <div className="quick-prompts-label">Instant Designer Actions:</div>
      <div className="quick-prompts">
        {QUICK_SUGGESTIONS.map((item, i) => (
          <button
            key={i}
            type="button"
            className="quick-prompt-chip"
            onClick={() => handleApply(item.query)}
            title={`Run ${item.label}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Confirmation feedback */}
      {lastApplied && (
        <div className="assistant-applied-box">
          <CheckCircle2 size={14} color="#466352" style={{ flexShrink: 0 }} />
          <span>{lastApplied.message}</span>
        </div>
      )}
    </div>
  );
}
