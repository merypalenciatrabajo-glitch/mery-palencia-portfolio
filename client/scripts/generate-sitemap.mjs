import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');
const publicDir = path.join(clientRoot, 'public');
const env = { ...loadEnv('production', clientRoot, ''), ...process.env };

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export function buildSitemap(siteUrl, posts = []) {
  const baseUrl = siteUrl.replace(/\/+$/, '');
  const urls = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/galeria', priority: '0.8', changefreq: 'weekly' },
    { path: '/blog', priority: '0.7', changefreq: 'weekly' },
    ...posts.map((post) => ({
      path: `/blog/${encodeURIComponent(post.id)}`,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: post.lastmod,
    })),
  ];

  const entries = urls.map((entry) => `  <url>
    <loc>${escapeXml(`${baseUrl}${entry.path}`)}</loc>
    ${entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>\n    ` : ''}<changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

export async function fetchPublishedPosts(projectId, apiKey) {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'blogPosts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'published' },
            op: 'EQUAL',
            value: { booleanValue: true },
          },
        },
        select: { fields: [{ fieldPath: 'date' }] },
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 500);
    throw new Error(`Firestore sitemap query failed with HTTP ${response.status}: ${detail}`);
  }

  const rows = await response.json();
  return rows.flatMap((row) => {
    if (!row.document?.name) return [];
    const id = row.document.name.split('/').at(-1);
    const date = row.document.fields?.date?.stringValue;
    const lastmod = /^\d{4}-\d{2}-\d{2}/.test(date ?? '')
      ? date.slice(0, 10)
      : row.document.updateTime?.slice(0, 10);
    return id ? [{ id, lastmod }] : [];
  }).sort((left, right) => (right.lastmod ?? '').localeCompare(left.lastmod ?? ''));
}

async function main() {
  const siteUrl = env.VITE_SITE_URL || 'https://mery-palencia-client.vercel.app';
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const posts = projectId && apiKey ? await fetchPublishedPosts(projectId, apiKey) : [];

  await writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemap(siteUrl, posts), 'utf8');
  await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\/+$/, '')}/sitemap.xml\n`, 'utf8');
  console.log(`Generated sitemap with ${posts.length} published article(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Unable to generate sitemap');
    process.exitCode = 1;
  });
}
