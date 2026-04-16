# Feature Specification: Ciclo completo de reservas, inventario, administración y reportes (MVP Fase 1 — Semana 4)

**Feature Branch**: `004-complete-reservation-lifecycle`  
**Created**: 2026-04-16  
**Status**: Draft  

---

## Contexto del negocio

Esta feature cierra el **MVP Fase 1** del backend: el hotel puede **consultar y gobernar reservas de punta a punta** (listados, detalle, política de cancelación, cambio de fechas, cancelación con motivo, altas de actividades opcionales después de crear la reserva), operar **inventario y proveedores**, administrar **usuarios del portal y configuración del negocio** según roles, y obtener **reportes operativos** para decisiones. Complementa la Semana 3 (catálogo, planes y creación inicial de reservas con snapshot).

Alineación: `CONTEXTO_MAESTRO.md` (§6 roles, §7 modelo, §9 contrato de operaciones, §21 MVP Fase 1) y Semana 4 del plan de trabajo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Personal consulta y gestiona el estado de las reservas (Priority: P1)

Recepción y administración necesitan buscar reservas por filtros (estado, fechas, habitación, plan, datos del huésped), abrir el detalle completo (cliente, plan, snapshot de actividades base, opcionales con montos congelados, totales, estado) y, según su rol, aplicar transiciones de estado permitidas por el negocio. También deben poder localizar una reserva por su **número legible** (p. ej. para llamadas telefónicas o integración con el agente de IA) y conocer la **penalidad estimada** de cancelación según la política configurada antes de actuar.

**Independent Test**: Crear una reserva de prueba, localizarla por número, consultar política, cambiar estado solo con un rol autorizado y verificar que un rol de solo lectura no puede mutar.

**Acceptance Scenarios**:
1. **Given** un usuario con permiso de solo lectura sobre reservas, **When** abre listados y detalle, **Then** ve la información completa incluyendo snapshot y opcionales con montos congelados, y **no** puede ejecutar cambios de estado ni cancelaciones.
2. **Given** un usuario de operaciones o administración con permisos de escritura, **When** aplica una transición de estado permitida por las reglas del negocio, **Then** el cambio queda registrado y el detalle refleja el nuevo estado.
3. **Given** una reserva existente, **When** se consulta la política de cancelación respecto a la fecha de entrada, **Then** la respuesta expresa de forma clara la penalidad (por ejemplo porcentaje o monto aplicable según ventanas definidas en la configuración del negocio), utilizable por el portal y por canales de soporte.
4. **Given** el identificador legible de una reserva, **When** personal autorizado o el canal de agente IA lo consulta, **Then** obtiene el mismo detalle que por identificador interno.
5. **Given** una mutación relevante sobre una reserva (cambio de estado u operación equivalente definida en el contrato), **When** el actor es un usuario del portal, **Then** queda asociado el usuario responsable en auditoría cuando aplica.

---

### User Story 2 — Operaciones modifica fechas, cancela o agrega opcionales tras la creación (Priority: P1)

El negocio debe poder **mover fechas** cuando hay disponibilidad, **cancelar** con motivo y aplicación de política, y **agregar actividades opcionales** después de creada la reserva, siempre que pertenezcan al plan de esa reserva. Las **actividades base del snapshot no pueden eliminarse ni alterarse** por estos flujos; los opcionales nuevos deben guardar nombre y precio congelados al momento de agregarse.

**Independent Test**: Crear reserva, agregar un opcional válido del plan, intentar agregar uno no vinculado al plan (debe fallar), cambiar fechas a un rango sin cupo (debe fallar con conflicto claro), cancelar con motivo y verificar inmutabilidad del snapshot base.

**Acceptance Scenarios**:
1. **Given** una reserva vinculada a un plan, **When** se agregan opcionales adicionales, **Then** solo se permiten actividades opcionales asociadas a ese plan, con cantidades válidas y precio/nombre congelados en el momento del alta.
2. **Given** un cambio de fechas que no cumple disponibilidad o reglas de solape, **When** se envía la modificación, **Then** el sistema rechaza la operación con un mensaje de conflicto consistente con el resto de la plataforma.
3. **Given** una cancelación, **When** el usuario proporciona motivo, **Then** el motivo queda persistido y la reserva refleja estado cancelado según reglas; la auditoría registra actor y operación.
4. **Given** cualquier operación sobre la reserva, **When** se inspeccionan las filas de snapshot de actividades base, **Then** permanecen inmutables respecto a la creación (no reescritura).

---

### User Story 3 — Operaciones gestiona inventario y proveedores (Priority: P1)

