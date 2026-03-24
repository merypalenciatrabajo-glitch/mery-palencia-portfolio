# Requirements Document

## Introduction

This feature extends the Gallery section of the portfolio in two ways:

1. **Multi-image per item**: The admin can upload a Cover_Image (shown in the carousel) plus up to 4 extra photos per gallery item. When a visitor taps "Ver detalle", a detail view opens showing the cover image, the item's existing info (title, category, description), and the extra photos below.
2. **Carousel touch drag on mobile**: On touch devices, visitors can drag the carousel horizontally with their finger instead of tapping the arrow buttons. On desktop, the arrows continue to work as before. The auto-scroll behavior is preserved.

The Blog section is unaffected.

## Glossary

- **Gallery_Item**: A single entry in the Firestore "gallery" collection with title, category, description, order, a Cover_Image, and an optional array of Extra_Images.
- **Cover_Image**: The main image of a Gallery_Item. Shown as the thumbnail in the carousel and at the top of the detail view. Stored in the `image` / `publicId` fields.
- **Extra_Images**: Up to 4 additional images per Gallery_Item, stored in the `extraImages` field as an array of `{ url: string, publicId: string }`. Shown below the item info in the detail view.
- **Detail_View**: The modal/lightbox that opens when a visitor taps a gallery item. Shows the Cover_Image, title, category, description, and Extra_Images.
- **Admin_Panel**: The React/Capacitor admin application at `admin/src/`.
- **Public_Frontend**: The client-facing React application at `client/src/`.
- **Carousel**: The `InfiniteCarousel` component in `client/src/pages/Home.tsx` that auto-scrolls gallery thumbnails. On desktop, arrows navigate it. On mobile, finger drag navigates it.
- **Cloudinary**: The third-party image hosting service used for all uploads.
- **Firestore**: The Firebase NoSQL database storing gallery data.

---

## Requirements

### Requirement 1: Cover Image Upload (unchanged behavior)

**User Story:** As an admin, I want to upload a single cover photo for a gallery item, so that it appears as the thumbnail in the public carousel.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a dedicated "Foto de portada" upload field when creating or editing a Gallery_Item.
2. THE Admin_Panel SHALL display a preview of the selected Cover_Image before saving.
3. WHEN editing an existing Gallery_Item, THE Admin_Panel SHALL pre-populate the cover image preview with the current Cover_Image.
4. IF the admin does not change the cover image when editing, THE Admin_Panel SHALL preserve the existing Cover_Image.

---

### Requirement 2: Extra Images Upload in Admin Panel

**User Story:** As an admin, I want to upload up to 4 extra photos for a gallery item, so that visitors can see additional views when they open the detail view.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a separate "Fotos extras" upload field that accepts between 0 and 4 image files.
2. WHEN the admin selects extra image files, THE Admin_Panel SHALL display a preview thumbnail for each one.
3. WHEN the admin attempts to add more than 4 extra images, THE Admin_Panel SHALL prevent the addition and display an error indicating the 4-image limit.
4. THE Admin_Panel SHALL allow the admin to remove individual extra images before saving.
5. WHEN editing an existing Gallery_Item, THE Admin_Panel SHALL pre-populate the extra images list with the current Extra_Images.

---

### Requirement 3: Cloudinary Upload for Extra Images

**User Story:** As an admin, I want each extra image to be uploaded to Cloudinary individually, so that all images are stored reliably.

#### Acceptance Criteria

1. WHEN the admin submits a Gallery_Item form with extra images, THE Admin_Panel SHALL upload each extra image file to Cloudinary using `uploadToCloudinary`.
2. WHEN all uploads complete successfully, THE Admin_Panel SHALL collect the resulting `{ url, publicId }` pairs into the `extraImages` array.
3. IF any individual Cloudinary upload fails, THE Admin_Panel SHALL display an error message and SHALL NOT save the Gallery_Item to Firestore.
4. WHILE uploads are in progress, THE Admin_Panel SHALL display a progress indicator.

---

### Requirement 4: Firestore Schema — Extra Images Field

**User Story:** As a developer, I want the Firestore gallery document to store extra images separately from the cover image, so that the frontend can retrieve them independently.

#### Acceptance Criteria

1. WHEN a Gallery_Item is saved with extra images, THE Admin_Panel SHALL write an `extraImages` field as an array of `{ url: string, publicId: string }` to the Firestore document.
2. WHEN a Gallery_Item is saved with no extra images, THE Admin_Panel SHALL write `extraImages: []`.
3. THE `image` and `publicId` fields SHALL continue to store only the Cover_Image, unchanged.
4. WHEN an existing Gallery_Item is updated, THE Admin_Panel SHALL overwrite `extraImages` with the new array (or empty array if all extras were removed).

---

### Requirement 5: Gallery Data Fetching in Public Frontend

**User Story:** As a developer, I want the `useGallery` hook to return the extra images for each item, so that the Detail_View can display them.

#### Acceptance Criteria

1. THE `useGallery` hook SHALL include the `extraImages` field in the returned data type, defaulting to `[]` if the field is absent (legacy items).
2. THE `useGallery` hook SHALL continue to return the `image` field unchanged so the Carousel requires no modifications.

---

### Requirement 6: Detail View

**User Story:** As a visitor, I want to tap a gallery item and see its full detail — cover image, info, and extra photos — so that I can appreciate the full work.

#### Acceptance Criteria

1. WHEN a visitor taps a gallery item in the Carousel, THE Public_Frontend SHALL open the Detail_View for that item.
2. THE Detail_View SHALL display the Cover_Image at the top.
3. THE Detail_View SHALL display the item's title, category, and description below the Cover_Image.
4. WHEN the Gallery_Item has Extra_Images, THE Detail_View SHALL display them in a scrollable grid or row below the item info.
5. WHEN the Gallery_Item has no Extra_Images, THE Detail_View SHALL not render the extra images section.
6. THE Detail_View SHALL provide a close control to dismiss it.

---

### Requirement 7: Carousel Touch Drag on Mobile

**User Story:** As a visitor on a mobile device, I want to drag the gallery carousel with my finger, so that I can browse items without needing to tap the arrow buttons.

#### Acceptance Criteria

1. ON touch devices, WHEN a visitor drags horizontally on the Carousel, THE Carousel SHALL move in the direction of the drag in real time.
2. WHEN the visitor releases the drag, THE Carousel SHALL resume auto-scrolling from the new position.
3. WHILE the visitor is dragging, THE Carousel SHALL pause auto-scrolling.
4. THE touch drag SHALL not interfere with vertical page scrolling.
5. ON desktop, THE Carousel arrow buttons SHALL continue to work as before.
6. THE auto-scroll behavior SHALL remain active on both desktop and mobile when the user is not interacting.

---

### Requirement 8: Carousel Thumbnail Unchanged

**User Story:** As a visitor, I want the carousel to continue showing one thumbnail per gallery item.

#### Acceptance Criteria

1. THE Carousel SHALL use only the `image` (Cover_Image) field of each Gallery_Item as the thumbnail, regardless of how many extra images the item has.

---

### Requirement 9: Backward Compatibility with Legacy Gallery Items

**User Story:** As a visitor, I want gallery items created before this feature to continue working correctly.

#### Acceptance Criteria

1. WHEN the Public_Frontend loads a Gallery_Item with no `extraImages` field, THE Detail_View SHALL display only the Cover_Image and item info, with no extra images section.
2. WHEN the Admin_Panel loads a legacy Gallery_Item for editing, THE Admin_Panel SHALL show an empty extra images list.
