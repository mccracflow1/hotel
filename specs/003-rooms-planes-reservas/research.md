# Research: 003 — Habitaciones, Planes y Creación de Reservas

Resolución de decisiones técnicas para implementar la spec sobre el stack existente (Express + Knex + PostgreSQL).

---

## 1. Número de reserva `HT-YYYY-NNNNN`

- **Decision**: Generar el correlativo con una transacción que reserve el siguiente valor usando una tabla dedicada `reservation_number_sequences` (una fila por año) **o** un `INSERT ... ON CONFLICT` en una tabla de secuencias con `UPDATE` del contador bajo `FOR UPDATE` de la fila del año.
- **Rationale**: Cumple SC-003/FR-020 sin depender de `MAX()` sobre `reservations` (riesgoso bajo concurrencia). Es portable y auditable.
- **Alternatives considered**:
  - Secuencia PostgreSQL por año (`CREATE SEQUENCE ht_2026`): más certero pero multiplica objetos DDL o requiere migración dinámica.
  - `reservation_number` único + reintento en colisión: simple pero empeora latencia y logs bajo carga.

---

## 2. Idempotencia en creación de reservas

- **Decision**: Completar el flujo en tres capas: (1) middleware `idempotency` ya consulta `idempotency_keys`; (2) al **iniciar** `POST /reservations`, registrar fila con `operation` (p. ej. `create_reservation`) y clave, o usar upsert con bloqueo; (3) **después** de respuesta exitosa, persistir `response_status` y `response_body` en la misma transacción que confirma la reserva **o** en commit inmediato posterior con manejo de error idempotente. Eliminar el comportamiento «non-blocking» que hoy omite idempotencia si falla la lectura a `idempotency_keys` para rutas críticas de reserva.
- **Rationale**: FR-016 y SC-003 exigen devolver la respuesta original; el esqueleto actual no guarda respuestas nuevas.
- **Alternatives considered**:
  - Solo Redis: añade infraestructura; la constitución ya modeló PostgreSQL en `idempotency_keys`.

---

## 3. Concurrencia: `check_availability` + inserción

- **Decision**: Ejecutar **una sola** transacción Knex que: abre `trx`; llama `SELECT * FROM check_availability(...)` vía `trx.raw`; si `false`, rollback y 409; si `true`, inserta `reservations` + snapshots + opcionales; genera número; commit. No invocar `checkAvailability` del repositorio actual en un `transaction` aislado si luego el insert va en otra conexión.
- **Rationale**: FR-017/FR-018; el patrón actual en `availability.repository.checkAvailability` solo envuelve la función SQL, no el insert.
- **Alternatives considered**:
  - Función PL/pgSQL única que inserta todo: máxima atomicidad pero mezcla lógica de dominio en SQL; reservado si la capa Node sigue creciendo.

---

## 4. Alineación Constitución III vs spec (momento del snapshot)

- **Decision**: Tomar la **spec** como fuente de verdad operativa: snapshot de actividades base y precios de opcionales al **crear** la reserva en estado `PENDING` (FR-015, FR-019). La constitución enuncia «upon confirmation» como narrativa de negocio; en MVP Fase 1 la reserva nace ya con compromiso de precio/actividades congeladas.
- **Rationale**: Coherencia con escenarios de prueba y con tablas `reservation_activity_snapshot` / `reservation_optional_activities` ya diseñadas para creación.
- **Alternatives considered**:
  - Diferir snapshot a `CONFIRMED`: contradice la spec y los tests independientes de US-3.

---

## 5. Impacto al eliminar actividad base (FR-009)

- **Decision**: Alineado con **spec enmendada**: «futuras» = `date_start >= CURRENT_DATE` (zona horaria del servidor o UTC según política de producto). Estados: `PENDING` o `CONFIRMED`. Endpoint de impacto (`GET …/delete-impact`) + `DELETE …/activities/:id` solo con cabecera `X-Confirm-Impact: true` (o flag equivalente en contrato OpenAPI). Query tipo `COUNT(DISTINCT r.id)` sobre `reservations r` JOIN `reservation_activity_snapshot s` … coincidencia por `activity_name` + `sort_order` mientras el snapshot no tenga `plan_activity_id`.
- **Rationale**: Sin FK al plan_activity, la detección «qué snapshot corresponde» es por datos copiados.
- **Alternatives considered**:
  - Migración para añadir `source_plan_activity_id` nullable al snapshot: más preciso; evaluar en apply si el costo es aceptable.

---

## 6. Catálogo público de habitaciones

- **Decision**: `GET /api/v1/rooms` público sin JWT filtra `deleted_at IS NULL` AND `is_active = true`; variantes admin con `authGuard` + `ADMIN|SUPER_ADMIN` listan inactivas/eliminadas lógicamente según FR-004.
- **Rationale**: Alineado con spec y patrón ya usado en disponibilidad (`whereNull('r.deleted_at')`).
- **Alternatives considered**:
  - GraphQL unificado: fuera de alcance; API REST es estándar del proyecto.

---

## 7. Inconsistencia detectada: `rooms.short_desc`

- **Decision**: Añadir columna `short_desc` a `rooms` (migración nueva) **o** ajustar `availability.repository` para no seleccionar `r.short_desc` hasta existir la columna. La spec no exige `short_desc` en habitación pero el código de disponibilidad ya lo asume.
- **Rationale**: Evita runtime SQL errors al habilitar rutas.
- **Alternatives considered**:
  - Solo `description`: rompe contrato de respuesta actual del GET availability.

---

## 8. Auditoría (SC-008)

- **Decision**: Migración `backend/src/config/migrations/014_audit_logs_user_from_session.js` redefine `log_changes()` para insertar `audit_logs.user_id` desde el GUC transaccional `app.audit_user_id` (vacío ⇒ NULL). Los servicios llaman `setAuditUserOnTrx(trx, req.user.id)` (`backend/src/utils/audit-context.js`) al abrir la transacción Knex antes de mutar tablas auditadas. Los triggers en `010` + ampliación `013` cubren tablas hijas de plan.
- **Rationale**: Cumple «usuario responsable» sin pasar JWT al motor SQL; compatible con pool de conexiones si el GUC es local a la transacción (`set_config(..., true)`).

---

## 9. MCP / Agente IA

- **Decision**: La creación desde Sofia **no** escribe en BD directo; consume los mismos endpoints (o herramientas MCP que encapsulan `fetch` autenticado) con `Idempotency-Key`. Roles `AGENT` con JWT limitado.
- **Rationale**: Constitución V.
