# Especificación: Portal de administración — Semana 6 (fundamentos y primeros módulos)

**Rama sugerida**: `006-angular-portal-week6`  
**Creado**: 2026-04-17  
**Estado**: Borrador  
**Fuentes**: `plan_trabajo.md` (Semana 6 · FASE 3), `CONTEXTO_MAESTRO.md` (§5 URLs, §6 RBAC, §11 Componente C4)

## Resumen ejecutivo

Esta entrega corresponde a la **primera semana del portal web de administración** del hotel: el equipo interno debe poder **iniciar sesión de forma segura**, ver un **tablero con indicadores clave**, **gestionar habitaciones** (altas, bajas lógicas, fotos y comodidades) y **consultar y operar disponibilidad** (calendario, bloqueos y temporadas) según su rol. El alcance es la **base del producto Angular** más **cuatro áreas funcionales** alineadas al plan semanal; **no** incluye aún reservas completas en portal, planes con actividades, inventario en UI, CMS visual ni landing (semanas posteriores del mismo plan maestro).

## Alcance incluido (Semana 6)

1. **Acceso y seguridad**: pantalla de inicio de sesión; sesión con renovación silenciosa; cierre de sesión; protección de rutas por autenticación y por rol; tokens de acceso **no** persistidos en almacenamiento local del navegador (solo en memoria de la aplicación), coherente con el modelo de riesgo descrito en el contexto maestro.
2. **Estructura de la aplicación**: diseño principal con menú lateral, barra superior y zona de contenido; menú lateral **según rol** (solo entradas permitidas por la matriz de permisos); las secciones principales se cargan **bajo demanda** para que el primer acceso sea rápido.
3. **Tablero (dashboard)**: tarjetas de resumen (reservas del día, ocupación, ingresos del mes, alertas de inventario bajo); gráfica de ocupación reciente; lista de próximas reservas con datos útiles para recepción; actualización periódica de cifras sin recargar toda la página; estados de carga claros.
4. **Habitaciones**: listado con paginación desde servidor, búsqueda y filtros; formulario de alta y edición; gestión de fotos (vista previa, orden, foto principal); comodidades como etiquetas; activar/desactivar con confirmación y retroalimentación visible.
5. **Disponibilidad**: vista de calendario mensual con indicación visual de ocupación; detalle al seleccionar un día; registro de bloqueos de fechas con motivo; configuración de temporadas con rango de fechas y factor de precio; navegación entre meses.

## Alcance excluido (dejado explícito)

- Módulos de **reservas** (listado avanzado, acciones, creación manual, exportaciones), **planes** (CRUD y actividades), **inventario** (pantallas completas), **reportes** (pantallas de analítica y exportación), **CMS** (biblioteca y textos), **usuarios** y **configuración del negocio** en el portal — salvo lo mínimo que el **dashboard** consuma vía API si ya existe en backend.
- **Landing pública**, **widget de chat** y **MCP / WhatsApp** (fases posteriores del plan).
- Cambios de **modelo de datos** o nuevos endpoints salvo que un hueco del API impida cumplir una pantalla ya comprometida en esta semana (en ese caso se documentará como dependencia en planificación).

## User Scenarios & Testing *(obligatorio)*

### Historia de usuario 1 — Iniciar sesión y recuperar sesión (Prioridad: P1)

**Como** personal del hotel con cuenta en el portal, **quiero** iniciar sesión con correo y contraseña **para** acceder solo a las funciones que mi rol permite.

**Prueba independiente**: Con usuario de cada rol relevante (`SUPER_ADMIN`, `ADMIN`, `BUSINESS`, `VIEWER`), verificar acceso a `/admin` tras login y bloqueo o redirección al intentar URL de módulo no permitido.

**Escenarios de aceptación**:

1. **Dado** un usuario válido, **cuando** ingresa credenciales correctas, **entonces** accede al área autenticada y ve el menú acorde a su rol (matriz §6 del maestro: p. ej. `VIEWER` no ve entradas de CRUD de habitaciones ni CMS).
2. **Dado** una sesión con token próximo a vencer, **cuando** realiza una acción que llama al API, **entonces** la aplicación renueva la sesión sin pedir de nuevo la contraseña mientras el refresh sea válido.
3. **Dado** un usuario no autenticado, **cuando** abre una URL interna del portal, **entonces** es llevado a la pantalla de inicio de sesión.
4. **Dado** un usuario autenticado, **cuando** cierra sesión, **entonces** no puede volver a llamar APIs protegidas sin autenticarse de nuevo.

---

### Historia de usuario 2 — Ver el tablero operativo (Prioridad: P1)

