# Tasks: Autenticación JWT, RBAC y Módulo de Disponibilidad

**Input**: Design documents from `/specs/002-jwt-auth-disponibilidad/`
**Prerequisites**: plan.md ✓ | spec.md ✓ | data-model.md ✓ | contracts/ ✓ | research.md ✓ | quickstart.md ✓
**Branch**: `002-jwt-auth-disponibilidad`
**Last updated**: 2026-04-16 (post-analysis remediation — issues C1, I1, C2, C3, C4, A1, I2, A2, U1, U2, U3 addressed)

---

## Summary

| Phase | User Story | Tasks | Parallelizable |
|-------|-----------|-------|----------------|
| 1 — Setup | — | T001–T004 | T002, T003 |
| 2 — Foundational Middleware | — | T005–T007 | T005, T006 |
| 3 — Auth Module | US1 + US2 | T008–T013 | T008, T009 |
| 4 — Disponibilidad (lectura) | US3 | T014–T019 | T014, T015 |
| 5 — Disponibilidad (escritura) + Temporadas | US4 | T020–T024 | T020, T021 |
| 6 — Integration Tests | US1–US4 | T025–T027 | T025, T026 |
| 7 — Polish | — | T028–T030 | T028 |

**Total tasks**: 30
**MVP scope**: Phases 1–3 (US1 + US2) → login funcional con RBAC

> **Nota FR-015**: La validación de `Idempotency-Key` en creación de reservas está fuera del alcance de esta feature. El middleware ya existe (Semana 1). Se valida en feature `003-reservaciones`.
> **Nota FR-009**: El acceso del rol AGENT a `POST /reservations` y `POST /payments/link` se verifica en `003-reservaciones` y `004-pagos`. Esta feature solo emite el token AGENT.

---

## Phase 1: Setup

> Instalar dependencias nuevas, configurar entorno, crear migration de password reset tokens y seed inicial.

- [x] T001 Install new npm packages in `backend/`: `jsonwebtoken bcrypt cookie-parser express-rate-limit node-cache nodemailer uuid` (prod) + `supertest` (dev)
- [x] T002 [P] Add JWT and SMTP env vars to `backend/.env.example`: `JWT_SECRET` (min 64 chars), `JWT_REFRESH_SECRET` (min 64 chars, diferente de JWT_SECRET), `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`, `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM=noreply@hotel.com`
- [x] T003 [P] Create idempotent admin seed at `backend/seeds/001_admin_user.js`: uses `onConflict('email').ignore()` — no duplicate on re-run
- [x] T004 Create migration `backend/src/config/migrations/011_password_reset_tokens.js`: table with `id UUID PK`, `user_id UUID FK→users ON DELETE CASCADE`, `token_hash VARCHAR(255) UNIQUE`, `expires_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`

---

## Phase 2: Foundational Middleware

> Infraestructura transversal que US1–US4 dependen. Completar antes de cualquier módulo.

- [x] T005 [P] Implement `authGuard` and `requireRoles(...roles)` in `backend/src/middlewares/auth.guard.js`
- [x] T006 [P] Create `backend/src/middlewares/rate-limit.js` exporting `authLimiter` — aplica únicamente a `POST /api/v1/auth/login`
- [x] T007 Add `cookie-parser` middleware to `backend/src/app.js`

---

## Phase 3: Auth Module (US1 — Login y Sesión, US2 — RBAC)

> Independent test: `POST /api/v1/auth/login` con credenciales válidas → body contiene `accessToken` + Set-Cookie con httpOnly `refreshToken`. `POST /seasons` con token VIEWER → 403 FORBIDDEN.

