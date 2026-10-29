// Roomly - Shared Design Welcome Banner & Action Bar
// Welcomes visitors who open a shared link and gives a clear "Copy & Edit this room" CTA

import React from 'react';
import { Copy, Sparkles, Box, Check, ArrowRight, X } from 'lucide-react';
import { CATALOG } from '../data/roomData';

export default function SharedRoomBanner({ 
  room, 
  unit = 'm', 
  onCopyAndEdit, 
  onView3D, 
  onDismiss 
}) {
  if (!room) return null;

  const wDisplay = unit === 'ft' 
    ? `${(room.width / 30.48).toFixed(1)} ft` 
    : `${(room.width / 100).toFixed(2)} m`;
  const lDisplay = unit === 'ft' 
    ? `${(room.length / 30.48).toFixed(1)} ft` 
    : `${(room.length / 100).toFixed(2)} m`;

  const pieceCount = (room.items || []).length;
  const totalCost = (room.items || []).reduce((acc, it) => acc + (CATALOG[it.type]?.price || 0), 0);

  return (
    <aside className="shared-room-banner" aria-label="Shared design notice">
      <div className="shared-banner-inner">
        <div className="shared-banner-info">
          <div className="shared-banner-tag">
            <Sparkles size={13} />
            <span>SHARED ROOM DESIGN</span>
          </div>

          <div className="shared-banner-title">
            <strong>{room.name || 'Custom Room'}</strong>
            <span className="shared-banner-specs">
              {wDisplay} × {lDisplay} · {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'} · Est. ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="shared-banner-actions">
          <button 
            className="btn btn-secondary shared-view3d-btn"
            onClick={onView3D}
            title="Explore this room in 3D"
          >
            <Box size={15} />
            <span>View in 3D</span>
          </button>

          <button 
            className="btn btn-primary shared-copy-btn"
            onClick={onCopyAndEdit}
            title="Make an editable copy for yourself"
          >
            <Copy size={15} />
            <span>Copy this design to edit</span>
            <ArrowRight size={14} />
          </button>

          {onDismiss && (
            <button 
              className="btn-icon shared-dismiss-btn" 
              onClick={onDismiss} 
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

