// Roomly - Keyboard Shortcuts Cheat Sheet Modal

import React from 'react';
import { X, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Ctrl + Z', desc: 'Undo previous action' },
  { key: 'Ctrl + Y / ⇧ Ctrl + Z', desc: 'Redo undone action' },
  { key: 'Delete / Backspace', desc: 'Remove selected furniture piece' },
  { key: 'R', desc: 'Rotate selected piece by 45°' },
  { key: 'Arrow Keys', desc: 'Nudge piece by 5 cm' },
  { key: 'Shift + Arrows', desc: 'Nudge piece by 25 cm' },
  { key: 'Shift + Drag Rotate', desc: 'Snap rotation to 15° steps' },
  { key: 'Scroll Wheel', desc: 'Zoom canvas in & out' },
  { key: 'Drag Background', desc: 'Pan room in any direction' },
  { key: 'Escape', desc: 'Deselect active furniture piece' }
];

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Keyboard Shortcuts</h3>
            <p>Speed up your room planning workflow</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {SHORTCUTS.map((s, i) => (
              <div 
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: '#FAF8F5',
                  borderRadius: '10px',
                  border: '1px solid #ECE8E0'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#38423B' }}>{s.desc}</span>
                <kbd style={{
                  background: '#FFFFFF',
                  border: '1px solid #DDD7CB',
                  borderRadius: '6px',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#1D231F',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                }}>
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
