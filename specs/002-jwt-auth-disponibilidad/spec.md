# Feature Specification: Autenticación JWT, RBAC y Módulo de Disponibilidad

**Feature Branch**: `002-jwt-auth-disponibilidad`
**Created**: 2026-04-16
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Login y Gestión de Sesión (Priority: P1)

Un miembro del equipo del hotel (recepcionista, gerente, coordinador) necesita acceder al portal de administración de forma segura. Ingresa su correo y contraseña, obtiene acceso según su rol, y puede cerrar sesión cuando termina su turno. Si olvida su contraseña, puede solicitar un restablecimiento sin intervención técnica.

**Independent Test**: Realizar `POST /api/v1/auth/login` con credenciales válidas y verificar que el cuerpo de la respuesta contiene un access token válido y que se establece una httpOnly cookie con el refresh token.

**Acceptance Scenarios**:
1. **Given** un usuario activo con rol ADMIN existe en la base de datos, **When** ingresa correo y contraseña correctos, **Then** recibe un access token de 15 minutos y una httpOnly cookie con refresh token de 7 días.
2. **Given** un usuario intenta iniciar sesión con contraseña incorrecta 5 veces seguidas, **When** intenta el sexto intento desde la misma IP, **Then** el sistema bloquea el acceso por 15 minutos y devuelve un mensaje de error claro.
3. **Given** un usuario autenticado tiene un access token expirado, **When** su cliente envía el refresh token válido, **Then** recibe un nuevo access token sin necesidad de volver a ingresar sus credenciales.
4. **Given** un usuario autenticado cierra sesión, **When** intenta usar el refresh token invalidado, **Then** el sistema rechaza la solicitud y devuelve error de autenticación.
5. **Given** un usuario solicita restablecimiento de contraseña con su correo registrado, **When** completa el flujo con el token temporal, **Then** puede iniciar sesión con la nueva contraseña y el token temporal queda inutilizable.

---

### User Story 2 — Control de Acceso por Rol (RBAC) (Priority: P1)

El sistema debe garantizar que cada miembro del equipo solo pueda ejecutar las acciones permitidas para su rol. Un recepcionista (BUSINESS) puede crear reservas pero no modificar precios; un gerente (ADMIN) puede todo excepto gestionar credenciales de pago; el SUPER_ADMIN tiene control total.

**Independent Test**: Invocar un endpoint protegido con un token de rol VIEWER intentando crear un recurso y verificar que la respuesta es `403 Forbidden` con código `FORBIDDEN`.

**Acceptance Scenarios**:
1. **Given** un usuario con rol VIEWER, **When** intenta acceder a `GET /api/v1/reports/occupancy`, **Then** recibe respuesta 200 con los datos del reporte.
2. **Given** un usuario con rol VIEWER, **When** intenta `POST /api/v1/rooms`, **Then** recibe 403 con código de error `FORBIDDEN`.
3. **Given** un usuario con rol BUSINESS, **When** accede a `GET /api/v1/reservations` y `POST /api/v1/reservations`, **Then** ambas operaciones son exitosas.
4. **Given** un usuario con rol BUSINESS, **When** intenta `POST /api/v1/rooms` o `PUT /api/v1/business-config`, **Then** recibe 403.
5. **Given** un request llega sin header `Authorization`, **When** el endpoint requiere autenticación, **Then** el sistema devuelve 401 con código `UNAUTHORIZED`.
6. **Given** el agente IA (rol AGENT) envía un request autenticado, **When** crea una reserva vía `POST /api/v1/reservations`, **Then** la operación es exitosa y la reserva queda con `created_by = NULL` (sin usuario humano).

---

### User Story 3 — Consulta de Disponibilidad en Tiempo Real (Priority: P1)

Un visitante en la landing page, el agente IA de WhatsApp, o un recepcionista en el portal necesitan saber qué habitaciones y planes están disponibles para un rango de fechas y número de personas. La respuesta debe ser precisa en tiempo real, reflejando reservas ya confirmadas o pendientes.

**Independent Test**: Crear una reserva CONFIRMED para una habitación en fechas específicas, luego invocar `GET /api/v1/availability` para esas mismas fechas y verificar que esa habitación aparece como no disponible.

