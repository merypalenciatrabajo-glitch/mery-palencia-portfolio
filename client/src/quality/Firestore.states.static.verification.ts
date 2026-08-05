import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(__dirname, '..', path), 'utf-8');

describe('estados de contenido Firebase', () => {
  it('propaga carga, error y reintento desde las suscripciones', () => {
    const hooks = read('hooks/useFirestore.ts');
    expect(hooks).toContain('const [error, setError]');
    expect(hooks).toContain('const retry = useCallback');
    expect(hooks).toContain('return { data, loading, error, retry }');
  });

  it('distingue carga, error y vacío en las páginas públicas', () => {
    for (const page of ['pages/Home.tsx', 'pages/Blog.tsx', 'pages/GalleryPage.tsx']) {
      const source = read(page);
      expect(source).toContain('loading');
      expect(source).toContain('error');
      expect(source).toContain('ContentStatus');
    }
  });
});
