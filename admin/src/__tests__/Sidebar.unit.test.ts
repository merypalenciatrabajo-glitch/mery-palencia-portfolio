// Validates: Requirements 5.2

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for the updated Sidebar (Task 7 of gallery-page spec).
 *
 * Since the test environment is 'node' (no jsdom), we verify the source file
 * directly to assert that the correct nav items are present.
 */

const sidebarSource = readFileSync(
  resolve(__dirname, "../components/Sidebar.tsx"),
  "utf-8"
);

// ── Requirement 5.2 ──────────────────────────────────────────────────────────

describe("Sidebar – item /galeria muestra 'Galería' (Requirement 5.2)", () => {
  it("NAV_ITEMS contiene una entrada con to='/galeria'", () => {
    expect(sidebarSource).toContain('to: "/galeria"');
  });

  it("la entrada /galeria tiene el label 'Galería'", () => {
    expect(sidebarSource).toMatch(/to:\s*["']\/galeria["'][^}]*label:\s*["']Galería["']/s);
  });

  it("el item 'Galería' usa el icono GalleryHorizontal", () => {
    expect(sidebarSource).toMatch(/to:\s*["']\/galeria["'][^}]*icon:\s*GalleryHorizontal/s);
    expect(sidebarSource).toContain("GalleryHorizontal");
  });
});

// ── Orden: "Galería" aparece después de "Destacadas" ─────────────────────────

describe("Sidebar – orden de items de navegación", () => {
  it("el item 'Galería' (/galeria) aparece después del item 'Destacadas' (/gallery) en NAV_ITEMS", () => {
    const destacadasIndex = sidebarSource.indexOf('to: "/gallery"');
    const galeriaIndex = sidebarSource.indexOf('to: "/galeria"');

    expect(destacadasIndex).toBeGreaterThan(-1);
    expect(galeriaIndex).toBeGreaterThan(-1);
    expect(galeriaIndex).toBeGreaterThan(destacadasIndex);
  });
});
