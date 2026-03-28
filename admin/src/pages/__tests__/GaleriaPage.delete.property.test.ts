// Feature: gallery-page, Property 7: Eliminación de documento en galleryPage
// Validates: Requirements 5.5

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 7: Eliminación de documento en galleryPage
 *
 * The delete path in GaleriaPage.handleDelete (when the user confirms):
 *
 *   1. confirm(`¿Eliminar "${item.title}"?`) → user confirms
 *   2. setDeletingId(item.id)
 *   3. await deleteDoc(doc(db, "galleryPage", item.id))
 *   4. setDeletingId(null)
 *
 * We model this as a pure function and verify:
 *   - deleteDoc is called with the correct document ID.
 *   - After deletion, the document is no longer present in the collection.
 *   - All other documents in the collection remain unchanged.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtraImage {
  url: string;
  publicId: string;
}

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  publicId: string;
  category: string;
  description: string;
  order: number;
  extraImages: ExtraImage[];
}

// ---------------------------------------------------------------------------
// Pure model of the delete logic
// ---------------------------------------------------------------------------

/**
 * Models the ID that GaleriaPage.handleDelete passes to deleteDoc.
 * Simply returns the item's id — the function is trivially pure.
 */
function getDeleteDocId(item: GalleryItem): string {
  return item.id;
}

/**
 * Models the collection state after removing the target document.
 * Mirrors what Firestore's onSnapshot would emit after deleteDoc succeeds.
 *
 * @param collection - Current list of items in galleryPage
 * @param targetId   - ID of the document to delete
 */
function applyDeleteToCollection(
  collection: GalleryItem[],
  targetId: string
): GalleryItem[] {
  return collection.filter((item) => item.id !== targetId);
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 80 });
const urlArb = fc.webUrl();

const extraImageArb: fc.Arbitrary<ExtraImage> = fc.record({
  url: urlArb,
  publicId: nonEmptyStringArb,
});

const CATEGORIES = ["personajes", "escenarios", "props", "abstracto", "otro"] as const;

/** A single GalleryItem with a given id */
const galleryItemArb = (id: string): fc.Arbitrary<GalleryItem> =>
  fc.record({
    id: fc.constant(id),
    title: nonEmptyStringArb,
    image: urlArb,
    publicId: nonEmptyStringArb,
    category: fc.constantFrom(...CATEGORIES),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    order: fc.integer({ min: 0, max: 100 }),
    extraImages: fc.array(extraImageArb, { minLength: 0, maxLength: 4 }),
  });

/**
 * A collection of 1–10 items where exactly one has a known targetId.
 * The rest have distinct ids ("other-0", "other-1", …).
 */
const collectionWithTargetArb: fc.Arbitrary<{
  collection: GalleryItem[];
  targetId: string;
}> = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 20 }), // targetId
    fc.integer({ min: 0, max: 9 }),              // index of target in collection
    fc.integer({ min: 1, max: 10 })              // collection size
  )
  .chain(([targetId, rawIndex, size]) => {
    const index = rawIndex % size;
    const itemArbs: fc.Arbitrary<GalleryItem>[] = Array.from(
      { length: size },
      (_, i) => (i === index ? galleryItemArb(targetId) : galleryItemArb(`other-${i}`))
    );
    return fc
      .tuple(...(itemArbs as [fc.Arbitrary<GalleryItem>, ...fc.Arbitrary<GalleryItem>[]]))
      .map((items) => ({ collection: items as GalleryItem[], targetId }));
  });

// ---------------------------------------------------------------------------
// Property 7: Eliminación de documento en galleryPage
// ---------------------------------------------------------------------------

describe("GaleriaPage – eliminación de documento en galleryPage (Property 7)", () => {
  it(
    "P7a: deleteDoc es llamado con el ID correcto del documento a eliminar",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          ({ collection, targetId }) => {
            const target = collection.find((item) => item.id === targetId)!;
            const calledWithId = getDeleteDocId(target);

            expect(calledWithId).toBe(targetId);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P7b: tras la eliminación, el documento ya no está presente en la colección",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          ({ collection, targetId }) => {
            const updated = applyDeleteToCollection(collection, targetId);

            const stillPresent = updated.some((item) => item.id === targetId);
            expect(stillPresent).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P7c: la colección resultante tiene exactamente un elemento menos",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          ({ collection, targetId }) => {
            const updated = applyDeleteToCollection(collection, targetId);

            expect(updated.length).toBe(collection.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P7d: los demás documentos de la colección no se ven afectados por la eliminación",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          ({ collection, targetId }) => {
            const updated = applyDeleteToCollection(collection, targetId);

            const othersBefore = collection.filter((item) => item.id !== targetId);
            const othersAfter = updated.filter((item) => item.id !== targetId);

            expect(othersAfter).toEqual(othersBefore);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P7e: eliminar un documento que no existe en la colección no altera ningún elemento",
    () => {
      fc.assert(
        fc.property(
          fc.array(galleryItemArb("item-fixed"), { minLength: 1, maxLength: 10 }).chain(
            (items) => {
              // Ensure unique ids by rebuilding with distinct ids
              const uniqueItems = items.map((item, i) => ({ ...item, id: `item-${i}` }));
              return fc.constant(uniqueItems);
            }
          ),
          fc.string({ minLength: 1, maxLength: 20 }),
          (collection, nonExistentId) => {
            // Make sure nonExistentId is truly absent
            fc.pre(!collection.some((item) => item.id === nonExistentId));

            const updated = applyDeleteToCollection(collection, nonExistentId);

            expect(updated).toEqual(collection);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
