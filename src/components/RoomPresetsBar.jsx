// Roomly - Room Presets Bar & Large Tactile Dimensions Controls
// Features: Room switcher chips, large Width & Length stepper buttons (- / +), and numerical inputs

import React from 'react';
import { ROOM_PRESETS } from '../data/roomData';
import { Minus, Plus } from 'lucide-react';

export default function RoomPresetsBar({
  currentRoomId,
  onSelectPreset,
  roomWidthCm,
  roomLengthCm,
  onUpdateDimensions,
  unit
}) {
  const displayW = unit === 'ft' ? (roomWidthCm / 30.48).toFixed(1) : (roomWidthCm / 100).toFixed(1);
  const displayL = unit === 'ft' ? (roomLengthCm / 30.48).toFixed(1) : (roomLengthCm / 100).toFixed(1);

  // Stepper increment: 10cm for metric, 0.5ft (~15cm) for imperial
  const stepCm = unit === 'ft' ? Math.round(0.5 * 30.48) : 10;

  const stepWidth = (delta) => {
    const newW = Math.max(200, Math.min(1500, roomWidthCm + delta));
    onUpdateDimensions(newW, roomLengthCm);
  };

  const stepLength = (delta) => {
    const newL = Math.max(200, Math.min(2000, roomLengthCm + delta));
    onUpdateDimensions(roomWidthCm, newL);
  };

  const handleWidthInput = (val) => {
    let num = parseFloat(val) || 1;
    let cm = unit === 'ft' ? Math.round(num * 30.48) : Math.round(num * 100);
    cm = Math.max(200, Math.min(1500, cm));
    onUpdateDimensions(cm, roomLengthCm);
  };

  const handleLengthInput = (val) => {
    let num = parseFloat(val) || 1;
    let cm = unit === 'ft' ? Math.round(num * 30.48) : Math.round(num * 100);
    cm = Math.max(200, Math.min(2000, cm));
    onUpdateDimensions(roomWidthCm, cm);
  };

  return (
    <div className="presets-bar">
      {/* Preset Room Selection Chips */}
      <div className="presets-list">
        {ROOM_PRESETS.map(preset => {
          const isActive = preset.id === currentRoomId;
          return (
            <button
              key={preset.id}
              className={`preset-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              <span style={{ fontSize: '1.15rem' }}>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Large, Tactile Room Dimensions Controls */}
      <div className="room-dimensions-controls-large">
        {/* Width Controller with Large Buttons */}
        <div className="dimension-stepper-box">
          <span className="dimension-label">WIDTH</span>
          <div className="stepper-inner">
            <button
              className="stepper-btn"
              onClick={() => stepWidth(-stepCm)}
              title={`Decrease Width by ${unit === 'ft' ? '0.5 ft' : '0.1 m'}`}
            >
              <Minus size={18} />
            </button>
            <div className="stepper-value-wrap">
              <input
                type="number"
                step={unit === 'ft' ? '0.5' : '0.1'}
                min={unit === 'ft' ? '6.5' : '2.0'}
                max={unit === 'ft' ? '50' : '15.0'}
                className="dimension-large-input"
                value={displayW}
                onChange={(e) => handleWidthInput(e.target.value)}
              />
              <span className="dimension-unit-tag">{unit}</span>
            </div>
            <button
              className="stepper-btn"
              onClick={() => stepWidth(stepCm)}
              title={`Increase Width by ${unit === 'ft' ? '0.5 ft' : '0.1 m'}`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <span className="dimension-cross-divider">×</span>

        {/* Length Controller with Large Buttons */}
        <div className="dimension-stepper-box">
          <span className="dimension-label">LENGTH</span>
          <div className="stepper-inner">
            <button
              className="stepper-btn"
              onClick={() => stepLength(-stepCm)}
              title={`Decrease Length by ${unit === 'ft' ? '0.5 ft' : '0.1 m'}`}
            >
              <Minus size={18} />
            </button>
            <div className="stepper-value-wrap">
              <input
                type="number"
                step={unit === 'ft' ? '0.5' : '0.1'}
                min={unit === 'ft' ? '6.5' : '2.0'}
                max={unit === 'ft' ? '65' : '20.0'}
                className="dimension-large-input"
                value={displayL}
                onChange={(e) => handleLengthInput(e.target.value)}
              />
              <span className="dimension-unit-tag">{unit}</span>
            </div>
            <button
              className="stepper-btn"
              onClick={() => stepLength(stepCm)}
              title={`Increase Length by ${unit === 'ft' ? '0.5 ft' : '0.1 m'}`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