**Acceptance Scenarios**:
1. **Given** no hay reservas activas para el rango de fechas solicitado, **When** se consulta disponibilidad con `fecha_inicio`, `fecha_fin` y `num_personas`, **Then** se devuelve la lista de habitaciones y planes disponibles con sus precios (aplicando multiplicador de temporada si aplica).
2. **Given** una habitación tiene una reserva CONFIRMED que solapa con el rango solicitado, **When** se consulta disponibilidad, **Then** esa habitación no aparece en los resultados.
3. **Given** dos usuarios consultan disponibilidad simultáneamente para la misma habitación, **When** ambos intentan crear reservas al mismo tiempo, **Then** solo uno tiene éxito; el otro recibe un error claro de no disponibilidad (sin doble reserva).
4. **Given** el administrador configuró una vista mensual de disponibilidad, **When** accede a `GET /api/v1/availability/calendar` para el mes actual, **Then** obtiene un mapa día a día con el porcentaje de ocupación por habitación/plan.
5. **Given** existe una temporada activa con multiplicador de precio, **When** se consulta disponibilidad para fechas dentro de esa temporada, **Then** los precios devueltos reflejan el multiplicador aplicado.

---

### User Story 4 — Gestión de Disponibilidad y Temporadas (Priority: P2)

El administrador del hotel necesita configurar los cupos disponibles por fecha, bloquear fechas por mantenimiento o eventos, y definir temporadas de precios que ajusten automáticamente el costo de habitaciones y planes.

**Independent Test**: Crear una temporada con multiplicador 1.4 para un rango de fechas, luego consultar disponibilidad para una fecha dentro de ese rango y verificar que el precio retornado es `base_price × 1.4`.

**Acceptance Scenarios**:
1. **Given** un ADMIN configura cupos base con `POST /api/v1/availability`, **When** un usuario consulta disponibilidad, **Then** los resultados reflejan los cupos configurados.
2. **Given** un ADMIN bloquea un rango de fechas con motivo "Evento privado" vía `POST /api/v1/availability/block`, **When** se consulta disponibilidad para esas fechas, **Then** la habitación o plan bloqueado no aparece disponible.
3. **Given** un ADMIN crea una temporada "Semana Santa" con multiplicador 1.5 del 18 al 21 de abril, **When** se consulta disponibilidad para el 19 de abril, **Then** el precio devuelto es `base_price × 1.5`.
4. **Given** un ADMIN elimina una temporada, **When** se consulta disponibilidad para las fechas que cubría, **Then** los precios vuelven al valor base sin multiplicador.

---

## Requirements *(mandatory)*

### Functional Requirements

**Autenticación y Sesión**
- **FR-001**: El sistema DEBE validar credenciales (correo + contraseña) y emitir un access token con expiración de 15 minutos.
- **FR-002**: El sistema DEBE emitir un refresh token de 7 días almacenado en una httpOnly cookie (no accesible desde JavaScript del cliente).
- **FR-003**: El sistema DEBE rotar el refresh token en cada renovación (un refresh token solo puede usarse una vez).
- **FR-004**: El sistema DEBE invalidar el refresh token en base de datos al ejecutar logout.
- **FR-005**: El sistema DEBE aplicar rate limiting en `POST /api/v1/auth/login`: máximo 5 intentos fallidos por IP en ventana de 15 minutos, con bloqueo automático. Solo se cuentan intentos fallidos (`skipSuccessfulRequests=true`).
- **FR-006**: El sistema DEBE enviar un correo con token temporal (validez 1 hora) al solicitar restablecimiento de contraseña.

**Control de Acceso por Rol (RBAC)**
- **FR-007**: [Principle IV Check] El sistema DEBE verificar el rol del usuario en cada endpoint protegido y devolver 403 si el rol no tiene permiso.
- **FR-008**: El middleware de autenticación DEBE extraer el payload del JWT, verificar su firma y expiración, y adjuntar el usuario al contexto del request.
- **FR-009**: El rol `AGENT` DEBE poder crear reservas y generar links de pago sin acceso al portal de administración.
- **FR-010**: Usuarios inactivos (`is_active = false`) DEBEN ser rechazados con 401 aunque presenten un token válido.

