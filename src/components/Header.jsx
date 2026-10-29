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
      onNotify('Generating PDF...');
      setShowExportMenu(false);
      await exportDesignPDF(room, unit);
      onNotify('PDF downloaded');
    } catch (err) {
      console.error(err);
      onNotify('Failed to generate PDF: ' + (err.message || 'Error'));
    }
  };

  const handleExportJSON = () => {
    exportDesignJSON(room, shoppingList, unit);
    setShowExportMenu(false);
    onNotify('Project exported (.json)');
  };

  const handleExportOBJ = () => {
    exportRoomOBJ(room, CATALOG);
    setShowExportMenu(false);
    onNotify('3D model exported (.obj)');
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
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 140 }}
                onClick={() => setShowExportMenu(false)}
              />
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.4rem',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E6E1D6',
                minWidth: '175px',
                padding: '0.35rem',
                zIndex: 150,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    border: 'none', 
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    gap: '0.5rem',
                    color: '#26342B',
                    fontWeight: 600
                  }}
                  onClick={handleExportPDF}
                >
                  <FileText size={15} color="#3B5745" />
                  <span>PDF Document</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    border: 'none', 
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    gap: '0.5rem',
                    color: '#26342B',
                    fontWeight: 600
                  }}
                  onClick={handleExportJSON}
                >
                  <FileCode size={15} color="#466352" />
                  <span>Project Data (.json)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    border: 'none', 
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    gap: '0.5rem',
                    color: '#26342B',
                    fontWeight: 600
                  }}
                  onClick={handleExportOBJ}
                >
                  <Box size={15} color="#B88A44" />
                  <span>3D CAD Model (.obj)</span>
                </button>
              </div>
            </>
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
