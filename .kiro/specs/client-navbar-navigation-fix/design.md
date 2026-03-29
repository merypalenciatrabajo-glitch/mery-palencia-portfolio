# Client Navbar Navigation Fix - Bugfix Design

## Overview

La página `/blog` tiene un header incompleto que omite los enlaces de navegación "Blog" y "Galería", mostrando únicamente el logo y el `ThemeToggle`. Además, ninguna página interna expone un enlace explícito "Inicio" para volver a `/`. El fix consiste en alinear el header de `Blog.tsx` con el patrón ya implementado en `GalleryPage.tsx`, añadiendo los enlaces de navegación faltantes y un enlace "Inicio" consistente en las páginas internas.

## Glossary

- **Bug_Condition (C)**: La condición que activa el bug — el usuario se encuentra en la ruta `/blog` y el header no renderiza los enlaces "Blog" ni "Galería"
- **Property (P)**: El comportamiento correcto esperado — el header de `/blog` muestra los mismos enlaces de navegación que el header de `/galeria`
- **Preservation**: El comportamiento existente en `GalleryPage.tsx` y `Home.tsx` que no debe verse alterado por el fix
- **Blog.tsx**: Componente en `client/src/pages/Blog.tsx` que renderiza la página `/blog` con su propio header inline
- **GalleryPage.tsx**: Componente en `client/src/pages/GalleryPage.tsx` que ya implementa correctamente el header con navegación completa usando `Link` de wouter e `isActive`
- **isActive**: Función helper en `GalleryPage.tsx` que compara `location.pathname` con una ruta para aplicar estilos de enlace activo

## Bug Details

### Bug Condition

El bug se manifiesta cuando el usuario navega a `/blog`. El header de `Blog.tsx` fue implementado con una estructura simplificada que solo incluye el logo (como `<button>`) y el `ThemeToggle`, omitiendo el bloque de navegación con los enlaces a otras secciones del sitio.

**Formal Specification:**
```
FUNCTION isBugCondition(page)
  INPUT: page de tipo PageComponent
  OUTPUT: boolean

  RETURN page.route === '/blog'
         AND page.header.navLinks.includes('Blog') === false
         AND page.header.navLinks.includes('Galería') === false
END FUNCTION
```

### Examples

- Usuario en `/blog`: el header muestra `[Mery Palencia] [🌙]` — faltan "Blog", "Galería" e "Inicio"
- Usuario en `/blog` quiere ir a `/galeria`: no hay enlace visible, debe volver manualmente a `/` primero
- Usuario en `/galeria`: el header muestra `[Mery Palencia] [Blog] [Galería] [🌙]` — correcto, pero también falta "Inicio"
- Usuario en `/`: el header muestra `[Mery Palencia] [Blog] [Galería] [🌙]` — correcto para Home (no necesita "Inicio")

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `GalleryPage.tsx` debe continuar mostrando los enlaces "Blog" y "Galería" con el estilo activo en "Galería" cuando se está en `/galeria`
- El `ThemeToggle` debe seguir apareciendo en todas las páginas
- El clic en el logo/nombre "Mery Palencia" debe seguir navegando a `/`
- El estilo visual de enlace activo (color accent / subrayado) debe seguir aplicándose al enlace de la página actual

**Scope:**
Todos los inputs que NO involucren la ruta `/blog` deben quedar completamente inalterados. El fix solo modifica el header de `Blog.tsx`.

## Hypothesized Root Cause

Basado en el análisis del código:

1. **Header implementado de forma aislada**: El header de `Blog.tsx` fue escrito de forma independiente sin reutilizar el patrón de `GalleryPage.tsx`. Mientras `GalleryPage` usa `Link` de wouter con `isActive`, `Blog.tsx` usa un `<button>` con `window.location.href` y omite los enlaces de navegación.

2. **Ausencia de enlace "Inicio" en páginas internas**: Ni `Blog.tsx` ni `GalleryPage.tsx` incluyen un enlace explícito "Inicio". El logo actúa como enlace al home pero no es obvio para el usuario. La corrección debe añadir un enlace "Inicio" visible en las páginas internas (`/blog`, `/galeria`).

3. **No existe un componente Navbar compartido**: Cada página define su propio header inline, lo que genera inconsistencias. El fix más directo es alinear `Blog.tsx` con el patrón de `GalleryPage.tsx`. Una refactorización a componente compartido sería ideal pero está fuera del alcance de este bugfix.

4. **Uso de `window.location.href` en lugar de `Link`**: `Blog.tsx` usa navegación imperativa en lugar del componente `Link` de wouter, lo que impide el enrutamiento SPA correcto y la detección de ruta activa.

## Correctness Properties

Property 1: Bug Condition - Navbar de /blog muestra todos los enlaces de navegación

_For any_ renderizado de la página `/blog`, el header corregido SHALL mostrar los enlaces "Inicio", "Blog" y "Galería" de forma visible y funcional, de manera consistente con el header de `/galeria`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Comportamiento existente de otras páginas no se altera

_For any_ página distinta de `/blog` (incluyendo `/galeria` y `/`), el código corregido SHALL producir exactamente el mismo comportamiento que el código original, preservando los enlaces, estilos activos y funcionalidad del ThemeToggle.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `client/src/pages/Blog.tsx`

**Specific Changes**:

1. **Añadir import de `Link` y `useLocation` de wouter**: Reemplazar la navegación imperativa con `window.location.href` por el componente `Link` de wouter, igual que en `GalleryPage.tsx`.

2. **Añadir helper `isActive`**: Implementar la misma función `isActive` que usa `GalleryPage.tsx` para aplicar estilos de enlace activo.

