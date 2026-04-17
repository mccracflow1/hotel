# Tasks: 009 Landing Week 9 — reserva web, chat y resultados de pago

**Input**: `specs/009-landing-week9/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/README.md`, `quickstart.md`)  
**Branch**: `009-landing-week9`

## Implementation strategy

1. Completar **Phase 2 (Foundational)** antes de cualquier historia de usuario en landing que llame a `POST` públicos.  
2. **MVP sugerido**: Phase 2 + **solo [US1]** hasta reserva creada y redirect a checkout (sin chat ni páginas resultado finas).  
3. **[US2]** y **[US3]** pueden avanzar en paralelo **después** de que exista `GET /plans/by-slug/:slug` (para probar navegación); el chat no depende del booking público.

## Dependency graph (historias)

```text
Phase 2 (Foundational API)
        ├──► [US1] Detalle plan + reserva + pago redirect
        ├──► [US2] Widget chat (paralelo a US1 tras T012–T016 mínimo si no probás chat en plan page)
        └──► [US3] Páginas resultado MP (paralelo a US1; solo requiere archivos estáticos + LANDING_URL)
```

## Phase 1: Setup (contratos y alineación)

- [x] T001 Align `specs/009-landing-week9/contracts/README.md` body field names with `backend/src/modules/reservations/reservations.schema.js` (create reservation schema) and remove any placeholder once aligned
- [x] T002 Add MP `back_urls` path checklist and env table row to `specs/009-landing-week9/quickstart.md` after verifying `backend/src/modules/payments/payments.service.js` `back_urls` shape

## Phase 2: Foundational (backend — bloquea US1 submit)

- [x] T003 [P] Add `findPlanBySlug(slug)` in `backend/src/modules/plans/plans.repository.js` (active, `deleted_at` null)
- [x] T004 Add `getDetailBySlug(slug)` delegating to `getPlanDetail` in `backend/src/modules/plans/plans.service.js`
- [x] T005 Add `getPlanBySlug` handler mirroring `getPlan` visibility rules in `backend/src/modules/plans/plans.controller.js`
- [x] T006 Register `GET /by-slug/:slug` **before** `GET /:id` in `backend/src/modules/plans/plans.routes.js`
- [x] T007 Document `GET /plans/by-slug/:slug` in `backend/src/config/swagger.js` (or plans swagger module if split)
- [x] T008 Add integration tests for plan by-slug (200 active, 404 unknown, 404 inactive anonymous) in `backend/tests/integration/plans-by-slug.test.js`
- [x] T009 Add Knex migration for `reservation_public_checkout_tokens` (reservation_id, token_hash, expires_at, created_at) in `backend/src/config/migrations/`
- [x] T010 Add token create/validate helpers in `backend/src/modules/public-booking/public-booking.repository.js` (new file)
- [ ] T011 Refactor `backend/src/modules/reservations/reservations.service.js` to expose internal `createReservationFromPayload(payload, meta)` callable without portal `req.user` (preserve snapshots + trx)
- [x] T012 Add Joi body schema for public reservation in `backend/src/modules/public-booking/public-booking.schema.js` (new file; reuse shared keys with existing create schema)
- [x] T013 Add `POST /reservations` handler + rate-limit + idempotency wiring in `backend/src/modules/public-booking/public-booking.controller.js` (new file)
- [x] T014 Add dedicated rate limiter middleware in `backend/src/middlewares/public-booking-rate-limit.js` (new file) and apply only to public booking routes
- [ ] T015 Adjust `backend/src/middlewares/idempotency.js` (and/or `backend/src/utils/audit-context.js`) so public create records audit channel `WEB_PUBLIC` without forging a user JWT
- [x] T016 Create **new** file `backend/src/modules/public-booking/public-booking.routes.js` exporting an Express `Router` with `POST /reservations` (rate-limit + idempotency + controller handler); mount that router in `backend/src/app.js` on **`/api/v1/public`** immediately **after** the existing public catalog router so `GET /public/rooms` and `GET /public/plans` keep precedence (canonical paths: `specs/009-landing-week9/contracts/README.md`)
- [x] T017 Add `POST /payments/create` public handler (token + amount validation) in `backend/src/modules/public-booking/public-booking.controller.js` calling `payments.service.createCheckoutPreference`
- [x] T018 Add `POST /payments/create` to the **same** `backend/src/modules/public-booking/public-booking.routes.js` with `idempotencyPaymentCreate` middleware wired to the handler from `public-booking.controller.js`
- [x] T019 Add `cors` package configuration in `backend/src/app.js` (or new `backend/src/config/cors.js`) allowing origin from `process.env.LANDING_URL` origin for `POST`/`OPTIONS`
- [x] T020 Document public endpoints + headers in `backend/src/config/swagger.js`
- [ ] T021 Add integration test happy path `POST /api/v1/public/reservations` → `201` in `backend/tests/integration/public-booking.test.js` (new file)
- [ ] T022 Add integration test idempotency replay same `Idempotency-Key` returns same reservation in `backend/tests/integration/public-booking.test.js`
- [ ] T023 Add integration test `POST /api/v1/public/payments/create` invalid token → 403 in `backend/tests/integration/public-booking.test.js`
- [ ] T024 Add integration test `POST /api/v1/public/payments/create` success → `201` + `checkout_url` in `backend/tests/integration/public-booking.test.js`

