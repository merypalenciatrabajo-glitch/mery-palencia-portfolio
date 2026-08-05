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
const dockSource = readFileSync(resolve(__dirname, "../../components/PortfolioDock.tsx"), "utf-8");
const animatedHeroSource = readFileSync(resolve(__dirname, "../../components/AnimatedHeroBackground.tsx"), "utf-8");

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
    expect(source).toContain("<PortfolioDock />");
    expect(dockSource).toContain("label: 'Blog'");
    expect(dockSource).toContain("label: 'Galería'");
    expect(dockSource).toContain("to: '/galeria'");
  });

  it("el link 'Galería' del header usa navegación SPA con Link", () => {
    expect(dockSource).toContain("to: '/galeria'");
    expect(dockSource).toContain("to={to}");
    expect(dockSource).not.toContain("window.location.href");
  });
});

// ---------------------------------------------------------------------------
// El hero evita duplicar destinos que ya existen en el dock
// ---------------------------------------------------------------------------

describe("Home – acción principal del hero", () => {
  it("el hero conserva únicamente la acción de comisiones", () => {
    const heroSource = source.match(/HERO SECTION[\s\S]*?GALERÍA SECTION/)?.[0] ?? "";
    expect(heroSource).toContain("Ver Comisiones");
    expect(heroSource).not.toContain("Contactar");
    expect(heroSource).not.toContain("Leer Blog");
    expect(heroSource).not.toContain("Ver Galería");
  });

  it("el hero desplaza hacia la sección de comisiones", () => {
    const heroSource = source.match(/HERO SECTION[\s\S]*?GALERÍA SECTION/)?.[0] ?? "";
    expect(heroSource).toContain("commission-section");
    expect(heroSource).toContain("scrollIntoView");
  });
});

describe("Home – carrusel de trabajos destacados", () => {
  it("mantiene reproducción automática y ofrece un control de pausa", () => {
    expect(source).toContain("SPEED * (elapsed / 1000)");
    expect(source).toContain("Pausar carrusel");
    expect(source).toContain("Reanudar carrusel");
    expect(source).not.toContain("prefers-reduced-motion: reduce').matches) return");
  });
});

describe("Home – atardecer interactivo del hero", () => {
  it("usa un canvas local que abre la escena con el puntero y sin marcas externas", () => {
    expect(source).toContain("<AnimatedHeroBackground />");
    expect(animatedHeroSource).toContain("hero-sunset__canvas");
    expect(animatedHeroSource).toContain("revealTarget = 1");
    expect(animatedHeroSource).toContain("revealTarget = 0");
    expect(animatedHeroSource).not.toContain("UnicornStudio");
    expect(animatedHeroSource).not.toContain("vanta");
  });
});