- [x] T008 [P] [US1] Implement Joi validation schemas in `backend/src/modules/auth/auth.schema.js`: `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- [x] T009 [P] [US1] Implement `backend/src/modules/auth/auth.repository.js` with all auth DB methods including `password_reset_tokens` CRUD
- [x] T010 [US1] Implement `backend/src/modules/auth/auth.service.js`: login, logout, refresh (con rotación + detección de reutilización), forgotPassword (graceful degradation SMTP), resetPassword, generateAgentToken
- [x] T011 [US1] Implement `backend/src/modules/auth/auth.controller.js` with all handlers
- [x] T012 [US1] Implement `backend/src/modules/auth/auth.routes.js` with authLimiter on /login
- [x] T013 [US2] Mount auth routes in `backend/src/app.js`

---

## Phase 4: Módulo Disponibilidad — Lectura (US3)

> Independent test: Consulta con temporada activa → `precio_efectivo = base_price × multiplicador`. `GET /calendar` sin auth → 401.

- [x] T014 [P] [US3] Implement Joi schemas in `backend/src/modules/availability/availability.schema.js`: `queryAvailabilitySchema`, `calendarSchema`, `configureSlotsSchema`, `blockDatesSchema`
- [x] T015 [P] [US3] Implement `backend/src/modules/seasons/seasons.schema.js` and `backend/src/modules/seasons/seasons.repository.js`
- [x] T016 [US3] Implement `backend/src/modules/availability/availability.repository.js`: `checkAvailability` (calls PL/pgSQL via knex.transaction), `findWithPricing`, `getCalendarData`, `upsertAvailability`, `blockDateRange`
- [x] T017 [US3] Implement `backend/src/modules/availability/availability.service.js`: `getAvailability`, `getCalendar` (node-cache TTL 60s), `invalidateCalendarCache`, `configureSlots`, `blockDates`
- [x] T018 [US3] Implement GET handlers in `backend/src/modules/availability/availability.controller.js`
- [x] T019 [US3] Implement `backend/src/modules/availability/availability.routes.js` and mount at `/api/v1/availability` in `app.js`

---

## Phase 5: Módulo Disponibilidad — Escritura + Temporadas (US4)

> Independent test: Crear temporada con multiplicador 1.4 → consultar disponibilidad para fecha dentro del rango → `precio_efectivo = base_price × 1.4`.

- [x] T020 [P] [US4] Implement complete seasons module: `backend/src/modules/seasons/seasons.service.js`, `seasons.controller.js`, `seasons.routes.js` — invalida node-cache al crear/actualizar/eliminar
- [x] T021 [P] [US4] Write methods already implemented in `availability.service.js` (configureSlots, blockDates) and `availability.repository.js` (upsertAvailability, blockDateRange)
- [x] T022 [US4] POST handlers in `backend/src/modules/availability/availability.controller.js`
- [x] T023 [US4] POST routes in `backend/src/modules/availability/availability.routes.js`
- [x] T024 [US4] Mount seasons routes at `/api/v1/seasons` in `backend/src/app.js`

---

## Phase 6: Integration Tests

> Tests de integración con supertest. Cada archivo corre de forma independiente.

- [x] T025 [P] Write auth integration tests in `backend/tests/auth.test.js`: login, credenciales inválidas, usuario inactivo, rate limiting, refresh, reutilización, logout, RBAC (VIEWER→403, sin token→401, JWT expirado→401), bcrypt rounds >= 12
- [x] T026 [P] Write availability integration tests in `backend/tests/availability.test.js`: endpoint público, precio con temporada, calendar (sin auth→401, con auth→200), caché spy, concurrencia (2 llamadas simultáneas → 1 slot), configureSlots, seasons CRUD
- [x] T027 Write load test script at `backend/tests/load-availability.sh` (autocannon -c 50 -d 10, valida p95 < 1000ms)

---

## Phase 7: Polish

> Validaciones finales, documentación Swagger y auditoría de constitución.

- [ ] T028 [P] Update `backend/src/config/swagger.js` with OpenAPI 3.0 schemas for auth, availability, and seasons endpoints
- [x] T029 Add JWT_SECRET length assertion in `backend/src/server.js`: fails fast with `process.exit(1)` if JWT_SECRET or JWT_REFRESH_SECRET < 64 chars (NFR-004)
- [ ] T030 Run constitution audit: verify no direct DB access in controllers, authGuard+requireRoles on all protected endpoints, audit_logs trigger on users table, PII_FIELDS covers password_hash, bcrypt.getRounds >= 12

---

## Dependency Graph

```
T001 → T002, T003 (paralelos)
T001 → T004 (migración 011 — prerequisito de T009)
       ↓
T005, T006 (paralelos) → T007
                          ↓
T008, T009 (paralelos) → T010 → T011 → T012 → T013
                                                  ↓
T014, T015 (paralelos) → T016 → T017 → T018 → T019
                                                  ↓
T020, T021 (paralelos) → T022 → T023 → T024
                                          ↓
T025, T026 (paralelos) → T027
                            ↓
T028, T029 (paralelos) → T030
```

## User Story Completion Criteria

| Story | Complete When | Gate |
|-------|--------------|------|
| US1 (Login/Sesión) | T008–T013 done + T025 green | `POST /auth/login` retorna accessToken + httpOnly cookie |
| US2 (RBAC) | T005 done + T013 done + T025 RBAC tests green | VIEWER → 403 en POST /seasons |
| US3 (Disponibilidad lectura) | T014–T019 done + T026 (GET + cache tests) green | Temporada × multiplicador en precio_efectivo |
| US4 (Disponibilidad escritura) | T020–T024 done + T026 (concurrencia test) green | 1 slot → solo 1 llamada exitosa a checkAvailability |

## Parallel Execution Examples

### Phase 3 (Auth Module)
```bash
# Parallel: T008 (schema) + T009 (repository)
# Then sequential: T010 → T011 → T012 → T013
```

### Phase 4 (Disponibilidad lectura)
```bash
# Parallel: T014 (availability.schema) + T015 (seasons.schema + seasons.repository)
# Then sequential: T016 → T017 → T018 → T019
```

### Phase 5 (Escritura + Seasons)
```bash
# Parallel: T020 (seasons module completo) + T021 (availability write methods)
# Then sequential: T022 → T023 → T024
```

## Implementation Strategy

**MVP (Phases 1–3)**: Login funcional con RBAC completo → el equipo del hotel puede usar el portal con autenticación real desde el día 1.

**Increment 2 (Phase 4)**: Disponibilidad en tiempo real → landing page y agente IA de WhatsApp pueden consultar disponibilidad con precios correctos.

**Increment 3 (Phases 5–7)**: Configuración de temporadas, bloqueos, tests y polish → operación completa del módulo de disponibilidad.
