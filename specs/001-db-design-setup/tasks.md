# Tasks: DB Design & Project Setup (Semana 1)

**Input**: Design documents from `/specs/001-db-design-setup/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, contracts/standards.md

## Phase 1: Setup (Project Initialization)
**Purpose**: Initialize the repository structure and base dependencies.

- [X] T001 Initialize backend project structure in `backend/`
- [X] T002 Initialize npm project and install core dependencies (express, knex, pg, joi, winston, dotenv) in `backend/package.json`

---

## Phase 2: Foundational (Backend Infrastructure)
**Purpose**: Core infrastructure required for all feature modules.

- [X] T003 [P] Configure Knex.js with PostgreSQL connection pool for Enterprise scale in `backend/src/config/database.js`
- [X] T004 Create base module scaffolding (auth, rooms, plans, reservations, payments, inventory, media, cms, users, reports) in `backend/src/modules/`
- [X] T005 [P] Implement centralized error handler and custom error classes in `backend/src/middlewares/error-handler.js`
- [X] T006 [P] Implement logging utility for basic text logs and PII-safe full payload capture in `backend/src/utils/logger.js`

**Checkpoint**: Foundation ready - database connection and project structure established.

---

## Phase 3: User Story 1 - Database Schema Initialization (P1)
**Goal**: Implement and execute 10 migrations covering all entities with correct constraints.

**Independent Test**: Run `knex migrate:latest` and verify all tables and relationships in PostgreSQL.

- [X] T007 [P] [US1] Migration 001: `users` + `refresh_tokens` — roles ENUM, avatar, last_login_at in `backend/src/config/migrations/001_users_roles.js`
- [X] T008 [P] [US1] Migration 002: `media_library` + `rooms` (slug, amenities JSONB) + `room_media` in `backend/src/config/migrations/002_rooms_media.js`
- [X] T009 [P] [US1] Migration 003: `plans` (slug, price_unit, max_persons) + `plan_media` + `plan_activities` + `optional_activities` + `plan_optional_activities` in `backend/src/config/migrations/003_plans_activities.js`
- [X] T010 [P] [US1] Migration 004: `seasons` + `availability` (total_slots, blocked_slots, plan_id) in `backend/src/config/migrations/004_availability_seasons.js`
- [X] T011 [P] [US1] Migration 005: `reservations` (5 estados ENUM, customer_phone, adults) + `reservation_activity_snapshot` + `reservation_optional_activities` in `backend/src/config/migrations/005_reservations.js`
- [X] T012 [P] [US1] Migration 006: `payment_attempts` + `payments` (currency, external_id) + `idempotency_keys` (TTL 24h) in `backend/src/config/migrations/006_payments.js`
- [X] T013 [P] [US1] Migration 007: `suppliers` + `inventory_items` (inv_category ENUM) + `inventory_movements` (mov_type ENUM) in `backend/src/config/migrations/007_inventory.js`
- [X] T014 [P] [US1] Migration 008: `site_content` (section+key unique) + `faqs` + `business_config` + `audit_logs` in `backend/src/config/migrations/008_cms_config.js`
- [X] T015 [P] [US1] Migration 009: Índices críticos parciales y compuestos (idx_availability_lookup, idx_reservations_active, idx_inventory_low_stock, etc.) in `backend/src/config/migrations/009_indexes.js`
- [X] T016 [P] [US1] Migration 010: Función `check_availability()` PL/pgSQL + triggers `log_changes()` en tablas críticas + pg_cron cleanup in `backend/src/config/migrations/010_triggers_functions.js`

**Checkpoint**: Database schema fully migrated and verified.

---

## Phase 4: User Story 2 - API Project Foundation (P1)
**Goal**: Establish standard API patterns including health-checks, RBAC, and idempotency skeletons.

**Independent Test**: Invoke `GET /api/v1/health` and verify 200 OK with structured JSON response.

- [X] T017 [US2] Implement standard health-check endpoint `GET /api/v1/health` in `backend/src/app.js`
- [X] T018 [US2] Create base Repository class with transaction support and SELECT FOR UPDATE SKIP LOCKED in `backend/src/modules/base.repository.js`
- [X] T019 [US2] Implement RBAC middleware skeleton (roles verification) in `backend/src/middlewares/auth.guard.js`
- [X] T020 [US2] Implement idempotency middleware skeleton (header check + cache replay) in `backend/src/middlewares/idempotency.js`

**Checkpoint**: Backend API responding with standard formats and middleware placeholders.

---

## Phase 5: Polish & Cross-Cutting Concerns
**Purpose**: Documentation and final compliance audit.

- [X] T021 [P] Configure Swagger UI for API documentation in `backend/src/config/swagger.js`
- [X] T022 Run final audit against Project Constitution and check SC-001/SC-004 targets

---

## Dependencies & Execution Order

### Phase Dependencies
1. **Phase 1 (Setup)**: No dependencies.
2. **Phase 2 (Foundational)**: Depends on Phase 1.
3. **Phase 3 (US1 - Database)**: Depends on Phase 2.
4. **Phase 4 (US2 - API)**: Depends on Phase 2.
5. **Phase 5 (Polish)**: Depends on Phase 4.

### Parallel Opportunities
- Foundational configurations (T003, T005, T006) can run in parallel.
- All migration file creations (T007-T016) can be done in parallel once the Knex config is stable.
- Polish tasks (T021, T022) can run in parallel.

---

## Implementation Strategy

### MVP First (Database & Health Check)
1. Complete Setup and Foundation phases.
2. Execute User Story 1 migrations.
3. Deploy User Story 2 health-check.
4. **VALIDATE**: Run health check and inspect database tables.

### Incremental Delivery
- Each migration adds capabilities: Users → Rooms/Media → Plans/Opcionales → Disponibilidad → Reservas → Pagos → Inventario → CMS → Índices → Triggers
- Skeletons for RBAC and Idempotency ensure Semana 2+ have the correct patterns to follow.
