// Validates: Requirements 3.1, 3.2

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for Home — "Ver Galería" changes
 *
 * These tests verify the structural content of the Home component:
 * - Header contains a "Ver Galería" navigation link pointing to /galeria (Req 3.1)
 * - Hero buttons section contains a "Ver Galería" button navigating to /galeria (Req 3.2)
 *
 * Since the test environment is 'node' (no jsdom), we verify the component
 * source to assert the presence of required elements.
 */

const componentPath = resolve(__dirname, "../Home.tsx");
const source = readFileSync(componentPath, "utf-8");

// ---------------------------------------------------------------------------
// Requirement 3.1 — Header "Ver Galería" link
// ---------------------------------------------------------------------------

describe("Home – header link 'Ver Galería' (Requirement 3.1)", () => {
  it("el header contiene un elemento que navega a /galeria", () => {
    expect(source).toContain('to="/galeria"');
  });

  it("el header contiene el texto 'Galería' en el área de navegación", () => {
    // The header nav area has a button with text "Galería"
    expect(source).toMatch(/Galer[íi]a/);
  });

  it("el header tiene el link 'Galería' junto al link 'Blog'", () => {
    // Both Blog and Galería buttons appear in the header nav area
    const headerMatch = source.match(/<header[\s\S]*?<\/header>/);
    expect(headerMatch).not.toBeNull();
    const headerSource = headerMatch![0];
    expect(headerSource).toContain("Blog");
    expect(headerSource).toContain("Galer");
    expect(headerSource).toContain('to="/galeria"');
  });

  it("el link 'Galería' del header usa navegación SPA con Link", () => {
    expect(source).toMatch(/<Link\s+to="\/galeria">/);
    expect(source).not.toContain("window.location.href = '/galeria'");
  });
});

// ---------------------------------------------------------------------------
// Requirement 3.2 — Hero "Ver Galería" button
// ---------------------------------------------------------------------------

describe("Home – hero button 'Ver Galería' (Requirement 3.2)", () => {
  it("el hero contiene el texto 'Ver Galería'", () => {
    expect(source).toContain("Ver Galería");
  });

  it("el hero contiene un Button que navega a /galeria", () => {
    const heroSource = source.match(/HERO SECTION[\s\S]*?GALERÍA SECTION/)?.[0] ?? "";
    expect(heroSource).toContain('to="/galeria"');
    expect(heroSource).toContain("Ver Galería");
  });

  it("el hero 'Ver Galería' usa el mismo patrón que 'Leer Blog'", () => {
    expect(source).toContain('to="/blog"');
    expect(source).toContain('to="/galeria"');
  });

  it("el hero contiene el botón 'Ver Galería' con variant outline (mismo estilo que 'Leer Blog')", () => {
    // The "Ver Galería" button in the hero uses variant="outline"
    // We verify both "Ver Galería" and variant="outline" appear in the hero section
    const heroMatch = source.match(/HERO SECTION[\s\S]*?GALERÍA SECTION/);
    expect(heroMatch).not.toBeNull();
    const heroSource = heroMatch![0];
    expect(heroSource).toContain("Ver Galería");
    expect(heroSource).toContain('variant="outline"');
    expect(heroSource).toContain('to="/galeria"');
  });
});
