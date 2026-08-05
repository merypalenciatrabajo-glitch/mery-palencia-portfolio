import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hashtagUrl,
  normalizeHashtag,
  normalizeHashtagEntries,
} from "@/components/HashtagInput";

describe("HashtagInput", () => {
  it("normaliza hashtags como etiquetas reutilizables", () => {
    expect(normalizeHashtag("#Infantil")).toBe("infantil");
    expect(normalizeHashtag("  ##Retrato_Familiar  ")).toBe("retrato_familiar");
    expect(normalizeHashtag("niñez! feliz")).toBe("niñezfeliz");
  });

  it("mantiene compatibilidad con etiquetas antiguas y valida sus redes", () => {
    expect(normalizeHashtagEntries([
      "#Infantil",
      { tag: "Retrato Familiar", platforms: ["instagram", "x", "invalid", "x"] },
    ])).toEqual([
      { tag: "infantil", platforms: [] },
      { tag: "retratofamiliar", platforms: ["instagram", "x"] },
    ]);
  });

  it("genera búsquedas de hashtag para cada red social", () => {
    expect(hashtagUrl("instagram", "infantil")).toBe("https://www.instagram.com/explore/tags/infantil/");
    expect(hashtagUrl("facebook", "infantil")).toBe("https://www.facebook.com/hashtag/infantil");
    expect(hashtagUrl("x", "infantil")).toBe("https://x.com/hashtag/infantil");
  });

  it("está conectado a Galería y Destacadas", () => {
    const gallery = readFileSync(resolve(__dirname, "../pages/Gallery.tsx"), "utf-8");
    const galleryPage = readFileSync(resolve(__dirname, "../pages/GaleriaPage.tsx"), "utf-8");
    expect(gallery).toContain("<HashtagInput");
    expect(galleryPage).toContain("<HashtagInput");
    expect(gallery).toContain("hashtags: normalizeHashtagEntries(item.hashtags)");
    expect(galleryPage).toContain("hashtags: normalizeHashtagEntries(item.hashtags)");
    expect(gallery).toContain("<HashtagLinks");
    expect(galleryPage).toContain("<HashtagLinks");
  });
});
