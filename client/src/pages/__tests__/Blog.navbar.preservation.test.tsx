// Feature: client-navbar-navigation-fix, Property 2: Preservation
// Validates: Requirements 3.1, 3.2, 3.3, 3.4
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

/**
 * Property 2: Preservation — Comportamiento existente de GalleryPage no se altera
 *
 * PRESERVATION TESTS — EXPECTED TO PASS ON UNFIXED CODE
 *
 * These tests observe the CURRENT (unfixed) behavior of GalleryPage.tsx and
 * encode it as a baseline to preserve after the fix is applied.
 *
 * Observed behaviors in unfixed code:
 * - GalleryPage at `/galeria` renders "Blog" and "Galería" links in the header
 * - ThemeToggle is present in GalleryPage header
 * - Logo "Mery Palencia" navigates to "/" (href="/")
 * - "Galería" link has active style class (border-b-2 border-accent) when at /galeria
 *
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior to preserve).
 * After the fix (Task 3), these tests must STILL PASS (no regressions).
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read the GalleryPage component source once
const componentPath = resolve(__dirname, "../GalleryPage.tsx");
const source = readFileSync(componentPath, "utf-8");

/**
 * Extract the header section from the GalleryPage component source.
 */
function extractHeaderSource(src: string): string {
  const headerMatch = src.match(/<header[\s\S]*?<\/header>/);
  return headerMatch ? headerMatch[0] : "";
}

const headerSource = extractHeaderSource(source);

// ---------------------------------------------------------------------------
// Property 2: Preservation — GalleryPage header preserva sus enlaces
// ---------------------------------------------------------------------------

describe("GalleryPage – preservation de navbar (Property 2: Preservation)", () => {
  /**
   * P2.1 (property-based): Para todas las rutas en ['/galeria'],
   * el header de GalleryPage contiene los enlaces "Blog" y "Galería".
   *
   * Validates: Requirement 3.1
   * EXPECTED TO PASS on unfixed code.
   */
  it(
    "P2.1: para todas las rutas en ['/galeria'], el header contiene los enlaces 'Blog' y 'Galería' (property-based)",
    () => {
      // The routes where GalleryPage is rendered
      const galleryRoutes = ["/galeria"] as const;

      fc.assert(
        fc.property(
          fc.constantFrom(...galleryRoutes),
          (_route) => {
            // GalleryPage header must always contain a Blog link
            const hasBlogLink =
              headerSource.includes('to="/blog"') &&
              /to="\/blog"[\s\S]{0,500}Blog/.test(headerSource);

            // GalleryPage header must always contain a Galería link
            const hasGaleriaLink =
              headerSource.includes('to="/galeria"') &&
              /to="\/galeria"[\s\S]{0,500}Galer/.test(headerSource);

            return hasBlogLink && hasGaleriaLink;
          }
        ),
        { numRuns: 1 } // 1 run — deterministic with constantFrom over single value
      );
    }
  );

  /**
   * P2.2: ThemeToggle está presente en el header de GalleryPage.
   *
   * Validates: Requirement 3.2
   * EXPECTED TO PASS on unfixed code.
   */
  it("P2.2: ThemeToggle está presente en el header de GalleryPage", () => {
    expect(headerSource).toContain("ThemeToggle");
    expect(headerSource).toMatch(/<ThemeToggle/);
  });

  /**
   * P2.3: El logo "Mery Palencia" en GalleryPage tiene href="/" (navega al home).
   *
   * Validates: Requirement 3.3
   * EXPECTED TO PASS on unfixed code.
   */
  it('P2.3: el logo link en GalleryPage tiene href="/" (navega al home)', () => {
    // The logo is rendered as <Link to="/">Mery Palencia</Link>
    // which wouter renders as <a href="/">Mery Palencia</a>
    expect(headerSource).toContain('to="/"');
    expect(headerSource).toMatch(/to="\/"[\s\S]{0,200}Mery Palencia/);
  });

  /**
   * P2.4: El enlace "Galería" en GalleryPage tiene la clase de estilo activo
   * (border-b-2 border-accent) cuando se está en /galeria.
   *
   * Validates: Requirement 3.4
   * EXPECTED TO PASS on unfixed code.
   */
  it(
    "P2.4: el enlace 'Galería' en GalleryPage tiene clase de estilo activo (border-b-2 border-accent) cuando está en /galeria",
    () => {
      // The active style for Galería link uses border-b-2 border-accent
      expect(headerSource).toContain("border-b-2 border-accent");
      // The active style is applied conditionally via isActive('/galeria')
      expect(headerSource).toMatch(/isActive\(['"]\/galeria['"]\)/);
    }
  );

  /**
   * P2.5: El header de GalleryPage usa el componente Link de wouter (no window.location.href).
   *
   * Validates: Requirement 3.3 (logo navigation uses proper SPA routing)
   * EXPECTED TO PASS on unfixed code.
   */
  it("P2.5: el header de GalleryPage usa Link de wouter, no window.location.href", () => {
    expect(headerSource).not.toMatch(/window\.location\.href/);
  });
});
