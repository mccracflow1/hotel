# Tasks: Portal Angular — Semana 6 (006)

**Input**: `E:\Proyectos\multi_stage\hotel\specs\006-angular-portal-week6\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)  
**Docs de apoyo**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/README.md](./contracts/README.md), [quickstart.md](./quickstart.md)

> **Estado implementación (2026-04-17):** creado `admin-portal/` con auth, layout, dashboard, rooms y availability; `ng build --configuration development` OK. Pendientes: tests (T064–T065, T084, T122), polish (T126–T129), opcionales T032/T034.

## Grafo de dependencias (historias)

```text
Phase 1 Setup
    │
    ▼
Phase 2 Foundational (config HTTP, shell mínimo, shared UI FR-012)
    │
    ▼
[US1] Autenticación, guards, layout, menú por rol, lazy `/admin/*`
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
[US2] Dashboard  [US3] Rooms   [US4] Availability
    │              │              │
    └──────────────┴──────────────┘
                   ▼
            Phase final Polish
```

- **[US2]**, **[US3]**, **[US4]** dependen de **[US1]** (sesión, interceptor, layout, rutas lazy).
- **[US3]** y **[US4]** pueden desarrollarse en paralelo una vez listo **[US1]** (equipos distintos, archivos mayormente disjuntos).

## Parallel execution (ejemplos)

| Tras completar | Tareas en paralelo `[P]` |
|----------------|---------------------------|
| Phase 2 | Estilos tema vs proxy vs tests de utilidades shared |
| [US1] | Tests `auth.service` vs pulido `login.component` HTML |
| [US1] | [US2] servicio dashboard vs [US3] `rooms.service` (distintos paths) |
| [US3] | Subida media helper vs tabla listado (mismo módulo: coordinar merges) |

## Implementation strategy

1. **MVP**: Phase 1 + Phase 2 + **[US1]** + **[US2]** (login estable + tablero con degradación elegante si falta algún reporte).
2. **Incremento 2**: **[US3]** habitaciones (CRUD + medios + confirmaciones con shared).
3. **Incremento 3**: **[US4]** disponibilidad + temporadas; alinear mensajes de error con contrato API.
4. **Cierre**: Phase Polish (a11y, forbidden, doc `quickstart`, QA manual por rol).

---

## Phase 1: Setup

**Goal**: Workspace `admin-portal/` compilable con Angular, Material y TypeScript estricto.

- [x] T001 Crear workspace Angular con routing y SCSS en `admin-portal/` (`ng new` o CLI equivalente)
- [x] T002 Fijar `engines.node` >= 20 en `admin-portal/package.json`
- [x] T003 Habilitar TypeScript `strict` en `admin-portal/tsconfig.json` y `admin-portal/tsconfig.app.json`
- [x] T004 Configurar `outputPath` de producción en `admin-portal/angular.json` (p. ej. `dist/admin-portal`)
- [x] T005 Ejecutar `ng add @angular/material` y registrar tema en `admin-portal/src/styles.scss`
- [x] T006 [P] Crear `admin-portal/src/styles/_theme.scss` con tokens de color marca (primary/accent/warn)
- [x] T007 [P] Documentar scripts en `admin-portal/README.md` (`start`, `build`, `test`, `lint`)
- [x] T008 [P] Alinear `admin-portal/.editorconfig` con la raíz del monorepo si aplica
- [x] T009 Verificar `ng serve` sin errores desde `admin-portal/`
- [x] T010 [P] Añadir `admin-portal/.gitignore` estándar Angular si el CLI no lo generó completo

---

## Phase 2: Foundational

**Goal**: `provideHttpClient`, entornos, `app.routes` base, `AppComponent` con `router-outlet`, y **componentes shared** (FR-012) usables por US2–US4.

- [x] T011 Crear `admin-portal/src/environments/environment.ts` con `apiUrl` y `production`
- [x] T012 Crear `admin-portal/src/environments/environment.development.ts` con `apiUrl` local
- [x] T013 Crear `admin-portal/src/environments/environment.production.ts` con `apiUrl` de despliegue
- [x] T014 Configurar `fileReplacements` en `admin-portal/angular.json` para `production` y `development`
- [x] T015 Registrar `provideRouter(routes)` en `admin-portal/src/app/app.config.ts` importando `admin-portal/src/app/app.routes.ts`
- [x] T016 Registrar `provideHttpClient(withInterceptors([]))` placeholder en `admin-portal/src/app/app.config.ts`
- [x] T017 Registrar `provideAnimationsAsync()` en `admin-portal/src/app/app.config.ts`
- [x] T018 Definir rutas iniciales stub en `admin-portal/src/app/app.routes.ts` (redirect raíz)
- [x] T019 Asegurar `router-outlet` en `admin-portal/src/app/app.component.html`
- [x] T020 Declarar `AppComponent` standalone en `admin-portal/src/app/app.component.ts` con imports mínimos
- [x] T021 Ajustar `admin-portal/src/main.ts` con `bootstrapApplication(AppComponent, appConfig)`
- [x] T022 Ajustar `admin-portal/src/index.html` (title, viewport, `lang="es"`)
- [x] T023 [P] Crear `admin-portal/proxy.conf.json` y anotar uso en `specs/006-angular-portal-week6/quickstart.md`
- [x] T024 Crear `DataTableComponent` standalone en `admin-portal/src/app/shared/components/data-table/data-table.component.ts`
- [x] T025 Implementar plantilla `MatTable` + `MatPaginator` en `admin-portal/src/app/shared/components/data-table/data-table.component.html`
- [x] T026 Emitir eventos `pageChange` / `sortChange` desde `admin-portal/src/app/shared/components/data-table/data-table.component.ts`
- [x] T027 Crear `DialogService` en `admin-portal/src/app/shared/ui/dialog.service.ts` (wrapper `MatDialog`)
- [x] T028 Crear `ConfirmDialogComponent` en `admin-portal/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- [x] T029 Crear `ToastService` en `admin-portal/src/app/shared/ui/toast.service.ts` usando `MatSnackBar`
- [x] T030 Crear `LoadingSpinnerComponent` en `admin-portal/src/app/shared/components/loading-spinner/loading-spinner.component.ts`
- [x] T031 Crear directiva `HasRoleDirective` en `admin-portal/src/app/shared/auth/has-role.directive.ts` (standalone, `inject(AuthService)`)
- [ ] T032 [P] Exportar barrel opcional `admin-portal/src/app/shared/index.ts` solo si mejora imports sin romper lint
- [x] T033 Ejecutar `ng build` en `admin-portal/` para validar tree y paths
- [ ] T034 [P] Añadir regla ESLint path alias `@app/*` en `admin-portal/eslint.config.js` o `admin-portal/.eslintrc.json` si el equipo lo usa

