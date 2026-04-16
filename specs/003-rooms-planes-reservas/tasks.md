# Tasks: Gestión de Habitaciones, Planes y Creación de Reservas

**Input**: Design documents from `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)  
**Also used**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

## Implementation strategy

- Entregar **MVP vertical** primero con **User Story 1** (catálogo de habitaciones + RBAC + público), luego **US2** (planes/actividades + catálogo global opcionales), luego **US3** (reserva transaccional + idempotencia + concurrencia).
- Las tres historias son **P1**; la dependencia natural es US1 y US2 antes de US3 (reservas referencian `rooms` / `plans`), aunque el esquema de BD ya existe.
- **Tests de integración** se incluyen por escenarios obligatorios de la spec y por constitución (módulos críticos).
- **Auditoría**: migración `014_audit_logs_user_from_session.js` y `backend/src/utils/audit-context.js` ya están en el repo; las implementaciones deben invocar `setAuditUserOnTrx(trx, req.user?.id)` al inicio de cada transacción que muta tablas auditadas (tarea **T029**).

## Dependency graph (story order)

```text
Phase 1 (Setup) ──► Phase 2 (Foundational)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
      [US1] Rooms    [US2] Plans     (US3 blocked until plans/rooms API stable)
         │                 │
         └────────┬────────┘
                  ▼
            [US3] Reservations
                  │
                  ▼
         Phase 6 (Polish / cross-cutting)
```

## Parallel execution examples

- Tras **T003**: ejecutar en paralelo **T004 [P]** y **T005 [P]** (schemas vs repository rooms), luego secuencial servicio → controller → routes.
- Tras **T013**: **T014** y **T015** pueden repartirse si un agente hace controller y otro routes (mismo módulo: coordinar exports).
- **T011 [P]** + **T018 [P]**: schemas/repository de plans vs sub-router opcionales si archivos distintos y contratos claros.
- **T026** y **T027** en paralelo (Swagger vs migración `013` triggers) al final.

---

## Phase 1: Setup (database alignment)

- [x] T001 Add Knex migration `backend/src/config/migrations/012_rooms_short_desc_and_reservation_sequences.js` adding nullable `short_desc` on `rooms` and creating `reservation_number_sequences` (`year` PK or unique, `last_value` bigint) for `HT-YYYY-NNNNN` allocation per `specs/003-rooms-planes-reservas/research.md`

---

## Phase 2: Foundational (blocking for all stories)

- [x] T002 Harden `backend/src/middlewares/idempotency.js` to support `reservation:create`: fail on DB read errors (no silent bypass), persist `response_status` and `response_body` on success, return cached replay with original HTTP status per FR-016
- [x] T003 Add shared slug helper `backend/src/utils/slug.js` exporting `toSlug(input)` used by `backend/src/modules/rooms/rooms.service.js` and `backend/src/modules/plans/plans.service.js` for unique `slug` values on create/update

---

## Phase 3: User Story 1 — Administrador gestiona el catálogo de habitaciones (P1)

**Goal**: CRUD habitaciones/servicios, soft delete, catálogo público solo activas, media y portada, RBAC FR-001/FR-003/FR-004/FR-005.

**Independent test**: Crear habitación, cambiar capacidad, desactivar; público no la lista; reservas históricas siguen referenciando la fila.

- [x] T004 [P] [US1] Implement Joi validation schemas in `backend/src/modules/rooms/rooms.schema.js` for create, patch, list query params, and `room_media` payloads
- [x] T005 [P] [US1] Implement `backend/src/modules/rooms/rooms.repository.js` with insert/update/soft-delete (`deleted_at`), admin list vs public list (`is_active`, `deleted_at` filters), and `room_media` join updates
- [x] T006 [US1] Implement `backend/src/modules/rooms/rooms.service.js` enforcing slug uniqueness, cover image rule (single `is_cover`), and mapping room types to enum `room_type` values
- [x] T007 [US1] Implement `backend/src/modules/rooms/rooms.controller.js` with `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN')` for writes, `ForbiddenError` for `BUSINESS`/`VIEWER` on writes, and public `GET` without auth per FR-004
- [x] T008 [US1] Register HTTP routes in `backend/src/modules/rooms/rooms.routes.js` aligned to `specs/003-rooms-planes-reservas/contracts/openapi.yaml` (`/rooms`, `/rooms/:id`, media sub-routes as needed)
- [x] T009 [US1] Enable router in `backend/src/app.js` by uncommenting `app.use('/api/v1/rooms', require('./modules/rooms/rooms.routes'))`
- [x] T010 [US1] Add integration tests in `backend/tests/rooms.test.js` for public list (active only), ADMIN create, and `BUSINESS`/`VIEWER` write rejection per acceptance scenarios 1–4

