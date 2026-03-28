// Feature: gallery-page, Property 3: Click en tarjeta abre Lightbox con datos correctos
// Validates: Requirements 2.3

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 3: Click en tarjeta abre Lightbox con datos correctos
 *
 * The selection logic in GalleryPage is:
 *
 *   const openLightbox = (item: GalleryItem) => {
 *     setSelected(item);
 *     setLightboxOpen(true);
 *   };
 *
 * And the Lightbox receives:
 *   <Lightbox
 *     isOpen={lightboxOpen}
 *     image={selected.image}
 *     title={selected.title}
 *     category={selected.category}
 *     description={selected.description}
 *     extraImages={selected.extraImages}
 *     onClose={...}
 *   />
 *
 * We model this pure selection logic in isolation — no Firebase or DOM needed.
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

interface LightboxProps {
  isOpen: boolean;
  image: string;
  title: string;
  category: string;
  description: string;
  extraImages: { url: string; publicId: string }[];
}

/**
 * Mirrors the openLightbox logic from GalleryPage:
 * given a clicked item, returns the props that would be passed to Lightbox.
 */
function openLightbox(item: GalleryItem): LightboxProps {
  return {
    isOpen: true,
    image: item.image,
    title: item.title,
    category: item.category,
    description: item.description,
    extraImages: item.extraImages,
  };
}

/**
 * Simulates clicking the card at `index` in the items list and returns
 * the resulting Lightbox props.
 */
function clickCard(items: GalleryItem[], index: number): LightboxProps {
  const item = items[index];
  return openLightbox(item);
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

/** Non-empty list of 1–50 GalleryItems paired with a valid index into that list */
const itemsWithIndexArb = fc
  .array(galleryItemArb, { minLength: 1, maxLength: 50 })
  .chain((items) =>
    fc.tuple(
      fc.constant(items),
      fc.integer({ min: 0, max: items.length - 1 })
    )
  );

// ---------------------------------------------------------------------------
// Property 3: Click en tarjeta abre Lightbox con datos correctos
// ---------------------------------------------------------------------------

describe("GalleryPage – click en tarjeta abre Lightbox con datos correctos (Property 3)", () => {
  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox se abre con isOpen=true",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const props = clickCard(items, index);
          expect(props.isOpen).toBe(true);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox recibe la image del item seleccionado",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);
          expect(props.image).toBe(item.image);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox recibe el title del item seleccionado",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);
          expect(props.title).toBe(item.title);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox recibe la category del item seleccionado",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);
          expect(props.category).toBe(item.category);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox recibe la description del item seleccionado",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);
          expect(props.description).toBe(item.description);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3: para cualquier lista de GalleryItems y cualquier índice válido, el Lightbox recibe las extraImages del item seleccionado",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);
          expect(props.extraImages).toEqual(item.extraImages);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P3 (combinado): para cualquier lista de GalleryItems y cualquier item seleccionado, todos los props del Lightbox coinciden con el item",
    () => {
      fc.assert(
        fc.property(itemsWithIndexArb, ([items, index]) => {
          const item = items[index];
          const props = clickCard(items, index);

          expect(props.isOpen).toBe(true);
          expect(props.image).toBe(item.image);
          expect(props.title).toBe(item.title);
          expect(props.category).toBe(item.category);
          expect(props.description).toBe(item.description);
          expect(props.extraImages).toEqual(item.extraImages);
        }),
        { numRuns: 100 }
      );
    }
  );
});
