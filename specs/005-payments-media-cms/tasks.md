# Tasks: Cobros en línea, biblioteca de medios y CMS (MVP Fase 2 — Semana 5)

**Input**: Design documents from `specs/005-payments-media-cms/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)  
**Referencias**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

## Dependency graph (orden de historias)

```text
Phase 1 (Setup) ──► Phase 2 (Foundational)
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
      [US1]            [US4]             [US5]
   crear checkout      medios             CMS
         │            (paralelo          (paralelo
         ▼             opcional)         opcional)
      [US2]
    webhook + confirmación
         ▼
      [US3]
   conciliación
         │
         ▼
   Polish (tests swagger, verificación)
```

**Regla**: [US2] depende de [US1] (intentos en BD + Preference). [US3] depende de [US1]+[US2]. [US4] y [US5] solo dependen de Fase 2 si no comparten archivos bloqueantes; conviene completar Fase 2 antes de abrir PRs en paralelo.

## Parallel execution (mismo sprint)

| Tras completar | Puede ir en paralelo (distintos módulos / archivos) |
|----------------|-----------------------------------------------------|
| Phase 2 | [US4] storage + upload vs [US5] repos CMS (equipos distintos) |
| [US2] | [P] tests de medios + tests CMS mientras se estabiliza conciliación |

## Implementation strategy

1. Cerrar **caminos felices** de pagos (US1 → US2) antes de conciliación fina (US3).  
2. **Medios y CMS** pueden avanzar en paralelo para desbloquear landing en semanas siguientes.  
3. **No** implementar UI Angular en esta lista (fuera de alcance spec).  
4. Cumplir constitución: **tests de integración obligatorios** para flujo de pagos (idempotencia + webhook).

---

## Phase 1: Setup

- [X] T001 Add runtime dependencies `@mercadopago/sdk-node`, `multer`, `sharp` and (if S3 is first provider) `@aws-sdk/client-s3` in `backend/package.json`
- [X] T002 Add startup validation for `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `API_URL`, `LANDING_URL` (and `STORAGE_PROVIDER` + provider keys when storage !== local) in `backend/src/server.js` or new file `backend/src/config/validate-env.js` imported from `server.js`
- [X] T003 [P] **Create** `backend/src/utils/crypto.js` (archivo nuevo en el repo) exporting `hashPaymentIdempotencyKey(reservationId, amount, currency)` returning hex SHA256 per contract; add JSDoc with expected `Idempotency-Key` format for payments

---

## Phase 2: Foundational (blocking)

- [X] T004 Register new idempotency operation key for payments in `backend/src/middlewares/idempotency.js` (e.g. `payment:create`) and export a strict middleware bound to that operation for `POST /payments/create`
- [X] T005 Ensure `POST /api/v1/payments/webhook` receives raw body or correct parsing order: adjust middleware registration in `backend/src/app.js` (document chosen pattern in comment)
- [X] T006 Create module entrypoints `backend/src/modules/payments/payments.routes.js`, `backend/src/modules/media/media.routes.js`, `backend/src/modules/cms/cms.routes.js` with placeholder 501 handlers removed as features land

---

## Phase 3: User Story 1 — Generar enlace de pago (Priority: P1)

**Goal**: `POST /api/v1/payments/create` con `Idempotency-Key`, Preference MP, `payment_attempts`, transición opcional a `PAYMENT_PENDING`.  
**Independent test**: Mismo header Idempotency-Key → misma `preference_id` / replay sin segunda llamada MP (mock en tests).