**Como** gerente o recepción, **quiero** ver de un vistazo ocupación, reservas próximas y alertas **para** priorizar el día sin abrir muchas pantallas.

**Prueba independiente**: Con datos de prueba en el API, comprobar que las cuatro tarjetas, la gráfica y la lista reflejan la misma información que se obtendría consultando los endpoints de referencia (reportes / reservas / inventario según contrato existente).

**Escenarios de aceptación**:

1. **Dado** el tablero cargado, **cuando** pasan unos segundos, **entonces** los indicadores se actualizan automáticamente sin recargar manualmente la página (intervalo acordado en implementación, objetivo del plan: orden de 30 segundos).
2. **Dado** demora del servidor, **cuando** el usuario espera, **entonces** ve indicadores de carga (esqueleto o equivalente) en lugar de cifras incorrectas o vacías confusas.
3. **Dado** un rol solo lectura, **cuando** entra al tablero, **entonces** ve la misma información resumida que los roles operativos donde el maestro lo permita (dashboard para todos los roles del portal).

---

### Historia de usuario 3 — Gestionar habitaciones (Prioridad: P1)

**Como** administrador, **quiero** crear y editar habitaciones, fotos y comodidades **para** que la oferta mostrada al cliente sea correcta.

**Prueba independiente**: CRUD completo sobre una habitación de prueba; verificación en API de que fotos y orden coinciden con lo guardado; intento de `VIEWER` de crear habitación → debe ser imposible (UI y/o 403 del API).

**Escenarios de aceptación**:

1. **Dado** un listado grande, **cuando** el usuario cambia de página o filtra, **entonces** el servidor entrega la página correcta (paginación del lado del servidor).
2. **Dado** un formulario de habitación, **cuando** el usuario adjunta imágenes, **entonces** ve vista previa, puede ordenarlas y marcar la principal antes de guardar.
3. **Dado** una habitación activa, **cuando** el usuario desactiva con confirmación, **entonces** el estado queda reflejado y el usuario recibe confirmación visual (p. ej. notificación).
4. **Dado** un rol sin permiso de CRUD de habitaciones, **cuando** intenta crear o editar, **entonces** no puede completar la acción.

---

### Historia de usuario 4 — Disponibilidad y temporadas (Prioridad: P1)

**Como** operaciones, **quiero** ver el calendario de ocupación, bloquear fechas y ajustar temporadas de precios **para** alinear ventas con capacidad real.

**Prueba independiente**: Navegar meses; abrir detalle de un día; crear bloqueo; crear temporada; verificar coherencia con API de disponibilidad y temporadas ya documentada.

**Escenarios de aceptación**:

1. **Dado** el calendario mensual, **cuando** el usuario navega entre meses, **entonces** las celdas muestran nivel de ocupación con código de color comprensible (p. ej. bajo / medio / alto).
2. **Dado** un día seleccionado, **cuando** el usuario abre el panel de detalle, **entonces** ve desglose por habitación o plan según lo que exponga el contrato del API.
3. **Dado** un usuario con permiso de edición de disponibilidad (`ADMIN`, `BUSINESS`, `SUPER_ADMIN` según maestro), **cuando** registra un bloqueo con motivo, **entonces** queda persistido y visible en la vista.
4. **Dado** un usuario **sin** permiso de edición de disponibilidad (`VIEWER`), **cuando** intenta bloquear o cambiar temporadas, **entonces** no puede completar la acción.
5. **Dado** temporadas con solapamiento inválido, **cuando** el usuario guarda, **entonces** recibe mensaje claro de validación (origen API o validación cliente alineada al contrato).

