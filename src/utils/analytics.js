// Roomly - Privacy-Conscious Funnel Analytics Utility
// Local-first funnel totals plus optional Google Analytics events when configured.

import { trackGoogleEvent } from './googleAnalytics';

const STORAGE_KEY = 'roomly_funnel_stats_v1';
const SESSION_KEY = 'roomly_session_events_v1';

export const FUNNEL_STEPS = [
  { id: 'visit', label: '1. Landed on Roomly', desc: 'Visitor arrived at welcome or studio' },
  { id: 'start_room', label: '2. Started Room Setup', desc: 'Chose room type and entered planner' },
  { id: 'add_furniture', label: '3. Added Furniture', desc: 'Placed at least one piece on the scale canvas' },
  { id: 'open_3d', label: '4. Explored 3D View', desc: 'Switched to interactive 3D studio preview' },
  { id: 'save_room', label: '5. Saved Design', desc: 'Saved room to local storage or library' },
  { id: 'share_room', label: '6. Shared Design', desc: 'Generated share link or copied link' }
];

function getStoredStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) {}

  return {
    sessionsCount: 0,
    steps: {
      visit: 0,
      start_room: 0,
      add_furniture: 0,
      open_3d: 0,
      save_room: 0,
      share_room: 0
    },
    eventLog: []
  };
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (_e) {}
}

function getSessionEvents() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (_e) {}
  return new Set();
}

function recordSessionEvent(eventId) {
  const set = getSessionEvents();
  set.add(eventId);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(set)));
  } catch (_e) {}
}

export function trackEvent(eventName, metadata = {}) {
  try {
    trackGoogleEvent(eventName, metadata);
    const stats = getStoredStats();
    const sessionEvents = getSessionEvents();

    // Check if this step was already recorded in this user session
    const isNewInSession = !sessionEvents.has(eventName);
    if (isNewInSession) {
      recordSessionEvent(eventName);
      if (stats.steps[eventName] !== undefined) {
        stats.steps[eventName] = (stats.steps[eventName] || 0) + 1;
      }
      if (eventName === 'visit') {
        stats.sessionsCount = (stats.sessionsCount || 0) + 1;
      }
    }

    // Keep last 40 anonymous events for audit/funnel inspection
    stats.eventLog = stats.eventLog || [];
    stats.eventLog.unshift({
      event: eventName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: metadata
    });
    if (stats.eventLog.length > 40) stats.eventLog.pop();

    saveStats(stats);
  } catch (_e) {
    // Non-blocking
  }
}

export function getFunnelMetrics() {
  const stats = getStoredStats();
  const visitCount = Math.max(1, stats.steps.visit || 1);

  const stepsWithMetrics = FUNNEL_STEPS.map((step, idx) => {
    const count = stats.steps[step.id] || 0;
    const prevCount = idx === 0 ? visitCount : (stats.steps[FUNNEL_STEPS[idx - 1].id] || 0);
    const overallRate = Math.round((count / visitCount) * 100);
    const stepRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    const dropOffRate = 100 - stepRate;

    return {
      ...step,
      count,
      overallRate,
      stepRate,
      dropOffRate
    };
  });

  return {
    sessionsCount: stats.sessionsCount || 1,
    steps: stepsWithMetrics,
    recentEvents: stats.eventLog || []
  };
}

export function resetFunnelStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_e) {}
}
