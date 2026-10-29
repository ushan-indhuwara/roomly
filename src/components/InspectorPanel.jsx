// Roomly - Selected Item Inspector & Room Finishes Panel
// Features: Item editing (dimensions, rotation, elevation presets, online shopping links)
// PLUS Room Finishes customization: Wall Paint Color & Floor Finish Materials/Tints

import React, { useState } from 'react';
import { CATALOG, MATERIALS } from '../data/roomData';
import { 
  RotateCw, Copy, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ShoppingBag, Layers, Move, Minus, Plus, ExternalLink, Palette, Check, Sparkles 
} from 'lucide-react';

export const WALL_COLORS = [
  { id: 'alabaster', name: 'Alabaster White', hex: '#F7F4EC' },
  { id: 'linen', name: 'Warm Linen', hex: '#EFECE4' },
  { id: 'sage', name: 'Sage Mist', hex: '#DCE5DF' },
  { id: 'terracotta', name: 'Terracotta Wash', hex: '#E8D4C8' },
  { id: 'greige', name: 'Greige Stone', hex: '#E2DFD8' },
  { id: 'charcoal', name: 'Midnight Charcoal', hex: '#3A3F3B' },
  { id: 'white', name: 'Architectural White', hex: '#FAF9F6' }
];

export const FLOOR_FINISHES = [
  { id: 'wood_oak', name: 'Natural Oak', icon: '🪵', defaultColor: '#C49C72', desc: 'Warm European oak parquet' },
  { id: 'wood_walnut', name: 'Dark Walnut', icon: '🌰', defaultColor: '#5E4432', desc: 'Rich walnut timber' },
  { id: 'wood_pine', name: 'Nordic Pine', icon: '🌲', defaultColor: '#DFCEB9', desc: 'Pale Scandinavian wood' },
  { id: 'tile_terrazzo', name: 'Terrazzo Stone', icon: '🏛️', defaultColor: '#EBE7DF', desc: 'Speckled Italian terrazzo' },
  { id: 'tile_cream', name: 'Cream Ceramic', icon: '⬜', defaultColor: '#FAF8F5', desc: 'Clean large-format tile' },
  { id: 'slate_dark', name: 'Dark Slate', icon: '⬛', defaultColor: '#383D3A', desc: 'Modern matte charcoal stone' }
];