## Phase 3: User Story 1 — Detalle de plan y reserva web (P1) [US1]

**Goal**: Visitante abre ficha por slug, ve opcionales y total en vivo, envía reserva anónima y llega a checkout MP.  
**Independent test**: E2E manual en `specs/009-landing-week9/quickstart.md` sección flujo sin usar chat.

- [x] T025 [P] [US1] Add Netlify `_redirects` or update `landing-page/nginx.conf` for `/planes/*` → `plan.html` preserving slug path segment
- [x] T026 [US1] Verify `slug` is present in JSON of `GET /api/v1/public/plans` response; if missing from serialization, fix `backend/src/modules/public-catalog/public-catalog.service.js` or `backend/src/modules/plans/plans.repository.js` `listPlansPublic` selected fields
- [x] T027 [US1] Wrap each plan card in link to `/planes/<slug>` in `landing-page/app.js` inside `renderPlans`
- [x] T028 [US1] Add new static page markup `landing-page/plan.html` (sections: hero, media, room, base activities read-only, optionals, summary, form)
- [x] T029 [US1] Add `landing-page/plan-detail.js` implementing slug parse from `window.location`, `fetch` to `GET ${API_BASE_URL}/plans/by-slug/:slug`, and `computeTotal` + `aria-live` total binding
- [x] T030 [US1] Wire `landing-page/plan.html` with `<script defer src="./plan-detail.js">` and shared Tailwind CDN pattern from `landing-page/index.html`
- [x] T031 [US1] Implement reservation form fields + HTML5/JS validation matching `public-booking.schema.js` in `landing-page/plan-detail.js`
- [x] T032 [US1] Implement `POST` submit with `Idempotency-Key` header (UUID) and JSON body to **`${API_BASE_URL}/public/reservations`** (canonical) in `landing-page/plan-detail.js`
- [x] T033 [US1] On reservation success, call `POST` **`${API_BASE_URL}/public/payments/create`** with `payment_intent_token` and redirect to `checkout_url` in `landing-page/plan-detail.js`
- [x] T034 [US1] Map API errors (`409`, `422`, `429`, network) to user-visible Spanish messages in `landing-page/plan-detail.js`
- [x] T035 [US1] Add responsive QA notes (360px / 1280px) for `landing-page/plan.html` in `landing-page/README.md`

## Phase 4: User Story 2 — Widget de chat (P1) [US2]

**Goal**: Chat flotante, sesión estable, typing indicator, markdown seguro, tarjeta de pago si el webhook responde con campos.  
**Independent test**: Mock webhook con respuesta JSON fija; verificar `sessionStorage` y ausencia de XSS al inyectar `<script>` en respuesta.

- [x] T036 [P] [US2] Create `landing-page/chat-widget.js` with IIFE + `window.HotelChatWidget` class (UI shell: toggle, panel, list, input, send)
- [x] T037 [US2] Read `window.CHAT_WEBHOOK_URL` and post `{ sessionId, message, channel: 'web' }` from `landing-page/chat-widget.js`
- [x] T038 [US2] Load DOMPurify from CDN in `landing-page/index.html` and sanitize bot HTML before render in `landing-page/chat-widget.js`
- [x] T039 [US2] Implement typing indicator and user/bot bubble styles in `landing-page/chat-widget.js`
- [x] T040 [US2] Render payment CTA card when response includes `payment_url` and `reservation_number` in `landing-page/chat-widget.js`
- [x] T041 [US2] Instantiate `new HotelChatWidget()` on DOMContentLoaded in `landing-page/index.html` via inline defer script or small `landing-page/init-chat.js`
- [x] T042 [US2] Repeat chat script includes + init for `landing-page/plan.html`
- [ ] T043 [US2] Document `CHAT_WEBHOOK_URL` contract in `landing-page/README.md`

## Phase 5: User Story 3 — Resultados de pago (P2) [US3]

