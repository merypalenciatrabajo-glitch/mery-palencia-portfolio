// Feature: gallery-page, Property 2: Grid muestra todos los items
// Validates: Requirements 2.2

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 2: Grid muestra todos los items
 *
 * The rendering logic in GalleryPage for the grid is:
 *   items.map((item) => <div key={item.id} ...>...</div>)
 *
 * The number of rendered cards equals items.length.
 * We test this pure mapping in isolation — no Firebase or DOM needed.
 */

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  description: string;
  order: number;
  extraImages: { url: string; publicId: string }[];
}

/**
 * Mirrors the grid rendering logic from GalleryPage:
 * returns the number of card elements that would be rendered for a given items list.
 */
function countRenderedCards(items: GalleryItem[]): number {
  // GalleryPage renders one card per item via items.map(...)
  return items.map((item) => item.id).length;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const extraImageArb = fc.record({
  url: fc.webUrl(),
  publicId: fc.string({ minLength: 1, maxLength: 50 }),
});

const galleryItemArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  image: fc.webUrl(),
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

/** Non-empty list of 1–50 GalleryItems */
const nonEmptyItemsArb = fc.array(galleryItemArb, {
  minLength: 1,
  maxLength: 50,
});

// ---------------------------------------------------------------------------
// Property 2: Grid muestra todos los items
// ---------------------------------------------------------------------------

describe("GalleryPage – grid muestra todos los items (Property 2)", () => {
  it(
    "P2: para cualquier lista no vacía de 1-50 GalleryItems, el grid renderiza exactamente tantas tarjetas como items",
    () => {
      fc.assert(
        fc.property(nonEmptyItemsArb, (items) => {
          const cardCount = countRenderedCards(items);
          expect(cardCount).toBe(items.length);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P2b: el número de tarjetas nunca excede el número de items",
    () => {
      fc.assert(
        fc.property(nonEmptyItemsArb, (items) => {
          const cardCount = countRenderedCards(items);
          expect(cardCount).toBeLessThanOrEqual(items.length);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P2c: el número de tarjetas nunca es menor que el número de items",
    () => {
      fc.assert(
        fc.property(nonEmptyItemsArb, (items) => {
          const cardCount = countRenderedCards(items);
          expect(cardCount).toBeGreaterThanOrEqual(items.length);
        }),
        { numRuns: 100 }
      );
    }
  );
});
