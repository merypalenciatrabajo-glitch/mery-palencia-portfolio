// Feature: gallery-page, Property 6: Edición de documento en galleryPage
// Validates: Requirements 5.4

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 6: Edición de documento en galleryPage
 *
 * The edit path in GaleriaPage.handleSubmit (when editing !== null):
 *
 *   1. For each extraFile, upload to Cloudinary → { url, publicId }
 *   2. finalExtras = [...existingExtras, ...uploadedExtras]
 *   3. If a new cover file was selected:
 *        upload → { url: newCoverUrl, publicId: newCoverPublicId }
 *        imageData = { image: newCoverUrl, publicId: newCoverPublicId }
 *      Else:
 *        imageData = {}  (keep existing image)
 *   4. updateDoc(doc(db, "galleryPage", editing.id), {
 *        ...form,        // title, category, description
 *        ...imageData,   // optional new image
 *        extraImages: finalExtras,
 *      })
 *
 * We model this as a pure function and verify:
 *   - The updated document reflects the new form values.
 *   - When a new cover is provided, image/publicId are updated.
 *   - When no new cover is provided, image/publicId are NOT included in the patch.
 *   - extraImages is the merge of existingExtras + uploadedExtras.
 *   - Other documents in the collection are not affected (isolation property).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtraImage {
  url: string;
  publicId: string;
}

interface FormState {
  title: string;
  category: string;
  description: string;
}

interface CloudinaryResult {
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

/** The partial payload passed to updateDoc */
interface UpdatePayload {
  title: string;
  category: string;
  description: string;
  image?: string;
  publicId?: string;
  extraImages: ExtraImage[];
}

// ---------------------------------------------------------------------------
// Pure model of the edit-document logic
// ---------------------------------------------------------------------------

/**
 * Models the payload that GaleriaPage.handleSubmit builds and passes to
 * updateDoc when editing an existing item.
 *
 * @param form           - Current form state (title, category, description)
 * @param newCoverUpload - Result of uploading a new cover, or null if unchanged
 * @param existingExtras - Already-saved extra images kept by the user
 * @param uploadedExtras - Results of uploading new extra files to Cloudinary
 */
function buildUpdatePayload(
  form: FormState,
  newCoverUpload: CloudinaryResult | null,
  existingExtras: ExtraImage[],
  uploadedExtras: CloudinaryResult[]
): UpdatePayload {
  const finalExtras: ExtraImage[] = [...existingExtras, ...uploadedExtras];

  const imageData: { image?: string; publicId?: string } =
    newCoverUpload !== null
      ? { image: newCoverUpload.url, publicId: newCoverUpload.publicId }
      : {};

  return {
    title: form.title,
    category: form.category,
    description: form.description,
    ...imageData,
    extraImages: finalExtras,
  };
}

/**
 * Models the full collection state after applying an update to one document.
 * All other documents remain unchanged.
 *
 * @param collection  - Current list of items in galleryPage
 * @param targetId    - ID of the document being edited
 * @param payload     - The update payload (fields to merge)
 */
function applyUpdateToCollection(
  collection: GalleryItem[],
  targetId: string,
  payload: UpdatePayload
): GalleryItem[] {
  return collection.map((item) => {
    if (item.id !== targetId) return item; // other docs untouched
    return {
      ...item,
      title: payload.title,
      category: payload.category,
      description: payload.description,
      image: payload.image ?? item.image,
      publicId: payload.publicId ?? item.publicId,
      extraImages: payload.extraImages,
    };
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 80 });
const urlArb = fc.webUrl();

const cloudinaryResultArb: fc.Arbitrary<CloudinaryResult> = fc.record({
  url: urlArb,
  publicId: nonEmptyStringArb,
});

const extraImageArb: fc.Arbitrary<ExtraImage> = fc.record({
  url: urlArb,
  publicId: nonEmptyStringArb,
});

const CATEGORIES = ["personajes", "escenarios", "props", "abstracto", "otro"] as const;

const formArb: fc.Arbitrary<FormState> = fc.record({
  title: nonEmptyStringArb,
  category: fc.constantFrom(...CATEGORIES),
  description: fc.string({ minLength: 0, maxLength: 200 }),
});

/** Existing extras kept after the user removes some (0–4) */
const existingExtrasArb = (max: number): fc.Arbitrary<ExtraImage[]> =>
  fc.array(extraImageArb, { minLength: 0, maxLength: max });

/** New extras uploaded (total existingExtras + uploadedExtras ≤ 4) */
const uploadedExtrasArb = (max: number): fc.Arbitrary<CloudinaryResult[]> =>
  fc.array(cloudinaryResultArb, { minLength: 0, maxLength: max });

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

/** A collection of 1–10 items where one has a known id */
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
    const itemArbs: fc.Arbitrary<GalleryItem>[] = Array.from({ length: size }, (_, i) =>
      i === index ? galleryItemArb(targetId) : galleryItemArb(`other-${i}`)
    );
    return fc.tuple(...(itemArbs as [fc.Arbitrary<GalleryItem>, ...fc.Arbitrary<GalleryItem>[]])).map(
      (items) => ({ collection: items as GalleryItem[], targetId })
    );
  });

