# Tasks: Portal Angular — Semana 7 (007)

**Input**: `E:\Proyectos\multi_stage\hotel\specs\007-angular-portal-week7\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)  
**Referencias**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/README.md](./contracts/README.md), [quickstart.md](./quickstart.md)

## Implementation strategy

- **MVP**: Phase 1 (deps) + Phase 2 (fundaciones) + **[US1]** + **[US2]** — operación diaria de reservas con export y mutaciones alineadas al API.
- **Incremento 2**: **[US3]** y **[US4]** en paralelo cuando dos devs disponibles (carpetas distintas; comparten solo `PlanFormComponent` / sección opcionales: coordinar merge).
- **Incremento 3**: **[US5]** inventario + reportes + Polish.
- **Degradación**: reporte de planes y enlace de pago según `research.md` / FR-020 (mensaje explícito si falta agregado o rol no coincide con `POST /payments/create`).

## Grafo de dependencias

```text
Phase 1 Setup (deps)
    │
    ▼
Phase 2 Foundational (idempotencia, export, navegación)
    │
    ├──► [US1] Reservas — listado/export/detalle
    │         │
    │         ▼
    └──► [US2] Reservas — acciones y alta manual
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[US3] Planes    [US4] Opcionales
    │                   │
    └─────────┬─────────┘
              ▼
        [US5] Inventario + Reportes
              │
              ▼
        Phase Polish
