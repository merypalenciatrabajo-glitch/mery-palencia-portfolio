// Validates: Requirements 6.1

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Unit test for the /galeria route in the client router (App.tsx)
 *
 * Since the test environment is 'node' (no jsdom), we verify the router
 * source to assert that the /galeria route is registered and points to
 * the GalleryPage component.
 */

const appSource = readFileSync(resolve(__dirname, "../App.tsx"), "utf-8");

describe("Client router – ruta /galeria (Requirement 6.1)", () => {
  it("App.tsx importa el componente GalleryPage", () => {
    expect(appSource).toContain("GalleryPage");
    expect(appSource).toMatch(/import\s+GalleryPage/);
  });

  it("App.tsx registra la ruta '/galeria' en el Switch de wouter", () => {
    expect(appSource).toContain('path={"/galeria"}');
  });

  it("la ruta '/galeria' está asociada al componente GalleryPage", () => {
    // Verify that the Route with path="/galeria" uses GalleryPage as component
    expect(appSource).toMatch(/path=\{["']\/galeria["']\}[^>]*component=\{GalleryPage\}/);
  });

  it("App.tsx usa wouter para el routing", () => {
    expect(appSource).toContain("from \"wouter\"");
    expect(appSource).toContain("Switch");
    expect(appSource).toContain("Route");
  });
});
