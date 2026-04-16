# Feature Specification: Gestión de Habitaciones, Planes y Creación de Reservas

**Feature Branch**: `003-rooms-planes-reservas`  
**Created**: 2026-04-16  
**Status**: Draft  

---

## Contexto del negocio

Esta feature cubre el núcleo operativo del hotel: el inventario de habitaciones y servicios, la configuración de planes experienciales con sus actividades incluidas y opcionales, y la creación de reservas que preserva de forma permanente el contenido del plan al momento de reservar.

Es el módulo con mayor valor de negocio del sistema: sin él, no es posible operar reservas ni cobros. Corresponde a los días 11–15 del plan de trabajo (Semana 3, MVP Fase 1).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Administrador gestiona el catálogo de habitaciones (Priority: P1)

Un administrador del hotel necesita mantener actualizado el inventario de habitaciones y servicios disponibles. Puede crear nuevas habitaciones, modificar sus datos y dejarlas inactivas cuando no están disponibles sin perder el historial de reservas asociadas.

**Independent Test**: Crear una habitación, modificar su capacidad, desactivarla y verificar que sigue apareciendo en el historial de reservas anteriores pero no en la disponibilidad pública.

**Acceptance Scenarios**:
1. **Given** un administrador autenticado con rol ADMIN o SUPER_ADMIN, **When** registra una nueva habitación con nombre, tipo, capacidad y precio base, **Then** la habitación aparece disponible en el catálogo público y en el portal administrativo.
2. **Given** una habitación con reservas futuras activas, **When** el administrador intenta eliminarla, **Then** el sistema aplica una eliminación lógica (la habitación deja de aparecer en reservas nuevas pero se preserva en reservas existentes).
3. **Given** un usuario con rol BUSINESS o VIEWER, **When** intenta crear o modificar una habitación, **Then** el sistema rechaza la acción con un error de permisos insuficientes.
4. **Given** cualquier visitante sin autenticación, **When** consulta el catálogo de habitaciones, **Then** solo ve las habitaciones activas con sus datos básicos (nombre, capacidad, precio, foto).

---

### User Story 2 — Administrador configura un plan experiencial con actividades (Priority: P1)

El administrador crea un "Plan Romántico" que incluye actividades base (desayuno, tour, botella de bienvenida) y define actividades opcionales que el cliente puede agregar al reservar (cena, masaje, cuatrimoto). Las actividades base forman parte del precio del plan; las opcionales tienen costo adicional.

**Independent Test**: Crear un plan con 3 actividades base y 2 opcionales (una de ellas marcada como preseleccionada), luego verificar que al obtener el detalle del plan aparecen las actividades en el orden correcto y el precio total refleja la actividad preseleccionada.

**Acceptance Scenarios**:
1. **Given** un plan existente con actividades base, **When** el administrador reordena las actividades, **Then** el nuevo orden se refleja inmediatamente en el catálogo público.
2. **Given** una actividad base que ya está en el snapshot de reservas futuras con estado `PENDING` o `CONFIRMED`, **When** el administrador intenta eliminarla del plan, **Then** el sistema informa cuántas reservas futuras se verán afectadas y requiere confirmación explícita (p. ej. segundo paso con cabecera o flag de confirmación en la API).
3. **Given** un plan con actividades opcionales configuradas, **When** se consulta el detalle del plan, **Then** las opcionales aparecen ordenadas primero las marcadas como preseleccionadas, luego el resto por nombre.
4. **Given** un administrador, **When** duplica un plan existente, **Then** se crea una copia con todas las actividades base pero sin las opcionales asociadas, lista para personalización.

---

### User Story 3 — Cliente o agente IA crea una reserva con actividades opcionales (Priority: P1)

Un cliente que llama por teléfono o el agente de IA por WhatsApp crea una reserva para el Plan Romántico eligiendo la cena romántica como actividad opcional. El sistema verifica disponibilidad, registra la reserva con una copia exacta de las actividades base del plan en ese momento, y guarda el precio de cada opcional tal como estaba al momento de reservar.

**Independent Test**: Crear una reserva con un plan y 2 opcionales. Luego modificar el precio de uno de los opcionales en el catálogo. Verificar que la reserva original conserva el precio al momento de creación (price snapshot), no el precio actualizado.

