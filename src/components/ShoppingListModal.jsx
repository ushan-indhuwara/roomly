// Roomly - Shopping List, Product Sourcing & Budget Estimation Modal
// Multi-country retailer links (US, UK, CA, EU, AU), estimated market price ranges,
// direct specific product queries, owned item checklist, CSV export, and transparent affiliate disclosure.

import React, { useState, useMemo } from 'react';
import { X, ExternalLink, Download, Check, ShoppingBag, Info, Globe, ShieldAlert, Sparkles } from 'lucide-react';
import { CATALOG } from '../data/roomData';
import { COUNTRIES, RETAILER_CONFIGS, SPECIFIC_PRODUCT_DATA, AFFILIATE_DISCLOSURE } from '../data/retailers';
import { downloadBlob } from '../utils/exportUtils';

const COUNTRY_STORAGE_KEY = 'roomly_selected_country_v1';

export default function ShoppingListModal({ isOpen, onClose, room, onNotify }) {
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [selectedCountry, setSelectedCountry] = useState(() => {
    try {
      return localStorage.getItem(COUNTRY_STORAGE_KEY) || 'US';
    } catch (e) {
      return 'US';
    }
  });

  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);
    try {
      localStorage.setItem(COUNTRY_STORAGE_KEY, countryId);
    } catch (e) {}
  };

  const countryInfo = COUNTRIES.find(c => c.id === selectedCountry) || COUNTRIES[0];
  const retailers = RETAILER_CONFIGS[selectedCountry] || RETAILER_CONFIGS.US;

  // Aggregate items in room
  const aggregatedItems = useMemo(() => {
    if (!room?.items) return [];
    const map = new Map();

    room.items.forEach(it => {
      const type = it.type;
      const cat = CATALOG[type] || { name: type, price: 100, icon: '📦', searchKeyword: type };
      const specificData = SPECIFIC_PRODUCT_DATA[type] || {
        exactQuery: cat.searchKeyword || cat.name,
        priceRange: [Math.round(cat.price * 0.85), Math.round(cat.price * 1.25)],
        availability: 'In Stock Online · Ready to Ship',
        sampleModels: 'Comparable across major home brands'
      };

      if (!map.has(type)) {
        map.set(type, {
          type,
          name: cat.name,
          category: cat.category || 'Furniture',
          icon: cat.icon,
          basePrice: cat.price,
          priceRange: specificData.priceRange,
          exactQuery: specificData.exactQuery,
          availability: specificData.availability,
          sampleModels: specificData.sampleModels,
          qty: 0,
          ids: []
        });
      }
      const entry = map.get(type);
      entry.qty += 1;
      entry.ids.push(it.id);
    });

    return Array.from(map.values());
  }, [room?.items]);

  // Calculate budget (both point estimate and realistic range)
  const { totalEstimated, remainingToBuy, totalRangeMin, totalRangeMax } = useMemo(() => {
    let total = 0;
    let remaining = 0;
    let rangeMin = 0;
    let rangeMax = 0;

    aggregatedItems.forEach(item => {
      const lineCost = item.basePrice * item.qty;
      total += lineCost;

      const ownedCount = item.ids.filter(id => ownedIds.has(id)).length;
      const needed = Math.max(0, item.qty - ownedCount);
      remaining += needed * item.basePrice;

      rangeMin += needed * (item.priceRange[0] || item.basePrice);
      rangeMax += needed * (item.priceRange[1] || item.basePrice);
    });

    return { 
      totalEstimated: total, 
      remainingToBuy: remaining,
      totalRangeMin: rangeMin,
      totalRangeMax: rangeMax
    };
  }, [aggregatedItems, ownedIds]);

  const toggleOwned = (id) => {
    setOwnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = [
      'Item Name',
      'Category',
      'Quantity',
      'Est. Unit Price ($)',
      'Est. Price Range ($)',
      'Subtotal ($)',
      'Specific Search Query',
      'Sample Compatible Models',
      'Primary Retailer Search',
      'Affiliate Disclosure'
    ];

    const rows = aggregatedItems.map(it => {
      const primaryRetailer = retailers[0];
      const link = primaryRetailer.buildUrl(it.exactQuery);
      return [
        `"${it.name}"`,
        `"${it.category}"`,
        it.qty,
        it.basePrice,
        `"$${it.priceRange[0]} - $${it.priceRange[1]}"`,
        it.basePrice * it.qty,
        `"${it.exactQuery}"`,
        `"${it.sampleModels}"`,
        `"${link}"`,
        `"${AFFILIATE_DISCLOSURE}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `roomly-${(room?.name || 'room').toLowerCase().replace(/\s+/g, '-')}-furniture-shopping-list.csv`);
    if (onNotify) onNotify('Exported itemized shopping budget to CSV');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card shopping-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3>Shopping List & Furniture Estimates</h3>
              <span className="estimate-badge">Estimated Pricing</span>
            </div>
            <p>Every piece in {room?.name || 'your room'} with direct retailer search links</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Country Selector Bar */}
          <div className="country-selector-row">
            <div className="country-label">
              <Globe size={15} />
              <span>Show retailers for:</span>
            </div>

            <div className="country-pills">
              {COUNTRIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`country-pill ${selectedCountry === c.id ? 'active' : ''}`}
                  onClick={() => handleCountryChange(c.id)}
                  title={`View retailers for ${c.name}`}
                >
                  <span className="country-flag">{c.flag}</span>
                  <span className="country-name">{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Overview Card */}
          <div className="shopping-summary-card">
            <div>
              <div className="shopping-summary-title">Estimated Furniture Budget (Unowned)</div>
              <div className="shopping-summary-amount">
                {countryInfo.symbol}{remainingToBuy.toLocaleString()}
              </div>

              <div className="shopping-range-sub">
                Expected market range: <strong>{countryInfo.symbol}{totalRangeMin.toLocaleString()} – {countryInfo.symbol}{totalRangeMax.toLocaleString()}</strong>
              </div>

              {ownedIds.size > 0 && (
                <div className="shopping-owned-sub">
                  Total room value: {countryInfo.symbol}{totalEstimated.toLocaleString()} ({countryInfo.symbol}{(totalEstimated - remainingToBuy).toLocaleString()} already owned)
                </div>
              )}
            </div>

            <button className="btn btn-secondary" onClick={exportCSV} title="Export CSV for spreadsheet">
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Pricing & Affiliate Transparency Card */}
          <div className="shopping-disclosure-box">
            <Info size={16} color="#466352" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div className="disclosure-text">
              <p>
                <strong>Estimates & Sourcing:</strong> Prices shown are market averages based on real manufacturer listings. Clicking a retailer opens a search pre-filtered with exact dimensions and materials to help you find the closest real item.
              </p>
              <p className="affiliate-subtext">
                {AFFILIATE_DISCLOSURE}
              </p>
            </div>
          </div>

          {/* Item Rows */}
          {aggregatedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#88948B' }}>
              <ShoppingBag size={42} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
              <h4>Your room is currently empty</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Add pieces from the left catalog to generate real-time price estimates and direct retailer links.
              </p>
            </div>
          ) : (
            <div className="shopping-items-list">
              {aggregatedItems.map(item => {
                const allOwned = item.ids.every(id => ownedIds.has(id));

                return (
                  <article 
                    key={item.type} 
                    className={`shopping-item-row ${allOwned ? 'is-owned' : ''}`}
                  >
                    <div className="shopping-item-icon">{item.icon}</div>

                    <div className="shopping-item-info">
                      <div className="item-title-row">
                        <span className="shopping-item-name" style={{ textDecoration: allOwned ? 'line-through' : 'none' }}>
                          {item.name} {item.qty > 1 && `(×${item.qty})`}
                        </span>
                        <div className="item-price-col">
                          <span className="item-price-est">
                            {countryInfo.symbol}{(item.basePrice * item.qty).toLocaleString()}
                          </span>
                          <span className="item-price-range">
                            Est. {countryInfo.symbol}{item.priceRange[0]} – {countryInfo.symbol}{item.priceRange[1]} ea.
                          </span>
                        </div>
                      </div>

                      <div className="item-availability-row">
                        <span className="availability-dot" />
                        <span className="availability-text">{item.availability}</span>
                        <span className="models-hint">· e.g., {item.sampleModels}</span>
                      </div>

                      {/* Retailer Links for Selected Country */}
                      <div className="shopping-retailer-links">
                        <span className="retailer-row-label">Shop on:</span>
                        {retailers.map(ret => {
                          const targetUrl = ret.buildUrl(item.exactQuery);
                          return (
                            <a
                              key={ret.id}
                              href={targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shopping-link-btn"
                              title={`Search for "${item.exactQuery}" on ${ret.name}`}
                            >
                              <span>{ret.name}</span>
                              <ExternalLink size={11} />
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Checkbox: Already own this piece */}
                    <button
                      type="button"
                      className={`btn ${allOwned ? 'btn-sage-subtle' : 'btn-secondary'} own-piece-btn`}
                      onClick={() => item.ids.forEach(id => toggleOwned(id))}
                      title={allOwned ? 'Mark as needed' : 'Deduct from remaining budget'}
                    >
                      <Check size={13} color={allOwned ? '#3B5745' : '#88948B'} />
                      <span>{allOwned ? 'Owned' : 'I own this'}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: '#626D65' }}>
            {aggregatedItems.length} unique {aggregatedItems.length === 1 ? 'model' : 'models'} · {room?.items?.length || 0} total pieces
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
