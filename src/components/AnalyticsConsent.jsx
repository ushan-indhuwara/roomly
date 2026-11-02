import React, { useState } from 'react';
import { initializeGoogleAnalytics, trackGooglePageView } from '../utils/googleAnalytics';

const CONSENT_KEY = 'roomly_analytics_consent';

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      return saved === 'accepted' || saved === 'declined' ? saved : null;
    } catch {
      return 'declined';
    }
  });
  const [showChoices, setShowChoices] = useState(false);

  const choose = (nextChoice) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, nextChoice);
    } catch {
      setChoice('declined');
      setShowChoices(false);
      return;
    }
    setChoice(nextChoice);
    setShowChoices(false);
    if (nextChoice === 'accepted') {
      initializeGoogleAnalytics();
      trackGooglePageView(window.location.pathname, document.title);
    }
  };

  return (
    <>
      {(choice === null || showChoices) && (
        <aside style={{ position: 'fixed', zIndex: 1000, left: 16, right: 16, bottom: 16, maxWidth: 460, padding: 18, border: '1px solid #DDD7CB', borderRadius: 16, background: '#FFFFFF', boxShadow: '0 16px 44px rgba(29,35,31,.16)', color: '#1D231F' }}>
          <strong>Privacy choices</strong>
          <p style={{ margin: '6px 0 14px', fontSize: 13, lineHeight: 1.5, color: '#626D65' }}>
            Optional Google Analytics helps us understand which pages and features are useful. It stays off unless you accept. You can change your choice later.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => choose('declined')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DDD7CB', background: 'white', cursor: 'pointer' }}>Decline</button>
            <button type="button" onClick={() => choose('accepted')} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: '#3B5745', color: 'white', cursor: 'pointer' }}>Accept analytics</button>
          </div>
        </aside>
      )}
      {choice !== null && !showChoices && (
        <button type="button" onClick={() => setShowChoices(true)} style={{ position: 'fixed', zIndex: 999, left: 12, bottom: 12, border: '1px solid #DDD7CB', borderRadius: 999, padding: '7px 10px', background: 'rgba(255,255,255,.94)', color: '#38423B', fontSize: 11, cursor: 'pointer' }}>
          Privacy choices
        </button>
      )}
    </>
  );
}