**Goal**: Páginas estáticas coherentes con `LANDING_URL/success|failure|pending` used by MercadoPago `back_urls`.  
**Independent test**: Open each HTML directly in browser; verify copy + link home.

- [x] T044 [P] [US3] Create `landing-page/success.html` with Tailwind CDN, success copy, CTA link to `/`
- [x] T045 [P] [US3] Create `landing-page/failure.html` with failure copy + retry/contact CTA
- [x] T046 [P] [US3] Create `landing-page/pending.html` with pending copy + CTA
- [x] T047 [US3] Optional: read-only display of safe query params from MP in `landing-page/success.html` / `landing-page/failure.html` / `landing-page/pending.html` via small inline script (no trust in params for business logic)
- [x] T048 [US3] Update `landing-page/nginx.conf` (or `_redirects`) so `/success` maps to `success.html` if MP paths are extensionless (match `backend/src/modules/payments/payments.service.js`)

## Phase 6: Polish & cross-cutting

- [x] T049 Sync final request/response shapes into `specs/009-landing-week9/contracts/README.md` from implemented controllers
- [x] T050 Update root `landing-page/README.md` with full S9 file list, env vars (`API_BASE_URL`, `CHAT_WEBHOOK_URL`, `PRIVACY_POLICY_URL`), and manual E2E checklist
- [ ] T051 Run through `specs/009-landing-week9/quickstart.md` manual flow including **SC-001** timer and **SC-002** table; annotate gaps in `specs/009-landing-week9/quickstart.md` if any

## Phase 7: Hardening — hallazgos speckit.analyze (2026-04-17)

- [x] T052 [US1] Extend `backend/src/modules/plans/plans.repository.js` `getPlanDetail` (y por tanto `getDetailBySlug`) para hidratar **`plan_media`** (URLs) y campos necesarios a FR-002 (galería / video / cover) si aún no llegan en el JSON público
- [x] T053 [US1] Actualizar `specs/009-landing-week9/data-model.md` con tabla **payload → UI** e implementar en `landing-page/plan-detail.js` + `landing-page/plan.html` el render de `long_desc`, galería, video y bloque habitación
- [ ] T054 [US1] Add integration cases in `backend/tests/integration/public-booking.test.js` for **tres combinaciones distintas** de opcionales verificando que `data.total_amount` coincide con la suma esperada (base + opcionales) — **SC-002**
- [ ] T055 [US2] Document and execute manual **XSS** procedure in `landing-page/README.md`: respuesta bot con `<script>…</script>` no debe ejecutarse — **SC-005**; registrar fecha/revisor (procedimiento documentado en `landing-page/README.md`; falta ejecución humana + firma)
- [x] T056 [P] [US2] Add **CSP** recommendations and optional `Content-Security-Policy` header (commented template) in `landing-page/nginx.conf` for CDNs used (Tailwind, DOMPurify)
- [x] T057 [US1] Add **privacy policy** link using `window.PRIVACY_POLICY_URL` fallback `#` in `landing-page/plan.html` and `landing-page/index.html`
- [x] T058 [US1] Centralize `PUBLIC_RESERVATIONS_PATH = '/public/reservations'` and `PUBLIC_PAYMENTS_PATH = '/public/payments/create'` in `landing-page/plan-detail.js` matching `specs/009-landing-week9/contracts/README.md` only

---

## Summary

| Métrica | Valor |
|---------|--------|
| **Total tasks** | 58 |
| **Phase 1 Setup** | 2 |
| **Phase 2 Foundational** | 22 |
| **[US1] tasks** | 16 (T025–T035, T052–T054, T057–T058) |
| **[US2] tasks** | 10 (T036–T043, T055–T056) |
| **[US3] tasks** | 5 (T044–T048) |
| **Polish** | 3 (T049–T051) |
| **Extra hardening (Phase 7)** | 7 tareas T052–T058 (cerrado análisis 009) |
| **Marked [P]** | 7 |

## Parallel execution examples

- After **T006** completes: **T007** (swagger) and **T008** (tests) can proceed in parallel with different files.
- After **T012** completes: **T014** (rate-limit file) and **T009** (migration) can proceed in parallel `[P]`.
- **T044–T046** can be implemented in parallel once copy is agreed.
- **T036** (chat widget file) can start in parallel with **T025–T030** after **T003–T006** exist (slug fetch), but **T042** must wait for `plan.html` scaffold (**T028**).

## Format validation

All **58** tasks use `- [ ] Tnnn` with explicit repository paths under `backend/`, `landing-page/`, or `specs/009-landing-week9/`; user-story tasks include `[US1]`, `[US2]`, or `[US3]` where aplica (Phase 7 mezcla hardening con historias).
