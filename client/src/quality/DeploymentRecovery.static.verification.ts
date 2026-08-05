import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const clientRoot = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(clientRoot, path), 'utf-8');

describe('recuperación después de un despliegue', () => {
  it('recarga una sola vez cuando Vite detecta un chunk obsoleto', () => {
    const main = read('src/main.tsx');
    expect(main).toContain("'vite:preloadError'");
    expect(main).toContain('event.preventDefault()');
    expect(main).toContain('sessionStorage');
    expect(main).toContain('window.location.replace');
  });

  it('evita conservar el HTML principal entre despliegues', () => {
    const clientVercel = read('vercel.json');
    const rootVercel = read('../vercel.json');
    for (const config of [clientVercel, rootVercel]) {
      expect(config).toContain('"source": "/index.html"');
      expect(config).toContain('public, max-age=0, must-revalidate');
    }
  });

  it('consulta solo artículos públicos y los ordena sin índice compuesto', () => {
    const firestoreHook = read('src/hooks/useFirestore.ts');
    expect(firestoreHook).toContain('>("blogPosts", [where("published", "==", true)])');
    expect(firestoreHook).toContain('right.date.localeCompare(left.date)');
  });
});