---

## Phase 4: User Story 2 — Administrador configura planes y actividades (P1)

**Goal**: CRUD planes, actividades base con reorder batch, **catálogo global de opcionales (FR-010)**, asociación por plan (`is_default`), detalle con orden FR-012, impacto FR-009 (reservas futuras `PENDING`/`CONFIRMED`) antes de borrar actividad base con cabecera `X-Confirm-Impact`, clonado FR-013, escritura solo ADMIN/SUPER_ADMIN.

**Independent test**: Plan con 3 base + 2 opcionales (una preseleccionada); `GET` detalle orden correcto; reorder reflejado; clone sin opcionales; CRUD opcionales globales vía `/optional-activities`.

- [x] T011 [P] [US2] Implement Joi schemas in `backend/src/modules/plans/plans.schema.js` for plan CRUD, `plan_activities` rows, `plan_optional_activities` link payload, reorder body, clone response shape, and optional-activity catalog payloads
- [x] T012 [P] [US2] Implement `backend/src/modules/plans/plans.repository.js` for `plans`, `plan_activities`, `optional_activities`, `plan_optional_activities` including batch sort_order updates inside a transaction
- [x] T013 [US2] Implement `backend/src/modules/plans/plans.service.js` with optional ordering (preselected `is_default` first, then name), `getDeleteBaseActivityImpact(planId, activityId)` counting future reservations (`date_start >= today`, `status IN ('PENDING','CONFIRMED')`) whose `reservation_activity_snapshot` rows match the base activity per **FR-009** (y `clonePlan` copying only base activities per FR-013)
- [x] T014 [US2] Implement `backend/src/modules/plans/plans.controller.js` with `requireRoles('ADMIN','SUPER_ADMIN')` on all mutating routes and public `GET` for catalog/detail as per spec
- [x] T015 [US2] Wire routes in `backend/src/modules/plans/plans.routes.js` including nested paths for reorder, `GET …/delete-impact`, `DELETE …/activities/:activityId` with `X-Confirm-Impact`, and clone per `specs/003-rooms-planes-reservas/contracts/openapi.yaml`
- [x] T016 [US2] Uncomment `app.use('/api/v1/plans', require('./modules/plans/plans.routes'))` in `backend/src/app.js`
- [x] T017 [US2] Add integration tests in `backend/tests/plans.test.js` for reorder visibility, optional ordering in `GET`, clone without `plan_optional_activities`, delete-impact response, and delete-with-confirmation header behavior
- [x] T018 [P] [US2] Expose CRUD HTTP for global `optional_activities` at `/api/v1/optional-activities` (mount alongside plans in `backend/src/app.js` or sub-router from plans module) matching `specs/003-rooms-planes-reservas/contracts/openapi.yaml` FR-010

---

## Phase 5: User Story 3 — Creación de reserva con snapshots e idempotencia (P1)

**Goal**: `POST /reservations` transaccional (check_availability + inserts), snapshots base y opcionales con precios congelados, número `HT-YYYY-NNNNN`, idempotencia, roles AGENT/ADMIN/BUSINESS, denegar VIEWER, estado `PENDING`.

