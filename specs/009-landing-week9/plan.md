# Implementation Plan: Landing Semana 9 — reserva web, chat y resultados de pago (009)

**Branch**: `009-landing-week9` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Especificación funcional 009 (solo C5; **sin** MCP/C6)

## Summary

Completar el **sitio público** para: (1) **ficha de plan** por URL amigable con medios, actividades base de solo lectura, opcionales con **total dinámico**, formulario de reserva validado y continuidad hacia **checkout**; (2) **widget de chat** embebido con sesión estable, indicador de escritura, render seguro de texto enriquecido y **tarjeta de pago** cuando el backend del chat lo indique; (3) **páginas de resultado** de pago alineadas a `back_urls` de MercadoPago.

**Enfoque técnico**: mantener **HTML + Tailwind CDN + JS vanilla** en `landing-page/`. La constitución exige **API como única fuente de verdad**: la landing no inventa precios ni disponibilidad. Hoy **no existen** endpoints públicos anónimos para **crear reservas** ni **crear preferencias de pago** (`reservations.routes.js` y `payments.routes.js` exigen JWT con roles restringidos); este plan incorpora un **módulo de API pública acotado** (`/api/v1/public/...` adicional o sub-rutas dedicadas) que **reutiliza servicios de dominio** existentes, con **idempotencia**, **rate limiting** y **token de tenencia** para el paso de pago (ver `research.md` R-002 / R-003).

## Technical Context

| Área | Elección |
|------|-----------|
| **Landing** | HTML5, Tailwind (CDN), JS vanilla — `landing-page/app.js` hoy orquesta home S8 |
| **API** | Node.js 20 + Express 5 — extender con rutas públicas controladas |
| **Pagos** | MercadoPago Checkout Pro ya integrado; `LANDING_URL` + `API_URL` obligatorios para URLs |
| **Chat** | Webhook HTTPS externo (n8n u otro); variable `CHAT_WEBHOOK_URL` en runtime |
| **SEO / hosting** | Netlify (estático + `_redirects`); meta básicos ya en home |
| **Pruebas** | Integración API para flujo reserva+pago público; manual E2E landing + MP sandbox |

## Constitution Check

*GATE: cumplir antes de implementar writes públicos. Re-verificado post-diseño.*

| Principio | Estado | Notas |
|-----------|--------|--------|
| **I. API-First** | ✅ | Toda mutación y lectura autoritativa vía API; sin acceso directo a BD desde la landing |
| **II. Idempotency** | ✅ | `POST /public/reservations` y `POST /public/payments/create` **DEBEN** exigir `Idempotency-Key`; reutilizar middleware existente donde aplique |
| **III. Snapshots** | ✅ | Creación de reserva delega en servicio actual que persiste snapshots inmutables |
| **IV. RBAC / Security** | ✅ | Constitución **v1.2.0**: *Public Web Acquisition Channel* — `POST` anónimo solo bajo `/api/v1/public/...` con idempotencia, rate limit, delegación a servicios existentes y auditoría `WEB_PUBLIC`. |
| **V. MCP / IA autonomy** | N/A (alcance 009) | El **widget web** habla con webhook HTTPS; no sustituye MCP para Sofia. La constitución **v1.2.0** aclara que MCP sigue gobernando el **agente**; el chat embebido es canal de presentación. |
| **VI. Angular signals** | N/A | Solo admin |

**Complejidad / excepción documentada**

| Violación aparente | Por qué se necesita | Alternativa descartada |
|--------------------|---------------------|-------------------------|
| Escritura pública sin login | El visitante no es usuario del portal | Token AGENT en frontend — inseguro |

## Estado actual (post Semana 8)

- **Home**: `landing-page/index.html` + `app.js` consumen bundle CMS, `/public/rooms`, `/public/plans`, `/faqs`.
- **Planes en home**: tarjetas sin enlace a detalle ni slug en UI.
- **Detalle de plan**: `GET /api/v1/plans/:id` ya devuelve `base_activities` y `optional_activities` con `optionalAuth` (público OK para activos); falta resolución por **slug** y navegación desde la home.
- **Reserva / pago**: rutas actuales **no** sirven al huésped anónimo — ver `research.md`.

