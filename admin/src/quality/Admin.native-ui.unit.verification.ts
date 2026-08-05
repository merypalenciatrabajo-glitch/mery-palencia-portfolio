import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readAdminSource = (path: string) =>
  readFileSync(resolve(__dirname, "..", path), "utf-8");

const interactivePages = [
  "pages/Gallery.tsx",
  "pages/GaleriaPage.tsx",
  "pages/Blog.tsx",
  "pages/Commissions.tsx",
].map(readAdminSource).join("\n");

describe("Admin – sistema de interacción propio", () => {
  it("no usa confirmaciones ni selectores visuales nativos", () => {
    expect(interactivePages).not.toContain("confirm(");
    expect(interactivePages).not.toContain("<select");
    expect(interactivePages).not.toContain('type="datetime-local"');
    expect(interactivePages).toContain("ConfirmDialog");
    expect(interactivePages).toContain("AdminSelect");
  });

  it("define scrollbar y cursores coherentes globalmente", () => {
    const styles = readAdminSource("index.css");
    expect(styles).toContain("::-webkit-scrollbar-thumb");
    expect(styles).toContain("scrollbar-color:");
    expect(styles).toContain("cursor: pointer");
    expect(styles).toContain("cursor: text");
    expect(styles).toContain("cursor: not-allowed");
  });

  it("mantiene cabeceras y pies acrílicos en Blog y Comisiones", () => {
    const blog = readAdminSource("pages/Blog.tsx");
    const commissions = readAdminSource("pages/Commissions.tsx");
    expect(blog).toContain("bg-card/85");
    expect(blog).toContain("backdrop-blur-xl");
    expect(commissions).toContain("bg-card/85");
    expect(commissions).toContain("backdrop-blur-xl");
  });
});
