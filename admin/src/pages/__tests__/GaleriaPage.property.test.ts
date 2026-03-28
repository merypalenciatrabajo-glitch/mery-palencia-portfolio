// Feature: gallery-page, Property 4: Validación máximo 4 imágenes extra
// Validates: Requirements 5.7

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 4: Validación máximo 4 imágenes extra
 *
 * The validation logic in GaleriaPage.handleExtraFilesChange is:
 *
 *   const total = existingExtras.length + extraFiles.length + selected.length;
 *   if (total > 4) {
 *     setExtrasError(`Máximo 4 fotos extras. Ya tienes ${existingExtras.length + extraFiles.length}.`);
 *     return; // reject — state unchanged
 *   }
 *
 * We model this as a pure function and verify the property holds for all
 * combinations where existingExtras + extraFiles === 4 and selected >= 1.
 */

interface ExtraImage {
  url: string;
  publicId: string;
}

interface AddExtrasResult {
  accepted: boolean;
  error: string;
  newExtraFiles: File[];
}

/**
 * Pure model of GaleriaPage.handleExtraFilesChange logic.
 * Returns whether the files were accepted and the resulting error message.
 */
function tryAddExtraFiles(
  existingExtras: ExtraImage[],
  currentExtraFiles: File[],
  selected: File[]
): AddExtrasResult {
  if (!selected.length) {
    return { accepted: false, error: "", newExtraFiles: currentExtraFiles };
  }

  const total = existingExtras.length + currentExtraFiles.length + selected.length;

  if (total > 4) {
    const alreadyHave = existingExtras.length + currentExtraFiles.length;
    return {
      accepted: false,
      error: `Máximo 4 fotos extras. Ya tienes ${alreadyHave}.`,
      newExtraFiles: currentExtraFiles, // state unchanged
    };
  }

  return {
    accepted: true,
    error: "",
    newExtraFiles: [...currentExtraFiles, ...selected],
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const extraImageArb = fc.record({
  url: fc.webUrl(),
  publicId: fc.string({ minLength: 1, maxLength: 30 }),
});

/** A fake File object — only the identity matters for state comparison */
function makeFile(name: string): File {
  return new File([""], name, { type: "image/png" });
}

const fakeFileArb = fc.string({ minLength: 1, maxLength: 20 }).map(makeFile);

/**
 * Generates a state where existingExtras + extraFiles === exactly 4.
 * existingCount ∈ [0, 4], extraFilesCount = 4 - existingCount
 */
const fullExtrasStateArb = fc
  .integer({ min: 0, max: 4 })
  .chain((existingCount) => {
    const extraFilesCount = 4 - existingCount;
    return fc.tuple(
      fc.array(extraImageArb, { minLength: existingCount, maxLength: existingCount }),
      fc.array(fakeFileArb, { minLength: extraFilesCount, maxLength: extraFilesCount })
    );
  });

/** At least 1 new file to add */
const selectedFilesArb = fc.array(fakeFileArb, { minLength: 1, maxLength: 5 });

// ---------------------------------------------------------------------------
// Property 4: Validación máximo 4 imágenes extra
// ---------------------------------------------------------------------------

describe("GaleriaPage – validación máximo 4 imágenes extra (Property 4)", () => {
  it(
    "P4: cuando ya hay 4 extras (existingExtras + extraFiles === 4), agregar ≥1 archivo más es rechazado con mensaje de error",
    () => {
      fc.assert(
        fc.property(fullExtrasStateArb, selectedFilesArb, ([existingExtras, currentExtraFiles], selected) => {
          const result = tryAddExtraFiles(existingExtras, currentExtraFiles, selected);

          // Must be rejected
          expect(result.accepted).toBe(false);

          // Must show an error message
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error).toContain("Máximo 4 fotos extras");

          // State must not change — no new files added
          expect(result.newExtraFiles).toStrictEqual(currentExtraFiles);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P4b: el mensaje de error indica cuántas extras ya tiene el usuario",
    () => {
      fc.assert(
        fc.property(fullExtrasStateArb, selectedFilesArb, ([existingExtras, currentExtraFiles], selected) => {
          const result = tryAddExtraFiles(existingExtras, currentExtraFiles, selected);
          const alreadyHave = existingExtras.length + currentExtraFiles.length;

          expect(result.error).toContain(`Ya tienes ${alreadyHave}`);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P4c: cuando hay menos de 4 extras y se agrega exactamente el número que completa hasta 4, se acepta",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }).chain((existingCount) => {
            const extraFilesCount = fc.integer({ min: 0, max: 3 - existingCount });
            return extraFilesCount.chain((efCount) => {
              const remaining = 4 - existingCount - efCount;
              return fc.tuple(
                fc.array(extraImageArb, { minLength: existingCount, maxLength: existingCount }),
                fc.array(fakeFileArb, { minLength: efCount, maxLength: efCount }),
                fc.array(fakeFileArb, { minLength: remaining, maxLength: remaining })
              );
            });
          }),
          ([existingExtras, currentExtraFiles, selected]) => {
            // Only test when selected.length > 0 (remaining > 0)
            if (selected.length === 0) return;

            const result = tryAddExtraFiles(existingExtras, currentExtraFiles, selected);

            expect(result.accepted).toBe(true);
            expect(result.error).toBe("");
            expect(result.newExtraFiles.length).toBe(currentExtraFiles.length + selected.length);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
