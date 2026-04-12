# Requirements Document

## Introduction

Esta feature reemplaza el hero actual de la página principal del portafolio de Mery Palencia (ilustradora digital) por un widget animado de UnicornStudio. El hero actual consiste en un grid de 2 columnas con texto a la izquierda e imagen estática a la derecha. El nuevo hero integrará el widget animado de UnicornStudio (`data-us-project="4v8wXufmDdV5npLSJDVK"`) como elemento visual principal, de forma responsiva y elegante, sin romper ninguna funcionalidad existente de Firestore ni el resto de las secciones de la página.

## Glossary

- **UnicornStudio_Widget**: El elemento `<div>` con atributo `data-us-project` que UnicornStudio utiliza para montar una animación interactiva.
- **UnicornStudio_Script**: El script de inicialización de UnicornStudio que carga el runtime desde CDN y llama a `UnicornStudio.init()`.
- **Hero_Section**: La sección superior de `Home.tsx` que actualmente contiene el grid de texto + imagen estática.
- **UnicornStudio_Hook**: Componente React (`useUnicornStudio`) responsable de inyectar el UnicornStudio_Script en el DOM de forma segura y controlada.
- **Hero_Component**: Componente React (`UnicornStudioHero`) que encapsula el UnicornStudio_Widget y gestiona su ciclo de vida.
- **Firestore_Hooks**: Los hooks `useGallery`, `useCommissions`, `useProcessSteps`, `useHeroImage` definidos en `useFirestore.ts`.
- **Home_Page**: El componente `Home` en `client/src/pages/Home.tsx`.

---

## Requirements

### Requirement 1: Inyección segura del script de UnicornStudio

**User Story:** Como desarrolladora, quiero que el script de UnicornStudio se cargue de forma segura y sin duplicados, para que la animación funcione correctamente sin errores en consola ni conflictos con React.

#### Acceptance Criteria

1. THE UnicornStudio_Hook SHALL inyectar el UnicornStudio_Script en el `<head>` del documento únicamente si no existe ya un script con la misma `src`.
2. WHEN el UnicornStudio_Script termina de cargar, THE UnicornStudio_Hook SHALL llamar a `UnicornStudio.init()` si `document.readyState` no es `"loading"`, o registrar el listener `DOMContentLoaded` en caso contrario.
3. IF el UnicornStudio_Script ya fue inyectado previamente (por una navegación anterior o hot-reload), THEN THE UnicornStudio_Hook SHALL omitir la inyección y llamar a `UnicornStudio.init()` directamente si el objeto global `window.UnicornStudio` ya está inicializado.
4. WHEN el componente que usa el UnicornStudio_Hook se desmonta, THE UnicornStudio_Hook SHALL limpiar cualquier listener de eventos registrado para evitar memory leaks.

---

### Requirement 2: Componente Hero con widget de UnicornStudio

**User Story:** Como visitante del portafolio, quiero ver una animación interactiva de UnicornStudio como hero principal, para que la primera impresión del portafolio sea visualmente impactante y profesional.

#### Acceptance Criteria

1. THE Hero_Component SHALL renderizar el UnicornStudio_Widget con el atributo `data-us-project="4v8wXufmDdV5npLSJDVK"`.
2. THE Hero_Component SHALL usar el UnicornStudio_Hook para gestionar la carga del script.
3. WHILE el UnicornStudio_Script está cargando, THE Hero_Component SHALL mostrar un estado de carga (skeleton o fondo sólido) que ocupe el mismo espacio visual que el widget final, para evitar layout shift.
4. WHEN el UnicornStudio_Script termina de cargar, THE Hero_Component SHALL mostrar el widget animado sin parpadeos ni saltos de layout.

---

### Requirement 3: Integración responsiva del Hero en Home.tsx

**User Story:** Como visitante en cualquier dispositivo, quiero que el hero con UnicornStudio se adapte correctamente a distintos tamaños de pantalla, para que la experiencia sea profesional tanto en móvil como en escritorio.

#### Acceptance Criteria

1. THE Hero_Section SHALL reemplazar el grid de 2 columnas (texto + imagen estática) por el Hero_Component como elemento visual central.
2. THE Hero_Component SHALL ocupar el ancho completo disponible en la sección hero, con una altura máxima definida que mantenga proporciones elegantes en todos los breakpoints (`sm`, `md`, `lg`).
3. THE Hero_Section SHALL mantener el contenido textual (nombre, subtítulo, descripción, botones de acción) visible y correctamente espaciado junto al Hero_Component.
4. WHERE el viewport es menor a `768px` (móvil), THE Hero_Section SHALL apilar el contenido textual encima del Hero_Component en una sola columna.
5. WHERE el viewport es mayor o igual a `1024px` (escritorio), THE Hero_Section SHALL mostrar el contenido textual y el Hero_Component en un layout de 2 columnas con espaciado profesional (`gap` mínimo de `3rem`).

---

### Requirement 4: Preservación de funcionalidad existente

**User Story:** Como desarrolladora, quiero que la integración del nuevo hero no rompa ninguna funcionalidad existente de la página, para que los datos de Firestore y el resto de secciones sigan funcionando correctamente.

#### Acceptance Criteria

1. THE Home_Page SHALL continuar llamando a todos los Firestore_Hooks (`useGallery`, `useCommissions`, `useProcessSteps`, `useHeroImage`) sin modificaciones en su lógica.
2. THE Home_Page SHALL mantener todas las secciones existentes (Galería, Proceso, Comisiones, Contacto, Footer) con su estructura, estilos y comportamiento intactos.
3. IF el UnicornStudio_Script falla al cargar (error de red o CDN no disponible), THEN THE Hero_Component SHALL mostrar un fallback visual (imagen estática o fondo de color sólido) sin lanzar errores no capturados que interrumpan el renderizado de la página.
4. THE Home_Page SHALL mantener el hook `useHeroImage` activo para no romper la suscripción a Firestore, aunque la imagen resultante no se use como fondo del nuevo hero.

---

### Requirement 5: Espaciado y presentación profesional

**User Story:** Como cliente del portafolio, quiero que todas las secciones de la página tengan un espaciado consistente y profesional, para que la presentación visual sea coherente y de alta calidad.

#### Acceptance Criteria

1. THE Hero_Section SHALL tener un `padding-top` mínimo de `3rem` y un `padding-bottom` mínimo de `4rem` para separarse correctamente del header y de la sección siguiente.
2. THE Hero_Component SHALL tener bordes redondeados (`border-radius` mínimo de `1rem`) y una sombra sutil consistente con el sistema de diseño existente (`shadow-soft-lg`).
3. THE Hero_Section SHALL mantener el gradiente de fondo sutil existente (`from-white via-white to-orange-50/20`) para coherencia visual con el resto de la página.
4. WHEN el usuario hace hover sobre el Hero_Component, THE Hero_Component SHALL no mostrar ningún overlay ni efecto que tape la animación de UnicornStudio.