**Independent test**: Reserva con 2 opcionales; cambiar precio en catálogo; snapshot en DB sin cambiar; mismo `Idempotency-Key` devuelve mismo cuerpo; concurrencia: una sola gana; **SC-002**: en test de integración lanzar **~50** solicitudes concurrentes a la misma disponibilidad y esperar una sola reserva creada.

- [x] T019 [US3] Implement Joi schema in `backend/src/modules/reservations/reservations.schema.js` for create payload with XOR `room_id`/`plan_id`, dates, guests, and `optional_activity_ids` subset validation against `plan_optional_activities` when `plan_id` present
- [x] T020 [US3] Implement `backend/src/modules/reservations/reservations.repository.js` exporting `createReservationInTransaction(trx, dto)` that runs `SELECT * FROM check_availability($1,$2,$3,$4)` on same `trx`, inserts into `reservations`, `reservation_activity_snapshot`, `reservation_optional_activities` per FR-017–FR-019
- [x] T021 [US3] Implement reservation numbering in `backend/src/modules/reservations/reservations.service.js` (or colocated helper used by service) using `reservation_number_sequences` with `SELECT … FOR UPDATE` on the year row inside the same Knex transaction as T020
- [x] T022 [US3] Implement `backend/src/modules/reservations/reservations.controller.js` chaining `idempotency`, `authGuard`, `requireRoles('AGENT','ADMIN','BUSINESS')` for `POST`, returning `403` for `VIEWER` per FR-021
- [x] T023 [US3] Register `POST /` in `backend/src/modules/reservations/reservations.routes.js` and compose middleware stack per `specs/003-rooms-planes-reservas/contracts/openapi.yaml`
- [x] T024 [US3] Uncomment `app.use('/api/v1/reservations', require('./modules/reservations/reservations.routes'))` in `backend/src/app.js`
- [x] T025 [US3] Add integration tests in `backend/tests/reservations.test.js` for idempotent replay (SC-003), **~50** concurrent `POST` attempts for the same slot (SC-002), and snapshot stability after mutating `plan_activities` (SC-004/SC-005)

---

## Phase 6: Polish & cross-cutting concerns

- [x] T026 Document rooms/plans/reservations/optional-activities endpoints in `backend/src/config/swagger.js` (JSDoc/OpenAPI fragments) consistent with `specs/003-rooms-planes-reservas/contracts/openapi.yaml`
- [x] T027 [P] Add Knex migration `backend/src/config/migrations/013_audit_triggers_plan_child_tables.js` attaching `log_changes` triggers to `plan_activities` and `optional_activities` (and optionally `plan_optional_activities`) to align SC-008 with `specs/003-rooms-planes-reservas/research.md`
- [x] T028 Align `backend/src/modules/availability/availability.repository.js` room SELECT with post-migration `rooms.short_desc` and run a quick manual or integration smoke via existing `backend/tests/availability.test.js` if needed
- [x] T029 Call `setAuditUserOnTrx` from `backend/src/utils/audit-context.js` at the start of every Knex transaction in `rooms.service.js`, `plans.service.js`, and `reservations.service.js` that performs INSERT/UPDATE/DELETE on audited tables, passing `req.user.id` when present (depends on migration `014_audit_logs_user_from_session.js` already in repo)

---

## Summary counts

| Metric | Value |
|--------|-------|
| **Total tasks** | 29 |
| **Phase 1 (Setup)** | 1 |
| **Phase 2 (Foundational)** | 2 |
| **US1 tasks** | 7 |
| **US2 tasks** | 8 |
| **US3 tasks** | 7 |
| **Polish** | 4 |
| **Parallel opportunities** | T004+T005, T011+T012, T011+T018, T026+T027 (and notes above) |
| **Suggested MVP scope** | Complete through **T010** (US1) for operable room catalog; then US2 (through **T018**) before reservation writes. |

## Format validation

All tasks use the checklist form `- [x] Tnnn …` with sequential IDs **T001–T029**, explicit **repo paths** under `backend/…` or `specs/…`, and **[US1]/[US2]/[US3]** labels only on user-story phase tasks. **[P]** marks parallel-safe tasks where files do not depend on incomplete sibling work.