El hotel registra insumos, entradas, salidas y ajustes; necesita **alertas de stock bajo**, **historial por ítem** y **gestión de proveedores** para abastecimiento. Los movimientos no pueden dejar existencias negativas.

**Independent Test**: Crear ítem con mínimo, registrar salida que supere stock (rechazo), registrar movimiento válido vinculado opcionalmente a una reserva, listar alertas y ver historial filtrado.

**Acceptance Scenarios**:
1. **Given** un ítem activo por debajo del mínimo, **When** se consultan alertas, **Then** aparece en la lista de bajo stock.
2. **Given** un movimiento de salida, **When** la cantidad excede el stock disponible, **Then** el sistema rechaza la operación sin alterar stock.
3. **Given** usuarios con permiso de solo lectura de inventario, **When** intentan registrar movimientos o crear ítems, **Then** el sistema deniega la acción.
4. **Given** un ítem, **When** se consulta el historial de movimientos con filtros por tipo y fechas, **Then** se obtiene una secuencia coherente y paginada cuando el volumen lo requiere.

---

### User Story 4 — Administración gestiona usuarios, configuración del negocio y temporadas (Priority: P1)

Un administrador configura **usuarios del portal** (altas, ediciones, activación), respeta la regla de que un administrador general **no gestiona superadministradores**, permite **perfil propio** (datos básicos y cambio de contraseña), y mantiene **datos del hotel**, horarios de entrada/salida, **política de cancelación** validada, y **temporadas de precios** sin solapes inválidos. Las credenciales sensibles de pasarela de pago solo son manipulables por quien corresponda según la matriz de permisos y nunca se exponen en lecturas sin enmascarar.

**Independent Test**: Intentar como ADMIN crear o editar SUPER_ADMIN (denegado); actualizar política de cancelación con JSON inválido (error de validación); leer configuración y verificar enmascarado de secretos; crear temporada solapada según reglas de negocio documentadas.

**Acceptance Scenarios**:
1. **Given** un administrador sin alcance sobre superadministradores, **When** intenta crear o modificar un usuario `SUPER_ADMIN`, **Then** el sistema rechaza la operación.
2. **Given** la política de cancelación en configuración del negocio, **When** se actualiza, **Then** debe pasar validación de esquema acordado y ser la misma fuente de verdad que alimenta el cálculo de penalidad en reservas.
3. **Given** credenciales de pasarela almacenadas, **When** un rol no autorizado consulta la configuración, **Then** no ve valores secretos completos; solo roles autorizados pueden rotarlas.
4. **Given** temporadas de precios, **When** se crean o editan, **Then** las validaciones de rangos de fechas y solapes cumplen las reglas definidas para el negocio.

---

### User Story 5 — Dirección y operaciones consumen reportes consistentes (Priority: P1)

La gerencia necesita **ocupación por periodo**, **ingresos** (con reglas explícitas mientras el flujo de cobros en línea no esté completo), **detalle exportable de reservas** y **movimientos de inventario** en ventanas de tiempo, con resultados reproducibles y parámetros claros (desde/hasta, granularidad donde aplique).

**Independent Test**: Ejecutar el mismo reporte dos veces con los mismos parámetros y comparar totales; verificar que el contrato de cada reporte documenta qué estados de reserva cuentan para ocupación e ingresos.

**Acceptance Scenarios**:
1. **Given** un rango de fechas válido, **When** se solicita ocupación, **Then** la respuesta indica o documenta qué estados de reserva se incluyen y los totales son reproducibles.
2. **Given** el mismo rango, **When** se solicita ingresos antes de contar con cobros confirmados de forma completa, **Then** el comportamiento es explícito (p. ej. modo preliminar basado en montos de reserva en estados acordados) sin presentar cifras como definitivas de cobro si no lo son.
3. **Given** un listado detallado de reservas para analítica, **When** se exporta o pagina, **Then** los límites y orden son estables y acordes al contrato.

---

### User Story 6 — Integradores y equipo técnico disponen de contrato actualizado (Priority: P2)

El equipo y los integradores (portal futuro, agente IA, MCP) necesitan un **contrato de integración** que refleje fielmente las operaciones entregadas en el alcance de las semanas 1–4, con ejemplos y códigos de error estándar, sin listar capacidades inexistentes.

**Independent Test**: Revisar que cada operación documentada corresponde a comportamiento real y que los dominios (reservas, inventario, usuarios, configuración, reportes) están agrupados de forma coherente.

**Acceptance Scenarios**:
1. **Given** el catálogo de operaciones documentado, **When** se compara con lo desplegado, **Then** no hay endpoints o acciones documentadas que no existan.
2. **Given** un consumidor del contrato, **When** simula errores conocidos (validación, no encontrado, conflicto), **Then** encuentra la forma esperada de código y mensaje alineada al estándar del proyecto.

