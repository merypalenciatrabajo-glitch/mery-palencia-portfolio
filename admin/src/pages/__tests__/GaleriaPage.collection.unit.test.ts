import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "../GaleriaPage.tsx"), "utf-8");

describe("GaleriaPage – aislamiento de la colección pública", () => {
  it("realiza todas sus lecturas y escrituras sobre galleryPage", () => {
    expect(source).toContain('collection(db, "galleryPage")');
    expect(source).toContain('doc(db, "galleryPage", editing.id)');
    expect(source).toContain('doc(db, "galleryPage", item.id)');
  });

  it("no modifica accidentalmente la colección gallery de Destacadas", () => {
    expect(source).not.toMatch(/(?:collection|doc)\(db, "gallery"/);
  });
});
