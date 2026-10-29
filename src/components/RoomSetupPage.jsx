// Roomly - Guided Room Setup Page
// Choose room type, enter tape-measured dimensions, select starter layout or clean canvas

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Ruler, Sparkles, LayoutGrid, Box } from 'lucide-react';
import { ROOM_PRESETS } from '../data/roomData';
import { trackEvent } from '../utils/analytics';

const toDisplay = (cm, unit) => unit === 'ft' ? (cm / 30.48).toFixed(1) : (cm / 100).toFixed(1);
const toCm = (value, unit) => Math.round(Number(value) * (unit === 'ft' ? 30.48 : 100));

// Recommended common room dimensions (in meters)
const QUICK_SIZES = {
  living_room: [
    { label: 'Apartment', w: 4.2, l: 3.4 },
    { label: 'Standard', w: 4.8, l: 3.8 },
    { label: 'Spacious', w: 5.8, l: 4.4 }
  ],
  bedroom_master: [
    { label: 'Cozy', w: 3.4, l: 3.0 },
    { label: 'Standard', w: 4.0, l: 3.5 },
    { label: 'Large Suite', w: 5.0, l: 4.2 }
  ],
  home_office: [
    { label: 'Nook', w: 2.8, l: 2.4 },
    { label: 'Standard', w: 3.4, l: 2.8 },
    { label: 'Executive', w: 4.2, l: 3.5 }
  ],
  kitchen_dining: [
    { label: 'Compact', w: 3.8, l: 3.2 },
    { label: 'Open Plan', w: 5.2, l: 4.0 }
  ],
  dining_room: [
    { label: '4-Seater', w: 3.6, l: 3.0 },
    { label: '6 to 8 Seater', w: 4.8, l: 3.8 }
  ]
};

