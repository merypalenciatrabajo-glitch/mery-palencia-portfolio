import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(src, path), 'utf-8');

describe('accesibilidad del cliente público', () => {
  it('permite saltar la navegación repetida y usa regiones principales', () => {
    expect(read('App.tsx')).toContain('href="#main-content"');
    for (const page of ['pages/Home.tsx', 'pages/Blog.tsx', 'pages/GalleryPage.tsx', 'pages/BlogPost.tsx', 'pages/NotFound.tsx']) {
      expect(read(page)).toContain('<main id="main-content"');
    }
  });

  it('asocia las etiquetas del formulario de contacto con sus campos', () => {
    const home = read('pages/Home.tsx');
    for (const id of ['contact-name', 'contact-email', 'contact-project', 'contact-message']) {
      expect(home).toContain(`htmlFor="${id}"`);
      expect(home).toContain(`id="${id}"`);
    }
    expect(home).toContain('aria-live="polite"');
  });

  it('expone el lightbox como diálogo modal operable por teclado', () => {
    const lightbox = read('components/Lightbox.tsx');
    expect(lightbox).toContain('role="dialog"');
    expect(lightbox).toContain('aria-modal="true"');
    expect(lightbox).toContain("e.key === 'Escape'");
    expect(lightbox).toMatch(/e\.key\s*!==?\s*['"]Tab['"]/);
  });

  it('mantiene foco visible y respeta movimiento reducido', () => {
    const css = read('index.css');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('permite ampliar la interfaz desde el navegador', () => {
    const html = read('../index.html');
    expect(html).not.toMatch(/maximum-scale|user-scalable\s*=\s*['"]?no/i);
  });
});
