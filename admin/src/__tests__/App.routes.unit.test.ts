// Validates: Requirements 7.1, 7.2

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for the admin router – ruta /galeria (Task 7.3 of gallery-page spec).
 *
 * We inspect the source of admin/src/App.tsx to verify:
 *   1. The route /galeria is registered in AppRoutes
 *   2. The route /galeria belongs to the protected route group
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
  it("App.tsx carga GaleriaPage de forma diferida", () => {
    expect(appSource).toContain(
      'lazy(() => import("./pages/GaleriaPage"))'
    );
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
  it("la ruta /galeria pertenece al grupo protegido", () => {
    const protectedRoutesBlock = extractProtectedRoutesBlock(appSource);
    expect(protectedRoutesBlock).not.toBeNull();
    expect(protectedRoutesBlock).toMatch(/path=["']\/galeria["']/);
  });

  it("GaleriaPage aparece dentro del grupo ProtectedRoute", () => {
    const protectedRoutesBlock = extractProtectedRoutesBlock(appSource);
    expect(protectedRoutesBlock).not.toBeNull();
    expect(protectedRoutesBlock).toContain("GaleriaPage");
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
 * Extracts the nested route group whose element is ProtectedRoute.
 */
function extractProtectedRoutesBlock(source: string): string | null {
  const protectedRoutePattern = /<Route\s+element=\{<ProtectedRoute\s*\/>\}>/;
  const match = protectedRoutePattern.exec(source);
  if (!match) return null;

  const routeStart = match.index;
  const routeEnd = source.indexOf("</Route>", routeStart);
  return routeEnd === -1 ? null : source.slice(routeStart, routeEnd + 8);
}