// ---------------------------------------------------------------------------
// Property 6: Edición de documento en galleryPage
// ---------------------------------------------------------------------------

describe("GaleriaPage – edición de documento en galleryPage (Property 6)", () => {
  it(
    "P6a: el payload de updateDoc contiene title, category, description y extraImages",
    () => {
      fc.assert(
        fc.property(
          formArb,
          fc.option(cloudinaryResultArb, { nil: null }),
          existingExtrasArb(4),
          (form, newCoverUpload, existingExtras) => {
            const maxNew = 4 - existingExtras.length;
            const uploadedExtras: CloudinaryResult[] = [];
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);

            expect(payload).toHaveProperty("title");
            expect(payload).toHaveProperty("category");
            expect(payload).toHaveProperty("description");
            expect(payload).toHaveProperty("extraImages");
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6b: title, category y description en el payload coinciden exactamente con el formulario",
    () => {
      fc.assert(
        fc.property(
          formArb,
          fc.option(cloudinaryResultArb, { nil: null }),
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          (form, newCoverUpload, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);

            expect(payload.title).toBe(form.title);
            expect(payload.category).toBe(form.category);
            expect(payload.description).toBe(form.description);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6c: cuando se sube una nueva portada, image y publicId en el payload reflejan el nuevo upload",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb, // always a new cover
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          (form, newCoverUpload, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);

            expect(payload.image).toBe(newCoverUpload.url);
            expect(payload.publicId).toBe(newCoverUpload.publicId);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6d: cuando NO se sube nueva portada, image y publicId NO están en el payload (imagen existente se conserva)",
    () => {
      fc.assert(
        fc.property(
          formArb,
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          (form, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, null, existingExtras, uploadedExtras);

            expect(payload.image).toBeUndefined();
            expect(payload.publicId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6e: extraImages en el payload es la concatenación de existingExtras y los extras subidos",
    () => {
      fc.assert(
        fc.property(
          formArb,
          fc.option(cloudinaryResultArb, { nil: null }),
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          (form, newCoverUpload, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);

            const expectedExtras: ExtraImage[] = [
              ...existingExtras,
              ...uploadedExtras.map((u) => ({ url: u.url, publicId: u.publicId })),
            ];

            expect(payload.extraImages).toEqual(expectedExtras);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6f: al aplicar el update, el documento editado refleja los nuevos valores",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          formArb,
          fc.option(cloudinaryResultArb, { nil: null }),
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          ({ collection, targetId }, form, newCoverUpload, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);
            const updated = applyUpdateToCollection(collection, targetId, payload);

            const editedDoc = updated.find((item) => item.id === targetId)!;

            expect(editedDoc.title).toBe(form.title);
            expect(editedDoc.category).toBe(form.category);
            expect(editedDoc.description).toBe(form.description);
            expect(editedDoc.extraImages).toEqual(payload.extraImages);

            if (newCoverUpload !== null) {
              expect(editedDoc.image).toBe(newCoverUpload.url);
              expect(editedDoc.publicId).toBe(newCoverUpload.publicId);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P6g: los demás documentos de la colección no se ven afectados por la edición",
    () => {
      fc.assert(
        fc.property(
          collectionWithTargetArb,
          formArb,
          fc.option(cloudinaryResultArb, { nil: null }),
          existingExtrasArb(4),
          uploadedExtrasArb(4),
          ({ collection, targetId }, form, newCoverUpload, existingExtras, uploadedExtras) => {
            const payload = buildUpdatePayload(form, newCoverUpload, existingExtras, uploadedExtras);
            const updated = applyUpdateToCollection(collection, targetId, payload);

            // Every document that is NOT the target must remain identical
            const othersBefore = collection.filter((item) => item.id !== targetId);
            const othersAfter = updated.filter((item) => item.id !== targetId);

            expect(othersAfter).toEqual(othersBefore);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