## Workstreams y tareas detalladas

### WS-A — Backend: superficie pública segura

#### A.1 Descubrimiento y alineación de contrato

1. Releer `reservations.controller.js` / `reservations.service.js` y schema Joi de creación: lista exacta de campos, nombres y reglas (`plan_id` vs `room_id`, fechas, ocupación, opcionales).
2. Releer `payments.service.js` `createCheckoutPreference` y respuesta al cliente.
3. Documentar en `contracts/README.md` cualquier desviación respecto a la tabla propuesta una vez cerrados nombres de campos.

#### A.2 `GET /plans/by-slug/:slug`

1. En `plans.repository.js` agregar `findPlanBySlug(slug)` (activo, `deleted_at` null).
2. En `plans.service.js` exponer `getDetailBySlug(slug)` reutilizando `getPlanDetail` interno por id resuelto.
3. En `plans.routes.js` registrar **antes** de `/:id`: `router.get('/by-slug/:slug', optionalAuth, controller.getPlanBySlug)`.
4. Controller: mismas reglas `is_active` que `getPlan`.
5. **Swagger**: anotar path y 404.
6. **Test integración**: slug válido → 200 con `optional_activities`; slug inexistente → 404; plan inactivo anónimo → 404.

#### A.3 `POST /api/v1/public/reservations`

1. Nuevo archivo de rutas p.ej. `public-booking.routes.js` montado en `app.js` como `app.use('/api/v1/public', ...)` — **cuidado**: ya existe `public-catalog.routes.js` en `/api/v1/public`; **unificar** en un solo `public.routes.js` que agrupe `GET .../rooms`, `GET .../plans`, **nuevos** POST, **o** montar `public-booking` en `/api/v1/public-booking` para no romper paths existentes. **Recomendación del plan**: extender el router actual `public-catalog` renombrado a `public-site.routes.js` o agregar en el mismo router los POST (semántica REST bajo el mismo prefix `/api/v1/public`).
2. Middleware **dedicado** `publicReservationRateLimit` (límites más bajos que auth).
3. Reutilizar `idempotencyReservationCreate` si encaja sin `req.user` — ajustar middleware si hoy asume usuario (set audit): permitir `user_id` null con `set_config('app.audit_channel', 'WEB_PUBLIC')` o similar consumido por triggers.
4. Handler que valida body con **mismo schema** que creación interna (importar Joi compartido).
5. Invocar **función de servicio** compartida con `createReservation` (refactor extraer `createReservationCore(payload, meta)` si hoy está acoplado a `req.user`).
6. Respuesta: incluir `reservation_number`, `total_amount`, `status`, `id` y **`payment_intent_token`** (si se implementa R-003): generar JWT firmado HS256 de corta duración **o** fila en tabla `reservation_public_checkout_tokens` (reservation_id, token_hash, expires_at).
7. **Tests**: idempotencia replay, 409 sin cupo, 400 cuerpo inválido, 429 rate limit (mock reloj o muchas peticiones en test si hay infra).

#### A.4 `POST /api/v1/public/payments/create`

1. Nuevo handler que valida `reservation_id`, `amount`, `payment_intent_token`.
2. Verificar token no expirado y que `reservation_id` coincide; estado permite pago; `amount` === `total_amount`.
3. Llamar `createCheckoutPreference` existente.
4. Reutilizar `idempotencyPaymentCreate`.
5. **Tests**: token inválido → 403; monto distinto → 400; éxito → 201 con `checkout_url`.

#### A.5 CORS, logging y observabilidad

1. Añadir origen de la landing a configuración CORS.
2. Log estructurado en creación pública (sin datos sensibles completos — enmascarar teléfono/documento en logs).

#### A.6 Swagger / OpenAPI

1. Documentar los tres endpoints nuevos con ejemplos y cabeceras.

---

### WS-B — Landing: navegación y ficha de plan

#### B.1 Enrutado estático

1. **Netlify `_redirects`** o `nginx.conf` del Docker de landing: rutas `/planes/*` → `plan.html` (o query única) manteniendo slug en path si se desea SEO (`/planes/romantica-2-noches` → `plan.html` con rewrite que preserve slug en `window.location` o parse del path).
2. Alternativa MVP: `plan.html?slug=romantica-2-noches` sin rewrite; menos SEO pero más simple.

