// Roomly - Main Web Application
// State coordination, 2D/3D mode toggle, undo/redo, localStorage persistence, modals

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ROOM_PRESETS, CATALOG } from './data/roomData';
import { parseShareUrl } from './utils/exportUtils';

import Header from './components/Header';
import RoomPresetsBar from './components/RoomPresetsBar';
import CatalogPanel from './components/CatalogPanel';
import Planner2D from './components/Planner2D';
import Planner3D from './components/Planner3D';
import InspectorPanel from './components/InspectorPanel';
import AIAssistant from './components/AIAssistant';
import ShoppingListModal from './components/ShoppingListModal';
import SavedRoomsModal from './components/SavedRoomsModal';
import ArticleReaderModal from './components/ArticleReaderModal';
import ShortcutsModal from './components/ShortcutsModal';
import JournalPage from './components/JournalPage';
import WelcomePage from './components/WelcomePage';
import RoomSetupPage from './components/RoomSetupPage';
import ShareModal from './components/ShareModal';
import SharedRoomBanner from './components/SharedRoomBanner';
import FirstUseGuide from './components/FirstUseGuide';
import FunnelInsightsModal from './components/FunnelInsightsModal';
import { trackEvent } from './utils/analytics';

import { LayoutGrid, Box, Undo2, Redo2, Layers, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const LOCAL_STORAGE_KEY = 'roomly_active_design_v1';
const SAVED_ROOMS_KEY = 'roomly_saved_rooms_v1';
const ONBOARDING_KEY = 'roomly_started_planning_v1';

// Helper to guarantee every room layout has movable, editable, deletable window & door items
function ensureRoomFixtures(r) {
  if (!r || !r.items) return r;
  let items = [...r.items];

  // 1. Ensure Movable Architectural Window
  const hasWindowItem = items.some(it => it.type?.startsWith('window'));
  if (!hasWindowItem) {
    const legacyWin = (r.windows && r.windows[0]) || { wall: 'top', offset: 120, width: 160, elevation: 85 };
    const isLeftWall = legacyWin.wall === 'left';
    const isRightWall = legacyWin.wall === 'right';
    const isBottomWall = legacyWin.wall === 'bottom';

    let x = legacyWin.offset || 120;
    let y = 0;
    let w = legacyWin.width || 160;
    let d = 16;
    let rot = 0;

    if (isLeftWall) {
      x = 0;
      y = legacyWin.offset || 100;
      w = 16;
      d = legacyWin.width || 150;
      rot = 90;
    } else if (isRightWall) {
      x = (r.width || 400) - 16;
      y = legacyWin.offset || 100;
      w = 16;
      d = legacyWin.width || 150;
      rot = 90;
    } else if (isBottomWall) {
      x = legacyWin.offset || 120;
      y = (r.length || 400) - 16;
      w = legacyWin.width || 160;
      d = 16;
      rot = 180;
    }

    items.unshift({
      id: `item-win-${Date.now()}`,
      type: 'window_casement',
      x,
      y,
      w,
      d,
      rot,
      elevation: legacyWin.elevation || 85,
      material: 'white',
      zIndex: 1
    });
  }

  // 2. Ensure Movable Architectural Door
  const hasDoorItem = items.some(it => it.type?.startsWith('door'));
  if (!hasDoorItem) {
    const legacyDoor = (r.doors && r.doors[0]) || { wall: 'bottom', offset: 60, width: 90 };
    const isLeftWall = legacyDoor.wall === 'left';
    const isRightWall = legacyDoor.wall === 'right';
    const isTopWall = legacyDoor.wall === 'top';

    let x = legacyDoor.offset || 60;
    let y = Math.max(0, (r.length || 400) - 16);
    let w = legacyDoor.width || 90;
    let d = 16;
    let rot = 0;

    if (isLeftWall) {
      x = 0;
      y = legacyDoor.offset || 60;
      w = 16;
      d = legacyDoor.width || 90;
      rot = 90;
    } else if (isRightWall) {
      x = Math.max(0, (r.width || 400) - 16);
      y = legacyDoor.offset || 60;
      w = 16;
      d = legacyDoor.width || 90;
      rot = 90;
    } else if (isTopWall) {
      x = legacyDoor.offset || 60;
      y = 0;
      w = legacyDoor.width || 90;
      d = 16;
      rot = 180;
    }

    items.unshift({
      id: `item-door-${Date.now()}`,
      type: 'door_passage',
      x,
      y,
      w,
      d,
      rot,
      elevation: 0,
      material: 'oak',
      zIndex: 1
    });
  }

  return { ...r, items };
}

export default function App() {
  // Check for shared URL room on load
  const sharedRoom = parseShareUrl();

  // Active page state: 'welcome' (default Home Page), 'planner', 'setup', or 'journal'
  const [activePage, setActivePage] = useState(() => {
    if (sharedRoom) return 'planner';
    try {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash === '#studio' || hash === '#planner') return 'planner';
      if (hash === '#setup') return 'setup';
      if (hash === '#journal') return 'journal';
    } catch (e) {}
    // The home page is ALWAYS the default when visiting the website
    return 'welcome';
  });

  // Load initial room from share, localStorage, or default preset (Living Room)
  const [room, setRoom] = useState(() => {
    if (sharedRoom) return ensureRoomFixtures(sharedRoom);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return ensureRoomFixtures(JSON.parse(saved));
    } catch (e) {}
    return ensureRoomFixtures(ROOM_PRESETS[0]);
  });

  const [savedRooms, setSavedRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ROOMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [unit, setUnit] = useState('m'); // 'm' or 'ft'
  const [isSaved, setIsSaved] = useState(true);
  const [toast, setToast] = useState(null);

  // Shared room banner state
  const [isSharedRoom, setIsSharedRoom] = useState(() => Boolean(sharedRoom));

  // Modals state
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [isSavedRoomsOpen, setIsSavedRoomsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFunnelInsightsOpen, setIsFunnelInsightsOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);

  // Undo / Redo history stack
  const historyRef = useRef([JSON.stringify(room)]);
  const historyIndexRef = useRef(0);
  const [, setHistoryTick] = useState(0); // force re-render for undo button states

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => setToast(null), 3000);
  }, []);

  // Record undo/redo state
  const pushState = useCallback((newRoom) => {
    const serialized = JSON.stringify(newRoom);
    if (historyRef.current[historyIndexRef.current] === serialized) return;

    // Discard forward history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(serialized);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;

    setIsSaved(false);
    setHistoryTick(t => t + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = JSON.parse(historyRef.current[historyIndexRef.current]);
      setRoom(prev);
      setSelectedId(null);
      setHistoryTick(t => t + 1);
      showToast('Undone');
    }
  }, [showToast]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = JSON.parse(historyRef.current[historyIndexRef.current]);
      setRoom(next);
      setSelectedId(null);
      setHistoryTick(t => t + 1);
      showToast('Redone');
    }
  }, [showToast]);

  // Debounced auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(room));
        setIsSaved(true);
      } catch (e) {}
    }, 1200);
    return () => clearTimeout(timer);
  }, [room]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    try {
      if (page === 'planner') {
        window.location.hash = 'studio';
      } else if (page === 'setup') {
        window.location.hash = 'setup';
      } else if (page === 'journal') {
        window.location.hash = 'journal';
      } else if (page === 'welcome') {
        window.location.hash = '';
      }
    } catch (e) {}
  }, []);

  // Synchronize browser URL hash with active page
  useEffect(() => {
    const handleHash = () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.startsWith('#share=')) {
        setActivePage('planner');
      } else if (hash === '#studio' || hash === '#planner') {
        setActivePage('planner');
      } else if (hash === '#setup') {
        setActivePage('setup');
      } else if (hash === '#journal') {
        setActivePage('journal');
      } else {
        setActivePage('welcome');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Presets & Room actions
  const handleSelectPreset = (preset) => {
    const newRoom = ensureRoomFixtures(JSON.parse(JSON.stringify(preset)));
    newRoom.items = newRoom.items.map((it, idx) => ({
      ...it,
      id: it.id || `preset-${Date.now()}-${idx}`
    }));
    setRoom(newRoom);
    setSelectedId(null);
    pushState(newRoom);
    showToast(`Loaded ${preset.name}`);
  };

  const handleStartPlanning = (preset, width = preset.width, length = preset.length) => {
    const newRoom = ensureRoomFixtures(JSON.parse(JSON.stringify(preset)));
    newRoom.width = width;
    newRoom.length = length;
    newRoom.items = newRoom.items.map((it, idx) => ({
      ...it,
      id: `item-${Date.now()}-${idx}`
    }));
    setRoom(newRoom);
    setSelectedId(null);
    pushState(newRoom);
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch (e) {}
    setActivePage('planner');
    showToast(`Your ${preset.name.toLowerCase()} is ready to edit`);
  };

  const handleUpdateDimensions = (w, l) => {
    const updated = { ...room, width: w, length: l };
    setRoom(updated);
    pushState(updated);
  };

  const handleAddItem = (type) => {
    const cat = CATALOG[type];
    if (!cat) return;

    // Place near center of room
    const targetX = Math.max(10, Math.round((room.width - cat.width) / 2));
    const targetY = Math.max(10, Math.round((room.length - cat.depth) / 2));

    const newItem = {
      id: `item-${Date.now()}`,
      type: type,
      x: targetX,
      y: targetY,
      w: cat.width,
      d: cat.depth,
      rot: 0,
      elevation: cat.defaultElevation || 0,
      mountType: cat.defaultMountType || 'floor',
      material: cat.defaultMaterial || 'boucle',
      zIndex: type.startsWith('rug_') ? 1 : (type.startsWith('tv') ? 4 : 2)
    };

    const updated = {
      ...room,
      items: [...room.items, newItem]
    };

    setRoom(updated);
    setSelectedId(newItem.id);
    pushState(updated);
    trackEvent('add_furniture', { type: cat.name, room: room.name });
    showToast(`Added ${cat.name} to room`);
  };

  const handleUpdateRoom = (props) => {
    const updated = { ...room, ...props };
    setRoom(updated);
    pushState(updated);
  };

  const handleUpdateItem = (id, props) => {
    const updatedItems = room.items.map(it => it.id === id ? { ...it, ...props } : it);
    const updated = { ...room, items: updatedItems };
    setRoom(updated);
    pushState(updated);
  };

  const handleRemoveItem = (id) => {
    const updatedItems = room.items.filter(it => it.id !== id);
    const updated = { ...room, items: updatedItems };
    setRoom(updated);
    if (selectedId === id) setSelectedId(null);
    pushState(updated);
    showToast('Piece removed');
  };

  const handleDuplicateItem = (id) => {
    const target = room.items.find(it => it.id === id);
    if (!target) return;

    const copy = {
      ...target,
      id: `item-${Date.now()}`,
      x: Math.min(room.width - target.w, target.x + 25),
      y: Math.min(room.length - target.d, target.y + 25)
    };

    const updated = { ...room, items: [...room.items, copy] };
    setRoom(updated);
    setSelectedId(copy.id);
    pushState(updated);
    trackEvent('add_furniture', { type: target.type, duplicated: true });
    showToast('Piece duplicated');
  };

  const handleApplyAISuggestions = (itemsOrConfig) => {
    let newItemsList;
    if (Array.isArray(itemsOrConfig)) {
      // If items share IDs with existing room items, replace full layout (move, space optimization)
      const hasExistingIds = itemsOrConfig.some(it => room.items.some(ex => ex.id === it.id));
      if (hasExistingIds) {
        newItemsList = itemsOrConfig;
      } else {
        newItemsList = [...room.items, ...itemsOrConfig];
      }
    } else if (itemsOrConfig && itemsOrConfig.items) {
      newItemsList = itemsOrConfig.items;
    } else {
      return;
    }

    const updated = {
      ...room,
      items: newItemsList
    };
    setRoom(updated);
    pushState(updated);
    trackEvent('apply_ai_layout', { count: newItemsList.length });
    try {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    } catch (e) {}
  };

  // View mode switcher with funnel tracking
  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === '3d') {
      trackEvent('open_3d', { room: room.name, pieceCount: room.items?.length || 0 });
    }
  };

  // Copy shared design into editable personal workspace
  const handleCopySharedDesign = () => {
    const remix = {
      ...room,
      id: `remix-${Date.now()}`,
      name: `${room.name} (My Copy)`
    };
    setRoom(remix);
    pushState(remix);
    setIsSharedRoom(false);
    try {
      window.history.replaceState(null, '', window.location.pathname);
      confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
    } catch (e) {}
    showToast(`Copied "${remix.name}" to your workspace!`);
    trackEvent('start_room', { source: 'shared_copy' });
  };

  // Manual save
  const handleManualSave = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(room));
      setIsSaved(true);
      trackEvent('save_room', { room: room.name, method: 'manual_save' });
      showToast('Saved to browser storage');
    } catch (e) {
      showToast('Error saving to storage');
    }
  };

  // Saved Rooms library actions
  const handleSaveCurrentAsNew = () => {
    const entry = {
      ...room,
      id: `saved-${Date.now()}`,
      savedAt: new Date().toISOString()
    };
    const updatedList = [entry, ...savedRooms.filter(r => r.id !== entry.id)];
    setSavedRooms(updatedList);
    try {
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(updatedList));
      trackEvent('save_room', { room: room.name, method: 'my_rooms_library' });
      showToast(`Saved "${room.name}" to My Rooms`);
    } catch (e) {}
  };

  const handleDeleteSavedRoom = (id) => {
    const updatedList = savedRooms.filter(r => r.id !== id);
    setSavedRooms(updatedList);
    try {
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(updatedList));
      showToast('Room design deleted');
    } catch (e) {}
  };

  const handleDuplicateSavedRoom = (roomToDup) => {
    const copy = {
      ...roomToDup,
      id: `saved-${Date.now()}`,
      name: `${roomToDup.name} (Copy)`,
      savedAt: new Date().toISOString()
    };
    const updatedList = [copy, ...savedRooms];
    setSavedRooms(updatedList);
    try {
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(updatedList));
      showToast('Room design duplicated');
    } catch (e) {}
  };

  const handleLoadSavedRoom = (roomToLoad) => {
    const loaded = JSON.parse(JSON.stringify(roomToLoad));
    setRoom(loaded);
    setSelectedId(null);
    pushState(loaded);
    showToast(`Loaded ${roomToLoad.name}`);
  };

  const selectedItem = room?.items?.find(x => x.id === selectedId);

  return (
    <div className={`roomly-app ${activePage === 'planner' ? 'planner-view' : ''}`}>
      {activePage !== 'welcome' && activePage !== 'setup' && (
        <Header
          room={room}
          shoppingList={room?.items || []}
          isSaved={isSaved}
          unit={unit}
          activePage={activePage}
          onNavigate={handleNavigate}
          onToggleUnit={setUnit}
          onManualSave={handleManualSave}
          onOpenSavedRooms={() => setIsSavedRoomsOpen(true)}
          onOpenShopping={() => setIsShoppingOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenFunnelInsights={() => setIsFunnelInsightsOpen(true)}
          onNotify={showToast}
        />
      )}

      {/* Conditional View: Planner Studio or Dedicated Journal Page */}
      {activePage === 'welcome' ? (
        <WelcomePage
          onOpenStudio={() => handleNavigate('planner')}
          onStart={() => handleNavigate('setup')}
          onTrySample={() => handleStartPlanning(ROOM_PRESETS[0])}
          onSelectRoomPreset={(preset) => handleStartPlanning(preset)}
          onOpenFunnelInsights={() => setIsFunnelInsightsOpen(true)}
        />
      ) : activePage === 'setup' ? (
        <RoomSetupPage
          onBack={() => handleNavigate('welcome')}
          onStart={handleStartPlanning}
          unit={unit}
          onToggleUnit={setUnit}
        />
      ) : activePage === 'planner' ? (
        <>
          {/* Shared Room Discovery Banner */}
          {isSharedRoom && (
            <SharedRoomBanner
              room={room}
              unit={unit}
              onCopyAndEdit={handleCopySharedDesign}
              onView3D={() => handleToggleViewMode('3d')}
              onDismiss={() => setIsSharedRoom(false)}
            />
          )}

          {/* Presets and Room Dimensions Bar */}
          <RoomPresetsBar
            currentRoomId={room.id}
            onSelectPreset={handleSelectPreset}
            roomWidthCm={room.width}
            roomLengthCm={room.length}
            onUpdateDimensions={handleUpdateDimensions}
            unit={unit}
          />

          {/* Main Studio Work Area */}
          <main className="studio-main">
            {/* Left: Furniture Catalog */}
            <CatalogPanel
              onAddItem={handleAddItem}
              unit={unit}
            />

            {/* Center: Stage with 2D / 3D Canvas */}
            <section className="stage-center">
              {/* First-Use Quick Guidance Banner */}
              <FirstUseGuide
                room={room}
                viewMode={viewMode}
                onToggle3D={() => handleToggleViewMode(viewMode === '2d' ? '3d' : '2d')}
                onOpenCatalog={() => {
                  const el = document.querySelector('.catalog-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onOpenShare={() => setIsShareOpen(true)}
              />

              {/* Top Stage Controls (2D/3D toggle + Info + Undo/Redo) */}
              <div className="stage-top-controls">
                {/* 2D / 3D View Switcher */}
                <div className="view-mode-toggle">
                  <button
                    className={`view-mode-btn ${viewMode === '2d' ? 'active' : ''}`}
                    onClick={() => handleToggleViewMode('2d')}
                  >
                    <span>▦</span>
                    <span>2D Floor Plan</span>
                  </button>
                  <button
                    className={`view-mode-btn ${viewMode === '3d' ? 'active' : ''}`}
                    onClick={() => handleToggleViewMode('3d')}
                  >
                    <span>◇</span>
                    <span>3D Room Preview</span>
                  </button>
                </div>

                {/* Room Title Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid #ECE8E0',
                  fontSize: '0.78rem',
                  color: '#38423B',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <span>{room.icon || '🛋️'}</span>
                  <span style={{ fontWeight: 700 }}>{room.name}</span>
                  <span style={{ color: '#88948B' }}>•</span>
                  <span style={{ color: '#626D65' }}>
                    {unit === 'ft' 
                      ? `${(room.width / 30.48).toFixed(1)} × ${(room.length / 30.48).toFixed(1)} ft` 
                      : `${(room.width / 100).toFixed(1)} × ${(room.length / 100).toFixed(1)} m`}
                  </span>
                </div>

                {/* Undo & Redo Buttons */}
                <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.95)', padding: '4px', borderRadius: '14px', border: '1px solid #ECE8E0' }}>
                  <button 
                    className="btn-icon" 
                    onClick={handleUndo} 
                    disabled={historyIndexRef.current <= 0}
                    style={{ opacity: historyIndexRef.current <= 0 ? 0.4 : 1 }}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button 
                    className="btn-icon" 
                    onClick={handleRedo}
                    disabled={historyIndexRef.current >= historyRef.current.length - 1}
                    style={{ opacity: historyIndexRef.current >= historyRef.current.length - 1 ? 0.4 : 1 }}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
              </div>

              {/* Active Canvas (2D SVG or 3D Three.js) */}
              {viewMode === '2d' ? (
                <Planner2D
                  room={room}
                  selectedId={selectedId}
                  onSelectItem={setSelectedId}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onDuplicateItem={handleDuplicateItem}
                  unit={unit}
                />
              ) : (
                <Planner3D
                  room={room}
                  selectedId={selectedId}
                  onSelectItem={setSelectedId}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  onDuplicateItem={handleDuplicateItem}
                />
              )}
            </section>

            {/* Right: Inspector & AI Assistant */}
            <aside className="studio-sidebar right">
              <InspectorPanel
                selectedItem={selectedItem}
                room={room}
                onUpdateRoom={handleUpdateRoom}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                onDuplicateItem={handleDuplicateItem}
                onAddToCart={(type) => {
                  setIsShoppingOpen(true);
                  showToast('View item in Shopping List');
                }}
                unit={unit}
              />

              {/* Layout Suggestions (hidden when an item is selected so user has full focus on piece inspector) */}
              {!selectedItem && (
                <AIAssistant
                  room={room}
                  selectedItem={selectedItem}
                  onApplySuggestions={handleApplyAISuggestions}
                  onNotify={showToast}
                />
              )}
            </aside>
          </main>
        </>
      ) : (
        /* Dedicated Journal Page */
        <JournalPage
          onBackToPlanner={() => handleNavigate('planner')}
          onReadArticle={(article) => setActiveArticle(article)}
          currentRoomName={room?.name}
        />
      )}

      {/* Footer */}
      {activePage !== 'welcome' && activePage !== 'setup' && <footer className="roomly-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button 
            type="button"
            onClick={() => handleNavigate('welcome')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1D231F' }}
            title="Go to Home Page"
          >
            roomly<span style={{ color: '#466352' }}>.</span>
          </button>
          <span>Make room for living.</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#38423B',
          background: 'rgba(70, 99, 82, 0.08)',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          border: '1px solid rgba(70, 99, 82, 0.15)'
        }}>
          <span style={{ color: '#466352' }}>✨</span>
          <span>Click piece to select • Drag to move • Customize in right panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>© 2026 Roomly Studio • Architectural scale & 3D visualization</span>
          <button 
            type="button" 
            className="footer-stats-trigger" 
            onClick={() => setIsFunnelInsightsOpen(true)}
            title="View Privacy-Preserving Funnel Analytics"
          >
            📊 Visitor Funnel Stats
          </button>
        </div>
      </footer>}

      {/* Modals */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        room={room}
        unit={unit}
        onNotify={showToast}
      />

      <FunnelInsightsModal
        isOpen={isFunnelInsightsOpen}
        onClose={() => setIsFunnelInsightsOpen(false)}
      />

      <ShoppingListModal
        isOpen={isShoppingOpen}
        onClose={() => setIsShoppingOpen(false)}
        room={room}
        onNotify={showToast}
      />

      <SavedRoomsModal
        isOpen={isSavedRoomsOpen}
        onClose={() => setIsSavedRoomsOpen(false)}
        savedRooms={savedRooms}
        activeRoomId={room.id}
        onLoadRoom={handleLoadSavedRoom}
        onDeleteRoom={handleDeleteSavedRoom}
        onDuplicateRoom={handleDuplicateSavedRoom}
        onSaveCurrentAsNew={handleSaveCurrentAsNew}
        onImportJSON={(imported) => {
          setRoom(imported);
          pushState(imported);
        }}
        onNotify={showToast}
      />

      <ArticleReaderModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
        onAddFeaturedPiece={(pieceKey) => {
          handleAddItem(pieceKey);
          setActiveArticle(null);
          setActivePage('planner');
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={16} color="#A8D5BA" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
