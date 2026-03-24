# Implementation Plan: Gallery Multi-Image

## Overview

Extend the gallery feature with per-item extra images (admin upload + client display) and add touch-drag support to the carousel. All code is TypeScript/React.

## Tasks

- [x] 1. Extend `useGallery` hook with `extraImages` field
  - In `client/src/hooks/useFirestore.ts`, add `extraImages: { url: string; publicId: string }[]` to the `useGallery` return type, defaulting to `[]` for legacy items without the field
  - _Requirements: 5.1, 5.2, 9.1_

- [x] 2. Update Admin Panel — cover image label and extra images upload
  - [x] 2.1 Rename the existing image upload label to "Foto de portada" in `admin/src/pages/Gallery.tsx`
    - Update the `<label>` text from "Imagen" to "Foto de portada"
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Add `extraImages` state and file list to the Gallery form
    - Add state: `extraFiles: File[]`, `extraPreviews: string[]`, `existingExtras: { url: string; publicId: string }[]`
    - On `openEdit`, pre-populate `existingExtras` from `item.extraImages ?? []`
    - On `openCreate` / `closeForm`, reset all extra state to empty
    - _Requirements: 2.1, 2.5, 9.2_

  - [x] 2.3 Render the "Fotos extras" upload section in the form
    - Add a file input (multiple, accept="image/*") below the cover image field
    - Show a thumbnail grid of selected extra files (previews) and existing extras
    - Show a remove button on each thumbnail
    - Enforce max 4 total extras; show an inline error if the limit is exceeded
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.4 Upload extra images to Cloudinary on form submit and save to Firestore
    - In `handleSubmit`, after uploading the cover image (if changed), iterate `extraFiles` and call `uploadToCloudinary` for each
    - Merge results with `existingExtras` (kept items) into the final `extraImages` array
    - On any upload failure, show an error and abort the Firestore write
    - Write `extraImages` (array of `{ url, publicId }`, or `[]`) to the Firestore document alongside existing fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Checkpoint — verify admin panel compiles and uploads work end-to-end
  - Ensure all TypeScript diagnostics pass, ask the user if questions arise.

- [x] 4. Extend `Lightbox` to display extra images
  - [x] 4.1 Add `extraImages` prop to `LightboxProps` in `client/src/components/Lightbox.tsx`
    - Type: `extraImages?: { url: string; publicId: string }[]`
    - _Requirements: 6.4, 6.5_

  - [x] 4.2 Render the extra images grid inside the Lightbox
    - Below the info panel, when `extraImages` is non-empty, render a scrollable grid of thumbnails
    - Each thumbnail is a full-bleed `<img>` with `object-cover`; clicking one opens it full-size (or simply enlarges inline)
    - When `extraImages` is empty or absent, render nothing
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 9.1_

- [x] 5. Wire `extraImages` from `useGallery` through `Home.tsx` into `Lightbox`
  - [x] 5.1 Update `GalleryItem` type in `Home.tsx` to include `extraImages?: { url: string; publicId: string }[]`
    - _Requirements: 5.1, 8.1_

  - [x] 5.2 Pass `extraImages` through `openLightbox` → `selectedImage` state → `<Lightbox>` prop
    - Update `selectedImage` state type and `openLightbox` to carry `extraImages`
    - Pass `extraImages={selectedImage.extraImages}` to `<Lightbox>`
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 6. Add touch-drag support to `InfiniteCarousel` in `Home.tsx`
  - [x] 6.1 Add `touchstart` / `touchmove` / `touchend` handlers to the carousel track `<div>`
    - On `touchstart`: record `touchStartX`, pause auto-scroll
    - On `touchmove`: compute delta from `touchStartX`, apply `translateX` offset in real time; call `e.preventDefault()` only on horizontal swipes (check `|deltaX| > |deltaY|`) to preserve vertical scroll
    - On `touchend`: snap `offsetRef` to the new position, resume auto-scroll
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 7. Final checkpoint — ensure all TypeScript diagnostics pass
  - Run diagnostics on all modified files; ensure all tests pass, ask the user if questions arise.