---

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema **debe** permitir iniciar y cerrar sesión usando el flujo de autenticación del API (acceso + renovación + salida), sin guardar el token de acceso en almacenamiento persistente del navegador.
- **FR-002**: El sistema **debe** restringir rutas con guardas de autenticación y de rol, alineadas a la matriz del maestro para: tablero, habitaciones, disponibilidad (lectura vs edición).
- **FR-003**: El sistema **debe** mostrar un menú lateral dinámico: entradas visibles solo para módulos permitidos al rol actual.
- **FR-004**: El tablero **debe** mostrar al menos cuatro indicadores de negocio, una tendencia de ocupación reciente y una lista de próximas reservas, consumiendo el API existente; si un endpoint no está disponible, la pantalla **debe** degradar con mensaje explícito (no cifras inventadas).
- **FR-005**: El tablero **debe** actualizar datos de forma automática periódica sin recarga completa de la página.
- **FR-006**: El módulo de habitaciones **debe** soportar listado paginado desde servidor, filtros de búsqueda, alta/edición y desactivación con confirmación.
- **FR-007**: El módulo de habitaciones **debe** permitir gestionar múltiples fotos con vista previa, reordenamiento y designación de foto principal, en línea con el modelo de medios del negocio.
- **FR-008**: El módulo de habitaciones **debe** permitir gestionar comodidades como lista de etiquetas agregables y quitables.
- **FR-009**: El módulo de disponibilidad **debe** mostrar un calendario mensual navegable con indicación visual de ocupación por día.
- **FR-010**: El módulo de disponibilidad **debe** permitir registrar bloqueos de fechas con motivo a los roles con permiso de edición.
- **FR-011**: El módulo de disponibilidad **debe** permitir configurar temporadas con rango de fechas y factor de precio a roles autorizados, con validación de solapes acorde al contrato del API.
- **FR-012**: La aplicación **debe** incluir componentes reutilizables para tablas con paginación servidor, diálogo de confirmación, notificaciones de resultado y estado de carga, usados de forma consistente en los módulos de esta semana.
- **FR-013**: La aplicación **debe** cargar cada sección principal solo cuando el usuario la visita, sin obligar a descargar todo el portal en el primer acceso.

### Reglas de negocio y cumplimiento (referencia maestro)

- **FR-014**: Las acciones mutadoras **deben** respetar la matriz de roles (§6): p. ej. `BUSINESS` no gestiona usuarios ni CMS; `VIEWER` no crea ni edita habitaciones ni bloqueos.
- **FR-015**: Ninguna pantalla del portal **debe** mostrar datos de disponibilidad o precios que contradigan la respuesta del API (sin “inventar” cifras).

### Entidades y datos (vista negocio)

- **Usuario del portal**: credenciales, rol, permisos efectivos para el menú y las acciones.
- **Habitación**: nombre, tipo, capacidad, precio base, descripción, estado activo/inactivo, medios asociados, comodidades.
- **Disponibilidad por día**: nivel de ocupación o señal equivalente acordada con el API; detalle al seleccionar día.
- **Bloqueo de fechas**: rango (o día), motivo, actor implícito vía sesión.
- **Temporada**: fechas de vigencia, multiplicador de precio; coherencia con temporadas del backend.

## Criterios de éxito *(obligatorio)*

### Resultados medibles y agnósticos de tecnología

- **SC-001**: Un usuario nuevo del hotel, con capacitación mínima (menos de 30 minutos), **completa el inicio de sesión y llega al tablero** en un solo intento en condiciones normales de red.
- **SC-002**: El **90%** de las acciones de listado y filtrado en habitaciones devuelven resultados visibles en **menos de 3 segundos** percibidos en red típica de oficina, o muestran estado de carga explícito (sin bloqueo silencioso).
- **SC-003**: Tras publicar un cambio en habitaciones o disponibilidad, un segundo usuario (o la misma sesión en otra pestaña) **ve el cambio reflejado** tras actualización automática o manual claramente indicada.
- **SC-004**: **Cero** acciones de creación o edición de habitaciones o bloqueos completadas por usuarios **VIEWER** en pruebas de rol (todas deben quedar bloqueadas por UI y/o servidor).
- **SC-005**: En una sesión de trabajo de 2 horas con llamadas normales al API, **no más de una** petición de re-login injustificada (fuera de cierre de sesión explícito o revocación de refresh).

## Supuestos

- El **API de las semanas 1–5** está disponible con los contratos documentados (auth, habitaciones, disponibilidad/calendario, reportes o agregados necesarios para KPIs).
- El hotel entregará **logo y paleta** para tema visual (activo bloqueante del maestro); si no llegan a tiempo, se usan valores provisionales acordados con el cliente.
- La convención de URL del portal bajo **`/admin`** se mantiene como en el maestro (misma base que la futura despliegue en Vercel).
- **Pencil** (diseño) y verificación en navegador entran como práctica recomendada del plan de trabajo, no como criterio formal de esta especificación.

## Riesgos y dependencias

- **Dependencia crítica**: Si los endpoints de reporte o agregados del dashboard no cubren los cuatro KPIs, hay que acotar con el negocio qué indicador sustituye o se pospone a la semana de reportes.
- **Riesgo**: Tokens solo en memoria implican pérdida de sesión al refrescar pestaña; el comportamiento debe ser **predecible** (mensaje amigable, no error crudo).

## Fuera de alcance explícito (recordatorio)

Reservas (flujo completo en portal), planes con actividades, inventario UI, CMS UI, usuarios, ajustes finos de landing, MCP, WhatsApp, DevOps de producción.
