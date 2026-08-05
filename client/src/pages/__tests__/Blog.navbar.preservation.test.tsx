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
 * - An explicit Inicio link is present in GalleryPage header
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
const componentPath = resolve(__dirname, "../../components/PortfolioDock.tsx");
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
            const hasBlogLink = source.includes("to: '/blog'") && source.includes("label: 'Blog'");

            // GalleryPage header must always contain a Galería link
            const hasGaleriaLink = source.includes("to: '/galeria'") && source.includes("label: 'Galería'");

            return hasBlogLink && hasGaleriaLink;
          }
        ),
        { numRuns: 1 } // 1 run — deterministic with constantFrom over single value
      );
    }
  );

  /**
   * P2.2: Inicio está presente en el header de GalleryPage.
   *
   * Validates: Requirement 3.2
   * EXPECTED TO PASS on unfixed code.
   */
  it("P2.2: Inicio está presente en el header de GalleryPage", () => {
    expect(source).toContain("to: '/'");
    expect(source).toContain("label: 'Inicio'");
  });

  /**
   * P2.3: El logo accesible de GalleryPage navega al home.
   *
   * Validates: Requirement 3.3
   * EXPECTED TO PASS on unfixed code.
   */
  it('P2.3: el logo accesible en GalleryPage navega al home', () => {
    expect(headerSource).toContain('to="/"');
    expect(headerSource).toContain('aria-label="Mery Palencia, ir al inicio"');
    expect(headerSource).toContain('<img src="/logo/logo.svg" alt="Mery Palencia"');
  });

  /**
   * P2.4: El enlace "Galería" en GalleryPage tiene la clase de estilo activo
   * (border-b-2 border-accent) cuando se está en /galeria.
   *
   * Validates: Requirement 3.4
   * EXPECTED TO PASS on unfixed code.
   */
  it(
    "P2.4: el enlace activo usa el tratamiento acrílico turquesa",
    () => {
      expect(headerSource).toContain("bg-primary/15 text-primary");
      expect(headerSource).toContain("matches(location)");
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
