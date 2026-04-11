# Implementation Plan: gallery-page

## Overview

Implementación incremental de la página pública `/galeria`, la sección admin correspondiente, y los ajustes en Home y Sidebar. Se reutiliza al máximo el código existente (hook `useGallery`, componente `Gallery.tsx`, `Lightbox.tsx`).

## Tasks

- [x] 1. Añadir hook `useGalleryPage` en useFirestore.ts
  - Replicar el patrón de `useGallery` apuntando a la colección `galleryPage` ordenada por `order` ascendente
  - Normalizar `extraImages` a `[]` cuando el campo no existe en el documento
  - _Requirements: 1.1, 1.2, 1.3_

  - [x]* 1.1 Escribir property test para normalización de extraImages
    - **Property 1: Normalización de extraImages**
    - **Validates: Requirements 1.2**

- [x] 2. Crear componente `GalleryPage` en el client
  - Crear `client/src/pages/GalleryPage.tsx`
  - Consumir `useGalleryPage` y renderizar grid 2 cols (mobile) / 3 cols (desktop) con Tailwind
  - Incluir header idéntico al de `Home.tsx` (logo, link Blog, link Galería activo, ThemeToggle)
  - Al click en tarjeta, abrir `Lightbox` con `image`, `title`, `category`, `description` y `extraImages` del item
  - Mostrar placeholder cuando la colección está vacía
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x]* 2.1 Escribir property test: grid muestra todos los items
    - **Property 2: Grid muestra todos los items**
    - **Validates: Requirements 2.2**

  - [x]* 2.2 Escribir property test: click en tarjeta abre Lightbox con datos correctos
    - **Property 3: Click en tarjeta abre Lightbox con datos correctos**
    - **Validates: Requirements 2.3**

  - [x]* 2.3 Escribir unit tests para GalleryPage
    - Verificar que el header contiene logo, link Blog, link Galería y ThemeToggle
    - Verificar que con lista vacía se muestra el placeholder
    - _Requirements: 2.5, 2.6_

- [x] 3. Registrar ruta `/galeria` en el client router
  - En `client/src/App.tsx`, añadir `<Route path="/galeria" component={GalleryPage} />`
  - _Requirements: 6.1, 6.2_

  - [x]* 3.1 Escribir unit test para la ruta /galeria del client
    - Verificar que navegar a `/galeria` renderiza `GalleryPage`
    - _Requirements: 6.1_

- [x] 4. Añadir botón "Ver Galería" en Home
  - En `client/src/pages/Home.tsx`, añadir link "Ver Galería" → `/galeria` en el header junto al link "Blog"
  - En la sección de botones del hero, añadir `<Button>` "Ver Galería" con `window.location.href = '/galeria'`, con el mismo estilo que "Leer Blog"
  - _Requirements: 3.1, 3.2_

  - [x]* 4.1 Escribir unit tests para los cambios en Home
    - Verificar que el header contiene link "Ver Galería" → `/galeria`
    - Verificar que el hero contiene botón "Ver Galería" → `/galeria`
    - _Requirements: 3.1, 3.2_

- [x] 5. Renombrar sección admin "Galería" a "Destacadas"
  - En `admin/src/components/Sidebar.tsx`, cambiar el label del item `/gallery` de "Galería" a "Destacadas"
  - En `admin/src/pages/Gallery.tsx`, cambiar el heading a "Destacadas" y el subtítulo a "Imágenes del carrusel del Home"
  - No modificar ninguna lógica de datos ni la colección Firestore `gallery`
  - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 5.1 Escribir unit tests para el renombrado
    - Verificar que el Sidebar muestra "Destacadas" para `/gallery`
    - Verificar que el heading de `Gallery.tsx` admin dice "Destacadas"
    - _Requirements: 4.1, 4.2_

- [x] 6. Crear componente admin `GaleriaPage`
  - Crear `admin/src/pages/GaleriaPage.tsx` como copia de `Gallery.tsx` apuntando a la colección `galleryPage`
  - Cambiar heading a "Galería" y subtítulo a "Ilustraciones de la página /galeria"
  - Mantener toda la lógica de CRUD, upload a Cloudinary y gestión de extraImages (máx 4)
  - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x]* 6.1 Escribir property test: validación máximo 4 imágenes extra
    - **Property 4: Validación máximo 4 imágenes extra**
    - **Validates: Requirements 5.7**

  - [x]* 6.2 Escribir property test: creación de documento en galleryPage
    - **Property 5: Creación de documento en galleryPage**
    - **Validates: Requirements 5.3, 5.6**

  - [x]* 6.3 Escribir property test: edición de documento en galleryPage
    - **Property 6: Edición de documento en galleryPage**
    - **Validates: Requirements 5.4**

  - [x]* 6.4 Escribir property test: eliminación de documento en galleryPage
    - **Property 7: Eliminación de documento en galleryPage**
    - **Validates: Requirements 5.5**

- [x] 7. Actualizar Sidebar y router del admin
  - En `admin/src/components/Sidebar.tsx`, añadir item `{ to: "/galeria", icon: GalleryHorizontal, label: "Galería" }` después de "Destacadas"; importar `GalleryHorizontal` de lucide-react
  - En `admin/src/App.tsx`, importar `GaleriaPage` y añadir `<Route path="/galeria">` con `ProtectedRoute`
  - _Requirements: 5.2, 7.1, 7.2_

  - [x]* 7.1 Escribir unit test para el Sidebar actualizado
    - Verificar que el Sidebar muestra "Galería" para `/galeria`
    - _Requirements: 5.2_

  - [x]* 7.2 Escribir property test: auth guard en admin /galeria
    - **Property 8: Auth guard en admin /galeria**
    - **Validates: Requirements 7.2**

  - [x]* 7.3 Escribir unit test para la ruta /galeria del admin
    - Verificar que usuario autenticado en `/galeria` admin renderiza `GaleriaPage`
    - Verificar que usuario no autenticado es redirigido a `/login`
    - _Requirements: 7.1, 7.2_

- [x] 8. Checkpoint final — Asegurar que todo está integrado
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.
