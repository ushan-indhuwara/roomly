const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '');

function setMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function updatePageSeo({ title, description, path }) {
  if (typeof document === 'undefined') return;

  document.title = title;
  setMeta('meta[name="description"]', { name: 'description' }, description);
  setMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);

  const canonicalUrl = `${SITE_URL || window.location.origin}${path}`;
  setMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
}
