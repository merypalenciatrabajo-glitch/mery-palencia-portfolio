# Bugfix Requirements Document

## Introduction

La navegación del sitio público (cliente) presenta dos defectos relacionados con la barra de navegación (navbar). Primero, los enlaces "Blog" y "Galería" desaparecen cuando el usuario está en la página de Blog, rompiendo la consistencia visual y funcional entre páginas. Segundo, no existe ningún enlace visible de "Inicio" en la navbar, lo que obliga al usuario a adivinar que el logo es clickeable para volver al home. Ambos problemas afectan la usabilidad y la experiencia de navegación en todas las páginas internas del sitio.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN el usuario navega a la página `/blog` THEN el sistema oculta los botones "Blog" y "Galería" del navbar, mostrando únicamente el toggle de tema (🌙)

1.2 WHEN el usuario está en cualquier página del sitio (Home, Blog, Galería) THEN el sistema no muestra ningún enlace o botón visible con el texto "Inicio" o "Home" en la navegación

1.3 WHEN el usuario está en la página `/blog` THEN el sistema no puede navegar directamente a `/galeria` desde el navbar sin volver primero al home

### Expected Behavior (Correct)

2.1 WHEN el usuario navega a la página `/blog` THEN el sistema SHALL mostrar los enlaces "Blog" y "Galería" en el navbar, de forma consistente con las demás páginas

2.2 WHEN el usuario está en cualquier página interna (`/blog`, `/galeria`) THEN el sistema SHALL mostrar un enlace visible "Inicio" en el navbar que permita volver a `/`

2.3 WHEN el usuario está en la página `/blog` THEN el sistema SHALL permitir navegar directamente a `/galeria` desde el navbar sin pasos intermedios

### Unchanged Behavior (Regression Prevention)

3.1 WHEN el usuario está en la página `/galeria` THEN el sistema SHALL CONTINUE TO mostrar los enlaces "Blog" y "Galería" en el navbar tal como lo hace actualmente

3.2 WHEN el usuario está en cualquier página THEN el sistema SHALL CONTINUE TO mostrar el toggle de tema (🌙) en el navbar

3.3 WHEN el usuario hace clic en el logo/nombre "Mery Palencia" THEN el sistema SHALL CONTINUE TO navegar al home (`/`)

3.4 WHEN el usuario está en la página activa THEN el sistema SHALL CONTINUE TO aplicar el estilo visual de enlace activo (color accent / subrayado) al enlace correspondiente en el navbar
