// Roomly - Export & Import Utilities: Multi-Page PDF Spec Sheet (2D Plan + 4x 3D Renders), JSON, OBJ 3D Model, and URL sharing

import { jsPDF } from 'jspdf';
import { CATALOG } from '../data/roomData';
import { renderRoomSnapshots } from './threeSceneBuilder';

export async function exportDesignPDF(room, unit = 'm') {
  // 1. Generate multi-angle 3D renders offscreen
  let snapshots = null;
  try {
    snapshots = await renderRoomSnapshots(room);
  } catch (err) {
    console.error('Error generating 3D snapshots for PDF:', err);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const wDisplay = unit === 'ft' ? (room.width / 30.48).toFixed(1) + ' ft' : (room.width / 100).toFixed(2) + ' m';
  const lDisplay = unit === 'ft' ? (room.length / 30.48).toFixed(1) + ' ft' : (room.length / 100).toFixed(2) + ' m';
  const areaM2 = ((room.width / 100) * (room.length / 100)).toFixed(1);
  const areaSqFt = Math.round((room.width / 30.48) * (room.length / 30.48));
  const areaDisplay = `${areaM2} m² (${areaSqFt} sq ft)`;

  const totalCost = (room.items || []).reduce((acc, it) => {
    const cat = CATALOG[it.type];
    return acc + (cat?.price || 0);
  }, 0);

  // ==========================================
  // PAGE 1: 2D ARCHITECTURAL SCALE BLUEPRINT
  // ==========================================
  
  // 1. Header Banner
  doc.setFillColor(59, 87, 69); // Sage-700
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ROOMLY  •  ARCHITECTURAL ROOM SPECIFICATION & BLUEPRINT', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Scale Floor Plan & Spec Sheet', pageWidth - margin, 14, { align: 'right' });

  // 2. Room Info Card
  let curY = 28;
  doc.setFillColor(248, 246, 242);
  doc.setDrawColor(225, 220, 210);
  doc.roundedRect(margin, curY, contentWidth, 24, 3, 3, 'FD');

  doc.setTextColor(29, 35, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(room.name || 'Custom Room', margin + 6, curY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 109, 101);
  doc.text(`Dimensions: ${wDisplay} × ${lDisplay}   •   Area: ${areaDisplay}`, margin + 6, curY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 87, 69);
  doc.setFontSize(10);
  doc.text(`Total Pieces: ${(room.items || []).length}`, pageWidth - margin - 6, curY + 9, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Est. Budget: $${totalCost.toLocaleString()}`, pageWidth - margin - 6, curY + 17, { align: 'right' });

  // 3. 2D Floor Plan Drawing Box
  curY = 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 35, 31);
  doc.text('1. ARCHITECTURAL 2D SCALE BLUEPRINT (TOP-DOWN FLOOR PLAN)', margin, curY);

  curY += 4;
  const planBoxHeight = 150;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(margin, curY, contentWidth, planBoxHeight, 3, 3, 'FD');

  // Grid
  doc.setDrawColor(244, 240, 234);
  doc.setLineWidth(0.2);
  for (let gx = margin + 6; gx < margin + contentWidth - 6; gx += 8) {
    doc.line(gx, curY + 5, gx, curY + planBoxHeight - 5);
  }
  for (let gy = curY + 5; gy < curY + planBoxHeight - 5; gy += 8) {
    doc.line(margin + 6, gy, margin + contentWidth - 6, gy);
  }

  // Room Scale Calculation
  const availW = contentWidth - 36;
  const availH = planBoxHeight - 34;
  const scale = Math.min(availW / room.width, availH / room.length);

  const roomBoxW = room.width * scale;
  const roomBoxH = room.length * scale;
  const roomOriginX = margin + (contentWidth - roomBoxW) / 2;
  const roomOriginY = curY + (planBoxHeight - roomBoxH) / 2;

  // Floor
  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(205, 200, 190);
  doc.setLineWidth(0.4);
  doc.rect(roomOriginX, roomOriginY, roomBoxW, roomBoxH, 'FD');

  // Walls
  doc.setDrawColor(39, 56, 47);
  doc.setLineWidth(2.2);
  doc.rect(roomOriginX, roomOriginY, roomBoxW, roomBoxH, 'D');

  // Windows
  (room.windows || []).forEach(win => {
    doc.setDrawColor(70, 160, 200);
    doc.setLineWidth(3.0);
    const winX = roomOriginX + win.offset * scale;
    const winW = win.width * scale;
    doc.line(winX, roomOriginY, winX + winW, roomOriginY);
  });

  // Doors
  (room.doors || []).forEach(door => {
    const doorX = roomOriginX + door.offset * scale;
    const doorW = door.width * scale;
    doc.setDrawColor(250, 247, 242);
    doc.setLineWidth(3.2);
    doc.line(doorX, roomOriginY + roomBoxH, doorX + doorW, roomOriginY + roomBoxH);
    doc.setDrawColor(180, 140, 90);
    doc.setLineWidth(0.6);
    doc.line(doorX, roomOriginY + roomBoxH, doorX, roomOriginY + roomBoxH - doorW);
  });

  // Furniture Items
  (room.items || []).forEach(it => {
    const cat = CATALOG[it.type] || {};
    const itX = roomOriginX + it.x * scale;
    const itY = roomOriginY + it.y * scale;
    const itW = it.w * scale;
    const itH = it.d * scale;

    if (it.type?.startsWith('rug')) {
      doc.setFillColor(235, 230, 222);
      doc.setDrawColor(200, 195, 185);
      doc.setLineWidth(0.3);
    } else if (it.type?.startsWith('tv')) {
      doc.setFillColor(32, 36, 34);
      doc.setDrawColor(18, 22, 20);
      doc.setLineWidth(0.5);
    } else {
      doc.setFillColor(242, 238, 230);
      doc.setDrawColor(70, 99, 82);
      doc.setLineWidth(0.4);
    }

    doc.rect(itX, itY, itW, itH, 'FD');

    if (itW > 8 && itH > 5) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(itW > 18 ? 7 : 5.5);
      const isDark = it.type?.startsWith('tv');
      doc.setTextColor(isDark ? 255 : 40, isDark ? 255 : 45, isDark ? 255 : 42);
      const shortName = (cat.name || it.type).split(' ')[0];
      doc.text(shortName, itX + itW / 2, itY + itH / 2 + 1.5, { align: 'center' });
    }
  });

  // Dimension indicators outside room
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(70, 99, 82);
  doc.text(`Width: ${wDisplay}`, roomOriginX + roomBoxW / 2, roomOriginY - 3, { align: 'center' });
  doc.text(`Length: ${lDisplay}`, roomOriginX - 3.5, roomOriginY + roomBoxH / 2, { align: 'right' });

  // 4. Room Finishes & Color Palette Box
  curY += planBoxHeight + 8;
  doc.setFillColor(248, 246, 242);
  doc.setDrawColor(225, 220, 210);
  doc.roundedRect(margin, curY, contentWidth, 26, 3, 3, 'FD');

  doc.setTextColor(29, 35, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROJECT PALETTE & FINISHES', margin + 6, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 80, 75);
  doc.text(`Wall Paint Color: ${room.wallColor || '#F7F4EC'}`, margin + 6, curY + 14);
  doc.text(`Floor Finish: ${room.floorType || 'wood_oak'} (${room.floorColor || 'Standard'})`, margin + 6, curY + 20);

  doc.setTextColor(110, 120, 115);
  doc.text('• Page 2: Multi-Angle 3D Photorealistic Visualization Suite (4 Views)', margin + 95, curY + 14);
  doc.text('• Page 3: Furniture Procurement Schedule & Budget Breakdown', margin + 95, curY + 20);

  // Page 1 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 145, 140);
  doc.text('Page 1 of 3  •  Architectural 2D Scale Blueprint  •  Roomly Studio', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // ==========================================
  // PAGE 2: 3D PHOTOREALISTIC VISUALIZATION SUITE (4 VIEWS)
  // ==========================================
  doc.addPage();

  // 1. Header Banner
  doc.setFillColor(59, 87, 69);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ROOMLY  •  3D MULTI-ANGLE VISUALIZATION SUITE', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Photorealistic Multi-Perspective Renders', pageWidth - margin, 14, { align: 'right' });

  curY = 28;
  doc.setTextColor(70, 80, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Architectural 3D perspective renders showing full 4-wall enclosure, cutaway open view, aerial top plan, and walk-in eye-level.', margin, curY);

  curY += 6;

  // 2x2 Grid of 3D Renders
  const gridW = (contentWidth - 6) / 2;
  const gridH = 108;
  const imgH = 88;

  if (snapshots) {
    // Top-Left: 3D with 4 Walls
    const x1 = margin;
    const y1 = curY;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 215, 205);
    doc.roundedRect(x1, y1, gridW, gridH, 2, 2, 'FD');
    doc.addImage(snapshots.fourWallsImg, 'JPEG', x1 + 2, y1 + 2, gridW - 4, imgH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 35, 31);
    doc.text('1. 3D PERSPECTIVE  •  ALL 4 WALLS (ENCLOSED)', x1 + 4, y1 + imgH + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 115);
    doc.text('Fully enclosed room showing all 4 architectural walls & finishes.', x1 + 4, y1 + imgH + 13);

    // Top-Right: 3D with 2 Walls (Cutaway)
    const x2 = margin + gridW + 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 215, 205);
    doc.roundedRect(x2, y1, gridW, gridH, 2, 2, 'FD');
    doc.addImage(snapshots.twoWallsImg, 'JPEG', x2 + 2, y1 + 2, gridW - 4, imgH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 35, 31);
    doc.text('2. 3D PERSPECTIVE  •  CUTAWAY (2 WALLS OPEN)', x2 + 4, y1 + imgH + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 115);
    doc.text('Open cutaway viewing showing full spatial furniture arrangement.', x2 + 4, y1 + imgH + 13);

    // Bottom-Left: 3D Top-Down View
    const y2 = curY + gridH + 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 215, 205);
    doc.roundedRect(x1, y2, gridW, gridH, 2, 2, 'FD');
    doc.addImage(snapshots.topImg, 'JPEG', x1 + 2, y2 + 2, gridW - 4, imgH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 35, 31);
    doc.text('3. 3D TOP-DOWN PLAN  •  AERIAL CAMERA VIEW', x1 + 4, y2 + imgH + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 115);
    doc.text('Orthogonal aerial view showing circulation paths and clearances.', x1 + 4, y2 + imgH + 13);

    // Bottom-Right: 3D Walk-in View
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 215, 205);
    doc.roundedRect(x2, y2, gridW, gridH, 2, 2, 'FD');
    doc.addImage(snapshots.walkImg, 'JPEG', x2 + 2, y2 + 2, gridW - 4, imgH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 35, 31);
    doc.text('4. 3D WALK-IN PERSPECTIVE  •  EYE-LEVEL VIEW', x2 + 4, y2 + imgH + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 115);
    doc.text('Eye-level visual showing human perspective, sightlines and scale.', x2 + 4, y2 + imgH + 13);
  }

  // Page 2 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 145, 140);
  doc.text('Page 2 of 3  •  3D Multi-Angle Visualization Suite  •  Roomly Studio', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // ==========================================
  // PAGE 3: FURNITURE & DECOR SPECIFICATION
  // ==========================================
  doc.addPage();

  // 1. Header Banner
  doc.setFillColor(59, 87, 69);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ROOMLY  •  FURNITURE SPECIFICATION & PROCUREMENT SCHEDULE', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Procurement Schedule & Budget', pageWidth - margin, 14, { align: 'right' });

  // Table Columns
  curY = 32;
  const colX = {
    num: margin + 2,
    name: margin + 10,
    cat: margin + 60,
    dims: margin + 95,
    mat: margin + 130,
    mount: margin + 155,
    price: pageWidth - margin - 4
  };

  doc.setFillColor(70, 99, 82);
  doc.rect(margin, curY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', colX.num, curY + 4.8);
  doc.text('ITEM NAME', colX.name, curY + 4.8);
  doc.text('CATEGORY', colX.cat, curY + 4.8);
  doc.text('DIMENSIONS (W×D×H)', colX.dims, curY + 4.8);
  doc.text('FINISH', colX.mat, curY + 4.8);
  doc.text('PLACEMENT', colX.mount, curY + 4.8);
  doc.text('PRICE', colX.price, curY + 4.8, { align: 'right' });

  curY += 7;

  // Table Rows
  const items = room.items || [];
  const rowH = 6.4;
  items.forEach((it, idx) => {
    const cat = CATALOG[it.type] || {};
    const isAlt = idx % 2 === 1;

    if (isAlt) {
      doc.setFillColor(248, 246, 242);
      doc.rect(margin, curY, contentWidth, rowH, 'F');
    }

    doc.setTextColor(50, 55, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(String(idx + 1), colX.num, curY + 4.4);
    
    const itemName = cat.name || it.type;
    doc.setFont('helvetica', 'bold');
    doc.text(itemName.length > 25 ? itemName.substring(0, 24) + '…' : itemName, colX.name, curY + 4.4);

    doc.setFont('helvetica', 'normal');
    doc.text(cat.category || 'General', colX.cat, curY + 4.4);

    const dimStr = unit === 'ft'
      ? `${Math.round(it.w / 2.54)}″×${Math.round(it.d / 2.54)}″×${Math.round((cat.height || 75) / 2.54)}″`
      : `${it.w}×${it.d}×${cat.height || 75}cm`;
    doc.text(dimStr, colX.dims, curY + 4.4);

    const matStr = it.material ? it.material.charAt(0).toUpperCase() + it.material.slice(1) : 'Standard';
    doc.text(matStr, colX.mat, curY + 4.4);

    const isTV = it.type?.startsWith('tv') || cat.category === 'Electronics';
    const mountStr = isTV
      ? (it.mountType === 'wall' || (it.elevation || 0) >= 95 ? `Wall (${it.elevation || 120}cm)` : (it.elevation ? `Table (${it.elevation}cm)` : 'Floor'))
      : 'Floor';
    doc.text(mountStr, colX.mount, curY + 4.4);

    doc.setFont('helvetica', 'bold');
    doc.text(`$${cat.price || 0}`, colX.price, curY + 4.4, { align: 'right' });

    curY += rowH;
  });

  // Table Total Row
  doc.setFillColor(240, 244, 241);
  doc.rect(margin, curY, contentWidth, 7.5, 'F');
  doc.setDrawColor(70, 99, 82);
  doc.setLineWidth(0.4);
  doc.line(margin, curY, margin + contentWidth, curY);

  doc.setTextColor(32, 49, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`TOTAL ESTIMATED FURNITURE BUDGET (${items.length} items)`, margin + 10, curY + 5.2);
  doc.text(`$${totalCost.toLocaleString()}`, colX.price, curY + 5.2, { align: 'right' });

  // Notes & Procurement Links
  curY += 15;
  doc.setFillColor(248, 246, 242);
  doc.setDrawColor(225, 220, 210);
  doc.roundedRect(margin, curY, contentWidth, 24, 3, 3, 'FD');

  doc.setTextColor(29, 35, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ONLINE PROCUREMENT & PRICE COMPARISON', margin + 6, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 85);
  doc.text('Each furniture item in your Roomly Studio is linked with direct live price-check and style comparison searches on:', margin + 6, curY + 13);
  doc.text('• AliExpress: Budget-friendly and direct-manufacturer furniture models & lighting discounts.', margin + 6, curY + 18);
  doc.text('• Amazon, IKEA & Wayfair: Fast-delivery furnishings, curated aesthetic styles, and matching sets.', margin + 6, curY + 23);

  // Page 3 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 145, 140);
  doc.text('Page 3 of 3  •  Procurement Schedule  •  Roomly Studio  •  www.roomly.design', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Save PDF file
  const filename = `roomly-${(room.name || 'room').toLowerCase().replace(/\s+/g, '-')}-architectural-spec.pdf`;
  doc.save(filename);
}

export function exportDesignJSON(room, shoppingList = [], unit = 'm') {
  const exportData = {
    app: 'Roomly',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    room: {
      id: room.id,
      name: room.name,
      widthCm: room.width,
      lengthCm: room.length,
      heightCm: room.height || 260,
      wallColor: room.wallColor,
      floorType: room.floorType,
      unit: unit,
      windows: room.windows || [],
      doors: room.doors || [],
      items: room.items.map(it => ({
        id: it.id,
        type: it.type,
        x: it.x,
        y: it.y,
        width: it.w,
        depth: it.d,
        rotation: it.rot || 0,
        elevation: it.elevation || 0,
        mountType: it.mountType || 'floor',
        material: it.material,
        zIndex: it.zIndex || 2
      }))
    },
    shoppingList: shoppingList
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const filename = `roomly-${(room.name || 'room').toLowerCase().replace(/\s+/g, '-')}-design.json`;
  downloadBlob(blob, filename);
}

export function exportRoomOBJ(room, catalog) {
  const lines = [
    '# Roomly 3D Room Model',
    `# Exported: ${new Date().toISOString()}`,
    `# Room Dimensions: ${room.width}cm x ${room.length}cm x ${room.height || 260}cm`,
    ''
  ];

  let vertexOffset = 0;

  function appendBox(name, x, y, z, w, h, d) {
    lines.push(`o ${name.replace(/\s+/g, '_')}`);
    
    const v = [
      [x, y, z],
      [x + w, y, z],
      [x + w, y, z + d],
      [x, y, z + d],
      [x, y + h, z],
      [x + w, y + h, z],
      [x + w, y + h, z + d],
      [x, y + h, z + d]
    ];

    v.forEach(([vx, vy, vz]) => {
      lines.push(`v ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}`);
    });

    const faces = [
      [1, 2, 3, 4], // Bottom
      [5, 8, 7, 6], // Top
      [1, 5, 6, 2], // Front
      [2, 6, 7, 3], // Right
      [3, 7, 8, 4], // Back
      [4, 8, 5, 1]  // Left
    ];

    faces.forEach(f => {
      lines.push(`f ${f.map(idx => idx + vertexOffset).join(' ')}`);
    });

    vertexOffset += 8;
    lines.push('');
  }

  const rw = room.width / 100;
  const rl = room.length / 100;
  const rh = (room.height || 260) / 100;
  const wt = 0.15;

  appendBox('Room_Floor', 0, 0, 0, rw, 0.05, rl);
  appendBox('Wall_Back', -wt, 0, -wt, rw + wt * 2, rh, wt);
  appendBox('Wall_Left', -wt, 0, 0, wt, rh, rl);
  appendBox('Wall_Right', rw, 0, 0, wt, rh, rl);

  room.items.forEach((it, i) => {
    const cat = catalog[it.type] || { name: it.type, height: 75 };
    const ix = it.x / 100;
    const iz = it.y / 100;
    const iw = it.w / 100;
    const id = it.d / 100;
    const ih = (cat.height || 75) / 100;
    const elev = (it.elevation || 0) / 100;

    const itemName = `${cat.name || it.type}_${i + 1}`;
    appendBox(itemName, ix, 0.05 + elev, iz, iw, ih, id);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const filename = `roomly-${(room.name || 'room').toLowerCase().replace(/\s+/g, '-')}-model.obj`;
  downloadBlob(blob, filename);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generateShareUrl(room) {
  try {
    const payload = JSON.stringify({
      v: 2,
      id: room.id,
      name: room.name,
      width: room.width,
      length: room.length,
      height: room.height || 260,
      wallColor: room.wallColor,
      floorType: room.floorType,
      floorColor: room.floorColor,
      windows: room.windows || [],
      doors: room.doors || [],
      items: room.items
    });
    const encoded = btoa(encodeURIComponent(payload));
    const url = new URL(window.location.origin + window.location.pathname);
    url.hash = `share=${encoded}`;
    return url.toString();
  } catch (err) {
    console.error('Failed to generate share URL:', err);
    return window.location.href;
  }
}

export function parseShareUrl() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;
    const encoded = hash.split('share=')[1];
    if (!encoded) return null;
    const jsonStr = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(jsonStr);
    
    // Ensure all required fields exist
    return {
      id: parsed.id || `shared-${Date.now()}`,
      name: parsed.name || 'Shared Room Design',
      width: Number(parsed.width) || 500,
      length: Number(parsed.length) || 400,
      height: Number(parsed.height) || 260,
      wallColor: parsed.wallColor || '#FAF7F0',
      floorType: parsed.floorType || 'wood_oak',
      floorColor: parsed.floorColor || '',
      windows: parsed.windows || [],
      doors: parsed.doors || [],
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch (err) {
    console.error('Failed to parse share URL:', err);
    return null;
  }
}
