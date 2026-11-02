const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || 'G-0SFP7DX4B3';
const consentGranted = () => {
  try {
    return window.localStorage.getItem('roomly_analytics_consent') === 'accepted';
  } catch {
    return false;
  }
};
let isInitialized = false;

export function initializeGoogleAnalytics() {
  if (isInitialized || !consentGranted() || !/^G-[A-Z0-9]+$/.test(measurementId || '')) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  isInitialized = true;
  return true;
}

export function trackGooglePageView(path, title) {
  if (!consentGranted() || !isInitialized || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}

export function trackGoogleEvent(eventName, metadata = {}) {
  if (!consentGranted() || !isInitialized || typeof window.gtag !== 'function') return;

  // Room names can be visitor supplied, so only send short, non-identifying values.
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) =>
      key !== 'room' &&
      (typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value)) ||
        (typeof value === 'string' && value.length <= 80)),
    ),
  );

  window.gtag('event', eventName, safeMetadata);
}
