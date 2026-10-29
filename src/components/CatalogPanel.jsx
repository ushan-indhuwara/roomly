// Roomly - Furniture Catalog Panel
// Clean vertical list (scrolling up-to-down, ZERO horizontal/left-to-right scroll)
// Includes category filter wrapping, search, dimensions, AliExpress & Amazon links, and + Add to Room

import React, { useState, useMemo } from 'react';
import { CATALOG } from '../data/roomData';
import { Search, Plus, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: '✨' },
  { id: 'Seating', label: 'Seating', icon: '🛋️' },
  { id: 'Beds', label: 'Beds', icon: '🛏️' },
  { id: 'Tables & Desks', label: 'Tables', icon: '🪵' },
  { id: 'Storage', label: 'Storage', icon: '🗄️' },
  { id: 'Lighting & Decor', label: 'Decor', icon: '🌿' }
];

export default function CatalogPanel({ onAddItem, unit = 'm' }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filteredItems = useMemo(() => {
    return Object.values(CATALOG).filter(item => {
      const matchCat = category === 'All' || item.category === category;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const formatDim = (cm) => {
    if (unit === 'ft') {
      const inches = cm / 2.54;
      return `${Math.round(inches)}″`;
    }
    return `${cm}cm`;
  };

  return (
    <aside className="studio-sidebar catalog-sidebar">
      {/* Top Header & Search */}
      <div className="catalog-top-section">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Furniture Catalog</h3>
            <span className="panel-subtitle">Scroll up & down to explore pieces</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="catalog-search-wrap">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#88948B' }} />
            <input
              type="text"
              className="catalog-search-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search sofas, beds, desks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills - Wrapping, NEVER horizontal scroll */}
        <div className="catalog-category-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`catalog-cat-pill ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
              title={`Filter by ${cat.label}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Items List (Clean Up-to-Down Scrolling, No Left-to-Right Scroll) */}
      <div className="catalog-vertical-list">
        {filteredItems.length === 0 ? (
          <div className="catalog-empty-state">
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🔍</div>
            <p>No furniture found matching "{search}"</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const query = item.searchKeyword || item.name;
            const aliExpressUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query + ' home furniture')}`;

            return (
              <div
                key={item.id}
                className="catalog-item-card"
                onClick={() => onAddItem(item.id)}
                title={`Click card or Add button to place ${item.name} in room`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAddItem(item.id); }}
              >
                {/* Header row: Icon, Name, Price */}
                <div className="catalog-item-header">
                  <div className="catalog-item-icon-title">
                    <span className="catalog-item-emoji">{item.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="catalog-item-cat">{item.category}</div>
                      <h4 className="catalog-item-name">{item.name}</h4>
                    </div>
                  </div>
                  <span className="catalog-item-price-tag">${item.price}</span>
                </div>

                {/* Dimensions & Elevation */}
                <div className="catalog-item-details">
                  <span className="catalog-item-badge">
                    📐 {formatDim(item.width)} × {formatDim(item.depth)}
                    {item.height ? ` × ${formatDim(item.height)}` : ''}
                  </span>
                  {item.defaultElevation > 0 && (
                    <span className="catalog-item-badge elevation">
                      🧱 Elevated: {item.defaultElevation}cm
                    </span>
                  )}
                </div>

                {/* Live Online Store Price Check Links */}
                <div className="catalog-card-stores" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={aliExpressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="catalog-store-link aliexpress"
                    title={`Check price on AliExpress (${item.name})`}
                  >
                    <span>AliExpress</span>
                    <ExternalLink size={10} />
                  </a>
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="catalog-store-link amazon"
                    title={`Check price on Amazon (${item.name})`}
                  >
                    <span>Amazon</span>
                    <ExternalLink size={10} />
                  </a>
                </div>

                {/* Add to Room Button */}
                <button
                  type="button"
                  className="catalog-card-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddItem(item.id);
                  }}
                  title={`Add ${item.name} to room`}
                >
                  <Plus size={13} /> Add to Room
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