#### B.2 Home — enlaces a ficha

1. En `renderPlans` de `app.js`, envolver cada card en `<a href="/planes/${encodeURIComponent(p.slug)}">` (o `plan.html?slug=`) usando `slug` devuelto por `/public/plans` — verificar que `listPlansMarketing` incluye `slug` en JSON; si no, ampliar `listPlansPublic` select.
2. Accesibilidad: foco visible, `aria` en cards.

#### B.3 Página `plan.html` (o template equivalente)

1. Markup: secciones — hero del plan, galería/video, descripción larga, bloque habitación, lista actividades base (solo lectura), lista opcionales con `input type=checkbox`, `input type=number` cantidad (min 1 cuando está marcado), **sticky summary** con total estimado.
2. **JS** (`plan-detail.js` o sección en `app.js`):
   - Leer slug de URL.
   - `fetch GET ${API_BASE_URL}/plans/by-slug/${slug}` (una vez exista endpoint) o fallback temporal `GET /plans/:id` si se pasa uuid.
   - Función pura `computeTotal(plan, selectedMap)` — debe coincidir con la lógica mostrada en spec (base + sum(qty*price)); mostrar disclaimer “total confirmado al reservar”.
3. **Formulario de reserva**: campos mínimos alineados al schema backend; validación HTML5 + JS (email, teléfono, fechas `min`/`max`).
4. **Submit**:
   - Generar / reusar `Idempotency-Key` en `sessionStorage` por “intento de checkout” o nuevo UUID por submit explícito (documentar UX: doble click).
   - `POST ${API_BASE_URL}/public/reservations` con body JSON.
   - Éxito: guardar `payment_intent_token` + ids; llamar `POST /public/payments/create`; `window.location = checkout_url`.
   - Errores: mapear `409`, `422`, `429` a mensajes en español rioplatense según tono del hotel (configurable desde CMS opcional — fuera de MVP).
5. **Medios**: imágenes `loading="lazy"`; video `<video controls>` o iframe según tipo de URL en payload.
6. **Accesibilidad**: labels asociados, `aria-live="polite"` en total.

#### B.4 Coherencia visual

1. Reutilizar paleta y tipografía de `index.html`.
2. Probar 360px y 1280px (criterio spec S8 extendido).

---

### WS-C — Landing: widget de chat

#### C.1 `scripts/chat-widget.js` (o `landing-page/chat-widget.js`)

1. Clase `HotelChatWidget` como en `CONTEXTO_MAESTRO.md` §12 — adaptar a módulo IIFE + export global `window.HotelChatWidget`.
2. UI: botón flotante, panel, lista de mensajes, input, botón enviar, estado “Sofia está escribiendo…”.
3. `sessionId` en `sessionStorage`.
4. `fetch( CHAT_WEBHOOK_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...})})` con manejo de red y timeout.
5. **Sanitización**: integrar **DOMPurify** (CDN) antes de asignar HTML; si solo texto plano del modelo, escapar y usar `white-space: pre-wrap`.
6. **Tarjeta de pago**: si `payment_url` + `reservation_number`, renderizar card con CTA “Pagar” (`rel="noopener noreferrer"` si abre nueva pestaña).
7. Inyectar script desde `index.html` y `plan.html` (y páginas de resultado si aplica).

#### C.2 Seguridad

1. CSP recomendado en headers del hosting (al menos `default-src 'self'; script-src 'self' https://cdn.tailwindcss.com ...` — ajustar según CDNs usados).
2. No usar `eval`; no inyectar scripts desde respuesta del bot.

---

### WS-D — Páginas de resultado de pago

#### D.1 Archivos estáticos

1. Crear `success.html`, `failure.html`, `pending.html` con layout común (mismo `styles` / Tailwind CDN), mensajes claros y CTA “Volver al inicio” → `/`.
2. Opcional: leer query params de MP para mostrar “Referencia …” sin confiar en ellos para lógica de negocio.
3. Alinear rutas con `LANDING_URL` usado en backend.

