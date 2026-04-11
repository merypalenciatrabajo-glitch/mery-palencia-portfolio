// Feature: client-navbar-navigation-fix, Property 1: Bug Condition
// Validates: Requirements 1.1, 1.2, 1.3
// **Validates: Requirements 1.1, 1.2, 1.3**

/**
 * Property 1: Bug Condition — Navbar de /blog muestra enlaces de navegación
 *
 * EXPLORATORY TEST — EXPECTED TO FAIL ON UNFIXED CODE
 *
 * This test encodes the EXPECTED (correct) behavior:
 * - Blog.tsx header SHALL contain a link to "/" with text "Inicio"
 * - Blog.tsx header SHALL contain a link to "/blog" with text "Blog"
 * - Blog.tsx header SHALL contain a link to "/galeria" with text "Galería"
 *
 * On unfixed code, the Blog.tsx header only renders:
 *   [Mery Palencia (button)] [ThemeToggle]
 * — it does NOT include navigation links.
 *
 * EXPECTED OUTCOME: Tests FAIL on unfixed code (confirms bug exists).
 * When the fix is applied (Task 3), these tests will PASS.
 *
 * Counterexamples documented:
 * - Blog.tsx header does not render an "Inicio" link (href="/")
 * - Blog.tsx header does not render a "Blog" link (href="/blog")
 * - Blog.tsx header does not render a "Galería" link (href="/galeria")
 * - Root cause: header uses <button onClick={() => window.location.href = '/'}> instead of <Link>
 *   and omits the navigation block entirely
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read the Blog component source once
const componentPath = resolve(__dirname, "../Blog.tsx");
const source = readFileSync(componentPath, "utf-8");

/**
 * Extract the header section from the Blog component source.
 * The header is delimited by {/* HEADER *\/} and the next section comment.
 */
function extractHeaderSource(src: string): string {
  const headerMatch = src.match(/<header[\s\S]*?<\/header>/);
  return headerMatch ? headerMatch[0] : "";
}

const headerSource = extractHeaderSource(source);

// ---------------------------------------------------------------------------
// Property 1: Bug Condition — enlaces de navegación en el header de /blog
// ---------------------------------------------------------------------------

describe("Blog – navbar enlaces de navegación (Property 1: Bug Condition)", () => {
  /**
   * P1.1: El header de Blog.tsx contiene un enlace a "/" con texto "Inicio"
   *
   * Expected behavior: <Link to="/">Inicio</Link>
   * Bug condition: no existe ningún enlace con texto "Inicio" en el header
   *
   * EXPECTED TO FAIL on unfixed code.
   */
  it(
    'P1.1: el header contiene un link a "/" (Inicio)',
    () => {
      // The fixed header should have: <Link to="/">Inicio</Link>
      // or equivalent: to="/" ... Inicio
      const hasInicioLink =
        headerSource.includes('to="/"') &&
        /to="\/"[\s\S]{0,200}Inicio/.test(headerSource);

      expect(hasInicioLink).toBe(true);
    }
  );

  /**
   * P1.2: El header de Blog.tsx contiene un enlace a "/blog" con texto "Blog"
   *
   * Expected behavior: <Link to="/blog">Blog</Link>
   * Bug condition: no existe ningún enlace con texto "Blog" en el header
   *
   * EXPECTED TO FAIL on unfixed code.
   */
  it(
    'P1.2: el header contiene un link a "/blog" (Blog)',
    () => {
      // The fixed header should have: <Link to="/blog">Blog</Link>
      const hasBlogLink =
        headerSource.includes('to="/blog"') &&
        /to="\/blog"[\s\S]{0,200}Blog/.test(headerSource);

      expect(hasBlogLink).toBe(true);
    }
  );

  /**
   * P1.3: El header de Blog.tsx contiene un enlace a "/galeria" con texto "Galería"
   *
   * Expected behavior: <Link to="/galeria">Galería</Link>
   * Bug condition: no existe ningún enlace con texto "Galería" en el header
   *
   * EXPECTED TO FAIL on unfixed code.
   */
  it(
    'P1.3: el header contiene un link a "/galeria" (Galería)',
    () => {
      // The fixed header should have: <Link to="/galeria">Galería</Link>
      const hasGaleriaLink =
        headerSource.includes('to="/galeria"') &&
        /to="\/galeria"[\s\S]{0,200}Galer/.test(headerSource);

      expect(hasGaleriaLink).toBe(true);
    }
  );

  /**
   * P1.4 (property-based): Para cualquier ruta de navegación esperada en el header de /blog,
   * el header contiene el enlace correspondiente usando el componente Link de wouter.
   *
   * This property generalizes P1.1–P1.3: for each expected nav link (route, label),
   * the header source must contain a wouter Link pointing to that route.
   *
   * EXPECTED TO FAIL on unfixed code (header has no Link elements at all).
   */
  it(
    "P1.4: para cada enlace de navegación esperado, el header usa Link de wouter (property-based)",
    () => {
      // The three expected navigation links in the Blog header
      const expectedNavLinks = [
        { route: "/", label: "Inicio" },
        { route: "/blog", label: "Blog" },
        { route: "/galeria", label: "Galería" },
      ] as const;

      fc.assert(
        fc.property(
          fc.constantFrom(...expectedNavLinks),
          ({ route, label }) => {
            // The header must contain a Link with to="<route>" near the label text
            const routePattern = route.replace("/", "\\/");
            const hasLink =
              headerSource.includes(`to="${route}"`) &&
              new RegExp(`to="${routePattern}"[\\s\\S]{0,200}${label.charAt(0)}`).test(headerSource);

            return hasLink;
          }
        ),
        { numRuns: 3 } // 3 runs — one per nav link (deterministic with constantFrom)
      );
    }
  );

  /**
   * P1.5: El header de Blog.tsx usa el componente Link de wouter (no window.location.href)
   * para la navegación del logo.
   *
   * Bug condition: el logo usa <button onClick={() => window.location.href = '/'}>
   * Expected behavior: el logo usa <Link to="/">
   *
   * EXPECTED TO FAIL on unfixed code.
   */
  it(
    "P1.5: el logo del header usa Link de wouter en lugar de window.location.href",
    () => {
      // The fixed code should NOT use window.location.href in the header for the logo
      const headerUsesWindowLocation = /window\.location\.href/.test(headerSource);
      expect(headerUsesWindowLocation).toBe(false);
    }
  );
});