**Disponibilidad**
- **FR-011**: `GET /api/v1/availability` DEBE aceptar `fecha_inicio`, `fecha_fin`, `tipo_servicio` (opcional) y `num_personas` (opcional) como parámetros de consulta.
- **FR-012**: La verificación de disponibilidad DEBE usar `SELECT FOR UPDATE SKIP LOCKED` para prevenir condiciones de carrera en reservas simultáneas.
- **FR-013**: `GET /api/v1/availability/calendar` DEBE devolver un mapa mensual con porcentaje de ocupación por día y habitación/plan.
- **FR-014**: Los precios devueltos en disponibilidad DEBEN incluir el multiplicador de la temporada vigente si la fecha cae dentro de alguna temporada activa.
- **FR-015**: [Principle II Check] La creación de reservas DEBE incluir validación de `Idempotency-Key`. *(Dependencia cruzada: el middleware ya existe desde Semana 1; la integración se valida en feature 003-reservaciones. Esta feature solo expone disponibilidad, no crea reservas.)*

**Gestión de Disponibilidad**
- **FR-016**: `POST /api/v1/availability` (solo ADMIN/BUSINESS) DEBE permitir configurar cupos por fecha, habitación o plan.
- **FR-017**: `POST /api/v1/availability/block` DEBE permitir bloquear rangos de fechas con motivo obligatorio.
- **FR-018**: CRUD completo de temporadas (`/api/v1/seasons`) DEBE estar disponible para ADMIN.

### Non-Functional Requirements

- **NFR-001**: El endpoint `POST /api/v1/auth/login` DEBE responder en menos de 500ms en el percentil 95.
- **NFR-002**: La consulta de disponibilidad DEBE responder en menos de 800ms bajo carga normal (hasta 10 usuarios concurrentes). Bajo carga de estrés (50 usuarios concurrentes), el límite es 1000ms — medido en SC-003.
- **NFR-003**: Contraseñas DEBEN almacenarse con bcrypt, salt rounds ≥ 12.
- **NFR-004**: Tokens JWT DEBEN firmarse con algoritmo HS256 usando secreto de al menos 64 caracteres.

### Key Entities

- **User** (ya existe): Representa al miembro del equipo del hotel. Atributos clave: `role` (ENUM), `is_active`, `last_login_at`.
- **RefreshToken** (ya existe): Token de renovación de sesión. Atributos: `token_hash`, `user_id`, `expires_at`. Inmutable después de creación — se elimina al usar o al hacer logout.
- **Availability**: Cupos disponibles por fecha, habitación y/o plan. Controla cuántos slots hay y cuántos están bloqueados.
- **Season**: Temporada de precios con rango de fechas y multiplicador. Afecta precios de disponibilidad dinámicamente.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro del equipo puede iniciar sesión, navegar al dashboard y cerrar sesión en menos de 30 segundos en condiciones normales.
- **SC-002**: Cero casos de acceso no autorizado: ningún usuario puede ejecutar acciones fuera de los permisos de su rol en pruebas de integración.
- **SC-003**: La consulta de disponibilidad refleja el estado real de reservas en menos de 1 segundo, incluso con 50 solicitudes concurrentes.
- **SC-004**: Cero reservas duplicadas para la misma habitación/plan en el mismo período bajo pruebas de concurrencia simultánea.
- **SC-005**: El precio retornado en disponibilidad coincide exactamente con `base_price × multiplicador_temporada` cuando aplica, verificable para cualquier combinación de fechas y temporadas.
- **SC-006**: Tras un intento de fuerza bruta (>5 intentos fallidos), la cuenta queda inaccesible por exactamente 15 minutos desde la IP atacante.

---

## Assumptions

- Las credenciales de correo (SMTP) para el flujo de restablecimiento de contraseña serán configuradas en variables de entorno; si no están disponibles en desarrollo, el endpoint devuelve éxito pero el correo no se envía (se loguea el token temporalmente).
- El rate limiting se aplica por IP usando memoria del proceso en desarrollo; en producción (Railway) se considerará un store compartido si se escala horizontalmente.
- La disponibilidad base (cupos) se configura manualmente por el administrador para cada habitación/plan/fecha; no hay generación automática de slots.
- El calendario de disponibilidad (`/calendar`) opera en la zona horaria de Colombia (UTC-5); los clientes que consuman este endpoint deben considerar este offset.
- El token del agente IA (rol AGENT) se genera manualmente por un SUPER_ADMIN durante el setup inicial del sistema y tiene expiración de 1 año.
- La función PL/pgSQL `check_availability()` ya existe en la base de datos (creada en Semana 1, migración 010); este módulo la consume directamente via Knex raw query dentro de una transacción.
