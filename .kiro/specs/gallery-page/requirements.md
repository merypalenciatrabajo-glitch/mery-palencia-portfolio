# Requirements Document

## Introduction

Se añade una página `/galeria` completa e independiente al portfolio de Mery Palencia. Esta página muestra todas las ilustraciones de una nueva colección Firestore `galleryPage`, con un grid responsive y el mismo Lightbox slider ya existente. Paralelamente, la sección admin "Galería" actual se renombra a "Destacadas" (sigue gestionando la colección `gallery` usada por el carrusel del Home), y se añade una nueva sección admin "Galería" para gestionar `galleryPage`. El Home recibe un botón "Ver Galería" junto al botón "Blog" existente.

## Glossary

- **GalleryPage**: Colección Firestore `galleryPage` que almacena las ilustraciones de la página /galeria.
- **Destacadas**: Colección Firestore `gallery` existente, usada exclusivamente por el carrusel del Home.
- **GalleryItem**: Documento de Firestore con campos `{ id, title, image, publicId, category, description, order, extraImages?: [] }`.
- **Lightbox**: Componente slider ya implementado en `client/src/components/Lightbox.tsx` que muestra una imagen principal y extraImages con navegación.
- **Admin**: Aplicación de administración en `admin/src/`.
- **Client**: Aplicación pública del portfolio en `client/src/`.
- **Grid**: Cuadrícula responsive de 2-3 columnas que muestra las ilustraciones de GalleryPage.

---

## Requirements

### Requirement 1: Hook de Firestore para GalleryPage

**User Story:** As a developer, I want a Firestore hook for the `galleryPage` collection, so that both the client gallery page and admin section can read data consistently.

#### Acceptance Criteria

1. THE `useGallery` hook pattern SHALL be replicated as `useGalleryPage` in `client/src/hooks/useFirestore.ts`, reading from the `galleryPage` collection ordered by `order` ascending.
2. WHEN a `galleryPage` document lacks the `extraImages` field, THE `useGalleryPage` hook SHALL normalize it to an empty array.
3. THE `GalleryItem` type used by `useGalleryPage` SHALL include fields: `id`, `title`, `image`, `publicId`, `category`, `description`, `order`, and optional `extraImages: { url: string; publicId: string }[]`.

---

### Requirement 2: Página /galeria en el Client

**User Story:** As a visitor, I want to browse all illustrations on a dedicated /galeria page, so that I can explore the full portfolio without leaving the home page.

#### Acceptance Criteria

1. THE Client SHALL expose a route `/galeria` that renders the `GalleryPage` component.
2. WHEN the `galleryPage` collection has items, THE `GalleryPage` component SHALL display them in a uniform grid of 2 columns on mobile and 3 columns on desktop.
3. WHEN a visitor clicks an illustration in the grid, THE `GalleryPage` component SHALL open the existing `Lightbox` component with the selected item's `image`, `title`, `category`, `description`, and `extraImages`.
4. THE `GalleryPage` component SHALL use the same visual style as the rest of the site: font `Playfair Display` for headings, `accent` color tokens, and Tailwind utility classes consistent with `Home.tsx`.
5. WHEN the `galleryPage` collection is empty, THE `GalleryPage` component SHALL display a placeholder message indicating no illustrations are available yet.
6. THE `GalleryPage` component SHALL include a header consistent with the one in `Home.tsx` (logo, Blog link, Galería link active, ThemeToggle).

---

### Requirement 3: Botón "Ver Galería" en el Home

**User Story:** As a visitor, I want a "Ver Galería" button in the Home header and hero, so that I can navigate directly to the full gallery page.

#### Acceptance Criteria

1. THE `Home` component header SHALL include a "Ver Galería" navigation link styled identically to the existing "Blog" link, placed adjacent to it.
2. THE `Home` component hero buttons section SHALL include a "Ver Galería" `Button` styled identically to the existing "Leer Blog" button, navigating to `/galeria`.

---

### Requirement 4: Renombrar sección admin "Galería" a "Destacadas"

**User Story:** As an admin, I want the existing gallery admin section to be clearly labeled "Destacadas", so that I understand it manages only the home carousel images.

#### Acceptance Criteria

1. THE `Sidebar` component SHALL display the nav item for `/gallery` with the label "Destacadas" instead of "Galería".
2. THE `Gallery` admin page heading SHALL read "Destacadas" and its subtitle SHALL clarify it manages the home carousel.
3. THE `Gallery` admin page SHALL continue reading from and writing to the `gallery` Firestore collection without any change to data logic.

---

### Requirement 5: Nueva sección admin "Galería" para GalleryPage

**User Story:** As an admin, I want a dedicated admin section to manage the `galleryPage` collection, so that I can add, edit, and delete illustrations shown on /galeria.

#### Acceptance Criteria

1. THE Admin SHALL expose a route `/galeria` that renders a new `GaleriaPage` admin component.
2. THE `Sidebar` component SHALL include a new nav item "Galería" linking to `/galeria`, placed after the "Destacadas" item.
3. THE `GaleriaPage` admin component SHALL support creating a new `galleryPage` document with fields: `title`, `image`, `publicId`, `category`, `description`, `order`, and optional `extraImages` (max 4).
4. THE `GaleriaPage` admin component SHALL support editing an existing `galleryPage` document, including replacing the cover image and modifying `extraImages`.
5. THE `GaleriaPage` admin component SHALL support deleting a `galleryPage` document after confirmation.
6. WHEN saving a new item, THE `GaleriaPage` admin component SHALL upload images via the existing `uploadToCloudinary` utility and store the resulting `url` and `publicId`.
7. IF the admin attempts to add more than 4 extra images to a single item, THEN THE `GaleriaPage` admin component SHALL display an error message and reject the additional files.
8. THE `GaleriaPage` admin component SHALL reuse the same form UI pattern as the existing `Gallery` admin component (`admin/src/pages/Gallery.tsx`).

---

### Requirement 6: Routing del Client actualizado

**User Story:** As a developer, I want the client router to include the /galeria route, so that the page is accessible via direct URL and navigation links.

#### Acceptance Criteria

1. THE `Router` in `client/src/App.tsx` SHALL include a `<Route path="/galeria">` entry that renders the `GalleryPage` component.
2. WHEN a visitor navigates to `/galeria`, THE Client SHALL render the `GalleryPage` component without a full page reload (client-side routing via wouter).

---

### Requirement 7: Routing del Admin actualizado

**User Story:** As a developer, I want the admin router to include the /galeria route, so that the new admin section is accessible.

#### Acceptance Criteria

1. THE `AppRoutes` in `admin/src/App.tsx` SHALL include a `<Route path="/galeria">` entry that renders the `GaleriaPage` admin component inside `ProtectedRoute`.
2. WHEN an unauthenticated user navigates to `/galeria` in the admin, THE Admin SHALL redirect to `/login`.
