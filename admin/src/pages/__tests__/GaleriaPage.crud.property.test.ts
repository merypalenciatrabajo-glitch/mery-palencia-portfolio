// Feature: gallery-page, Property 5: Creación de documento en galleryPage
// Validates: Requirements 5.3, 5.6

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 5: Creación de documento en galleryPage
 *
 * The create path in GaleriaPage.handleSubmit (when !editing && file is present):
 *
 *   1. For each extraFile, upload to Cloudinary → { url, publicId }
 *   2. finalExtras = [...existingExtras, ...uploadedExtras]
 *   3. Upload cover file → { url: coverUrl, publicId: coverPublicId }
 *   4. addDoc(collection(db, "galleryPage"), {
 *        ...form,           // title, category, description
 *        image: coverUrl,
 *        publicId: coverPublicId,
 *        order: items.length,
 *        extraImages: finalExtras,
 *      })
 *
 * We model this as a pure function and verify that for any valid form
 * (non-empty title, cover image present), the document passed to addDoc
 * contains exactly the expected fields with the correct values.
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

interface GalleryPageDoc {
  title: string;
  category: string;
  description: string;
  image: string;
  publicId: string;
  order: number;
  extraImages: ExtraImage[];
}

// ---------------------------------------------------------------------------
// Pure model of the create-document logic
// ---------------------------------------------------------------------------

/**
 * Models the document that GaleriaPage.handleSubmit builds and passes to
 * addDoc when creating a new item (editing === null).
 *
 * @param form          - Current form state (title, category, description)
 * @param coverUpload   - Result of uploading the cover file to Cloudinary
 * @param existingExtras - Already-saved extra images (empty on create)
 * @param uploadedExtras - Results of uploading new extra files to Cloudinary
 * @param itemsLength   - Current number of items (used as `order`)
 */
function buildCreateDoc(
  form: FormState,
  coverUpload: CloudinaryResult,
  existingExtras: ExtraImage[],
  uploadedExtras: CloudinaryResult[],
  itemsLength: number
): GalleryPageDoc {
  const finalExtras: ExtraImage[] = [...existingExtras, ...uploadedExtras];

  return {
    // spread form
    title: form.title,
    category: form.category,
    description: form.description,
    // cover image
    image: coverUpload.url,
    publicId: coverUpload.publicId,
    // order
    order: itemsLength,
    // extra images
    extraImages: finalExtras,
  };
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

const CATEGORIES = ["fotografia-paisaje", "fotografia-infantil", "fotografia-moda", "fotografia-documental", "ilustracion-digital", "material-digital", "trabajos-analogos", "otros"] as const;

const formArb: fc.Arbitrary<FormState> = fc.record({
  title: nonEmptyStringArb, // valid: non-empty title
  category: fc.constantFrom(...CATEGORIES),
  description: fc.string({ minLength: 0, maxLength: 200 }),
});

/** On create, existingExtras is always [] (openCreate resets it) */
const existingExtrasArb: fc.Arbitrary<ExtraImage[]> = fc.constant([]);

/** 0–4 uploaded extra images (constraint: total ≤ 4) */
const uploadedExtrasArb: fc.Arbitrary<CloudinaryResult[]> = fc.array(cloudinaryResultArb, {
  minLength: 0,
  maxLength: 4,
});

const itemsLengthArb = fc.integer({ min: 0, max: 100 });

// ---------------------------------------------------------------------------
// Property 5: Creación de documento en galleryPage
// ---------------------------------------------------------------------------

describe("GaleriaPage – creación de documento en galleryPage (Property 5)", () => {
  it(
    "P5: para cualquier formulario válido, el documento creado contiene title, image, publicId, category, description, order y extraImages correctos",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          existingExtrasArb,
          uploadedExtrasArb,
          itemsLengthArb,
          (form, coverUpload, existingExtras, uploadedExtras, itemsLength) => {
            const doc = buildCreateDoc(
              form,
              coverUpload,
              existingExtras,
              uploadedExtras,
              itemsLength
            );

            // All required fields must be present
            expect(doc).toHaveProperty("title");
            expect(doc).toHaveProperty("image");
            expect(doc).toHaveProperty("publicId");
            expect(doc).toHaveProperty("category");
            expect(doc).toHaveProperty("description");
            expect(doc).toHaveProperty("order");
            expect(doc).toHaveProperty("extraImages");
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P5b: title, category y description en el documento coinciden exactamente con el formulario",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          existingExtrasArb,
          uploadedExtrasArb,
          itemsLengthArb,
          (form, coverUpload, existingExtras, uploadedExtras, itemsLength) => {
            const doc = buildCreateDoc(
              form,
              coverUpload,
              existingExtras,
              uploadedExtras,
              itemsLength
            );

            expect(doc.title).toBe(form.title);
            expect(doc.category).toBe(form.category);
            expect(doc.description).toBe(form.description);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P5c: image y publicId en el documento coinciden con el resultado del upload de Cloudinary",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          existingExtrasArb,
          uploadedExtrasArb,
          itemsLengthArb,
          (form, coverUpload, existingExtras, uploadedExtras, itemsLength) => {
            const doc = buildCreateDoc(
              form,
              coverUpload,
              existingExtras,
              uploadedExtras,
              itemsLength
            );

            expect(doc.image).toBe(coverUpload.url);
            expect(doc.publicId).toBe(coverUpload.publicId);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P5d: order en el documento es igual a items.length en el momento de guardar",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          existingExtrasArb,
          uploadedExtrasArb,
          itemsLengthArb,
          (form, coverUpload, existingExtras, uploadedExtras, itemsLength) => {
            const doc = buildCreateDoc(
              form,
              coverUpload,
              existingExtras,
              uploadedExtras,
              itemsLength
            );

            expect(doc.order).toBe(itemsLength);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P5e: extraImages en el documento es la concatenación de existingExtras y los extras subidos a Cloudinary",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          existingExtrasArb,
          uploadedExtrasArb,
          itemsLengthArb,
          (form, coverUpload, existingExtras, uploadedExtras, itemsLength) => {
            const doc = buildCreateDoc(
              form,
              coverUpload,
              existingExtras,
              uploadedExtras,
              itemsLength
            );

            const expectedExtras: ExtraImage[] = [
              ...existingExtras,
              ...uploadedExtras.map((u) => ({ url: u.url, publicId: u.publicId })),
            ];

            // Use toEqual (not toStrictEqual) to avoid prototype differences
            // introduced by fast-check's null-prototype objects
            expect(doc.extraImages).toEqual(expectedExtras);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P5f: cuando no hay extras, extraImages es un array vacío",
    () => {
      fc.assert(
        fc.property(
          formArb,
          cloudinaryResultArb,
          itemsLengthArb,
          (form, coverUpload, itemsLength) => {
            const doc = buildCreateDoc(form, coverUpload, [], [], itemsLength);

            expect(doc.extraImages).toStrictEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
