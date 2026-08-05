import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "../GaleriaPage.tsx"), "utf-8");

describe("GaleriaPage – colección pública unificada", () => {
  it("realiza todas sus lecturas y escrituras sobre gallery", () => {
    expect(source).toContain('collection(db, "gallery")');
    expect(source).toContain('doc(db, "gallery", editing.id)');
    expect(source).toContain('doc(db, "gallery", item.id)');
  });

  it("no vuelve a introducir la colección duplicada galleryPage", () => {
    expect(source).not.toContain("galleryPage");
  });
});
