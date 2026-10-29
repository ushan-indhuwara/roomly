import React, { useState } from 'react';
import { 
  Save, Folder, Share2, Download, HelpCircle, 
  ShoppingBag, BookOpen, Check, FileCode, Box, FileText
} from 'lucide-react';
import { exportDesignJSON, exportRoomOBJ, exportDesignPDF } from '../utils/exportUtils';
import { CATALOG } from '../data/roomData';

export default function Header({
  room,
  shoppingList,
  isSaved,
  unit,
  activePage = 'planner',
  onNavigate,
  onToggleUnit,
  onManualSave,
  onOpenSavedRooms,
  onOpenShopping,
  onOpenShortcuts,
  onOpenShare,
  onOpenFunnelInsights,
  onNotify
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleShareClick = () => {
    if (onOpenShare) {
      onOpenShare();
    } else {
      try {
        const payload = JSON.stringify({
          id: room.id,
          name: room.name,
          width: room.width,
          length: room.length,
          items: room.items
        });
        const encoded = btoa(encodeURIComponent(payload));
        const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
        navigator.clipboard.writeText(shareUrl);
        onNotify('Share link copied to clipboard! Anyone with this link can view your room.');
      } catch (err) {
        onNotify('Failed to copy share link');
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      onNotify('Generating architectural PDF with 2D blueprint & 4x 3D renders (Top, Walk-in, 4-Walls, 2-Walls)...');
      setShowExportMenu(false);
      await exportDesignPDF(room, unit);
      onNotify('Downloaded complete Room Spec Sheet PDF with 2D plan and 4x 3D renders!');
    } catch (err) {
      console.error(err);
      onNotify('Failed to generate PDF: ' + (err.message || 'Error'));
    }
  };

  const handleExportJSON = () => {
    exportDesignJSON(room, shoppingList, unit);
    setShowExportMenu(false);
    onNotify('Exported room design as JSON');
  };

  const handleExportOBJ = () => {
    exportRoomOBJ(room, CATALOG);
    setShowExportMenu(false);
    onNotify('Exported 3D model (.OBJ) for CAD & 3D viewers');
  };

  return (
    <header className="roomly-header">
      <div className="brand-group">
        <button 
          onClick={() => onNavigate && onNavigate('welcome')} 
          className="brand-logo"
          title="Return to Roomly Home Page"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          roomly<span className="brand-dot">.</span>
        </button>
        <span className="brand-badge">Studio</span>

        <nav className="nav-links">
          <button 
            className={`nav-link ${activePage === 'planner' ? 'active' : ''}`}
            onClick={() => onNavigate && onNavigate('planner')}
          >
            Studio Planner
          </button>
          <button className="nav-link" onClick={onOpenShopping}>
            Shopping List ({room?.items?.length || 0})
          </button>
          <button 
            className={`nav-link ${activePage === 'journal' ? 'active' : ''}`}
            onClick={() => onNavigate && onNavigate('journal')}
          >
            Design Journal
          </button>
        </nav>
      </div>

      <div className="header-actions">
        {/* Save Status Badge */}
        <div className="save-status-badge">
          <span className={`status-dot ${isSaved ? '' : 'unsaved'}`} />
          <span>{isSaved ? 'Saved locally' : 'Unsaved changes'}</span>
        </div>

        {/* Unit Toggle: m / ft */}
        <div className="unit-toggle">
          <button 
            className={`unit-btn ${unit === 'm' ? 'active' : ''}`}
            onClick={() => onToggleUnit('m')}
          >
            Meters
          </button>
          <button 
            className={`unit-btn ${unit === 'ft' ? 'active' : ''}`}
            onClick={() => onToggleUnit('ft')}
          >
            Feet
          </button>
        </div>

        {/* Save Room Button */}
        <button className="btn btn-secondary" onClick={onManualSave} title="Save to Browser Storage">
          <Save size={15} />
          <span>Save</span>
        </button>

        {/* Saved Rooms Library */}
        <button className="btn btn-secondary" onClick={onOpenSavedRooms} title="View Saved Rooms">
          <Folder size={15} />
          <span>My Rooms</span>
        </button>

        {/* Share Link */}
        <button className="btn btn-secondary" onClick={handleShareClick} title="Share Room Design">
          <Share2 size={15} />
          <span>Share</span>
        </button>

        {/* Export / Download Menu */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Download Room Design & PDF"
          >
            <Download size={15} />
            <span>Download</span>
          </button>

          {showExportMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              background: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-light)',
              minWidth: '260px',
              padding: '0.55rem',
              zIndex: 150
            }}>
              {/* Primary PDF Spec Sheet */}
              <button
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'flex-start', 
                  border: '1.5px solid var(--sage-200)', 
                  padding: '0.65rem 0.85rem',
                  background: 'var(--sage-50)',
                  borderRadius: '10px',
                  marginBottom: '0.45rem'
                }}
                onClick={handleExportPDF}
              >
                <FileText size={18} color="#3B5745" />
                <div style={{ textAlign: 'left', marginLeft: '0.45rem', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1D231F' }}>
                    Room Spec Sheet (.PDF)
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#626D65' }}>
                    2D Blueprint + 4x 3D Renders + Specs
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.62rem', 
                  background: '#3B5745', 
                  color: '#fff', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontWeight: 800 
                }}>
                  PDF
                </span>
              </button>

              {/* JSON Data */}
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.85rem' }}
                onClick={handleExportJSON}
              >
                <FileCode size={15} color="#466352" />
                <span style={{ marginLeft: '0.45rem', fontSize: '0.8rem' }}>Room Design Data (.JSON)</span>
              </button>

              {/* 3D Model */}
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '0.5rem 0.85rem' }}
                onClick={handleExportOBJ}
              >
                <Box size={15} color="#CCA262" />
                <span style={{ marginLeft: '0.45rem', fontSize: '0.8rem' }}>3D CAD Model (.OBJ)</span>
              </button>
            </div>
          )}
        </div>

        {/* Funnel Analytics / Drop-off Insights */}
        {onOpenFunnelInsights && (
          <button 
            className="btn-icon header-stats-btn" 
            onClick={onOpenFunnelInsights} 
            title="Visitor Funnel Insights"
            aria-label="Visitor Funnel Insights"
          >
            <span style={{ fontSize: '0.95rem' }}>📊</span>
          </button>
        )}

        {/* Keyboard Shortcuts Helper */}
        <button className="btn-icon" onClick={onOpenShortcuts} title="Keyboard Shortcuts (?)">
          <HelpCircle size={17} />
        </button>
      </div>
    </header>
  );
}