---

## Phase 3: User Story 1 — Iniciar sesión y recuperar sesión (P1) `[US1]`

**Goal**: Login, refresh silencioso, logout, tokens en memoria, guards, layout, menú por rol, lazy loading (FR-001–FR-003, FR-013).  
**Prueba independiente**: Cada rol ve menú acorde a §6; 401 → refresh → un retry; URL interna sin sesión → `/admin/login`.

- [x] T035 [US1] Crear tipos `UserRole`, `AuthSession`, `LoginRequest` en `admin-portal/src/app/core/auth/auth.models.ts`
- [x] T036 [US1] Crear `AuthService` en `admin-portal/src/app/core/auth/auth.service.ts` (`providedIn: 'root'`, signals de sesión)
- [x] T037 [US1] Implementar `login()` → `POST {apiUrl}/auth/login` en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T038 [US1] Guardar access token solo en memoria (signal privado) en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T039 [US1] Implementar `logout()` → `POST {apiUrl}/auth/logout` y limpiar estado en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T040 [US1] Implementar `refresh()` → `POST {apiUrl}/auth/refresh` con `withCredentials: true` en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T041 [US1] Implementar cola single-flight de refresh en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T042 [US1] Crear `authInterceptor` como `HttpInterceptorFn` en `admin-portal/src/app/core/auth/auth.interceptor.ts`
- [x] T043 [US1] Registrar `authInterceptor` en `admin-portal/src/app/app.config.ts` dentro de `withInterceptors([authInterceptor])`
- [x] T044 [US1] Adjuntar `Authorization` a requests bajo `apiUrl` en `admin-portal/src/app/core/auth/auth.interceptor.ts`
- [x] T045 [US1] Manejar `401` con refresh + **un** retry en `admin-portal/src/app/core/auth/auth.interceptor.ts`
- [x] T046 [US1] Excluir `/auth/login` y `/auth/refresh` del flujo de refresh en `admin-portal/src/app/core/auth/auth.interceptor.ts`
- [x] T047 [US1] Crear `authGuard` en `admin-portal/src/app/core/auth/auth.guard.ts` redirigiendo a `/admin/login`
- [x] T048 [US1] Crear `roleGuard` en `admin-portal/src/app/core/auth/role.guard.ts` leyendo `route.data['roles']`
- [x] T049 [US1] Si el JWT no expone `role`, añadir `loadProfile()` vía `GET {apiUrl}/users/me` en `admin-portal/src/app/core/auth/auth.service.ts`
- [x] T050 [US1] Crear `LoginComponent` en `admin-portal/src/app/features/auth-login/login.component.ts` (+ `.html`, `.scss`)
- [x] T051 [US1] Definir rutas en `admin-portal/src/app/features/auth-login/login.routes.ts`
- [x] T052 [US1] Formulario reactivo email/password con validadores en `admin-portal/src/app/features/auth-login/login.component.ts`
- [x] T053 [US1] Deshabilitar submit mientras `authenticating` en `admin-portal/src/app/features/auth-login/login.component.html`
- [x] T054 [US1] Mapear errores API a mensaje usuario en `admin-portal/src/app/features/auth-login/login.component.ts`
- [x] T055 [US1] Navegar a `/admin/dashboard` tras login en `admin-portal/src/app/features/auth-login/login.component.ts`
- [x] T056 [US1] Crear `MainLayoutComponent` en `admin-portal/src/app/core/layout/main-layout.component.ts` con sidenav + `router-outlet`
- [x] T057 [US1] Crear `SidebarComponent` en `admin-portal/src/app/core/layout/sidebar.component.ts`
- [x] T058 [US1] Definir `NavItem[]` y filtro por rol en `admin-portal/src/app/core/layout/nav.config.ts`
- [x] T059 [US1] Ocultar entrada Habitaciones para roles sin permiso en `admin-portal/src/app/core/layout/nav.config.ts`
- [x] T060 [US1] Crear `TopbarComponent` en `admin-portal/src/app/core/layout/topbar.component.ts` con email/rol y logout
- [x] T061 [US1] Montar rutas `/admin` con `MainLayoutComponent` + hijos lazy en `admin-portal/src/app/app.routes.ts`
- [x] T062 [US1] Aplicar `authGuard` a rutas bajo `/admin` en `admin-portal/src/app/app.routes.ts`
- [x] T063 [US1] Aplicar `roleGuard` + `data: { roles: [...] }` a ruta lazy `rooms` en `admin-portal/src/app/app.routes.ts`
- [ ] T064 [P] [US1] Tests básicos en `admin-portal/src/app/core/auth/auth.service.spec.ts` (login 200 / 401)
- [ ] T065 [P] [US1] Tests básicos en `admin-portal/src/app/core/auth/auth.guard.spec.ts`

