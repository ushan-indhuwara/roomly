// Roomly - Saved Rooms Library & File Import Modal

import React, { useRef } from 'react';
import { X, FolderPlus, Upload, Trash2, Copy, Play, Calendar } from 'lucide-react';

export default function SavedRoomsModal({
  isOpen,
  onClose,
  savedRooms,
  activeRoomId,
  onLoadRoom,
  onDeleteRoom,
  onDuplicateRoom,
  onSaveCurrentAsNew,
  onImportJSON,
  onNotify
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.room && Array.isArray(parsed.room.items)) {
          onImportJSON(parsed.room);
          onNotify(`Imported room: ${parsed.room.name}`);
          onClose();
        } else if (parsed.items && parsed.width) {
          onImportJSON(parsed);
          onNotify('Imported room design');
          onClose();
        } else {
          onNotify('Invalid Roomly JSON file');
        }
      } catch (err) {
        onNotify('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Saved Room Designs</h3>
            <p>Your saved designs stored safely on this device</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button className="btn btn-primary" onClick={onSaveCurrentAsNew}>
              <FolderPlus size={15} />
              <span>Save Current Design</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              <span>Import .JSON File</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleFileUpload}
            />
          </div>

          {savedRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#88948B' }}>
              <h4>No saved rooms yet</h4>
              <p style={{ fontSize: '0.85rem' }}>Click "Save Current Design" to store your first room layout.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {savedRooms.map(item => {
                const isActive = item.id === activeRoomId;
                const formattedDate = item.savedAt 
                  ? new Date(item.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Recently saved';

                return (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: isActive ? '#E6EFE9' : '#FAF8F5',
                      border: `1px solid ${isActive ? '#466352' : '#ECE8E0'}`,
                      borderRadius: '14px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{item.icon || '🛋️'}</span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1D231F' }}>
                          {item.name}
                        </h4>
                        {isActive && (
                          <span style={{ fontSize: '0.7rem', background: '#466352', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#626D65', marginTop: '0.25rem' }}>
                        {(item.width / 100).toFixed(1)} × {(item.length / 100).toFixed(1)} m • {item.items?.length || 0} pieces • {formattedDate}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={() => { onLoadRoom(item); onClose(); }}
                        title="Load this room into planner"
                      >
                        <Play size={13} />
                        <span>Open</span>
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem' }}
                        onClick={() => onDuplicateRoom(item)}
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '0.45rem' }}
                        onClick={() => onDeleteRoom(item.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