**Acceptance Scenarios**:
1. **Given** disponibilidad confirmada para las fechas solicitadas, **When** se crea una reserva con opcionales seleccionadas, **Then** la reserva queda en estado PENDING con un número único (ej. HT-2026-00001) y un registro inmutable de las actividades base del plan.
2. **Given** dos solicitudes de reserva simultáneas para la misma habitación en las mismas fechas, **When** ambas intentan confirmar al mismo tiempo, **Then** solo una reserva se crea exitosamente y la otra recibe un error de no disponibilidad.
3. **Given** una solicitud de reserva con el mismo Idempotency-Key que una reserva ya creada, **When** se reintenta la operación, **Then** el sistema devuelve la respuesta original sin crear una segunda reserva.
4. **Given** una reserva ya creada con actividades base de un plan, **When** el administrador modifica las actividades base del plan, **Then** la reserva existente conserva el snapshot original sin cambios.
5. **Given** un usuario con rol VIEWER, **When** intenta crear una reserva, **Then** el sistema rechaza la acción con error de permisos insuficientes.

---

## Requirements *(mandatory)*

### Functional Requirements

**Módulo de Habitaciones y Servicios**

- **FR-001**: El sistema DEBE permitir a usuarios con rol ADMIN o SUPER_ADMIN crear, editar y cambiar el estado de habitaciones y servicios.
- **FR-002**: El sistema DEBE soportar los tipos de habitación: cabaña, habitación, pasadía y servicio adicional.
- **FR-003**: El sistema DEBE aplicar eliminación lógica (soft delete) a habitaciones con reservas pasadas o futuras; nunca borrado físico.
- **FR-004**: El sistema DEBE exponer el catálogo de habitaciones activas sin autenticación (acceso público), y el catálogo completo (activas e inactivas) solo para roles ADMIN y SUPER_ADMIN.
- **FR-005**: Cada habitación PUEDE tener múltiples archivos de media asociados (fotos), con una foto marcada como portada principal.

**Módulo de Planes y Actividades**

- **FR-006**: El sistema DEBE permitir a usuarios ADMIN o SUPER_ADMIN crear, editar y desactivar planes experienciales.
- **FR-007**: Cada plan DEBE tener actividades base (siempre incluidas, no seleccionables por el cliente) con campo de orden explícito.
- **FR-008**: El sistema DEBE permitir reordenar actividades base de un plan en una sola operación por lote.
- **FR-009**: Antes de eliminar una actividad base de un plan, el sistema DEBE calcular y devolver el número de reservas **futuras** (fecha de inicio de estancia ≥ hoy) en estado `PENDING` o `CONFIRMED` cuyo snapshot incluye esa actividad, y la eliminación definitiva DEBE requerir confirmación explícita del administrador (p. ej. `GET` de impacto seguido de `DELETE` con cabecera `X-Confirm-Impact: true` o equivalente documentado en el contrato API).
- **FR-010**: El sistema DEBE mantener un catálogo global de actividades opcionales del hotel, independiente de los planes.
- **FR-011**: El sistema DEBE permitir asociar actividades opcionales del catálogo global a planes específicos, con la posibilidad de marcarlas como preseleccionadas dentro de ese plan.
- **FR-012**: Al consultar el detalle de un plan, las actividades opcionales DEBEN aparecer primero las preseleccionadas y luego el resto ordenadas por nombre.
- **FR-013**: El sistema DEBE permitir clonar un plan existente copiando sus actividades base, sin copiar las asociaciones de actividades opcionales.
- **FR-014**: El sistema DEBE [Principle IV Check] requerir rol ADMIN o SUPER_ADMIN para toda operación de escritura sobre planes y actividades.

**Módulo de Creación de Reservas**

- **FR-015**: El sistema DEBE [Principle III Check] crear un snapshot inmutable de las actividades base del plan al momento de crear la reserva, almacenado en una tabla separada dedicada exclusivamente a este propósito.
- **FR-016**: El sistema DEBE [Principle II Check] validar un Idempotency-Key único por operación de creación de reserva; si la clave ya existe y no ha expirado, devolver la respuesta original sin crear una segunda reserva.
- **FR-017**: La creación de reserva DEBE ejecutarse dentro de una transacción atómica que incluye: verificación de disponibilidad con bloqueo de concurrencia, inserción de la reserva, inserción del snapshot de actividades y registro de opcionales elegidas.
- **FR-018**: Si dos solicitudes de reserva compiten por la misma disponibilidad simultáneamente, el sistema DEBE garantizar que solo una tenga éxito.
- **FR-019**: Las actividades opcionales seleccionadas al reservar DEBEN guardar el nombre y precio vigente en ese momento (price snapshot), independientemente de cambios futuros en el catálogo.
- **FR-020**: Toda reserva creada DEBE recibir un número legible único con formato `HT-YYYY-NNNNN`.
- **FR-021**: El sistema DEBE permitir crear reservas a usuarios con rol AGENT, ADMIN o BUSINESS. Los roles VIEWER no pueden crear reservas.
- **FR-022**: Las reservas nuevas DEBEN crearse en estado `PENDING`.

### Key Entities