---

## Phase 4: User Story 2 — Tablero operativo (P1) `[US2]`

**Goal**: KPIs, gráfica ocupación 7 días, próximas reservas, polling ~30s, skeletons, degradación si falta endpoint (FR-004, FR-005).  
**Prueba independiente**: Cifras alineadas a `GET /api/v1/reports/*` y reservas; tarjetas toleran fallo parcial.

- [x] T066 [US2] Crear `DashboardComponent` OnPush en `admin-portal/src/app/features/dashboard/dashboard.component.ts`
- [x] T067 [US2] Crear `admin-portal/src/app/features/dashboard/dashboard.routes.ts` con `path: ''`
- [x] T068 [US2] Registrar lazy dashboard en `admin-portal/src/app/app.routes.ts` bajo layout autenticado
- [x] T069 [US2] Crear `DashboardService` en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T070 [US2] Implementar `fetchOccupancyReport(from, to)` → `GET {apiUrl}/reports/occupancy` en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T071 [US2] Implementar `fetchRevenueReport(from, to)` → `GET {apiUrl}/reports/revenue` en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T072 [US2] Implementar `fetchInventoryReport(...)` → `GET {apiUrl}/reports/inventory` en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T073 [US2] Implementar conteo reservas hoy vía `GET {apiUrl}/reservations` con filtros fecha en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T074 [US2] Implementar `fetchUpcomingReservations(limit)` → `GET {apiUrl}/reservations` en `admin-portal/src/app/features/dashboard/dashboard.service.ts`
- [x] T075 [US2] Orquestar carga KPIs con `forkJoin`/`combineLatest` en `admin-portal/src/app/features/dashboard/dashboard.component.ts`
- [x] T076 [US2] Manejar error parcial por tarjeta sin tumbar pantalla en `admin-portal/src/app/features/dashboard/dashboard.component.ts`
- [x] T077 [US2] UI: 4 `mat-card` KPI en `admin-portal/src/app/features/dashboard/dashboard.component.html`
- [x] T078 [US2] UI: skeletons o placeholders en `admin-portal/src/app/features/dashboard/dashboard.component.html`
- [x] T079 [US2] Crear `OccupancyChartComponent` en `admin-portal/src/app/features/dashboard/occupancy-chart.component.ts` (Chart.js)
- [x] T080 [US2] Serie últimos 7 días desde datos occupancy en `admin-portal/src/app/features/dashboard/occupancy-chart.component.ts`
- [x] T081 [US2] Destruir instancia Chart en `ngOnDestroy` en `admin-portal/src/app/features/dashboard/occupancy-chart.component.ts`
- [x] T082 [US2] Tabla próximas reservas con `MatTable` en `admin-portal/src/app/features/dashboard/dashboard.component.html`
- [x] T083 [US2] Polling ~30s con cleanup en `admin-portal/src/app/features/dashboard/dashboard.component.ts`
- [ ] T084 [P] [US2] Tests HTTP en `admin-portal/src/app/features/dashboard/dashboard.service.spec.ts`

