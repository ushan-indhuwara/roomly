// Roomly - Ultra-Compact Floating First-Use Guidance Pill
// Floats over canvas with 0px layout height impact, keeping 3D preview and 2D canvas at full size

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Box, Share2, Plus, X } from 'lucide-react';

const GUIDE_DISMISSED_KEY = 'roomly_first_use_guide_dismissed_v1';

export default function FirstUseGuide({ 
  room, 
  viewMode, 
  onToggle3D, 
  onOpenCatalog, 
  onOpenShare 
}) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_DISMISSED_KEY) === '1';
    } catch (e) {
      return false;
    }
  });

  const hasAddedFurniture = (room?.items?.length || 0) > 0;
  const [hasViewed3D, setHasViewed3D] = useState(viewMode === '3d');
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (viewMode === '3d') setHasViewed3D(true);
  }, [viewMode]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(GUIDE_DISMISSED_KEY, '1');
    } catch (e) {}
  };

  if (isDismissed) return null;

  return (
    <div className="compact-first-guide" aria-label="Quick start guide">
      <div className="guide-pill-inner">
        <span className="guide-pill-badge">
          <Sparkles size={11} />
          <span>Quick tips</span>
        </span>

        {/* Step 1: Add Furniture */}
        <button
          type="button"
          className={`guide-mini-step ${hasAddedFurniture ? 'done' : 'active'}`}
          onClick={onOpenCatalog}
          title="Click to add furniture from catalog"
        >
          <span className="mini-step-check">
            {hasAddedFurniture ? <Check size={10} /> : '1'}
          </span>
          <span className="mini-step-text">Add to scale</span>
        </button>

        <span className="guide-dot-separator">·</span>

        {/* Step 2: 3D View */}
        <button
          type="button"
          className={`guide-mini-step ${hasViewed3D ? 'done' : (hasAddedFurniture ? 'active' : '')}`}
          onClick={onToggle3D}
          title="Switch to 3D room preview"
        >
          <span className="mini-step-check">
            {hasViewed3D ? <Check size={10} /> : '2'}
          </span>
          <span className="mini-step-text">Explore 3D</span>
        </button>

        <span className="guide-dot-separator">·</span>

        {/* Step 3: Share */}
        <button
          type="button"
          className={`guide-mini-step ${hasShared ? 'done' : (hasViewed3D ? 'active' : '')}`}
          onClick={() => {
            setHasShared(true);
            if (onOpenShare) onOpenShare();
          }}
          title="Share room design"
        >
          <span className="mini-step-check">
            {hasShared ? <Check size={10} /> : '3'}
          </span>
          <span className="mini-step-text">Share link</span>
        </button>

        {/* Dismiss */}
        <button 
          type="button" 
          className="guide-mini-dismiss" 
          onClick={handleDismiss} 
          title="Dismiss guide"
          aria-label="Dismiss guide"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