3. **Reemplazar el header simplificado**: Sustituir el header actual:
   ```tsx
   // ANTES (buggy)
   <header ...>
     <div className="container py-6 flex items-center justify-between">
       <button onClick={() => window.location.href = '/'} ...>
         Mery Palencia
       </button>
       <ThemeToggle />
     </div>
   </header>
   ```
   Por un header completo con navegación:
   ```tsx
   // DESPUÉS (fixed)
   <header ...>
     <div className="container py-4 flex items-center justify-between">
       <Link to="/" className="text-2xl font-display text-foreground hover:text-accent transition-colors">
         Mery Palencia
       </Link>
       <div className="flex items-center gap-4">
         <Link to="/" className="font-medium transition-colors text-foreground hover:text-accent">
           Inicio
         </Link>
         <Link to="/blog" className={`font-medium transition-colors ${isActive('/blog') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'}`}>
           Blog
         </Link>
         <Link to="/galeria" className={`font-medium transition-colors ${isActive('/galeria') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'}`}>
           Galería
         </Link>
         <ThemeToggle />
       </div>
     </div>
   </header>
   ```

4. **Actualizar el padding del header**: Cambiar `py-6` a `py-4` para consistencia con `GalleryPage.tsx`.

5. **Eliminar el uso de `window.location.href`** en el logo del header (reemplazado por `Link`).

**Note**: No se modifica `GalleryPage.tsx` ni `Home.tsx`. El enlace "Inicio" se añade solo en páginas internas (`/blog`, `/galeria`). En `Home.tsx` no aplica porque ya se está en `/`.

## Testing Strategy

### Validation Approach

La estrategia sigue dos fases: primero verificar que el bug existe en el código sin corregir (exploratory), luego confirmar que el fix funciona y no introduce regresiones (fix checking + preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Demostrar el bug ANTES de implementar el fix. Confirmar que `Blog.tsx` no renderiza los enlaces de navegación.

**Test Plan**: Renderizar el componente `Blog` con mocks de `useFirestore` y verificar que los enlaces "Blog" y "Galería" NO están presentes en el DOM. Estos tests fallarán en el código corregido (lo cual es el comportamiento esperado).

**Test Cases**:
1. **Blog header sin enlace Blog**: Renderizar `<Blog />` y verificar que `queryByText('Blog')` en el header retorna `null` (fallará en código sin corregir)
2. **Blog header sin enlace Galería**: Renderizar `<Blog />` y verificar que `queryByText('Galería')` en el header retorna `null` (fallará en código sin corregir)
3. **Blog header sin enlace Inicio**: Renderizar `<Blog />` y verificar que no hay enlace a `/` con texto "Inicio" (fallará en código sin corregir)
4. **Logo no usa Link de wouter**: Verificar que el logo en `Blog.tsx` usa `window.location.href` en lugar de `Link` (confirmará root cause)

**Expected Counterexamples**:
- Los enlaces "Blog", "Galería" e "Inicio" no se encuentran en el header de `/blog`
- Causa raíz confirmada: header implementado sin bloque de navegación

### Fix Checking

**Goal**: Verificar que tras el fix, todos los inputs donde se cumple la bug condition producen el comportamiento esperado.

**Pseudocode:**
```
FOR ALL page WHERE isBugCondition(page) DO
  rendered := render(Blog)
  ASSERT rendered.header.contains(link('Inicio', href='/'))
  ASSERT rendered.header.contains(link('Blog', href='/blog'))
  ASSERT rendered.header.contains(link('Galería', href='/galeria'))
  ASSERT rendered.header.contains(ThemeToggle)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas las páginas donde NO se cumple la bug condition, el comportamiento es idéntico al original.

**Pseudocode:**
```
FOR ALL page WHERE NOT isBugCondition(page) DO
  ASSERT render(page)_original === render(page)_fixed
END FOR
```

**Testing Approach**: Tests de ejemplo son suficientes aquí dado que el fix solo modifica `Blog.tsx`. Los tests de preservación verifican que `GalleryPage.tsx` y `Home.tsx` no fueron alterados.

**Test Cases**:
1. **GalleryPage preservation**: Verificar que `/galeria` sigue mostrando "Blog" y "Galería" con estilo activo en "Galería"
2. **ThemeToggle preservation**: Verificar que el ThemeToggle aparece en `/blog` y `/galeria` tras el fix
3. **Logo preservation**: Verificar que el logo "Mery Palencia" en `/blog` navega a `/`
4. **Active style preservation**: Verificar que en `/blog` el enlace "Blog" tiene el estilo de enlace activo (color accent)

### Unit Tests

- Renderizar `Blog` y verificar presencia de enlaces "Inicio", "Blog", "Galería" en el header
- Verificar que el enlace "Blog" tiene clase de estilo activo cuando se está en `/blog`
- Verificar que el logo "Mery Palencia" tiene `href="/"` o navega a `/`
- Verificar que `ThemeToggle` sigue presente en el header de `Blog`

### Property-Based Tests

- Para cualquier ruta activa en `{'/blog', '/galeria'}`, el header debe contener siempre los tres enlaces de navegación
- Para cualquier ruta activa, exactamente un enlace debe tener el estilo activo (el correspondiente a la ruta actual)
- Para cualquier página, el `ThemeToggle` debe estar presente en el header

### Integration Tests

- Navegar de `/blog` a `/galeria` usando el enlace del navbar y verificar que la URL cambia correctamente
- Navegar de `/blog` a `/` usando el enlace "Inicio" y verificar que se llega al home
- Verificar que el estilo activo cambia correctamente al navegar entre páginas
