// Roomly - Share Design & Social Discovery Modal
// Generates shareable URL, social platform sharing, visual card preview

import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { generateShareUrl } from '../utils/exportUtils';
import { CATALOG } from '../data/roomData';
import { trackEvent } from '../utils/analytics';

export default function ShareModal({ isOpen, onClose, room, unit = 'm', onNotify }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !room) return null;

  const shareUrl = generateShareUrl(room);

  const wDisplay = unit === 'ft' 
    ? `${(room.width / 30.48).toFixed(1)} ft` 
    : `${(room.width / 100).toFixed(2)} m`;
  const lDisplay = unit === 'ft' 
    ? `${(room.length / 30.48).toFixed(1)} ft` 
    : `${(room.length / 100).toFixed(2)} m`;

  const totalCost = (room.items || []).reduce((acc, it) => {
    return acc + (CATALOG[it.type]?.price || 0);
  }, 0);

  const pieceCount = (room.items || []).length;
  const shareTitle = `${room.name || 'Room Design'} (${wDisplay} × ${lDisplay})`;
  const shareText = `Check out this ${room.name || 'room'} design planned to scale on Roomly! Explore it in 2D and 3D:`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackEvent('share_room', { method: 'copy_link', roomName: room.name });
      if (onNotify) onNotify('Share link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      if (onNotify) onNotify('Failed to copy link');
    }
  };

  const handleSocialShare = (platform, pinStyle = 'layout') => {
    trackEvent('share_room', { method: platform, roomName: room.name });
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareText} ${shareTitle}`);

    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=interiordesign,roomplanning`;
    } else if (platform === 'email') {
      url = `mailto:?subject=${encodeURIComponent(`Roomly Design: ${room.name}`)}&body=${encodedText}%0A%0A${encodedUrl}`;
    } else if (platform === 'pinterest') {
      const pinImages = {
        layout: 'roomly-layout.png',
        space: 'roomly-small-space.png',
        preview: 'roomly-3d-preview.png'
      };
      const pinDescriptions = {
        layout: `Plan your room before you buy. Measure, arrange furniture to scale, and preview your ${room.name || 'room'} in 3D with Roomly.`,
        space: `Make every corner count. Find a furniture layout for your ${room.name || 'room'} that leaves room to live with Roomly.`,
        preview: `Design it, then walk through it. Explore your ${room.name || 'room'} layout in 3D with Roomly before you buy.`
      };
      const pinParams = new URLSearchParams({
        url: shareUrl,
        media: `${window.location.origin}/pinterest/${pinImages[pinStyle]}`,
        description: pinDescriptions[pinStyle] || encodedText
      });
      url = `https://pinterest.com/pin/create/button/?${pinParams.toString()}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card share-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="share-header-icon"><Share2 size={16} /></span>
              <h3>Share Your Room Design</h3>
            </div>
            <p>Send an interactive link to clients, friends, or family to explore in 3D</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Social Card Preview */}
          <div className="share-preview-card">
            <div className="share-card-badge">
              <Sparkles size={12} />
              <span>Interactive 3D Roomly Preview</span>
            </div>

            <div className="share-card-content">
              <div className="share-card-thumb">
                <span className="share-card-thumb-icon">🛋️</span>
                <span className="share-card-thumb-dim">{wDisplay} × {lDisplay}</span>
              </div>

              <div className="share-card-meta">
                <h4 className="share-card-title">{room.name || 'Custom Room'}</h4>
                <p className="share-card-details">
                  Architectural scale plan with {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'} · Est. budget ${totalCost.toLocaleString()}
                </p>
                <div className="share-card-tags">
                  <span>True-to-Scale</span>
                  <span>3D Walkthrough</span>
                  <span>Free to Remix</span>
                </div>
              </div>
            </div>
          </div>

          {/* Share Link Row */}
          <div className="share-input-group">
            <label className="share-input-label">
              <Globe size={13} />
              <span>Direct shareable link</span>
            </label>
            <div className="share-url-container">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="share-url-input"
                onFocus={(e) => e.target.select()}
              />
              <button 
                className={`btn ${copied ? 'btn-sage-subtle' : 'btn-primary'}`}
                onClick={handleCopyLink}
                style={{ minWidth: '120px' }}
              >
                {copied ? (
                  <>
                    <Check size={15} color="#3B5745" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="share-link-hint">
              Recipients can immediately open this layout, view it in 3D, and duplicate it to create their own version without logging in.
            </p>
          </div>

          {/* Social Share Buttons */}
          <div className="share-social-section">
            <div className="share-section-title">Share your room or create a Pinterest post:</div>
            <div className="share-social-grid share-pinterest-grid">
              <button 
                type="button" 
                className="share-social-btn whatsapp"
                onClick={() => handleSocialShare('whatsapp')}
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
              <button 
                type="button" 
                className="share-social-btn twitter"
                onClick={() => handleSocialShare('twitter')}
              >
                <span>𝕏</span>
                <span>X / Twitter</span>
              </button>
              <button type="button" className="share-social-btn pinterest" onClick={() => handleSocialShare('pinterest', 'layout')}>
                <span>📌</span><span>Plan your room</span>
              </button>
              <button type="button" className="share-social-btn pinterest" onClick={() => handleSocialShare('pinterest', 'space')}>
                <span>📌</span><span>Small spaces</span>
              </button>
              <button type="button" className="share-social-btn pinterest" onClick={() => handleSocialShare('pinterest', 'preview')}>
                <span>📌</span><span>3D preview</span>
              </button>
              <button 
                type="button" 
                className="share-social-btn email"
                onClick={() => handleSocialShare('email')}
              >
                <span>✉️</span>
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: '#626D65' }}>
            🔒 Private & client-side · No designs are sold or indexed
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