- **Room (Habitación/Servicio)**: Unidad de inventario del hotel. Tipos: cabaña, habitación, pasadía, servicio adicional. Atributos clave: nombre, tipo, capacidad, precio base, estado activo/inactivo. Soporta eliminación lógica.
- **Plan**: Producto experiencial del hotel. Agrupa actividades base incluidas y puede tener actividades opcionales disponibles. Tiene precio base, unidad de precio (por persona, por grupo, por noche) y máximo de personas.
- **PlanActivity (Actividad Base)**: Actividad siempre incluida en un plan. Tiene nombre, descripción, costo adicional (0 = incluida en precio base) y orden.
- **OptionalActivity (Actividad Opcional)**: Catálogo global del hotel. Tiene nombre, precio propio y unidad de precio. Se asocia a planes específicos y puede marcarse como preseleccionada por plan.
- **Reservation (Reserva)**: Registro transaccional de una reserva. Estado inicial PENDING. Referencia al plan o habitación, datos del cliente, fechas, personas y monto total.
- **ReservationActivitySnapshot**: Copia inmutable de las actividades base del plan al momento de crear la reserva. Nunca se modifica después de la creación.
- **ReservationOptionalActivity**: Registro de las opcionales elegidas por el cliente al reservar, con nombre y precio congelados al momento de la reserva.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El catálogo público de habitaciones y planes se actualiza en tiempo real tras cualquier cambio del administrador, sin necesidad de intervención técnica.
- **SC-002**: Cero reservas duplicadas en pruebas de concurrencia con 50 solicitudes simultáneas para la misma disponibilidad.
- **SC-003**: Cero reservas duplicadas al reintentar la misma operación con el mismo Idempotency-Key dentro del período de validez.
- **SC-004**: El snapshot de actividades base de una reserva permanece inmutable incluso después de que el administrador modifique el plan original.
- **SC-005**: Los precios de actividades opcionales en reservas existentes no cambian cuando el administrador actualiza el catálogo global.
- **SC-006**: El tiempo de respuesta para crear una reserva (incluyendo verificación de disponibilidad) es perceptiblemente inmediato para el usuario bajo carga normal.
- **SC-007**: Un administrador sin permisos suficientes (rol BUSINESS, VIEWER o sin autenticación) recibe un error claro al intentar operaciones de escritura sobre habitaciones o planes.
- **SC-008**: Cada creación o modificación de habitación, plan o reserva genera un registro de auditoría con el usuario responsable y la acción ejecutada.

---

## Scope

### Incluido en esta feature

- CRUD completo de habitaciones y servicios con soft delete
- Asociación de archivos de media a habitaciones
- CRUD completo de planes con actividades base y reordenamiento
- Catálogo global de actividades opcionales y su asociación a planes
- Clonar plan existente
- Advertencia de impacto al eliminar actividades base
- Creación de reserva con snapshot inmutable y opcionales con precio congelado
- Control de concurrencia y idempotencia en la creación de reservas
- RBAC aplicado a todos los endpoints de escritura

### Excluido de esta feature (cubierto en semanas siguientes)

- Gestión del ciclo completo de estados de reserva (modificar, cancelar, confirmar)
- Generación de links de pago (MercadoPago)
- Módulo de inventario de insumos
- Portal Angular (frontend admin)
- Consulta de reservas existentes con filtros avanzados

---

## Dependencies

- **Feature 001 (DB Design)**: Tablas `rooms`, `room_media`, `plans`, `plan_activities`, `optional_activities`, `plan_optional_activities`, `reservations`, `reservation_activity_snapshot`, `reservation_optional_activities` ya creadas con sus índices y función `check_availability`.
- **Feature 002 (Auth + Disponibilidad)**: Middleware `authGuard` operativo con validación de roles. Mecanismo de idempotencia activo. Módulo de disponibilidad para verificar cupos antes de crear reservas.

---

## Assumptions

- El número de reserva (`HT-2026-NNNNN`) se genera con un contador secuencial garantizado a nivel de base de datos para evitar duplicados.
- La eliminación lógica de habitaciones se implementa con el campo `deleted_at`; los registros eliminados no aparecen en listados públicos ni en la selección de nuevas reservas.
- Las actividades opcionales con estado inactivo en el catálogo global no se ofrecen en nuevas reservas, pero las reservas existentes que las incluyeron conservan su registro histórico.
- El catálogo global de actividades opcionales es compartido entre todos los planes; el administrador elige qué opcionales son aplicables a cada plan mediante la asociación.
- Los roles AGENT acceden únicamente a los endpoints necesarios para crear reservas y consultar disponibilidad; no tienen acceso al CRUD de habitaciones ni planes.
- Una reserva puede referir a un plan O a una habitación directamente, pero no a ambos simultáneamente.