#### D.2 Animación / UX

1. Animación sutil CSS (p. ej. `transition` en ícono) — sin dependencias.

---

### WS-E — Calidad, pruebas y documentación

#### E.1 Automatizados backend

1. Nuevo archivo bajo `backend/tests/integration/public-booking.test.js` (nombre ajustar al estándar del repo).
2. Casos listados en A.2–A.4.

#### E.2 Manual / E2E

1. Script en `quickstart.md` (ya esbozado) — ejecutar checklist antes de merge.
2. Opcional: issue de follow-up para Playwright.

#### E.3 README raíz `landing-page/README.md`

1. Actualizar con nuevas páginas, variables `window`, flujo MP.

---

## Fases de entrega sugeridas

| Fase | Contenido | Criterio de “hecho” |
|------|-------------|---------------------|
| **F0** | A.2 + B.1 + B.2 + B.3 lectura | Detalle de plan navegable desde home sin reserva aún |
| **F1** | A.3 + B.3 submit reserva | Reserva creada en BD desde landing (sandbox) |
| **F2** | A.4 + flujo redirect MP | Preferencia creada y redirección a MP sandbox |
| **F3** | D.* páginas resultado | URLs de retorno MP muestran páginas coherentes |
| **F4** | C.* widget + sanitización | Chat usable + prueba XSS manual negativa |
| **F5** | Swagger + tests CI + README | Documentación y verdes en pipeline |

## Matriz de trazabilidad Spec → implementación

| Req spec | Entregable principal |
|-----------|----------------------|
| FR-001 | `GET /plans/by-slug/:slug` + enlaces home |
| FR-002–FR-004 | `plan.html` + JS de render y total |
| FR-005–FR-007 | Formulario + `POST /public/reservations` + manejo errores |
| FR-008–FR-010 | `chat-widget.js` + HTML embed |
| FR-011 | `success/failure/pending` + alineación `LANDING_URL` |
| SC-001–SC-005 | E2E manual + tests API + revisión sanitización |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Abuso de `POST /public/reservations` | Rate limit + captcha futuro (documentar backlog) |
| Desincronización total UI vs servidor | Mostrar `total_amount` devuelto por API post-creación |
| MP `back_urls` incorrectas | Checklist `quickstart.md` + variable `LANDING_URL` |
| XSS vía chat | DOMPurify + CSP |
| Express orden de rutas `:id` vs `by-slug` | Tests de regresión |

## Dependencias entre equipos / orden

1. Backend **A.2** antes de landing definitiva por slug.  
2. **A.3** antes de submit real.  
3. **A.4** después de token de tenencia acordado.  
4. Chat (**C**) puede desarrollarse en paralelo a **A.3** si el contrato del webhook ya existe en n8n (fuera de repo).

## Project Structure (actualizado para esta feature)

### Documentación (`specs/009-landing-week9/`)

```text
specs/009-landing-week9/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md          # generado por /speckit.tasks
```

### Código fuente a tocar (previsto)

```text
backend/src/
├── app.js                          # montaje router público extendido
├── modules/plans/                  # by-slug
├── modules/reservations/           # refactor servicio compartido si aplica
├── modules/payments/               # sin romper create actual admin/agent
├── modules/public-catalog/       # o nuevo módulo public unificado
├── middlewares/                    # rate limit público
└── tests/integration/

landing-page/
├── index.html
├── plan.html                       # nuevo
├── success.html | failure.html | pending.html
├── app.js                          # enlaces + posible split
├── chat-widget.js                  # nuevo
├── nginx.conf                      # rewrites si Docker
└── README.md
```

## Post-plan: agent context

Ejecutar desde la raíz del repo:

```powershell
.specify\scripts\powershell\update-agent-context.ps1 -AgentType cursor-agent
```

## Readiness

- ✅ `research.md` — sin NEEDS CLARIFICATION pendiente; decisiones cerradas para implementar.
- ✅ `data-model.md` + `contracts/README.md` + `quickstart.md`.
- ⏭ Siguiente comando sugerido: **`/speckit.tasks`** para desgranar en tickets con IDs y orden topológico.
