// Feature: gallery-page, Property 1: Normalización de extraImages
// Validates: Requirements 1.2

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * The normalization logic extracted from useGalleryPage:
 *   extraImages: item.extraImages ?? []
 *
 * We test this pure transformation in isolation — no Firebase mocking needed.
 */

interface RawGalleryItem {
  id: string;
  title: string;
  image: string;
  publicId: string;
  category: string;
  description: string;
  order: number;
  extraImages?: { url: string; publicId: string }[];
}

interface NormalizedGalleryItem extends RawGalleryItem {
  extraImages: { url: string; publicId: string }[];
}

/** Mirrors the normalization applied inside useGalleryPage */
function normalizeGalleryItem(item: RawGalleryItem): NormalizedGalleryItem {
  return {
    ...item,
    extraImages: item.extraImages ?? [],
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const extraImageArb = fc.record({
  url: fc.webUrl(),
  publicId: fc.string({ minLength: 1, maxLength: 50 }),
});

/** Document WITHOUT the extraImages field */
const rawItemWithoutExtrasArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  image: fc.webUrl(),
  publicId: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(
    "personajes",
    "escenarios",
    "props",
    "abstracto",
    "otro"
  ),
  description: fc.string({ maxLength: 200 }),
  order: fc.integer({ min: 0, max: 1000 }),
});

/** Document WITH the extraImages field (0–4 items) */
const rawItemWithExtrasArb = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    image: fc.webUrl(),
    publicId: fc.string({ minLength: 1, maxLength: 50 }),
    category: fc.constantFrom(
      "personajes",
      "escenarios",
      "props",
      "abstracto",
      "otro"
    ),
    description: fc.string({ maxLength: 200 }),
    order: fc.integer({ min: 0, max: 1000 }),
    extraImages: fc.array(extraImageArb, { minLength: 0, maxLength: 4 }),
  });

// ---------------------------------------------------------------------------
// Property 1: Normalización de extraImages
// ---------------------------------------------------------------------------

describe("useGalleryPage – normalización de extraImages (Property 1)", () => {
  it(
    "P1a: cuando el documento NO tiene extraImages, el resultado siempre es []",
    () => {
      fc.assert(
        fc.property(rawItemWithoutExtrasArb, (item) => {
          const normalized = normalizeGalleryItem(item);
          expect(normalized.extraImages).toEqual([]);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P1b: cuando el documento SÍ tiene extraImages, el resultado conserva el valor original",
    () => {
      fc.assert(
        fc.property(rawItemWithExtrasArb, (item) => {
          const normalized = normalizeGalleryItem(item);
          expect(normalized.extraImages).toEqual(item.extraImages);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P1c: el resto de los campos del documento no se alteran durante la normalización",
    () => {
      fc.assert(
        fc.property(rawItemWithoutExtrasArb, (item) => {
          const normalized = normalizeGalleryItem(item);
          expect(normalized.id).toBe(item.id);
          expect(normalized.title).toBe(item.title);
          expect(normalized.image).toBe(item.image);
          expect(normalized.publicId).toBe(item.publicId);
          expect(normalized.category).toBe(item.category);
          expect(normalized.description).toBe(item.description);
          expect(normalized.order).toBe(item.order);
        }),
        { numRuns: 100 }
      );
    }
  );
});