---

## Phase 5: User Story 3 — Gestionar habitaciones (P1) `[US3]`

**Goal**: Lista server-side, filtros, formulario, fotos, amenities, toggle con confirmación; VIEWER sin CRUD (FR-006–FR-008, FR-014).  
**Prueba independiente**: CRUD + medios verificados en API; 403 o UI bloqueada para VIEWER.

- [x] T085 [US3] Crear `RoomsService` en `admin-portal/src/app/features/rooms/rooms.service.ts`
- [x] T086 [US3] Crear `admin-portal/src/app/features/rooms/rooms.routes.ts` (`''`, `new`, `:id/edit`)
- [x] T087 [US3] Registrar lazy rooms con `roleGuard` ADMIN/SUPER_ADMIN en `admin-portal/src/app/app.routes.ts`
- [x] T088 [US3] Crear `RoomsListComponent` OnPush en `admin-portal/src/app/features/rooms/rooms-list.component.ts`
- [x] T089 [US3] Llamar `GET {apiUrl}/rooms` con query paginación en `admin-portal/src/app/features/rooms/rooms.service.ts`
- [x] T090 [US3] Conectar paginador a cambios de página en `admin-portal/src/app/features/rooms/rooms-list.component.ts`
- [x] T091 [US3] Búsqueda debounced hacia query `q` en `admin-portal/src/app/features/rooms/rooms-list.component.ts`
- [x] T092 [US3] Filtros tipo/estado si el API los expone en `admin-portal/src/app/features/rooms/rooms-list.component.ts`
- [x] T093 [US3] Botón “Nueva habitación” condicionado por rol en `admin-portal/src/app/features/rooms/rooms-list.component.html`
- [x] T094 [US3] Integrar `DataTableComponent` o `MatTable` coherente con shared en `admin-portal/src/app/features/rooms/rooms-list.component.html`
- [x] T095 [US3] Crear `RoomFormComponent` en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T096 [US3] Mapear campos al contrato backend en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T097 [US3] POST `POST {apiUrl}/rooms` en alta en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T098 [US3] PATCH `PATCH {apiUrl}/rooms/:id` en edición en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T099 [US3] Vista previa y lista ordenable de imágenes en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T100 [US3] Subir binario `POST {apiUrl}/media/upload` desde helper en `admin-portal/src/app/features/rooms/rooms-media.helper.ts`
- [x] T101 [US3] Asociar `POST {apiUrl}/rooms/:id/media` en `admin-portal/src/app/features/rooms/rooms.service.ts`
- [x] T102 [US3] Persistir orden y `is_cover` según contrato en `admin-portal/src/app/features/rooms/room-form.component.ts`
- [x] T103 [US3] Amenities con `MatChipGrid` en `admin-portal/src/app/features/rooms/room-form.component.html`
- [x] T104 [US3] Toggle activo/inactivo con `DialogService` + `ConfirmDialogComponent` en `admin-portal/src/app/features/rooms/rooms-list.component.ts`
- [x] T105 [US3] Llamar endpoint de estado acorde OpenAPI backend en `admin-portal/src/app/features/rooms/rooms.service.ts`

---

## Phase 6: User Story 4 — Disponibilidad y temporadas (P1) `[US4]`

**Goal**: Calendario mensual, detalle día, bloqueos, temporadas CRUD; VIEWER sin mutaciones; errores solape claros (FR-009–FR-011, FR-014–FR-015).  
**Prueba independiente**: Navegar meses, bloqueo persistido, temporada creada; VIEWER no muta.

