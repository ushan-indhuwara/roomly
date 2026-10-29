import { mkdir, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { ARTICLES } from '../src/data/roomData.js';

const env = loadEnv('production', process.cwd(), 'VITE_');
const configuredSiteUrl = process.env.VITE_SITE_URL || env.VITE_SITE_URL || process.env.URL;
const distDirectory = new URL('../dist/', import.meta.url);

await mkdir(distDirectory, { recursive: true });

let siteOrigin = '';
if (configuredSiteUrl) {
  try {
    siteOrigin = new URL(configuredSiteUrl).origin;
  } catch {
    throw new Error('VITE_SITE_URL must be a valid absolute URL, such as https://roomly.netlify.app');
  }
}

const robotsLines = ['User-agent: *', 'Allow: /'];
if (siteOrigin) robotsLines.push(`Sitemap: ${siteOrigin}/sitemap.xml`);
await writeFile(new URL('robots.txt', distDirectory), `${robotsLines.join('\n')}\n`);

if (siteOrigin) {
  const publicPaths = [ '/', '/journal/', ...ARTICLES.map(article => `/journal/${encodeURIComponent(article.id)}/`) ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publicPaths.map(path => `  <url><loc>${siteOrigin}${path}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(new URL('sitemap.xml', distDirectory), sitemap);
  console.log(`Generated sitemap for ${siteOrigin} (${publicPaths.length} URLs).`);
} else {
  console.log('No VITE_SITE_URL or Netlify URL found; generated robots.txt without a sitemap reference.');
}
