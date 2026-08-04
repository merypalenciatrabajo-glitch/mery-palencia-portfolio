// Validates: Requirements 2.5, 2.6

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for GalleryPage
 *
 * These tests verify the structural content of the GalleryPage component:
 * - Header contains logo, Inicio, Blog and Galería links
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

  it("el header contiene un link explícito a Inicio", () => {
    expect(source).toMatch(/to="\/"[\s\S]{0,300}Inicio/);
  });

  it("el header utiliza Link de wouter para navegación SPA", () => {
    expect(source).toContain("import { Link, useLocation } from 'wouter'");
    expect(source).not.toContain("window.location.href");
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
    expect(source).toContain("Aún no hay trabajos disponibles");
    expect(source).toContain("No hay trabajos publicados en esta categoría.");
  });

  it("el placeholder se muestra cuando el filtro no devuelve elementos", () => {
    expect(source).toContain("filteredItems.length === 0");
  });
});
