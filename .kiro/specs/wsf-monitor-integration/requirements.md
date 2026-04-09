# Requirements Document

## Introduction

Integración de WSF Monitor (WebSecure Forge) en el proyecto para capturar y reportar errores de forma centralizada. La integración abarca tres capas: el frontend público, el panel admin del cliente y el backend Node.js. El objetivo es garantizar visibilidad completa de errores JS, promesas rechazadas, errores HTTP 500+, uptime y excepciones no controladas del servidor.

## Glossary

- **WSF_Monitor**: Sistema de monitoreo de errores de WebSecure Forge que captura y reporta incidencias en tiempo real.
- **Frontend_Público**: Aplicación web pública del proyecto, servida desde su propio `index.html`.
- **Panel_Admin**: Panel de administración del cliente, servida desde su propio `index.html`.
- **Backend**: Servidor Node.js/Express del proyecto.
- **WSF_Snippet**: Etiqueta `<script>` que carga el agente de monitoreo del lado del cliente desde `https://websecureforge.com/wsf-monitor.js`.
- **WSF_Node_Agent**: Módulo npm `wsf-monitor-node` que inicializa el monitoreo en el servidor Node.js.
- **WSF_Middleware**: Middleware de Express generado por el WSF_Node_Agent que captura errores de Express.
- **PROJECT_ID**: Identificador único del proyecto en la plataforma WSF Monitor.
- **Error_Crítico**: Error de tipo `uptime_fail` o `uncaughtException` reportado por WSF_Monitor.

---

## Requirements

### Requirement 1: Integración del WSF_Snippet en el Frontend_Público

**User Story:** Como desarrollador, quiero que el Frontend_Público tenga el WSF_Snippet instalado en el `<head>`, para que WSF_Monitor capture errores JS, promesas rechazadas, errores HTTP 500+ y uptime del sitio público.

#### Acceptance Criteria

1. THE Frontend_Público SHALL incluir el WSF_Snippet como primer elemento del `<head>` del `index.html`.
2. THE WSF_Snippet SHALL referenciar el `PROJECT_ID` del proyecto mediante el atributo `data-project-id`.
3. THE WSF_Snippet SHALL cargar el script desde `https://websecureforge.com/wsf-monitor.js`.
4. IF el WSF_Snippet es modificado o eliminado, THEN THE Frontend_Público SHALL revertir el cambio y restaurar el snippet original.
5. WHEN el Frontend_Público carga en el navegador, THE WSF_Monitor SHALL capturar errores JS no controlados.
6. WHEN el Frontend_Público carga en el navegador, THE WSF_Monitor SHALL capturar promesas rechazadas no controladas.
7. WHEN una petición HTTP del Frontend_Público retorna un código de estado 500 o superior, THE WSF_Monitor SHALL registrar el error.

---

### Requirement 2: Integración del WSF_Snippet en el Panel_Admin

**User Story:** Como desarrollador, quiero que el Panel_Admin tenga el WSF_Snippet instalado en el `<head>`, para que WSF_Monitor capture errores del panel de administración usando el mismo PROJECT_ID del proyecto.

#### Acceptance Criteria

1. THE Panel_Admin SHALL incluir el WSF_Snippet como primer elemento del `<head>` del `index.html`.
2. THE WSF_Snippet del Panel_Admin SHALL usar el mismo `PROJECT_ID` que el WSF_Snippet del Frontend_Público.
3. THE WSF_Snippet SHALL cargar el script desde `https://websecureforge.com/wsf-monitor.js`.
4. IF el WSF_Snippet del Panel_Admin es modificado o eliminado, THEN THE Panel_Admin SHALL revertir el cambio y restaurar el snippet original.
5. WHEN WSF_Monitor recibe un error del Panel_Admin, THE WSF_Monitor SHALL distinguir su origen mediante la URL reportada en el evento.

---

### Requirement 3: Integración del WSF_Node_Agent en el Backend

**User Story:** Como desarrollador, quiero que el Backend inicialice el WSF_Node_Agent al arrancar el servidor, para que WSF_Monitor capture excepciones no controladas, promesas rechazadas y errores de Express.

#### Acceptance Criteria

1. THE Backend SHALL inicializar el WSF_Node_Agent al inicio del proceso del servidor, antes de definir cualquier ruta.
2. THE WSF_Node_Agent SHALL ser inicializado con el `PROJECT_ID` del proyecto.
3. THE Backend SHALL registrar el WSF_Middleware como el último middleware de Express, después de todas las rutas definidas.
4. WHEN el proceso del Backend lanza una excepción `uncaughtException`, THE WSF_Node_Agent SHALL capturar y reportar el error a WSF_Monitor.
5. WHEN el proceso del Backend genera una promesa con `unhandledRejection`, THE WSF_Node_Agent SHALL capturar y reportar el error a WSF_Monitor.
6. WHEN Express procesa una petición que resulta en un error, THE WSF_Middleware SHALL capturar y reportar el error a WSF_Monitor.
7. IF el WSF_Node_Agent o el WSF_Middleware son eliminados o reordenados, THEN THE Backend SHALL revertir el cambio y restaurar la configuración original.

---

### Requirement 4: Manejo de errores compatible con WSF_Monitor

**User Story:** Como desarrollador, quiero que el código del proyecto maneje los errores de forma compatible con WSF_Monitor, para que ningún error sea silenciado antes de ser capturado por el monitor.

#### Acceptance Criteria

1. WHEN un bloque `try/catch` captura un error, THE Backend SHALL relanzar el error después de cualquier lógica de recuperación, para que WSF_Monitor pueda capturarlo.
2. IF un error es capturado y resuelto en el código, THEN THE desarrollador SHALL marcar el error como resuelto en el panel WSF_Monitor antes de aplicar el fix.
3. THE Backend SHALL propagar todos los errores al WSF_Middleware sin suprimirlos en capas intermedias.
4. WHEN el Frontend_Público captura un error en un bloque `try/catch`, THE Frontend_Público SHALL relanzar el error para que WSF_Monitor lo registre.
5. WHEN el Panel_Admin captura un error en un bloque `try/catch`, THE Panel_Admin SHALL relanzar el error para que WSF_Monitor lo registre.

---

### Requirement 5: Priorización de errores críticos

**User Story:** Como desarrollador, quiero que los errores críticos reportados por WSF_Monitor sean atendidos con prioridad máxima, para minimizar el impacto en los usuarios.

#### Acceptance Criteria

1. WHEN WSF_Monitor reporta un error de tipo `uptime_fail`, THE desarrollador SHALL tratar el error con prioridad máxima por encima de cualquier otra tarea.
2. WHEN WSF_Monitor reporta un error de tipo `uncaughtException`, THE desarrollador SHALL tratar el error con prioridad máxima por encima de cualquier otra tarea.
3. THE desarrollador SHALL revisar el panel WSF_Monitor (Monitor → proyecto) antes de aplicar cualquier corrección a un Error_Crítico.
