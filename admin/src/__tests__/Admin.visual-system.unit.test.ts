import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(__dirname, path), "utf-8");

describe("Admin visual system", () => {
  it("usa la identidad de Mery Palencia en todos los estados de acceso", () => {
    const login = readSource("../pages/Login.tsx");
    const accessDenied = readSource("../components/AccessDenied.tsx");
    const sidebar = readSource("../components/Sidebar.tsx");

    expect(login).toContain("<AdminBrand");
    expect(accessDenied).toContain("<AdminBrand");
    expect(accessDenied).not.toContain("ShieldX");
    expect(sidebar).toContain("<AdminBrand");
    expect(sidebar).not.toMatch(/>\s*MP\s*</);
  });

  it("centraliza la carga y no reintroduce spinners genéricos", () => {
    const app = readSource("../App.tsx");
    expect(app).toContain("<AdminLoading");
    expect(app).not.toContain("animate-spin");
  });

  it("mantiene el modal de actualización dentro de la superficie acrílica", () => {
    const updateModal = readSource("../components/UpdateBanner.tsx");
    expect(updateModal).toContain("admin-dashboard-surface");
    expect(updateModal).not.toContain("rounded-xl bg-primary/10");
  });

  it("comparte los estados vacíos sin fondos decorativos de icono", () => {
    const pages = [
      readSource("../pages/Blog.tsx"),
      readSource("../pages/Gallery.tsx"),
      readSource("../pages/GaleriaPage.tsx"),
      readSource("../pages/Commissions.tsx"),
    ];

    pages.forEach((page) => expect(page).toContain("<AdminEmptyState"));
    pages.forEach((page) => expect(page).not.toContain("rounded-2xl bg-primary/10"));
  });
});