---

## Requirements *(mandatory)*

### Functional Requirements

**Reservas — consulta y ciclo de vida**

- **FR-001**: El sistema DEBE permitir listar reservas con paginación y filtros por estado, rango de fechas, habitación, plan y búsqueda por datos del huésped (nombre, documento, teléfono) según la matriz de permisos.
- **FR-002**: El sistema DEBE exponer detalle de reserva con datos de cliente, plan/habitación, snapshot inmutable de actividades base, opcionales con montos congelados, totales y estado actual.
- **FR-003**: El sistema DEBE permitir localizar una reserva por su número legible único además del identificador interno.
- **FR-004**: El sistema DEBE permitir transiciones manuales de estado solo a roles y transiciones permitidas por el negocio; los perfiles de solo lectura no mutan estados.
- **FR-005**: El sistema DEBE calcular y exponer la penalidad estimada de cancelación a partir de la política almacenada en la configuración del negocio y la proximidad al check-in.
- **FR-006**: El sistema DEBE permitir modificar fechas de estadía con revalidación de disponibilidad y control de concurrencia acorde al modelo transaccional existente.
- **FR-007**: El sistema DEBE permitir cancelar una reserva registrando motivo y reflejando el estado; la auditoría DEBE capturar actor (usuario del portal o sistema según corresponda).
- **FR-008**: El sistema DEBE permitir agregar actividades opcionales posteriores a la creación solo si están asociadas al plan de la reserva, persistiendo nombre y precio congelados en el alta.
- **FR-009**: El sistema NO DEBE permitir alterar ni eliminar filas de snapshot de actividades base mediante las operaciones públicas de reserva.
- **FR-010**: El sistema DEBE [Principle III Check] preservar snapshots de actividades base como registros inmutables tras la creación de la reserva. *(Misma regla de dominio que FR-009; FR-009 niega la mutación vía API, FR-010 afirma la invariante de datos.)*
- **FR-011**: El sistema DEBE [Principle II Check] aplicar idempotencia en operaciones críticas donde un reintento duplicaría un efecto económico o de inventario, reutilizando el mecanismo ya definido para creación de reservas donde el contrato lo exija.
- **FR-012**: Los roles `AGENT` (automatización) y personal autorizado DEBEN poder consultar reservas necesarias para soporte; `AGENT` no utiliza interfaz de portal.

**Inventario y proveedores**

- **FR-013**: El sistema DEBE permitir crear, editar y listar ítems de inventario con categoría, unidad, stock actual, mínimo, proveedor opcional y estado activo.
- **FR-014**: El sistema DEBE registrar movimientos de tipo entrada, salida y ajuste, actualizando stock de forma atómica y permitiendo vínculo opcional a una reserva para trazabilidad.
- **FR-015**: El sistema DEBE rechazar cualquier movimiento que resultaría en stock negativo.
- **FR-016**: El sistema DEBE exponer alertas de ítems activos cuyo stock está por debajo del mínimo.
- **FR-017**: El sistema DEBE exponer historial de movimientos por ítem con filtros por tipo y fechas y paginación cuando aplique.
- **FR-018**: El sistema DEBE soportar CRUD de proveedores y asociación a ítems según la matriz de permisos (operaciones de movimiento para roles de operación; creación de ítems/proveedores restringida según política del negocio).

**Usuarios, configuración y temporadas**

- **FR-019**: El sistema DEBE permitir listar, crear, editar y activar/desactivar usuarios del portal según rol; un `ADMIN` no gestiona cuentas `SUPER_ADMIN`.
- **FR-020**: El sistema DEBE ofrecer flujo seguro de restablecimiento de contraseña por token cuando el flujo aún no esté cerrado en entregas previas.
- **FR-021**: El sistema DEBE permitir al usuario autenticado actualizar su perfil (datos básicos, avatar, cambio de contraseña) en rutas dedicadas.
- **FR-022**: El sistema DEBE exponer lectura y actualización de la configuración del negocio (datos del hotel, horarios, política de cancelación como datos estructurados validados, branding); secretos de pasarela solo visibles o editables según roles autorizados y nunca en claro en lecturas no privilegiadas.
- **FR-023**: El sistema DEBE completar la gestión de temporadas con validación de solapes de fechas y uso coherente del multiplicador en referencias de precio alineadas al módulo de disponibilidad.

**Reportes**

