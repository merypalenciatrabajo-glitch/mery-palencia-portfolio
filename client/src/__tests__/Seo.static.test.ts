import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const clientRoot = resolve(__dirname, '../..');
const indexHtml = readFileSync(resolve(clientRoot, 'index.html'), 'utf-8');
const robots = readFileSync(resolve(clientRoot, 'public/robots.txt'), 'utf-8');
const sitemap = readFileSync(resolve(clientRoot, 'public/sitemap.xml'), 'utf-8');
const seoSource = readFileSync(resolve(clientRoot, 'src/components/Seo.tsx'), 'utf-8');
const socialPreview = readFileSync(resolve(clientRoot, 'public/og/social-preview.png'));
const sitemapGenerator = readFileSync(resolve(clientRoot, 'scripts/generate-sitemap.mjs'), 'utf-8');
const packageJson = JSON.parse(readFileSync(resolve(clientRoot, 'package.json'), 'utf-8'));

describe('SEO público', () => {
  it('declara idioma, descripción, canonical y metadatos sociales de respaldo', () => {
    expect(indexHtml).toContain('<html lang="es">');
    expect(indexHtml).toContain('name="description"');
    expect(indexHtml).toContain('rel="canonical"');
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:description"');
    expect(indexHtml).toContain('/og/social-preview.png');
    expect(indexHtml).toContain('property="og:image:width" content="1200"');
    expect(indexHtml).toContain('name="twitter:card"');
  });

  it('mantiene los metadatos por ruta y permite configurar el dominio', () => {
    expect(seoSource).toContain('VITE_SITE_URL');
    expect(seoSource).toMatch(/document\.documentElement\.lang = ["']es["']/);
    expect(seoSource).toContain('"og:url"');
    expect(seoSource).toContain('"robots"');
  });

  it('publica robots.txt y las rutas indexables en sitemap.xml', () => {
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Sitemap:');
    expect(sitemap).toContain('<loc>https://mery-palencia-client.vercel.app/</loc>');
    expect(sitemap).toContain('<loc>https://mery-palencia-client.vercel.app/galeria</loc>');
    expect(sitemap).toContain('<loc>https://mery-palencia-client.vercel.app/blog</loc>');
  });

  it('regenera el sitemap durante el build usando solo artículos publicados', () => {
    expect(packageJson.scripts.build).toContain('generate-sitemap.mjs');
    expect(sitemapGenerator).toContain("fieldPath: 'published'");
    expect(sitemapGenerator).toContain("booleanValue: true");
    expect(sitemapGenerator).toContain('/blog/${encodeURIComponent(post.id)}');
  });

  it('incluye una imagen social PNG de 1200 por 630 píxeles', () => {
    expect(socialPreview.subarray(1, 4).toString()).toBe('PNG');
    expect(socialPreview.readUInt32BE(16)).toBe(1200);
    expect(socialPreview.readUInt32BE(20)).toBe(630);
  });
});
