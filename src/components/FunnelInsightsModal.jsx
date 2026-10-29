// Roomly - Privacy-Conscious Funnel Analytics & Conversion Insights Modal
// Visualizes where visitors drop off to guide product improvements

import React, { useState, useEffect } from 'react';
import { X, TrendingDown, Users, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { getFunnelMetrics, resetFunnelStats } from '../utils/analytics';

export default function FunnelInsightsModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);

  const reloadMetrics = () => {
    setMetrics(getFunnelMetrics());
  };

  useEffect(() => {
    if (isOpen) {
      reloadMetrics();
    }
  }, [isOpen]);

  if (!isOpen || !metrics) return null;

  const handleReset = () => {
    if (window.confirm('Reset local visitor analytics data?')) {
      resetFunnelStats();
      reloadMetrics();
    }
  };

  // Find biggest drop-off point
  let maxDropStep = null;
  let maxDropVal = -1;
  metrics.steps.forEach((s, idx) => {
    if (idx > 0 && s.dropOffRate > maxDropVal) {
      maxDropVal = s.dropOffRate;
      maxDropStep = s;
    }
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card funnel-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <h3>Visitor Funnel & Drop-Off Insights</h3>
            </div>
            <p>Measure conversion from first visit to 3D exploration and sharing</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Privacy Guarantee Card */}
          <div className="funnel-privacy-callout">
            <ShieldCheck size={18} color="#3B5745" style={{ flexShrink: 0 }} />
            <div>
              <strong>100% Privacy-Preserving & Zero-PII</strong>
              <p>
                All funnel events are tracked strictly within your browser's local storage. No IP addresses, personal identifiers, or third-party advertising cookies are collected or shared.
              </p>
            </div>
          </div>

          {/* Biggest drop-off insight card */}
          {maxDropStep && (
            <div className="funnel-insight-alert">
              <TrendingDown size={16} color="#C8785E" style={{ flexShrink: 0 }} />
              <div>
                <span className="insight-highlight">Primary Drop-Off Point: </span>
                <span>
                  {maxDropStep.label} has a <strong>{maxDropStep.dropOffRate}% drop-off rate</strong>. 
                  Focusing on first-use guidance at this step will yield the highest activation gains.
                </span>
              </div>
            </div>
          )}

          {/* Visual Funnel Step Bars */}
          <div className="funnel-steps-container">
            {metrics.steps.map((step, idx) => {
              const barWidth = Math.max(8, step.overallRate);
              return (
                <div key={step.id} className="funnel-step-row">
                  <div className="funnel-step-header">
                    <div className="funnel-step-name">
                      <span className="step-num">{idx + 1}</span>
                      <strong>{step.label}</strong>
                      <span className="step-desc-sub">{step.desc}</span>
                    </div>

                    <div className="funnel-step-counts">
                      <span className="step-count-badge">
                        <Users size={12} /> {step.count} sessions
                      </span>
                      <span className="step-percent-badge">
                        {step.overallRate}% of visits
                      </span>
                    </div>
                  </div>

                  {/* Horizontal conversion bar */}
                  <div className="funnel-bar-track">
                    <div 
                      className="funnel-bar-fill" 
                      style={{ 
                        width: `${barWidth}%`,
                        backgroundColor: idx === 0 ? '#466352' : (idx < 4 ? '#577864' : '#C8785E')
                      }} 
                    />
                  </div>

                  {idx > 0 && (
                    <div className="funnel-step-submeta">
                      <span>Step retention: <strong>{step.stepRate}%</strong> from previous step</span>
                      {step.dropOffRate > 0 && (
                        <span className="drop-indicator">
                          Drop-off: <strong>{step.dropOffRate}%</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Event Audit */}
          {metrics.recentEvents && metrics.recentEvents.length > 0 && (
            <div className="funnel-audit-section">
              <h4 style={{ fontSize: '0.85rem', color: '#1D231F', marginBottom: '0.45rem' }}>
                Recent Funnel Activity Log
              </h4>
              <div className="funnel-audit-list">
                {metrics.recentEvents.slice(0, 8).map((ev, i) => (
                  <div key={i} className="funnel-audit-item">
                    <span className="audit-time">{ev.time}</span>
                    <span className="audit-event">{ev.event}</span>
                    {ev.meta?.roomName && (
                      <span className="audit-meta">({ev.meta.roomName})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleReset}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
          >
            <RefreshCw size={13} />
            <span>Reset Local Stats</span>
          </button>

          <button className="btn btn-primary" onClick={onClose}>
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
}