export default function InspectorPanel({
  selectedItem,
  room,
  onUpdateRoom,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onAddToCart,
  unit = 'm'
}) {
  const [activeTab, setActiveTab] = useState('piece'); // 'piece' or 'finishes'

  // Unit conversion helpers
  const displayDim = (cm) => unit === 'ft' ? Math.round(cm / 2.54) : cm;
  const parseDim = (val) => unit === 'ft' ? Math.round(parseFloat(val || 0) * 2.54) : Math.round(parseFloat(val || 0));

  // Render Room Finishes Component
  const renderRoomFinishes = () => {
    const curWallColor = room?.wallColor || '#F7F4EC';
    const curFloorType = room?.floorType || 'wood_oak';
    const curFloorColor = room?.floorColor || '';

    return (
      <div className="room-finishes-content">
        <div className="inspector-card-header" style={{ marginBottom: '0.85rem' }}>
          <div className="inspector-piece-title">
            <span className="inspector-piece-icon">🎨</span>
            <div>
              <h4 className="inspector-piece-name">Room Finishes</h4>
              <span className="inspector-piece-cat">Customize wall paints & floor materials</span>
            </div>
          </div>
        </div>

        {/* Wall Paint Color Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="inspect-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Wall Paint Color</span>
            <span style={{ fontSize: '0.72rem', color: '#688871', fontWeight: 700 }}>
              {curWallColor}
            </span>
          </div>

          <div className="wall-color-grid">
            {WALL_COLORS.map(wc => {
              const isSelected = curWallColor.toLowerCase() === wc.hex.toLowerCase();
              return (
                <button
                  key={wc.id}
                  type="button"
                  className={`wall-color-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => onUpdateRoom && onUpdateRoom({ wallColor: wc.hex })}
                  title={wc.name}
                >
                  <span className="wall-color-circle" style={{ backgroundColor: wc.hex }} />
                  <span className="wall-color-label">{wc.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Wall Color Picker */}
          <div className="custom-color-row">
            <label htmlFor="wall-color-input" className="custom-color-label">
              <Palette size={13} />
              <span>Custom Wall Color</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                id="wall-color-input"
                type="color"
                className="custom-color-picker"
                value={curWallColor}
                onChange={(e) => onUpdateRoom && onUpdateRoom({ wallColor: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#667069' }}>{curWallColor}</span>
            </div>
          </div>
        </div>

        {/* Floor Finish & Style Section */}
        <div style={{ marginBottom: '1rem' }}>
          <div className="inspect-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Floor Finish & Material</span>
            <span style={{ fontSize: '0.72rem', color: '#688871', fontWeight: 700 }}>
              {FLOOR_FINISHES.find(f => f.id === curFloorType)?.name || 'Custom'}
            </span>
          </div>

          <div className="floor-finish-grid">
            {FLOOR_FINISHES.map(f => {
              const isSelected = curFloorType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`floor-finish-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => onUpdateRoom && onUpdateRoom({ floorType: f.id, floorColor: f.defaultColor })}
                  title={f.desc}
                >
                  <span className="floor-finish-icon">{f.icon}</span>
                  <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <div className="floor-finish-name">{f.name}</div>
                    <div className="floor-finish-desc">{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Floor Tint Picker */}
          <div className="custom-color-row" style={{ marginTop: '0.65rem' }}>
            <label htmlFor="floor-color-input" className="custom-color-label">
              <Palette size={13} />
              <span>Custom Floor Tint</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                id="floor-color-input"
                type="color"
                className="custom-color-picker"
                value={curFloorColor || '#C49C72'}
                onChange={(e) => onUpdateRoom && onUpdateRoom({ floorColor: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#667069' }}>
                {curFloorColor || 'Default'}
              </span>
            </div>
          </div>
        </div>

        <div className="finishes-hint-card">
          <Sparkles size={14} style={{ color: '#466352', flexShrink: 0 }} />
          <span>Colors update both your 2D Blueprint and realistic 3D Room in real-time.</span>
        </div>
      </div>
    );
  };

  // If no piece is selected, display Room Finishes directly!
  if (!selectedItem) {
    return (
      <div className="inspector-panel">
        {renderRoomFinishes()}
      </div>
    );
  }

  // An item IS selected: provide tabs to toggle between Item Inspector and Room Finishes
  const cat = CATALOG[selectedItem.type] || { name: selectedItem.type, category: 'Furniture', icon: '📦', price: 100 };
  const isTV = selectedItem.type?.startsWith('tv') || cat.category === 'Electronics';
  const isWindow = selectedItem.type?.startsWith('window');
  const isDoor = selectedItem.type?.startsWith('door');
  const currentMaterial = selectedItem.material || cat.defaultMaterial || 'boucle';

  const nudge = (dx, dy) => {
    onUpdateItem(selectedItem.id, {
      x: Math.max(0, selectedItem.x + dx),
      y: Math.max(0, selectedItem.y + dy)
    });
  };

  return (
    <div className="inspector-panel">
      {/* Top Tab Bar: Selected Piece vs Room Finishes */}
      <div className="inspector-top-tabs">
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'piece' ? 'active' : ''}`}
          onClick={() => setActiveTab('piece')}
        >
          <span>{cat.icon}</span>
          <span>Piece Settings</span>
        </button>
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'finishes' ? 'active' : ''}`}
          onClick={() => setActiveTab('finishes')}
        >
          <span>🎨</span>
          <span>Room Finishes</span>
        </button>
      </div>

      {activeTab === 'finishes' ? (
        renderRoomFinishes()
      ) : (
        <>
          {/* Header Info */}
          <div className="inspector-card-header">
            <div className="inspector-piece-title">
              <span className="inspector-piece-icon">{cat.icon}</span>
              <div>
                <h4 className="inspector-piece-name">{cat.name}</h4>
                <span className="inspector-piece-cat">{cat.category} · ${cat.price}</span>
              </div>
            </div>

            {/* Top Quick Delete Button */}
            <button
              className="btn btn-danger"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => onRemoveItem(selectedItem.id)}
              title="Remove piece from room"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>

          {/* Position Coordinates & Nudge Pad */}
          <div>
            <div className="inspect-section-title">Position ({unit === 'ft' ? 'inches' : 'cm'} from walls)</div>
            <div className="inspect-row">
              <div className="inspect-field">
                <label>X (Left Wall)</label>
                <input
                  type="number"
                  min={0}
                  className="inspect-input"
                  value={displayDim(selectedItem.x)}
                  onChange={(e) => onUpdateItem(selectedItem.id, { x: parseDim(e.target.value) })}
                />
              </div>
              <div className="inspect-field">
                <label>Y (Top Wall)</label>
                <input
                  type="number"
                  min={0}
                  className="inspect-input"
                  value={displayDim(selectedItem.y)}
                  onChange={(e) => onUpdateItem(selectedItem.id, { y: parseDim(e.target.value) })}
                />
              </div>
            </div>

            {/* Nudge directional buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.72rem' }}
                onClick={() => nudge(-10, 0)}
                title="Nudge Left 10cm"
              >
                <ArrowLeft size={12} /> Left
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.72rem' }}
                onClick={() => nudge(10, 0)}
                title="Nudge Right 10cm"
              >
                Right <ArrowRight size={12} />
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.72rem' }}
                onClick={() => nudge(0, -10)}
                title="Nudge Up 10cm"
              >
                <ArrowUp size={12} /> Up
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.72rem' }}
                onClick={() => nudge(0, 10)}
                title="Nudge Down 10cm"
              >
                Down <ArrowDown size={12} />
              </button>
            </div>
          </div>

          {/* Dimensions Controls with - / + Stepper Buttons */}
          <div>
            <div className="inspect-section-title">Dimensions ({unit === 'ft' ? 'inches' : 'cm'})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="inspect-dim-row">
                <span className="inspect-dim-label">Width</span>
                <div className="inspect-stepper-row" style={{ flex: 1 }}>
                  <button
                    className="stepper-mini-btn"
                    onClick={() => onUpdateItem(selectedItem.id, { w: Math.max(30, selectedItem.w - 5) })}
                    title="Decrease Width by 5cm"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="inspect-dim-input-wrap">
                    <input
                      type="number"
                      min={unit === 'ft' ? 12 : 30}
                      max={unit === 'ft' ? 120 : 300}
                      step={unit === 'ft' ? 1 : 5}
                      className="inspect-dim-input"
                      value={displayDim(selectedItem.w)}
                      onChange={(e) => onUpdateItem(selectedItem.id, { w: Math.max(30, parseDim(e.target.value)) })}
                    />
                    <span className="inspect-dim-unit">{unit === 'ft' ? 'in' : 'cm'}</span>
                  </div>
                  <button
                    className="stepper-mini-btn"
                    onClick={() => onUpdateItem(selectedItem.id, { w: Math.min(400, selectedItem.w + 5) })}
                    title="Increase Width by 5cm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="inspect-dim-row">
                <span className="inspect-dim-label">Length</span>
                <div className="inspect-stepper-row" style={{ flex: 1 }}>
                  <button
                    className="stepper-mini-btn"
                    onClick={() => onUpdateItem(selectedItem.id, { d: Math.max(30, selectedItem.d - 5) })}
                    title="Decrease Length by 5cm"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="inspect-dim-input-wrap">
                    <input
                      type="number"
                      min={unit === 'ft' ? 12 : 30}
                      max={unit === 'ft' ? 120 : 300}
                      step={unit === 'ft' ? 1 : 5}
                      className="inspect-dim-input"
                      value={displayDim(selectedItem.d)}
                      onChange={(e) => onUpdateItem(selectedItem.id, { d: Math.max(30, parseDim(e.target.value)) })}
                    />
                    <span className="inspect-dim-unit">{unit === 'ft' ? 'in' : 'cm'}</span>
                  </div>
                  <button
                    className="stepper-mini-btn"
                    onClick={() => onUpdateItem(selectedItem.id, { d: Math.min(400, selectedItem.d + 5) })}
                    title="Increase Length by 5cm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Placement & Wall Snap: For Door, Window, and TV items */}
          {(isTV || isWindow || isDoor) && (
            <div>
              <div className="inspect-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{isDoor ? 'Door Width & Wall Alignment' : (isWindow ? 'Window Elevation & Wall Snap' : 'TV Mounting & Elevation')}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#466352' }}>
                  {isDoor ? `${selectedItem.w || 90}cm leaf` : `${displayDim(selectedItem.elevation !== undefined ? selectedItem.elevation : (isWindow ? 85 : 54))} ${unit === 'ft' ? 'in' : 'cm'} above floor`}
                </span>
              </div>

              {/* Quick Placement / Width Presets */}
              {isDoor ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginBottom: '0.65rem' }}>
                  <button
                    type="button"
                    className={`mount-preset-btn ${selectedItem.w === 75 ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { w: 75 })}
                    title="75cm Compact Interior Door"
                  >
                    🚪 75cm Compact
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${selectedItem.w === 85 ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { w: 85 })}
                    title="85cm Standard Room Door"
                  >
                    🚪 85cm Standard
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${(!selectedItem.w || selectedItem.w === 90) ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { w: 90 })}
                    title="90cm Wide Passage Door"
                  >
                    🚪 90cm Wide
                  </button>
                </div>
              ) : isWindow ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginBottom: '0.65rem' }}>
                  <button
                    type="button"
                    className={`mount-preset-btn ${(!selectedItem.elevation || selectedItem.elevation === 85) ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 85 })}
                    title="Standard Sill Height (85cm / 33in)"
                  >
                    🪟 Standard (85cm)
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${selectedItem.elevation === 45 ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 45 })}
                    title="Low Picture Window (45cm / 18in)"
                  >
                    🖼️ Low Sill (45cm)
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${selectedItem.elevation === 130 ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 130 })}
                    title="High Clerestory Window (130cm / 51in)"
                  >
                    ☀️ High (130cm)
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginBottom: '0.65rem' }}>
                  <button
                    type="button"
                    className={`mount-preset-btn ${(selectedItem.mountType === 'console' || (!selectedItem.mountType && (selectedItem.elevation === 54 || selectedItem.elevation === undefined))) ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 54, mountType: 'console' })}
                    title="Place TV on media console / tabletop (54cm / 21in height)"
                  >
                    🪑 On Table (54cm)
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${selectedItem.mountType === 'wall' || (selectedItem.elevation || 0) >= 95 ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 120, mountType: 'wall' })}
                    title="Mount TV to wall (120cm / 47in height)"
                  >
                    🧱 Wall (120cm)
                  </button>
                  <button
                    type="button"
                    className={`mount-preset-btn ${(selectedItem.mountType === 'floor' || (!selectedItem.mountType && selectedItem.elevation === 0)) ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { elevation: 0, mountType: 'floor' })}
                    title="Place TV on floor (0cm height)"
                  >
                    ⬇️ Floor (0cm)
                  </button>
                </div>
              )}

              {/* Height Stepper and Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="inspect-stepper-row">
                  <button
                    className="stepper-mini-btn"
                    onClick={() => {
                      const cur = selectedItem.elevation !== undefined ? selectedItem.elevation : 54;
                      const next = Math.max(0, cur - 5);
                      onUpdateItem(selectedItem.id, { 
                        elevation: next, 
                        mountType: next >= 95 ? 'wall' : (next > 0 ? 'console' : 'floor') 
                      });
                    }}
                    title="Lower height by 5cm"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="inspect-dim-input-wrap">
                    <input
                      type="number"
                      min={0}
                      max={250}
                      step={unit === 'ft' ? 1 : 5}
                      className="inspect-dim-input"
                      value={displayDim(selectedItem.elevation !== undefined ? selectedItem.elevation : 54)}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(250, parseDim(e.target.value)));
                        onUpdateItem(selectedItem.id, { 
                          elevation: val, 
                          mountType: val >= 95 ? 'wall' : (val > 0 ? 'console' : 'floor') 
                        });
                      }}
                    />
                    <span className="inspect-dim-unit">{unit === 'ft' ? 'in' : 'cm'}</span>
                  </div>
                  <button
                    className="stepper-mini-btn"
                    onClick={() => {
                      const cur = selectedItem.elevation !== undefined ? selectedItem.elevation : 54;
                      const next = Math.min(250, cur + 5);
                      onUpdateItem(selectedItem.id, { 
                        elevation: next, 
                        mountType: next >= 95 ? 'wall' : (next > 0 ? 'console' : 'floor') 
                      });
                    }}
                    title="Raise height by 5cm"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={220}
                  step={2}
                  style={{ width: '100%', accentColor: '#466352' }}
                  value={selectedItem.elevation !== undefined ? selectedItem.elevation : 54}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdateItem(selectedItem.id, {
                      elevation: val,
                      mountType: val >= 95 ? 'wall' : (val > 0 ? 'console' : 'floor')
                    });
                  }}
                />
              </div>

              {/* Quick Wall Snap Buttons */}
              <div style={{ marginTop: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#466352', display: 'block', marginBottom: '0.35rem' }}>
                  Snap {isDoor ? 'Door' : (isWindow ? 'Window' : 'TV')} to Wall (Auto-aligned & Rotated)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="mount-preset-btn"
                    style={{ fontSize: '0.68rem', padding: '0.35rem 0.2rem' }}
                    onClick={() => {
                      if (isDoor || isWindow) {
                        const L = Math.max(selectedItem.w, selectedItem.d);
                        onUpdateItem(selectedItem.id, {
                          w: L,
                          d: 16,
                          y: 0,
                          rot: 0,
                          mountType: 'wall',
                          elevation: isDoor ? 0 : (selectedItem.elevation !== undefined ? selectedItem.elevation : 85)
                        });
                      } else {
                        onUpdateItem(selectedItem.id, {
                          rot: 0,
                          y: 0,
                          mountType: 'wall',
                          elevation: selectedItem.elevation !== undefined ? selectedItem.elevation : 120
                        });
                      }
                    }}
                    title="Snap against North (Top) Wall"
                  >
                    ⬆ North
                  </button>
                  <button
                    type="button"
                    className="mount-preset-btn"
                    style={{ fontSize: '0.68rem', padding: '0.35rem 0.2rem' }}
                    onClick={() => {
                      if (isDoor || isWindow) {
                        const L = Math.max(selectedItem.w, selectedItem.d);
                        onUpdateItem(selectedItem.id, {
                          w: L,
                          d: 16,
                          y: Math.max(0, room.length - 16),
                          rot: 0,
                          mountType: 'wall',
                          elevation: isDoor ? 0 : (selectedItem.elevation !== undefined ? selectedItem.elevation : 85)
                        });
                      } else {
                        onUpdateItem(selectedItem.id, {
                          rot: 180,
                          y: Math.max(0, room.length - selectedItem.d),
                          mountType: 'wall',
                          elevation: selectedItem.elevation !== undefined ? selectedItem.elevation : 120
                        });
                      }
                    }}
                    title="Snap against South (Bottom) Wall"
                  >
                    ⬇ South
                  </button>
                  <button
                    type="button"
                    className="mount-preset-btn"
                    style={{ fontSize: '0.68rem', padding: '0.35rem 0.2rem' }}
                    onClick={() => {
                      if (isDoor || isWindow) {
                        const L = Math.max(selectedItem.w, selectedItem.d);
                        onUpdateItem(selectedItem.id, {
                          w: 16,
                          d: L,
                          x: 0,
                          rot: 0,
                          mountType: 'wall',
                          elevation: isDoor ? 0 : (selectedItem.elevation !== undefined ? selectedItem.elevation : 85)
                        });
                      } else {
                        const targetX = Math.round(selectedItem.d / 2 - selectedItem.w / 2);
                        onUpdateItem(selectedItem.id, {
                          rot: 270,
                          x: targetX,
                          mountType: 'wall',
                          elevation: selectedItem.elevation !== undefined ? selectedItem.elevation : 120
                        });
                      }
                    }}
                    title="Snap against West (Left) Wall"
                  >
                    ⬅ West
                  </button>
                  <button
                    type="button"
                    className="mount-preset-btn"
                    style={{ fontSize: '0.68rem', padding: '0.35rem 0.2rem' }}
                    onClick={() => {
                      if (isDoor || isWindow) {
                        const L = Math.max(selectedItem.w, selectedItem.d);
                        onUpdateItem(selectedItem.id, {
                          w: 16,
                          d: L,
                          x: Math.max(0, room.width - 16),
                          rot: 0,
                          mountType: 'wall',
                          elevation: isDoor ? 0 : (selectedItem.elevation !== undefined ? selectedItem.elevation : 85)
                        });
                      } else {
                        const targetX = Math.round(room.width - selectedItem.d / 2 - selectedItem.w / 2);
                        onUpdateItem(selectedItem.id, {
                          rot: 90,
                          x: targetX,
                          mountType: 'wall',
                          elevation: selectedItem.elevation !== undefined ? selectedItem.elevation : 120
                        });
                      }
                    }}
                    title="Snap against East (Right) Wall"
                  >
                    ➡ East
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rotation Slider & Quick Rotate */}
          <div>
            <div className="inspect-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Rotation</span>
              <span>{selectedItem.rot || 0}°</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                style={{ flex: 1, accentColor: '#466352' }}
                value={selectedItem.rot || 0}
                onChange={(e) => onUpdateItem(selectedItem.id, { rot: parseInt(e.target.value, 10) })}
              />
              <button 
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => onUpdateItem(selectedItem.id, { rot: ((selectedItem.rot || 0) + 45) % 360 })}
                title="Rotate 45 degrees"
              >
                <RotateCw size={13} />
                <span>+45°</span>
              </button>
            </div>
          </div>

          {/* Material & Fabric Swatches */}
          <div>
            <div className="inspect-section-title">Material / Finish</div>
            <div className="material-swatches">
              {MATERIALS.map(mat => {
                const isCurrent = currentMaterial === mat.id;
                return (
                  <button
                    key={mat.id}
                    className={`swatch-btn ${isCurrent ? 'active' : ''}`}
                    onClick={() => onUpdateItem(selectedItem.id, { material: mat.id })}
                    title={mat.desc}
                  >
                    <span className="swatch-circle" style={{ backgroundColor: mat.color }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mat.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layering Controls */}
          <div>
            <div className="inspect-section-title">Layering (Z-Index)</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                onClick={() => onUpdateItem(selectedItem.id, { zIndex: (selectedItem.zIndex || 2) + 1 })}
              >
                <ArrowUp size={13} /> Bring Forward
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                onClick={() => onUpdateItem(selectedItem.id, { zIndex: Math.max(1, (selectedItem.zIndex || 2) - 1) })}
              >
                <ArrowDown size={13} /> Send Backward
              </button>
            </div>
          </div>

          {/* Compare & Buy Online (AliExpress, Amazon, IKEA, Wayfair) */}
          <div className="inspect-shop-section">
            <div className="inspect-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Compare & Buy Online</span>
              <span style={{ fontSize: '0.7rem', color: '#688871', fontWeight: 600 }}>Live Price Check</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#667069', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
              Check prices or order matching models on online furniture stores:
            </p>
            <div className="inspect-shop-links">
              <a
                href={`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(cat.searchKeyword || cat.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-link-pill aliexpress"
                title="Search matching items and discounts on AliExpress"
              >
                <span className="shop-pill-tag">AliExpress</span>
                <span className="shop-pill-action">Check Prices <ExternalLink size={11} /></span>
              </a>
              <a
                href={`https://www.amazon.com/s?k=${encodeURIComponent((cat.searchKeyword || cat.name) + ' furniture')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-link-pill amazon"
                title="Search matching items on Amazon"
              >
                <span className="shop-pill-tag">Amazon</span>
                <span className="shop-pill-action">Find Deals <ExternalLink size={11} /></span>
              </a>
              <a
                href={`https://www.ikea.com/us/en/search/?q=${encodeURIComponent(cat.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-link-pill ikea"
                title="Search catalog on IKEA"
              >
                <span className="shop-pill-tag">IKEA</span>
                <span className="shop-pill-action">View Styles <ExternalLink size={11} /></span>
              </a>
              <a
                href={`https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(cat.searchKeyword || cat.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-link-pill wayfair"
                title="Search furniture on Wayfair"
              >
                <span className="shop-pill-tag">Wayfair</span>
                <span className="shop-pill-action">Compare <ExternalLink size={11} /></span>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="inspect-actions">
            <button 
              className="btn btn-sage-subtle"
              onClick={() => onAddToCart(selectedItem.type)}
            >
              <ShoppingBag size={15} />
              <span>Add to Shopping List · ${cat.price}</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => onDuplicateItem(selectedItem.id)}
              >
                <Copy size={14} /> Duplicate
              </button>
              <button 
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => onRemoveItem(selectedItem.id)}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
