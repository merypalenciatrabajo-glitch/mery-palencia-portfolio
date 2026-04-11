// Validates: Requirements 4.1, 4.2

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit tests for the renaming of the admin "Galería" section to "Destacadas"
 * (Task 5 of gallery-page spec).
 *
 * Since the test environment is 'node' (no jsdom), we verify the source files
 * directly to assert that the correct labels are present.
 */

const adminRoot = resolve(__dirname, "../../../admin/src");

const sidebarSource = readFileSync(resolve(adminRoot, "components/Sidebar.tsx"), "utf-8");
const galleryAdminSource = readFileSync(resolve(adminRoot, "pages/Gallery.tsx"), "utf-8");

// ── Requirement 4.1 ──────────────────────────────────────────────────────────

describe("Sidebar – item /gallery muestra 'Destacadas' (Requirement 4.1)", () => {
  it("NAV_ITEMS contiene una entrada con to='/gallery'", () => {
    expect(sidebarSource).toContain('to: "/gallery"');
  });

  it("la entrada /gallery tiene el label 'Destacadas'", () => {
    // The NAV_ITEMS entry for /gallery must use the label "Destacadas"
    expect(sidebarSource).toMatch(/to:\s*["']\/gallery["'][^}]*label:\s*["']Destacadas["']/s);
  });

  it("el label 'Galería' ya no está asociado a la ruta /gallery", () => {
    // "Galería" should not appear as the label for /gallery
    expect(sidebarSource).not.toMatch(/to:\s*["']\/gallery["'][^}]*label:\s*["']Galería["']/s);
  });
});

// ── Requirement 4.2 ──────────────────────────────────────────────────────────

describe("Gallery.tsx admin – heading y subtítulo (Requirement 4.2)", () => {
  it("el heading principal dice 'Destacadas'", () => {
    expect(galleryAdminSource).toContain("Destacadas");
    // Specifically as an h1 heading
    expect(galleryAdminSource).toMatch(/<h1[^>]*>Destacadas<\/h1>/);
  });

  it("el subtítulo menciona 'carrusel del Home'", () => {
    expect(galleryAdminSource).toContain("carrusel del Home");
  });

  it("el subtítulo menciona 'Imágenes del carrusel del Home'", () => {
    expect(galleryAdminSource).toContain("Imágenes del carrusel del Home");
  });
});