export default function RoomSetupPage({ onBack, onStart, unit, onToggleUnit }) {
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState(ROOM_PRESETS[0]);
  const [startWithLayout, setStartWithLayout] = useState(true);
  const [width, setWidth] = useState(toDisplay(ROOM_PRESETS[0].width, unit));
  const [length, setLength] = useState(toDisplay(ROOM_PRESETS[0].length, unit));

  const widthCm = toCm(width, unit);
  const lengthCm = toCm(length, unit);
  const valid = Number.isFinite(widthCm) && Number.isFinite(lengthCm) && widthCm >= 200 && widthCm <= 1500 && lengthCm >= 200 && lengthCm <= 2000;

  const choosePreset = (nextPreset) => {
    setPreset(nextPreset);
    setWidth(toDisplay(nextPreset.width, unit));
    setLength(toDisplay(nextPreset.length, unit));
  };

  const changeUnit = (nextUnit) => {
    if (nextUnit === unit) return;
    setWidth(toDisplay(widthCm, nextUnit));
    setLength(toDisplay(lengthCm, nextUnit));
    onToggleUnit(nextUnit);
  };

  const applyQuickSize = (qs) => {
    const wCm = Math.round(qs.w * 100);
    const lCm = Math.round(qs.l * 100);
    setWidth(toDisplay(wCm, unit));
    setLength(toDisplay(lCm, unit));
  };

  const handleFinishSetup = () => {
    const customPreset = {
      ...preset,
      items: startWithLayout ? preset.items : []
    };
    trackEvent('start_room', { 
      roomType: preset.name, 
      widthCm, 
      lengthCm, 
      hasStarterLayout: startWithLayout 
    });
    onStart(customPreset, widthCm, lengthCm);
  };

  const quickSizesList = QUICK_SIZES[preset.id] || [];

  return (
    <main className="setup-page">
      <header className="setup-header">
        <button className="setup-back" onClick={onBack}>
          <ArrowLeft size={17} /> <span>Back to Home</span>
        </button>
        <a className="welcome-brand" href="#top" onClick={(e) => { e.preventDefault(); onBack(); }}>
          roomly<span>.</span>
        </a>
        <span className="setup-no-account">
          <Check size={14} /> <span>No sign-up or login required</span>
        </span>
      </header>

      <div className="setup-content">
        {/* Progress Bar */}
        <div className="setup-progress">
          <span className={step === 1 ? 'active' : 'done'}>
            {step > 1 ? <Check size={14} /> : '1'}
          </span>
          <i className={step > 1 ? 'done' : ''} />
          <span className={step === 2 ? 'active' : ''}>2</span>
        </div>

        {step === 1 ? (
          <>
            <div className="setup-heading">
              <span className="welcome-eyebrow">
                <Ruler size={14} /> <span>STEP 1 OF 2 · ROOM TYPE</span>
              </span>
              <h1>What room are you planning?</h1>
              <p>Pick a room type to begin with tailored architectural clearances and furniture options.</p>
            </div>

            <div className="setup-room-grid">
              {ROOM_PRESETS.map((room) => (
                <button 
                  key={room.id} 
                  type="button"
                  className={`setup-room-card ${preset.id === room.id ? 'selected' : ''}`} 
                  onClick={() => choosePreset(room)} 
                  aria-pressed={preset.id === room.id}
                >
                  <span className="setup-room-icon">{room.icon}</span>
                  <span className="setup-room-name">{room.name}</span>
                  <span className="setup-room-description">{room.description}</span>
                  {preset.id === room.id && (
                    <span className="setup-selected-check"><Check size={13} /></span>
                  )}
                </button>
              ))}
            </div>

            <div className="setup-bottom">
              <span>Next: Set your room measurements to guarantee scale accuracy.</span>
              <button 
                type="button"
                className="welcome-primary-btn" 
                onClick={() => setStep(2)}
              >
                <span>Set room size</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="setup-heading">
              <span className="welcome-eyebrow">
                <Ruler size={14} /> <span>STEP 2 OF 2 · EXACT DIMENSIONS</span>
              </span>
              <h1>How big is your room?</h1>
              <p>Use your tape measure or pick a standard size. You can adjust this anytime in the studio.</p>
            </div>

            <div className="setup-dimensions-card">
              <div className="setup-dimensions-room">
                <span className="setup-room-icon">{preset.icon}</span>
                <div>
                  <b>{preset.name}</b>
                  <small>Architectural wall clearances will adjust to your dimensions</small>
                </div>
                <button 
                  type="button"
                  className="setup-change-room" 
                  onClick={() => setStep(1)}
                >
                  <span>Change room</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Unit Toggle */}
              <div className="setup-unit-row">
                <span>Room measurement units</span>
                <div className="unit-toggle">
                  <button 
                    type="button"
                    className={`unit-btn ${unit === 'm' ? 'active' : ''}`} 
                    onClick={() => changeUnit('m')}
                  >
                    Meters (m)
                  </button>
                  <button 
                    type="button"
                    className={`unit-btn ${unit === 'ft' ? 'active' : ''}`} 
                    onClick={() => changeUnit('ft')}
                  >
                    Feet & Inches (ft)
                  </button>
                </div>
              </div>

              {/* Quick Size Presets */}
              {quickSizesList.length > 0 && (
                <div className="setup-quick-sizes-row">
                  <span className="quick-sizes-label">Popular room sizes:</span>
                  <div className="quick-sizes-buttons">
                    {quickSizesList.map((qs, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-size-pill"
                        onClick={() => applyQuickSize(qs)}
                      >
                        {qs.label} ({qs.w} × {qs.l}m)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Width & Length Inputs */}
              <div className="setup-input-row">
                <label>
                  <span>WIDTH</span>
                  <div>
                    <input 
                      type="number" 
                      min={unit === 'm' ? '2' : '6.6'} 
                      max={unit === 'm' ? '15' : '49.2'} 
                      step="0.1" 
                      value={width} 
                      onChange={(e) => setWidth(e.target.value)} 
                    />
                    <i>{unit}</i>
                  </div>
                </label>
                <span className="setup-times">×</span>
                <label>
                  <span>LENGTH</span>
                  <div>
                    <input 
                      type="number" 
                      min={unit === 'm' ? '2' : '6.6'} 
                      max={unit === 'm' ? '20' : '65.6'} 
                      step="0.1" 
                      value={length} 
                      onChange={(e) => setLength(e.target.value)} 
                    />
                    <i>{unit}</i>
                  </div>
                </label>
              </div>

              <p className="setup-range-note">
                Supported range: width 2–15 {unit} · length 2–20 {unit}
              </p>
              {!valid && (
                <p className="setup-error" role="alert">
                  Please enter room dimensions within the supported range.
                </p>
              )}

              {/* Starter Layout Toggle Choice */}
              <div className="setup-starter-choice">
                <span className="starter-choice-title">Starting layout options:</span>
                <div className="starter-options-grid">
                  <button
                    type="button"
                    className={`starter-option-card ${startWithLayout ? 'active' : ''}`}
                    onClick={() => setStartWithLayout(true)}
                  >
                    <div className="starter-option-icon">🛋️</div>
                    <div>
                      <strong>Curated starter layout</strong>
                      <p>Start with pre-arranged furniture you can move, customize, or remove.</p>
                    </div>
                    {startWithLayout && <span className="starter-check"><Check size={14} /></span>}
                  </button>

                  <button
                    type="button"
                    className={`starter-option-card ${!startWithLayout ? 'active' : ''}`}
                    onClick={() => setStartWithLayout(false)}
                  >
                    <div className="starter-option-icon">📐</div>
                    <div>
                      <strong>Clean empty room</strong>
                      <p>Start with an empty floor plan to arrange pieces completely from scratch.</p>
                    </div>
                    {!startWithLayout && <span className="starter-check"><Check size={14} /></span>}
                  </button>
                </div>
              </div>
            </div>

            <div className="setup-bottom">
              <button 
                type="button"
                className="setup-back-bottom" 
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> <span>Change room type</span>
              </button>

              <button 
                type="button"
                className="welcome-primary-btn" 
                disabled={!valid} 
                onClick={handleFinishSetup}
              >
                <span>Build my room & start planning</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="setup-footer">
        <span>roomly<span>.</span></span>
        <span>Your floor plan saves automatically in this browser.</span>
      </footer>
    </main>
  );
}