```

**Orden de historias**: US1 → US2 → (US3 ∥ US4) → US5 → Polish.  
**US3 y US4**: US4 reutiliza `PlanFormComponent` / sección de opcionales; completar US3 hasta formulario base antes de integrar UI opcionales en plan si un solo dev.

## Criterios de prueba independiente (por historia)

| Historia | Criterio (de spec.md) |
|----------|------------------------|
| **US1** | Con datos de prueba en el API, filtros + detalle + export deben reflejar la misma información que consultas equivalentes al backend. |
| **US2** | Flujo completo: confirmar/cancelar/fechas/alta manual/agregar opcional; `VIEWER` no completa mutaciones; idempotencia en POST críticos. |
| **US3** | CRUD plan de prueba; reorder actividades base; delete-impact + confirmación; clone con verificación en API. |
| **US4** | CRUD catálogo global; asociación y **desvinculación** en plan; pre-selección persistida; preview precio vs API; bloqueo/mensaje al desactivar o desasociar con reservas futuras. |
| **US5** | CRUD ítem/proveedor (roles); movimiento entrada/salida coherente con API; **historial de movimientos** en UI; reportes por rango; export; `VIEWER` sin POST movimientos. |

## Ejemplos de ejecución en paralelo

| Historia | Tareas típicas en paralelo `[P]` / archivos distintos |
|----------|------------------------------------------------------|
| **Setup** | T004 README mientras otro dev corre T001–T003 installs. |
| **Foundational** | T007–T009 (export helpers) en paralelo; T014 quickstart verificado aparte. |
| **US1** | T035 `[P]` tests service mientras otro cierra T021–T033 UI lista (incl. T034 feedback export). |
| **US2** | T050 `[P]` tests idempotencia; en paralelo T041–T049 UI modales/forms. |
| **US3** | T061 `[P]` tests `plans.service`; paralelo T051–T053 list + rutas + registro lazy. |
| **US4** | T066–T067 catálogo global (lista + form) en paralelo con T068–T070 sección opcionales en `plans/`; T071–T072 servicio/UI desvincular. |
| **US5** | T091 `[P]` tests `inventory.service`; en paralelo T087–T088 gráficos Chart.js; T082 historial movimientos vs T078–T081 formularios inventario/movimiento. |
| **Polish** | T095 `[P]` limpieza de `console.log` en `reservations/**` vs `plans/**` en paralelo con T092–T094 (a11y, budgets, quickstart). |

---

## Phase 1: Setup

**Goal**: Dependencias de exportación y CDK listas en `admin-portal/`.

- [ ] T001 Instalar `exceljs` en `admin-portal/package.json` y lockfile
- [ ] T002 Instalar `jspdf` y `jspdf-autotable` en `admin-portal/package.json`
- [ ] T003 Instalar `@angular/cdk` en `admin-portal/package.json` (drag-drop)
- [ ] T004 [P] Documentar nuevas deps en `admin-portal/README.md`
- [ ] T005 Verificar que `ng serve` arranca tras installs en `admin-portal/`

---

## Phase 2: Foundational

**Goal**: Utilidades transversales y entradas de ruta sin features completas.

- [ ] T006 Crear `admin-portal/src/app/core/idempotency/idempotency.service.ts` con `nextKey(): string` (UUID)
- [ ] T007 Crear `admin-portal/src/app/shared/export/csv-export.ts` con función `downloadCsv(filename, rows, columns)`
- [ ] T008 Crear `admin-portal/src/app/shared/export/excel-export.ts` con helper `buildWorkbookFromRows` usando ExcelJS
- [ ] T009 Crear `admin-portal/src/app/shared/export/pdf-export.ts` con helper tabla usando jsPDF-autotable
- [ ] T010 Añadir rutas lazy vacías (redirect) en `admin-portal/src/app/app.routes.ts` para `reservations`, `plans`, `optional-activities`, `inventory`, `reports`
- [ ] T011 Actualizar `admin-portal/src/app/core/layout/nav.config.ts` con ítems y `roles` según `specs/007-angular-portal-week7/contracts/README.md`
- [ ] T012 Asegurar `roleGuard` en rutas `plans` y `optional-activities` solo `ADMIN`/`SUPER_ADMIN` en `admin-portal/src/app/app.routes.ts`
- [ ] T013 Asegurar ruta `reservations` accesible a roles de lectura según matriz en `admin-portal/src/app/app.routes.ts`
- [x] T014 [P] Verificar comandos install y rutas S7 documentados en `specs/007-angular-portal-week7/quickstart.md`

---

## Phase 3: User Story 1 — Explorar y exportar reservas `[US1]`

**Goal**: Tabla server-side, filtros, drawer detalle, CSV/Excel, búsqueda rápida, feedback en exportaciones pesadas.

- [ ] T015 [US1] Crear `admin-portal/src/app/features/reservations/reservations.service.ts` con `listReservations(params)`
- [ ] T016 [US1] Crear método `getById(id)` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [ ] T017 [US1] Crear método `getByNumber(n)` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [ ] T018 [US1] Crear método `getPolicy(id)` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [ ] T019 [US1] Crear `admin-portal/src/app/features/reservations/reservations.routes.ts` con rutas `''` list y opcional `:id` child
- [ ] T020 [US1] Registrar lazy `reservations` en `admin-portal/src/app/app.routes.ts`
- [ ] T021 [US1] Crear `ReservationsListComponent` OnPush en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T022 [US1] UI chips de estado con `MatChipSet` en `admin-portal/src/app/features/reservations/reservations-list.component.html`
- [ ] T023 [US1] Filtros `date_from`/`date_to` con `MatFormField` + datepickers en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T024 [US1] Filtros `room_id`/`plan_id` con selectores async desde API en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T025 [US1] Campo texto `q` debounced en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T026 [US1] Conectar `MatPaginator` a `page`/`limit` query en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T027 [US1] Columnas requeridas en `admin-portal/src/app/features/reservations/reservations-list.component.html`
- [ ] T028 [US1] Badge visual de pago (clases CSS) en `admin-portal/src/app/features/reservations/reservations-list.component.scss`
- [ ] T029 [US1] Crear `ReservationDetailDrawerComponent` en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.ts` (`MatSidenav` o `MatDrawer`)
- [ ] T030 [US1] Mostrar snapshot actividades base en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.html`
- [ ] T031 [US1] Mostrar opcionales e historial en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.html`
- [ ] T032 [US1] Botón export CSV usando `csv-export.ts` en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T033 [US1] Botón export Excel usando `excel-export.ts` en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T034 [US1] Indicador de carga o mensaje informativo para exportaciones lentas o conjuntos grandes en `admin-portal/src/app/features/reservations/reservations-list.component.ts`
- [ ] T035 [P] [US1] Tests HTTP en `admin-portal/src/app/features/reservations/reservations.service.spec.ts`

---

## Phase 4: User Story 2 — Operar reservas y alta manual `[US2]`

**Goal**: PATCH status, PUT fechas, DELETE cancel, POST opcional, POST crear, pago si rol API, idempotencia, refresco de detalle tras mutación.

- [x] T036 [US2] Implementar `createReservation()` con cabecera `Idempotency-Key` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [x] T037 [US2] Implementar `updateReservationDates()` con cabecera `Idempotency-Key` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [x] T038 [US2] Implementar `cancelReservation()` con cabecera `Idempotency-Key` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [x] T039 [US2] Implementar `patchReservationStatus()` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [x] T040 [US2] Implementar `addOptionalToReservation()` con cabecera `Idempotency-Key` en `admin-portal/src/app/features/reservations/reservations.service.ts`
- [x] T041 [US2] Crear `ReservationActionsComponent` o integrar acciones en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.ts`
- [x] T042 [US2] Modal confirmación cancelación leyendo `getPolicy` en `admin-portal/src/app/features/reservations/reservation-cancel-dialog.component.ts`
- [x] T043 [US2] Form cambio de fechas con validación en `admin-portal/src/app/features/reservations/reservation-dates-form.component.ts`
- [x] T044 [US2] Selector opcionales disponibles + `POST /reservations/:id/optional-activities` en `admin-portal/src/app/features/reservations/reservation-add-optional.component.ts`
- [x] T045 [US2] Crear `ReservationManualCreateComponent` en `admin-portal/src/app/features/reservations/reservation-manual-create.component.ts` y ruta `new` en `reservations.routes.ts`
- [x] T046 [US2] Ocultar acciones mutadoras para `VIEWER` con `*appHasRole` en templates de `admin-portal/src/app/features/reservations/`
- [x] T047 [US2] Crear `PaymentsService` en `admin-portal/src/app/features/payments/payments.service.ts` con `createCheckout(reservationId)` → `POST /payments/create` enviando cabecera `Idempotency-Key` cuando el contrato lo exija, si el rol y el backend lo permiten
- [x] T048 [US2] Botón “Generar link de pago” visible solo para roles permitidos por contrato en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.html`
- [x] T049 [US2] Mostrar URL copiable con `Clipboard` API y `ToastService` en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.ts`
- [x] T050 [US2] Tras mutación exitosa, refrescar detalle o re-fetch en `admin-portal/src/app/features/reservations/reservation-detail-drawer.component.ts` (alineado a SC-003)
- [x] T051 [P] [US2] Tests de cabecera idempotencia en `admin-portal/src/app/features/reservations/reservations.service.spec.ts`

---

## Phase 5: User Story 3 — Planes y actividades base `[US3]`

**Goal**: CRUD plan, medios, reorder, delete-impact, clone.

- [x] T052 [US3] Crear `admin-portal/src/app/features/plans/plans.service.ts` (list, get, create, patch, clone, reorder, deleteActivity, deleteImpact, media, optional-links según contrato)
- [x] T053 [US3] Crear `admin-portal/src/app/features/plans/plans.routes.ts` (`''`, `new`, `:id/edit`)
- [x] T054 [US3] Registrar lazy `plans` con `roleGuard` en `admin-portal/src/app/app.routes.ts`
- [x] T055 [US3] Crear `PlansListComponent` OnPush en `admin-portal/src/app/features/plans/plans-list.component.ts`
- [x] T056 [US3] Crear `PlanFormComponent` en `admin-portal/src/app/features/plans/plan-form.component.ts` con subsecciones Material stepper o tabs
- [x] T057 [US3] Integrar subida portada/galería vía `POST /plans/:id/media` en `admin-portal/src/app/features/plans/plan-media.helper.ts`
- [x] T058 [US3] Lista actividades base con CDK `DragDropModule` en `admin-portal/src/app/features/plans/plan-activities.component.ts`
- [x] T059 [US3] Llamar `POST /plans/:id/activities/reorder` al soltar en `admin-portal/src/app/features/plans/plan-activities.component.ts`
- [x] T060 [US3] Antes de `DELETE` actividad, llamar `GET .../delete-impact` y mostrar `ConfirmDialogComponent` en `admin-portal/src/app/features/plans/plan-activities.component.ts`
- [x] T061 [US3] Acción duplicar plan `POST /plans/:id/clone` con confirmación en `admin-portal/src/app/features/plans/plans-list.component.ts`
- [x] T062 [P] [US3] Tests básicos `admin-portal/src/app/features/plans/plans.service.spec.ts`

---

## Phase 6: User Story 4 — Opcionales globales y del plan `[US4]`

**Goal**: CRUD `/optional-activities`, links en plan, **desvinculación**, pre-selección, preview precio, validación negocio.

- [x] T063 [US4] Crear `admin-portal/src/app/features/optional-activities/optional-activities.service.ts`
- [x] T064 [US4] Crear rutas `admin-portal/src/app/features/optional-activities/optional-activities.routes.ts`
- [x] T065 [US4] Registrar lazy en `admin-portal/src/app/app.routes.ts`
- [x] T066 [US4] Crear `OptionalActivitiesListComponent` en `admin-portal/src/app/features/optional-activities/optional-activities-list.component.ts`
- [x] T067 [US4] Crear formulario alta/edición opcional en `admin-portal/src/app/features/optional-activities/optional-activity-form.component.ts`
- [x] T068 [US4] En `PlanFormComponent`, sección multi-select hacia `POST /plans/:id/optional-links` en `admin-portal/src/app/features/plans/plan-optionals-section.component.ts`
- [x] T069 [US4] Toggle pre-seleccionada mapeando campos del API en `admin-portal/src/app/features/plans/plan-optionals-section.component.ts`
- [x] T070 [US4] Vista previa precio total (computed desde respuestas API) en `admin-portal/src/app/features/plans/plan-price-preview.component.ts`
- [x] T071 [US4] Implementar `removePlanOptionalLink(planId, optionalId)` con `DELETE /plans/:id/optional-links/:optionalId` en `admin-portal/src/app/features/plans/plans.service.ts`
- [x] T072 [US4] Acción **desvincular** opcional del plan con confirmación y manejo de error de negocio en `admin-portal/src/app/features/plans/plan-optionals-section.component.ts`
- [x] T073 [US4] Manejar error de negocio al desactivar opcional con reservas futuras en `admin-portal/src/app/features/optional-activities/optional-activities-list.component.ts`

---

## Phase 7: User Story 5 — Inventario y reportes `[US5]`

**Goal**: Ítems (CRUD UI), alertas, movimientos con idempotencia, **historial**; proveedores; reportes con charts + export.

- [x] T074 [US5] Crear `admin-portal/src/app/features/inventory/inventory.service.ts` (items CRUD, movements list/create, alerts)
- [x] T075 [US5] Crear `admin-portal/src/app/features/suppliers/suppliers.service.ts` (CRUD según `backend/src/modules/suppliers/suppliers.routes.js`)
- [x] T076 [US5] Crear rutas lazy `admin-portal/src/app/features/inventory/inventory.routes.ts` (ítems, movimientos, historial, sub-ruta o feature `suppliers` según UX)
- [x] T077 [US5] Registrar rutas inventario/suppliers en `admin-portal/src/app/app.routes.ts`
- [x] T078 [US5] Crear `InventoryListComponent` con badge alertas en `admin-portal/src/app/features/inventory/inventory-list.component.ts`
- [x] T079 [US5] Crear `InventoryItemFormComponent` (diálogo o ruta) para alta/edición de ítem en `admin-portal/src/app/features/inventory/inventory-item-form.component.ts`
- [x] T080 [US5] Crear `SuppliersListComponent` y formulario proveedor en `admin-portal/src/app/features/suppliers/suppliers-list.component.ts`
- [x] T081 [US5] Crear `InventoryMovementFormComponent` con `Idempotency-Key` en `admin-portal/src/app/features/inventory/inventory-movement-form.component.ts`
- [x] T082 [US5] Crear `InventoryMovementsHistoryComponent` listando `GET` de movimientos en `admin-portal/src/app/features/inventory/inventory-movements-history.component.ts`
- [x] T083 [US5] Ocultar formulario movimiento a `VIEWER` en `admin-portal/src/app/features/inventory/inventory-movement-form.component.html`
- [x] T084 [US5] Crear `admin-portal/src/app/features/reports/reports.service.ts` envolviendo endpoints `/reports/*`
- [x] T085 [US5] Crear `ReportsPageComponent` OnPush en `admin-portal/src/app/features/reports/reports-page.component.ts`
- [x] T086 [US5] `DateRangePicker` (Material o dos datepickers) en `admin-portal/src/app/features/reports/reports-page.component.html`
- [x] T087 [US5] Gráfico ocupación apilada Chart.js en `admin-portal/src/app/features/reports/occupancy-stacked-chart.component.ts`
- [x] T088 [US5] Gráfico ingresos tipo pie en `admin-portal/src/app/features/reports/revenue-pie-chart.component.ts`
- [x] T089 [US5] Sección “planes performance” con degradación si falta agregado en `admin-portal/src/app/features/reports/plan-performance-section.component.ts`
- [x] T090 [US5] Export Excel/PDF de vista reporte usando helpers en `admin-portal/src/app/features/reports/reports-page.component.ts`
- [x] T091 [P] [US5] Tests `admin-portal/src/app/features/inventory/inventory.service.spec.ts`

---

## Phase 8: Polish & cross-cutting

- [x] T092 Añadir `aria-label` a iconos de acción en `admin-portal/src/app/features/reservations/`
- [x] T093 Revisar budgets `maximumWarning` en `admin-portal/angular.json` tras nuevas libs
- [x] T094 Actualizar `specs/007-angular-portal-week7/quickstart.md` con rutas finales y smoke por rol (incl. SC-001/SC-002 manuales)
- [x] T095 [P] Eliminar `console.log` en `admin-portal/src/app/features/reservations/**` y `plans/**`

---

## Summary

| Métrica | Valor |
|---------|------:|
| **Total tasks** | 95 |
| **Phase 1 Setup** | 5 (T001–T005) |
| **Phase 2 Foundational** | 9 (T006–T014) |
| **[US1]** | 21 (T015–T035) |
| **[US2]** | 16 (T036–T051) |
| **[US3]** | 11 (T052–T062) |
| **[US4]** | 11 (T063–T073) |
| **[US5]** | 18 (T074–T091) |
| **Polish** | 4 (T092–T095) |

## Format validation

- Cada línea: `- [ ]`, ID `Tnnn`, descripción con ruta bajo `admin-portal/` o `specs/007-angular-portal-week7/`.
- `[US1]`–`[US5]` solo en fases de historias; `[P]` en T004, T014, T035, T051, T062, T091, T095.