- [x] T106 [US4] Crear `AvailabilityService` en `admin-portal/src/app/features/availability/availability.service.ts`
- [x] T107 [US4] Crear `admin-portal/src/app/features/availability/availability.routes.ts`
- [x] T108 [US4] Registrar lazy availability con `authGuard` en `admin-portal/src/app/app.routes.ts`
- [x] T109 [US4] Crear `AvailabilityShellComponent` con pestañas en `admin-portal/src/app/features/availability/availability-shell.component.ts`
- [x] T110 [US4] Implementar `getCalendar(from, to)` → `GET {apiUrl}/availability/calendar` en `admin-portal/src/app/features/availability/availability.service.ts`
- [x] T111 [US4] Crear `CalendarGridComponent` en `admin-portal/src/app/features/availability/calendar-grid.component.ts`
- [x] T112 [US4] Navegación mes prev/sig en `admin-portal/src/app/features/availability/calendar-grid.component.ts`
- [x] T113 [US4] Clases `cell--low|med|high` en `admin-portal/src/app/features/availability/calendar-grid.component.scss`
- [x] T114 [US4] Crear `DayDetailComponent` en `admin-portal/src/app/features/availability/day-detail.component.ts` abriéndose desde click celda
- [x] T115 [US4] Crear `BlockDatesComponent` → `POST {apiUrl}/availability/block` en `admin-portal/src/app/features/availability/block-dates.component.ts`
- [x] T116 [US4] Ocultar acciones de bloqueo para `VIEWER` (y según maestro `BUSINESS`) en `admin-portal/src/app/features/availability/block-dates.component.ts`
- [x] T117 [US4] Crear `SeasonsListComponent` con `GET {apiUrl}/seasons` en `admin-portal/src/app/features/availability/seasons-list.component.ts`
- [x] T118 [US4] Crear `SeasonFormComponent` con `POST {apiUrl}/seasons` en `admin-portal/src/app/features/availability/season-form.component.ts`
- [x] T119 [US4] Edición `PUT {apiUrl}/seasons/:id` en `admin-portal/src/app/features/availability/season-form.component.ts`
- [x] T120 [US4] Borrado `DELETE {apiUrl}/seasons/:id` con confirmación vía `admin-portal/src/app/shared/ui/dialog.service.ts`
- [x] T121 [US4] Mostrar errores de solape/validación del API en `admin-portal/src/app/features/availability/season-form.component.ts`
- [ ] T122 [P] [US4] Tests HTTP en `admin-portal/src/app/features/availability/availability.service.spec.ts`

---

## Phase 7: Polish & cross-cutting

**Goal**: A11y básica, errores de autoría, documentación operativa.

- [x] T123 Añadir `aria-label` a controles icon-only en `admin-portal/src/app/core/layout/topbar.component.html`
- [x] T124 Crear `ForbiddenComponent` en `admin-portal/src/app/shared/pages/forbidden.component.ts` y ruta en `admin-portal/src/app/app.routes.ts`
- [x] T125 Revisar contraste celdas en `admin-portal/src/app/features/availability/calendar-grid.component.scss`
- [ ] T126 Centralizar mapeo `HttpErrorResponse` → toast en `admin-portal/src/app/core/http/error-mapper.ts` (opcional) y usar en servicios
- [x] T127 Actualizar `specs/006-angular-portal-week6/quickstart.md` con puertos, proxy y variables reales post-implementación
- [ ] T128 Documentar checklist QA manual por rol en `admin-portal/MANUAL-QA.md`
- [ ] T129 [P] Eliminar `console.log` temporales en `admin-portal/src/app/features/**`

---

## Summary

| Métrica | Valor |
|---------|------:|
| **Total tasks** | 129 |
| **[US1]** | 31 (T035–T065) |
| **[US2]** | 19 (T066–T084) |
| **[US3]** | 21 (T085–T105) |
| **[US4]** | 17 (T106–T122) |
| **Setup + Foundational + Polish** | 41 |
| **Oportunidades `[P]`** | T006–T008, T010, T023, T032, T034, T064–T065, T084, T122, T129 |

## Format validation

- Todas las líneas usan `- [ ]`, ID `Tnnn`, descripción con ruta bajo `admin-portal/` o `specs/006-angular-portal-week6/`.
- `[US1]`–`[US4]` solo en fases de historias de usuario.
- `[P]` solo donde el paralelismo es razonable (archivos o concerns distintos).

## Suggested MVP scope

**Solo User Story 1 + User Story 2** tras Phase 1–2: portal autenticado con tablero. Luego US3 y US4 como incrementos.

---

## Extension Hooks

**Optional Pre-Hook**: git  
Command: `/speckit.git.commit`  
Description: Auto-commit before task generation  
Prompt: Commit outstanding changes before task generation?  
To execute: `/speckit.git.commit`

**Optional Hook**: git  
Command: `/speckit.git.commit`  
Description: Auto-commit after task generation  
Prompt: Commit task changes?  
To execute: `/speckit.git.commit`
