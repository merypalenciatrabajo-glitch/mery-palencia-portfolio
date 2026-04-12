# Implementation Plan: UnicornStudio Hero Integration

## Overview

Integración del widget animado de UnicornStudio como hero principal del portafolio de Mery Palencia. Se implementa en tres pasos incrementales: hook de inyección de script, componente hero, y modificación mínima de Home.tsx.

## Tasks

- [x] 1. Crear el hook `useUnicornStudio`
  - [x] 1.1 Implementar `client/src/hooks/useUnicornStudio.ts`
    - Declarar la constante `SCRIPT_SRC` apuntando al CDN de UnicornStudio v2.1.6
    - Declarar la extensión global de `Window` con `UnicornStudio` y `__unicornStudioLoaded`
    - Implementar la lógica de inyección única: verificar `window.__unicornStudioLoaded` y `querySelector` por `src` antes de crear el `<script>`
    - Implementar el flag `isMounted` para evitar actualizaciones de estado tras desmontaje
    - Llamar `UnicornStudio.init()` en `onload` o directamente si el objeto ya existe
    - Registrar listener `DOMContentLoaded` solo si `document.readyState === "loading"`, limpiarlo en el cleanup
    - Exponer `{ ready: boolean, error: boolean }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Escribir tests unitarios para `useUnicornStudio`
    - Test: no inyecta script si ya existe en el DOM (mismo `src`)
    - Test: llama `init()` directamente si `window.UnicornStudio` ya está disponible
    - Test: expone `error = true` cuando el script dispara `onerror`
    - Test: no actualiza estado si el componente se desmonta antes de que cargue el script
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.3 Escribir property test — Property 1: Inyección única del script
    - **Property 1: Script inyectado exactamente 1 vez ante N montajes/desmontajes**
    - Generar con `fast-check` secuencias aleatorias de N montajes/desmontajes (N entre 1 y 20)
    - Verificar que el DOM contiene exactamente 1 `<script>` con la `src` del CDN al final de cada secuencia
    - `// Feature: unicornstudio-hero-integration, Property 1`
    - **Validates: Requirements 1.1, 1.3**

  - [ ]* 1.4 Escribir property test — Property 2: Cleanup de listeners sin memory leaks
    - **Property 2: Listeners activos ≤ 1 en cualquier momento**
    - Generar con `fast-check` secuencias aleatorias de montajes/desmontajes
    - Verificar que el contador de listeners activos nunca supera 1
    - `// Feature: unicornstudio-hero-integration, Property 2`
    - **Validates: Requirements 1.4**

  - [ ]* 1.5 Escribir property test — Property 3: Estado ready implica init llamado exactamente 1 vez
    - **Property 3: Cuando ready===true, init() fue llamado exactamente 1 vez**
    - Generar con `fast-check` distintos estados iniciales de `window.UnicornStudio` (undefined, inicializado, no inicializado)
    - Verificar que cuando `ready === true`, `init` fue invocado exactamente 1 vez
    - `// Feature: unicornstudio-hero-integration, Property 3`
    - **Validates: Requirements 1.2, 2.2, 2.4**

- [x] 2. Checkpoint — Verificar hook
  - Asegurarse de que todos los tests del hook pasan. Consultar al usuario si surgen dudas.

- [x] 3. Crear el componente `UnicornStudioHero`
  - [x] 3.1 Implementar `client/src/components/UnicornStudioHero.tsx`
    - Usar `useUnicornStudio` para obtener `{ ready, error }`
    - Renderizar siempre el `<div data-us-project="4v8wXufmDdV5npLSJDVK">` en el DOM desde el primer render
    - Superponer skeleton (`animate-pulse bg-muted`) con `position: absolute` mientras `!ready && !error`
    - Superponer fallback (`bg-muted` + texto "Animación no disponible") con `position: absolute` cuando `error`
    - Contenedor wrapper: `rounded-2xl shadow-soft-lg overflow-hidden` con proporción nativa 390×844 (aspect-ratio ≈ 0.462)
    - No añadir ningún overlay hover sobre el widget
    - Aceptar prop opcional `className`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.3, 5.2, 5.4_

  - [ ]* 3.2 Escribir tests unitarios para `UnicornStudioHero`
    - Test: renderiza skeleton cuando `ready = false` y `error = false`
    - Test: renderiza fallback cuando `error = true`
    - Test: el `div[data-us-project]` está siempre presente en el DOM (en los tres estados)
    - Test: no hay overlay hover sobre el widget
    - _Requirements: 2.1, 2.3, 2.4, 4.3_

  - [ ]* 3.3 Escribir property test — Property 4: Fallback ante error de CDN
    - **Property 4: Ante error de CDN, no excepciones y fallback visible**
    - Generar con `fast-check` secuencias aleatorias de eventos de carga (success/error)
    - Verificar que el componente no lanza excepciones y el fallback se muestra correctamente en caso de error
    - `// Feature: unicornstudio-hero-integration, Property 4`
    - **Validates: Requirements 4.3**

- [x] 4. Modificar `Home.tsx` para integrar `UnicornStudioHero`
  - [x] 4.1 Reemplazar el bloque "Imagen Hero" en `client/src/pages/Home.tsx`
    - Importar `UnicornStudioHero` desde `@/components/UnicornStudioHero`
    - Reemplazar el `<div>` con la imagen estática y el elemento decorativo por `<UnicornStudioHero />` dentro del wrapper de animación
    - Mantener `useHeroImage` activo sin cambios en su lógica
    - Eliminar `FALLBACK_HERO` si no se usa en ningún otro lugar del archivo
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 5.1, 5.3_

  - [ ]* 4.2 Escribir tests de integración para `Home.tsx`
    - Test: `Home` renderiza correctamente con todos los hooks de Firestore mockeados y `UnicornStudioHero` presente
    - Test: `useHeroImage` sigue activo (suscripción no cancelada) cuando `UnicornStudioHero` está montado
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 5. Checkpoint final — Asegurarse de que todos los tests pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los tests de propiedad usan `fast-check` (compatible con Vitest)
- El `div[data-us-project]` debe estar siempre en el DOM desde el primer render para que `UnicornStudio.init()` lo encuentre
- `useHeroImage` se mantiene activo aunque su resultado no se use visualmente (preserva la suscripción Firestore)
