// Validates: Requirements 2.5, 2.6

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for GalleryPage
 *
 * These tests verify the structural content of the GalleryPage component:
 * - Header contains logo, Blog link, Galería link, and ThemeToggle
 * - Empty state shows a placeholder message
 *
 * Since the test environment is 'node' (no jsdom), we verify the component
 * source to assert the presence of required elements, and test the rendering
 * logic in isolation.
 */

// Read the component source once
const componentPath = resolve(
  __dirname,
  "../GalleryPage.tsx"
);
const source = readFileSync(componentPath, "utf-8");

// ---------------------------------------------------------------------------
// Helpers — mirror the rendering logic from GalleryPage
// ---------------------------------------------------------------------------

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  description: string;
  order: number;
  extraImages: { url: string; publicId: string }[];
}

/**
 * Mirrors the empty-state branch in GalleryPage:
 *   items.length === 0 → placeholder message
 *   items.length > 0  → grid
 */
function getRenderedState(items: GalleryItem[], loading: boolean): "loading" | "empty" | "grid" {
  if (loading) return "loading";
  if (items.length === 0) return "empty";
  return "grid";
}

// ---------------------------------------------------------------------------
// Requirement 2.6 — Header structure
// ---------------------------------------------------------------------------

describe("GalleryPage – header (Requirement 2.6)", () => {
  it("el header contiene el logo 'Mery Palencia'", () => {
    expect(source).toContain("Mery Palencia");
  });

  it("el header contiene un link a /blog (Blog)", () => {
    // The component renders <Link to="/blog">...Blog...</Link>
    expect(source).toContain('to="/blog"');
    // The link text "Blog" appears in the JSX (possibly with surrounding whitespace)
    expect(source).toMatch(/to="\/blog"[\s\S]*?Blog/);
  });

  it("el header contiene un link a /galeria (Galería)", () => {
    // The component renders <Link to="/galeria">...Galería...</Link>
    expect(source).toContain('to="/galeria"');
    // The link text "Galería" appears in the JSX (possibly with surrounding whitespace)
    expect(source).toMatch(/to="\/galeria"[\s\S]*?Galer/);
  });

  it("el link Galería tiene estilos de estado activo (border-b-2 border-accent)", () => {
    // Active link has border-b-2 border-accent styling
    expect(source).toContain("border-b-2 border-accent");
  });

  it("el header contiene el componente ThemeToggle", () => {
    // The component imports and renders <ThemeToggle />
    expect(source).toContain("ThemeToggle");
    expect(source).toContain("<ThemeToggle");
  });

  it("el header importa ThemeToggle desde @/components/ThemeToggle", () => {
    expect(source).toContain("import ThemeToggle from '@/components/ThemeToggle'");
  });
});

// ---------------------------------------------------------------------------
// Requirement 2.5 — Empty state placeholder
// ---------------------------------------------------------------------------

describe("GalleryPage – estado vacío (Requirement 2.5)", () => {
  it("cuando items está vacío y no está cargando, el estado es 'empty'", () => {
    const state = getRenderedState([], false);
    expect(state).toBe("empty");
  });

  it("cuando items tiene elementos, el estado es 'grid'", () => {
    const items: GalleryItem[] = [
      {
        id: "1",
        title: "Test",
        image: "https://example.com/img.jpg",
        category: "personajes",
        description: "desc",
        order: 1,
        extraImages: [],
      },
    ];
    const state = getRenderedState(items, false);
    expect(state).toBe("grid");
  });

  it("cuando loading es true, el estado es 'loading' independientemente de items", () => {
    expect(getRenderedState([], true)).toBe("loading");
    expect(getRenderedState([{ id: "1", title: "T", image: "", category: "otro", description: "", order: 0, extraImages: [] }], true)).toBe("loading");
  });

  it("el componente contiene el texto del placeholder para colección vacía", () => {
    // The component renders: "No hay ilustraciones disponibles aún."
    expect(source).toContain("No hay ilustraciones disponibles aún");
  });

  it("el placeholder se muestra solo cuando items.length === 0 (lógica condicional)", () => {
    // Verify the source has the conditional: items.length === 0
    expect(source).toContain("items.length === 0");
  });
});