- [X] T007 [US1] Define Joi schemas for body `{ reservation_id, amount }` and headers in `backend/src/modules/payments/payments.schema.js`
- [X] T008 [US1] Implement Knex access for reservations + `payment_attempts` insert/select by idempotency key in `backend/src/modules/payments/payments.repository.js`
- [X] T009 [US1] Implement `createCheckoutPreference` (SDK MP, `back_urls`, `notification_url`, `external_reference`) + persist attempt + optional `PAYMENT_PENDING` update in `backend/src/modules/payments/payments.service.js`; document in code comments how **PSE / métodos offline** quedan habilitados vía Checkout Pro (sin confirmar reserva hasta webhook `approved`)
- [X] T010 [US1] Implement `createPayment` handler with `authGuard` allowing roles `ADMIN` and `AGENT` in `backend/src/modules/payments/payments.controller.js` (alineado a `CONTEXTO_MAESTRO.md` §9)
- [X] T011 [US1] Wire `POST /create` with strict idempotency + validation + mount `app.use('/api/v1/payments', paymentsRoutes)` uncommented in `backend/src/app.js`

---

## Phase 4: User Story 2 — Webhook y confirmación (Priority: P1)

**Goal**: `POST /api/v1/payments/webhook` responde 200 inmediato, valida firma, deduplica, transacción `payments` + `reservations` → `CONFIRMED`, auditoría.  
**Independent test**: Doble POST webhook con mismo `payment_id` simulado → un solo row en `payments`.

- [X] T012 [US2] Implement MercadoPago manifest signature verification (`x-signature`, timing-safe compare) in `backend/src/modules/payments/mp-webhook.verify.js`
- [X] T013 [US2] Implement `processPaymentNotification` with MP GET payment + exponential backoff retries (1s,2s,4s) + Knex transaction in `backend/src/modules/payments/payments.webhook.service.js`; mapear estados MP `pending` / `in_process` / `rejected` vs `approved` (solo **approved** inserta `payments` y pasa reserva a `CONFIRMED`); asegurar registro en **`audit_logs`** en confirmación (**FR-010**) vía trigger existente o insert explícito documentado
- [X] T014 [US2] Add `postWebhook` in `backend/src/modules/payments/payments.controller.js` that ends response before awaiting heavy work
- [X] T015 [US2] Register `POST /webhook` on `payments.routes.js` without JWT middleware in `backend/src/modules/payments/payments.routes.js`

---

## Phase 5: User Story 4 — Biblioteca de medios (Priority: P1)

**Goal**: Upload con límites, Sharp thumbnails, list/delete con reglas de uso, URLs en storage externo.  
**Independent test**: `POST /media/upload` imagen → `thumbnail_url` no nulo; `DELETE` medio en `room_media` → 409.

- [X] T016 [P] [US4] Implement storage adapter factory (`local` | `s3`) in `backend/src/modules/media/storage/index.js` plus provider files under same folder
- [X] T017 [US4] Add multipart upload middleware with MIME/size limits in `backend/src/middlewares/upload.js` (new) and consume from media routes
- [X] T018 [US4] Implement Sharp thumbnail generation + `media_library` insert in `backend/src/modules/media/media.service.js`
- [X] T019 [US4] Implement repository + controller + routes `POST /upload`, `GET /`, `DELETE /:id` with `authGuard` roles **`ADMIN` y `SUPER_ADMIN`** para mutaciones y lectura de biblioteca según matriz §6 (`backend/src/modules/media/media.repository.js`, `media.controller.js`, `media.routes.js`)
- [X] T020 [US4] Add `POST /:roomId/media` and `DELETE /:roomId/media/:mediaId` handlers using `rooms.repository.js` helpers in `backend/src/modules/rooms/rooms.controller.js` and register paths in `backend/src/modules/rooms/rooms.routes.js`
- [X] T021 [US4] Implement `plan_media` persistence helpers and `POST|DELETE` plan media routes in `backend/src/modules/plans/plans.repository.js`, `plans.controller.js`, `plans.routes.js`

---

## Phase 6: User Story 5 — CMS y contenido público (Priority: P1)

**Goal**: `GET/PUT /site-content/:section` (admin), `GET /site-content/public` sin auth, **`GET /faqs` público** (solo activas), `GET /faqs/manage` con Bearer para CMS admin, FAQs CRUD + reorder.  
**Independent test**: `PUT` hero → `GET /site-content/public` refleja título nuevo sin token; `GET /faqs` sin token devuelve solo `is_active=true` ordenadas.

