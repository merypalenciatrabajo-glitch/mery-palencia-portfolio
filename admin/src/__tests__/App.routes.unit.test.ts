// Validates: Requirements 7.1, 7.2

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for the admin router – ruta /galeria (Task 7.3 of gallery-page spec).
 *
 * We inspect the source of admin/src/App.tsx to verify:
 *   1. The route /galeria is registered in AppRoutes
 *   2. The route /galeria is wrapped by ProtectedRoute
 *   3. The route /galeria renders GaleriaPage
 *   4. Unauthenticated users are redirected to /login (via ProtectedRoute logic)
 *
 * Source-inspection approach is consistent with the existing Sidebar.unit.test.ts
 * pattern and avoids the need for jsdom / full React rendering in a node environment.
 */

const appSource = readFileSync(
  resolve(__dirname, "../App.tsx"),
  "utf-8"
);

// ── Requirement 7.1 – ruta /galeria registrada ────────────────────────────────

describe("Admin router – ruta /galeria registrada (Requirement 7.1)", () => {
  it("App.tsx importa GaleriaPage", () => {
    expect(appSource).toMatch(/import\s+GaleriaPage\s+from/);
  });

  it("AppRoutes contiene una <Route> con path='/galeria'", () => {
    // Matches both path="/galeria" and path='/galeria'
    expect(appSource).toMatch(/path=["']\/galeria["']/);
  });

  it("la ruta /galeria renderiza GaleriaPage", () => {
    // The JSX block for /galeria must reference GaleriaPage
    expect(appSource).toMatch(/<GaleriaPage\s*\/?>/);
  });
});

// ── Requirement 7.1 – ruta /galeria usa ProtectedRoute ───────────────────────

describe("Admin router – ruta /galeria protegida por ProtectedRoute (Requirement 7.1)", () => {
  it("la ruta /galeria está envuelta en ProtectedRoute", () => {
    // Extract the JSX block for the /galeria route and verify ProtectedRoute wraps it
    const galeriaRouteBlock = extractRouteBlock(appSource, "/galeria");
    expect(galeriaRouteBlock).not.toBeNull();
    expect(galeriaRouteBlock).toContain("ProtectedRoute");
  });

  it("GaleriaPage aparece dentro del bloque ProtectedRoute de la ruta /galeria", () => {
    const galeriaRouteBlock = extractRouteBlock(appSource, "/galeria");
    expect(galeriaRouteBlock).not.toBeNull();
    expect(galeriaRouteBlock).toContain("GaleriaPage");
  });
});

// ── Requirement 7.2 – usuario no autenticado redirigido a /login ──────────────

describe("Admin router – usuario no autenticado redirigido a /login (Requirement 7.2)", () => {
  it("ProtectedRoute redirige a /login cuando user es null", () => {
    // Verify the ProtectedRoute implementation redirects to /login
    expect(appSource).toMatch(/Navigate\s+to=["']\/login["']/);
  });

  it("ProtectedRoute comprueba que user no sea null antes de renderizar", () => {
    // The guard must check !user and return a Navigate element
    expect(appSource).toMatch(/if\s*\(\s*!user\s*\)/);
  });

  it("la redirección a /login usa replace para no añadir entrada al historial", () => {
    expect(appSource).toMatch(/Navigate\s+to=["']\/login["'][^/]*replace/);
  });
});

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Extracts the JSX <Route> block for a given path from the App source.
 * Returns the substring from `path="<routePath>"` to the closing `/>` or `</Route>`.
 */
function extractRouteBlock(source: string, routePath: string): string | null {
  // Find the <Route ... path="/galeria" ...> opening
  const pathPattern = new RegExp(`path=["']${routePath.replace("/", "\\/")}["']`);
  const match = pathPattern.exec(source);
  if (!match) return null;

  // Walk backwards to find the opening <Route
  const beforeMatch = source.slice(0, match.index);
  const routeStart = beforeMatch.lastIndexOf("<Route");
  if (routeStart === -1) return null;

  // Walk forward to find the closing </Route> or self-closing />
  // We count nesting depth to handle nested elements
  let depth = 0;
  let i = routeStart;
  while (i < source.length) {
    if (source.startsWith("<Route", i) && !source.startsWith("</Route", i)) {
      depth++;
      i += 6;
    } else if (source.startsWith("</Route>", i)) {
      depth--;
      if (depth === 0) {
        return source.slice(routeStart, i + 8);
      }
      i += 8;
    } else {
      i++;
    }
  }

  // Fallback: return a generous slice around the match
  return source.slice(routeStart, routeStart + 300);
}
