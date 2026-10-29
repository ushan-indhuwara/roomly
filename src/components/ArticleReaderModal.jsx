// Roomly - Interior Design Article Reader Modal

import React from 'react';
import { X, Clock, Tag, Sparkles, Plus } from 'lucide-react';
import { CATALOG } from '../data/roomData';

export default function ArticleReaderModal({ article, onClose, onAddFeaturedPiece }) {
  if (!article) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card reader-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span className="brand-badge">{article.category}</span>
              <span style={{ fontSize: '0.75rem', color: '#88948B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> {article.readTime}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', lineHeight: 1.3 }}>
              {article.title}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Hero Banner */}
          <div style={{
            height: '140px',
            background: article.gradient || 'linear-gradient(135deg, #E6EFEA, #D8E5DC)',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '3.5rem',
            marginBottom: '1.75rem'
          }}>
            {article.heroIcon || '🛋️'}
          </div>

          {/* Article HTML Content */}
          <div 
            className="reader-content"
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />

          {/* Featured Pieces in Article with Add to Room button */}
          {article.featuredPieces && article.featuredPieces.length > 0 && (
            <div style={{
              marginTop: '2.5rem',
              padding: '1.5rem',
              background: '#FAF8F5',
              border: '1px solid #ECE8E0',
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#466352',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <Sparkles size={14} />
                <span>Featured Furniture in this Story</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {article.featuredPieces.map(pieceKey => {
                  const item = CATALOG[pieceKey];
                  if (!item) return null;
                  return (
                    <div 
                      key={pieceKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: '#FFFFFF',
                        border: '1px solid #ECE8E0',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#577864', fontWeight: 600 }}>${item.price}</div>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sage-subtle"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => onAddFeaturedPiece(pieceKey)}
                        title="Add to room planner"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Back to Planner
          </button>
        </div>
      </div>
    </div>
  );
}