- [X] T022 [US5] Implement Knex queries for `site_content` and `faqs` in `backend/src/modules/cms/cms.repository.js`
- [X] T023 [US5] Implement section upsert validation + public bundle resolver (resolve `gallery` media IDs to URLs) in `backend/src/modules/cms/cms.service.js`
- [X] T024 [US5] Implement `cms.controller.js`, `cms.schema.js`, and `cms.routes.js` under `backend/src/modules/cms/` including **`GET /faqs`** (público), **`GET /faqs/manage`** (`ADMIN`+`SUPER_ADMIN`), mutaciones FAQ con mismos roles, y reutilización de consultas para el bundle público
- [X] T025 [US5] Mount CMS router at `/api/v1` in `backend/src/app.js` (uncomment or add `app.use('/api/v1', cmsRoutes)` matching contract paths `/site-content/...` and `/faqs/...`)

---

## Phase 7: User Story 3 — Conciliación (Priority: P2)

**Goal**: `GET /payments/reconciliation` solo `ADMIN`, compara intentos vs MP.  
**Independent test**: Mock MP devuelve distinto estado interno → `mismatch: true` en fila.

- [X] T026 [US3] Implement reconciliation query + MP status fetch per attempt in `backend/src/modules/payments/payments.service.js` (or `payments.reconciliation.service.js` if file grows)
- [X] T027 [US3] Expose `GET /reconciliation` with pagination query params in `backend/src/modules/payments/payments.controller.js` and `payments.routes.js` protected by `authGuard` for rol **`ADMIN`** según `CONTEXTO_MAESTRO.md` §9 (implementación: incluir `SUPER_ADMIN` si el guard de roles ya lo trata como superset)

---

## Phase 8: Polish & cross-cutting

- [X] T028 Write integration tests in `backend/tests/integration/payments.test.js`: idempotencia en `POST /payments/create`, webhook feliz + **duplicado**, caso **PSE/pending** (mock MP: no confirmar reserva), firma inválida → sin mutación; aserción **FR-023**: filas `reservation_activity_snapshot` **sin cambios** tras confirmar pago
- [X] T029 [P] Write integration tests for media upload validation + delete conflict in `backend/tests/integration/media.test.js`
- [X] T030 [P] Write integration tests for CMS in `backend/tests/integration/cms.test.js`: `GET /site-content/public`, **`GET /faqs` sin token**, `GET /faqs/manage` 401/403 sin rol; mutaciones CMS/medios rechazadas para roles no autorizados (**SC-006** muestra)
- [X] T031 Add or update swagger-jsdoc blocks for new routes in payment/media/cms modules and ensure tags appear in `backend/src/config/swagger.js` (if central registry exists)
- [ ] T032 Run manual checklist steps from `specs/005-payments-media-cms/quickstart.md` (sandbox MP + tunnel) and fix gaps; **opcional**: en staging, anotar tiempos observados para **SC-001** (creación de enlace en menos de 30 s) y **SC-002** (confirmación en menos de 2 min tras webhook) sin automatizar aún

---

## Summary counts

| Métrica | Valor |
|---------|-------|
| **Total tasks** | 32 |
| **[US1]** | 5 |
| **[US2]** | 4 |
| **[US3]** | 2 |
| **[US4]** | 6 |
| **[US5]** | 4 |
| **Setup + Foundational + Polish** | 11 |
| **Parallel opportunities** | T003, T016, T029, T030 marcados `[P]`; historias US4/US5 en paralelo tras Phase 2 |
| **Suggested MVP slice** | Phase 1–4 ([US1]+[US2]) + T028 |

## Format validation

- Todas las tareas usan el prefijo `- [ ]`, ID `Tnnn`, y rutas relativas al repo (`backend/...`, `specs/...`).
- Etiquetas `[USn]` solo en fases de historias de usuario (Phase 3–7).
- `[P]` solo donde el trabajo es paralelizable sin depender de tareas incompletas del mismo archivo crítico.