- **FR-024**: El sistema DEBE proveer reporte de ocupación por periodo con parámetros explícitos (`desde`, `hasta`, granularidad acordada) y definición clara de estados incluidos.
- **FR-025**: El sistema DEBE proveer reporte de ingresos con reglas explícitas; hasta que los cobros en línea estén plenamente integrados, el comportamiento DEBE documentarse como preliminar (p. ej. basado en montos de reserva en estados acordados) para no confundir con ingresos cobrados.
- **FR-026**: El sistema DEBE proveer detalle de reservas exportable o paginado para analítica.
- **FR-027**: El sistema DEBE proveer reporte de inventario en ventana de tiempo con saldo inicial/final por ítem donde corresponda.

**Documentación de integración**

- **FR-028**: El sistema DEBE publicar documentación de contrato actualizada que cubra todo el alcance funcional de las semanas 1–4, con agrupación por dominio, esquemas reutilizables y ejemplos; sin listar operaciones no implementadas.

### Key Entities

- **Reservation**: Reserva con número legible, fechas, estado, datos de huésped, montos, motivo de cancelación si aplica, versión para concurrencia.
- **ReservationActivitySnapshot**: Copia inmutable de actividades base al crear la reserva; no se actualiza tras la creación.
- **ReservationOptionalActivity**: Opcionales elegidos o agregados después, con nombre y precio congelados al momento de registro.
- **InventoryItem**: Insumo con categoría, unidad, stock, mínimos y proveedor opcional.
- **InventoryMovement**: Entrada, salida o ajuste con cantidad, notas, referencia opcional a reserva y autor.
- **Supplier**: Proveedor de abastecimiento.
- **User**: Usuario del portal con rol y estado.
- **BusinessConfig**: Configuración única del hotel: horarios, política de cancelación, branding y campos sensibles de integración de pagos.
- **Season**: Temporada con rango de fechas y multiplicador de precio.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas de integración con un dataset representativo (volumen acorde a un hotel pequeño/mediano), las respuestas de listado paginado y detalle de reserva completan en **menos de 3 segundos** (orden de magnitud observable; ajustar umbral si el entorno de CI impone límites distintos).
- **SC-002**: Cien por cien de las consultas de política de cancelación para la misma reserva y momento devuelven la misma penalidad estimada (reproducibilidad).
- **SC-003**: Intentos de agregar opcionales no asociados al plan de la reserva fallan siempre, sin crear registros parciales.
- **SC-004**: Cero filas de snapshot de actividades base modificadas tras operaciones de modificación de fechas, cancelación o altas de opcionales en pruebas de regresión definidas.
- **SC-005**: Cero stocks negativos en inventario bajo pruebas de movimientos concurrentes típicos.
- **SC-006**: Cien por cien de las violaciones de matriz de permisos en rutas administrativas resultan en denegación explícita (sin datos sensibles filtrados).
- **SC-007**: Los reportes con mismos parámetros y misma ventana temporal producen los mismos totales en ejecuciones repetidas el mismo día (reproducibilidad).
- **SC-008**: La documentación de contrato no lista operaciones inexistentes en el entorno objetivo del alcance 1–4.

---

## Assumptions

- La Semana 3 entrega creación de reserva con snapshot y opcionales iniciales; esta feature asume esa base operativa.
- Los **ingresos** en reportes pueden basarse provisionalmente en montos de reserva en estados acordados hasta que el flujo de cobros (MVP Fase 2) alimente datos definitivos; el contrato del reporte lo deja explícito.
- La política de cancelación se almacena como datos estructurados validados en configuración del negocio y es compartida con el cálculo de penalidad en reservas.
- El rol `VIEWER` puede consultar reservas y reportes según la matriz de permisos del contexto maestro; no realiza mutaciones. Los permisos específicos por tipo de reporte (por ejemplo ingresos vs ocupación) siguen esa misma matriz.
- Las operaciones del rol `AGENT` se usan para automatización (p. ej. MCP) sin acceso al portal.

## Edge Cases

- Doble intento de la misma operación idempotente debe devolver el mismo resultado sin duplicar efectos.
- Cancelación cuando la reserva está en estado incompatible con cobro pendiente debe mantener coherencia con el flujo de pagos futuro (sin cobro duplicado ni estados contradictorios).
- Temporadas superpuestas: el sistema rechaza o resuelve según la regla de negocio documentada en validación de temporadas.
- Lectura de configuración con credenciales de pasarela: solo valores enmascarados salvo para roles explícitamente autorizados.

---

## Out of Scope

- Integración completa de pagos en línea (MercadoPago), webhooks y reconciliación (MVP Fase 2 — Semana 5).
- Portal Angular, landing pública y widget (fases posteriores).
- MCP Server y agente WhatsApp (fases posteriores).
- Biblioteca de medios y CMS de contenido del sitio (Semana 5 salvo si ya existiera alcance parcial previo).
