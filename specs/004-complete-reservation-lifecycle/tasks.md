# Tasks: Ciclo completo de reservas, inventario, administración y reportes (004)

**Input**: Design documents from `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/openapi.yaml](./contracts/openapi.yaml)

## Dependencies (orden de historias)

```text
Foundational (migración + idempotencia)
    ↓
US1 — Consulta y estado de reservas  ─┐
    ↓                                 │
US2 — Modificación / cancelación /    │ mismos archivos reservations/*
    opcionales adicionales            │
                                      │
US3 — Inventario (paralelo a US4 tras foundational) ──→ monta app.js
US4 — Usuarios, business-config, temporadas
    ↓
US5 — Reportes (puede implementarse tras US1+US3+US4 o al menos con reservas listas)
    ↓
US6 — Swagger consolidado (al final del alcance backend)
    ↓
Polish — tests integración + RBAC
```

**Paralelización**: Tras **T002**, los equipos pueden dividir **US3** (inventory/suppliers) y **US4** (users/business-config/seasons) en ramas distintas; **US5** conviene cuando existan datos de reserva e inventario de prueba.

## Parallel execution examples

- **Tras T002**: Desarrollador A: **T003–T007** (US1); Desarrollador B: **T011–T012** [P] (repository + schema inventario).
- **Tras US1**: **T008–T010** (US2) secuencial en `reservations/*`.
- **US3 interno**: **T011** [P] + **T012** [P] en paralelo; luego T013→T018 en cadena.

## Implementation strategy

- **MVP incremental**: Entregar **US1** primero (operación puede listar/detalle/política/estado) → valor inmediato para recepción.
- **US2** a continuación para cerrar el ciclo transaccional de reserva.
- **US3 + US4** en paralelo si hay capacidad.
- **US5** cuando los repositorios de agregación tengan tablas pobladas (seed o datos manuales).
- **US6** al estabilizar rutas para no duplicar trabajo en JSDoc.

---

## Phase 1: Setup & foundational

- [X] T001 Add database migration for inventory stock invariant (e.g. `CHECK (current_stock >= 0)` on `inventory_items` if not present) in `backend/src/config/migrations/`
- [X] T002 Extend `Idempotency-Key` replay/persist behavior in `backend/src/middlewares/idempotency.js`: (1) mutaciones de reserva — `PUT`/`DELETE`/`POST …/optional-activities`; (2) **`POST /inventory/movements`** (constitución II: duplicar movimiento puede corromper stock). Exportar wrappers reutilizables y documentar `operation` en `idempotency_keys`.

---

## Phase 2: User Story 1 — Consulta y gestión de estado de reservas (P1)

**Goal**: Listados filtrados, detalle con snapshot y opcionales congelados, búsqueda por número legible, política de cancelación, `PATCH` de estado manual, RBAC (VIEWER lectura; mutaciones según matriz).

**Independent test**: JWT `VIEWER` lista y ve detalle; `VIEWER` no puede `PATCH` estado; `GET …/policy` devuelve penalidad coherente con `business_config.cancellation_policy`.

- [X] T003 [US1] Implement query helpers (filters, pagination, by-number) in `backend/src/modules/reservations/reservations.repository.js`
- [X] T004 [US1] Implement `getPolicyEstimate` (read `business_config`, compute rule vs `date_start`) in `backend/src/modules/reservations/reservations.service.js`
- [X] T005 [US1] Add Joi schemas for list query params, patch status, and policy response in `backend/src/modules/reservations/reservations.schema.js`
- [X] T006 [US1] Implement `listReservations`, `getReservationById`, `getReservationByNumber`, `getCancellationPolicy`, `patchReservationStatus` handlers in `backend/src/modules/reservations/reservations.controller.js`
- [X] T007 [US1] Register routes **before** `/:id` — `GET /`, `GET /by-number/:reservationNumber`, `GET /:id`, `GET /:id/policy`, `PATCH /:id/status` with `authGuard` and `requireRoles` in `backend/src/modules/reservations/reservations.routes.js` (**FR-012**: incluir `AGENT` en lecturas necesarias para soporte — listado/detalle/policy según matriz; `VIEWER` solo lectura; sin mutaciones para `VIEWER`)

---

## Phase 3: User Story 2 — Modificación, cancelación y opcionales adicionales (P1)

**Goal**: `PUT` fechas con transacción + disponibilidad; `DELETE` con motivo; `POST` opcionales post-creación; sin mutar `reservation_activity_snapshot`. **Edge case**: si la reserva está en `PAYMENT_PENDING` (u otro estado sensible), definir transiciones de cancelación coherentes con Fase 2 de pagos — sin estados contradictorios ni doble efecto.

**Independent test**: Cambio de fechas sin cupo → 409; opcional no asociado al plan → validación; snapshot base intacto en BD tras operaciones.

- [X] T008 [US2] Implement `updateReservationDates`, `cancelReservation`, `addPostReservationOptionals` in `backend/src/modules/reservations/reservations.repository.js` (transactions, `FOR UPDATE` / `check_availability` as in create flow)
- [X] T009 [US2] Orchestrate business rules, `setAuditUserOnTrx`, `total_amount` recalculation for optionals in `backend/src/modules/reservations/reservations.service.js`
- [X] T010 [US2] Add Joi bodies for `PUT`, `DELETE`, `POST …/optional-activities` and wire routes with idempotency middleware where applicable in `backend/src/modules/reservations/reservations.routes.js` and handlers in `backend/src/modules/reservations/reservations.controller.js`

---

## Phase 4: User Story 3 — Inventario y proveedores (P1)

**Goal**: CRUD ítems, movimientos atómicos, alertas, historial, CRUD proveedores; stock nunca negativo.

**Independent test**: `EXIT` que excede stock → error sin cambio; alertas solo `is_active`; movimiento con `reservation_id` opcional.

- [X] T011 [P] [US3] Implement Knex data access in `backend/src/modules/inventory/inventory.repository.js`
- [X] T012 [P] [US3] Define Joi schemas for items, movements, filters in `backend/src/modules/inventory/inventory.schema.js`
- [X] T013 [US3] Implement stock rules and movement application in `backend/src/modules/inventory/inventory.service.js`
- [X] T014 [US3] Implement HTTP handlers in `backend/src/modules/inventory/inventory.controller.js`
- [X] T015 [US3] Register `GET/POST /inventory/items`, `PUT …/items/:id`, `POST /inventory/movements` (**con middleware de idempotencia de T002**), `GET /inventory/alerts`, `GET /inventory/items/:itemId/movements` in `backend/src/modules/inventory/inventory.routes.js` with RBAC per matrix
- [X] T016 [P] [US3] Implement suppliers repository/service/schema/controller in `backend/src/modules/suppliers/suppliers.repository.js`, `suppliers.service.js`, `suppliers.schema.js`, `suppliers.controller.js`
- [X] T017 [US3] Register `GET/POST /suppliers`, `PUT /suppliers/:id` in `backend/src/modules/suppliers/suppliers.routes.js`
- [X] T018 [US3] Mount `app.use('/api/v1/inventory', …)` and `app.use('/api/v1/suppliers', …)` in `backend/src/app.js`

---

## Phase 5: User Story 4 — Usuarios, configuración del negocio y temporadas (P1)

**Goal**: CRUD usuarios (`ADMIN` no toca `SUPER_ADMIN`), perfil `/me`, `GET/PUT business-config` con masking de secretos MP, validación de solapes en temporadas.

**Independent test**: `ADMIN` no puede crear `SUPER_ADMIN`; `GET business-config` enmascara tokens; `POST /seasons` con solape → error.

- [X] T019 [P] [US4] Implement user CRUD and profile updates in `backend/src/modules/users/users.repository.js` and `backend/src/modules/users/users.service.js`
- [X] T020 [P] [US4] Add Joi schemas and role guards in `backend/src/modules/users/users.schema.js`
- [X] T021 [US4] Implement controllers and `GET/POST/PUT/PATCH` routes including `GET/PATCH /users/me` in `backend/src/modules/users/users.controller.js` and `backend/src/modules/users/users.routes.js`
- [X] T022 [US4] Create business config module: `backend/src/modules/business-config/business-config.repository.js`, `business-config.service.js` (masking), `business-config.schema.js`, `business-config.controller.js`, `business-config.routes.js`
- [X] T023 [US4] Add overlap validation for create/update season in `backend/src/modules/seasons/seasons.service.js` using `backend/src/modules/seasons/seasons.repository.js`
- [X] T024 [US4] Mount `/api/v1/users` and `/api/v1/business-config` in `backend/src/app.js`

---

## Phase 6: User Story 5 — Reportes operativos (P1)

**Goal**: `occupancy`, `revenue` (meta `revenue_basis` preliminar), `reservations` detalle, `inventory` ventana con saldos.

**Independent test**: Mismos query params → mismos totales el mismo día; `revenue` documenta estados incluidos.

- [X] T025 [US5] Implement SQL aggregations in `backend/src/modules/reports/reports.repository.js`
- [X] T026 [US5] Implement report orchestration and `meta` for revenue basis in `backend/src/modules/reports/reports.service.js`
- [X] T027 [P] [US5] Add query validation schemas in `backend/src/modules/reports/reports.schema.js`
- [X] T028 [US5] Implement controller and routes for `GET /reports/occupancy`, `/reports/revenue`, `/reports/reservations`, `/reports/inventory` in `backend/src/modules/reports/reports.controller.js` and `backend/src/modules/reports/reports.routes.js`
- [X] T029 [US5] Mount `app.use('/api/v1/reports', …)` in `backend/src/app.js`

---

## Phase 7: User Story 6 — Documentación Swagger consolidada (P2)

**Goal**: JSDoc/OpenAPI sincronizado con implementación semanas 1–4; sin endpoints fantasma.

**Independent test**: `/api/docs` muestra tags por dominio y coincide con rutas montadas.

- [ ] T030 [US6] Annotate new handlers with `@openapi` / swagger-jsdoc blocks in reservation, inventory, suppliers, users, business-config, reports modules and adjust aggregation in `backend/src/config/swagger.js`
- [X] T031 [US6] Audit all `app.use` routers in `backend/src/app.js` against documented paths and remove or mark deprecated stale definitions

---

## Phase 8: Polish & cross-cutting

- [X] T032 Integration test: reservation list/detail/policy/RBAC + rol `AGENT` en lecturas permitidas in `backend/tests/integration/reservations-lifecycle.test.js`
- [X] T033 [P] Integration test: inventory movement rejects negative stock and **idempotent replay** of same `Idempotency-Key` returns same outcome in `backend/tests/integration/inventory.test.js`
- [X] T034 [P] Integration test: `ADMIN` cannot assign `SUPER_ADMIN` in `backend/tests/integration/users-rbac.test.js`
- [ ] T035 Verify audit `user_id` on mutations via existing triggers + `setAuditUserOnTrx` for all new write paths (spot-check + constitution sign-off in PR description)
- [X] T036 [P] Integration test: **SC-007** — dos llamadas consecutivas al mismo reporte (`occupancy` o `revenue`) con mismos `from`/`to` devuelven mismos totales en `backend/tests/integration/reports-reproducibility.test.js`
- [X] T037 Confirmar **FR-020**: si `POST /auth/forgot-password` y `POST /auth/reset-password` ya están completos en `backend/src/modules/auth/`, documentar herencia de Semana 2 en PR; si no, completar en `auth.routes.js` / `auth.service.js` antes de cerrar 004

---

## Task summary

| Métrica | Valor |
|---------|-------|
| **Total tasks** | 37 |
| **US1** | 5 (T003–T007) |
| **US2** | 3 (T008–T010) |
| **US3** | 8 (T011–T018) |
| **US4** | 6 (T019–T024) |
| **US5** | 5 (T025–T029) |
| **US6** | 2 (T030–T031) |
| **Setup / foundational** | 2 (T001–T002) |
| **Polish** | 6 (T032–T037) |
| **Parallel opportunities** | T011–T012, T016, T027, T032–T034, T036 (marked [P]) |
| **Suggested MVP scope** | Phase 1 + Phase 2 (T001–T007) — operación lee y gestiona estados sin aún US2–US5 |

**Format validation**: Todas las tareas usan `- [ ]`, ID `Tnnn`, ruta de archivo explícita; fases de historia incluyen etiqueta `[USn]` salvo Setup, Foundational y Polish.
