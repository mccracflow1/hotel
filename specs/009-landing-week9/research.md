# Research — 009 Landing Week 9 (solo C5)

**Fecha**: 2026-04-17  

## R-001 — Detalle de plan por slug vs UUID

**Decision**: Exponer resolución estable por **slug** en la API pública (`GET /api/v1/plans/by-slug/:slug` con el mismo comportamiento de visibilidad que `GET /plans/:id`: solo planes activos para anónimos; admins autenticados ven inactivos si aplica la misma regla que `getPlan`).

**Rationale**: La spec exige URL amigable; hoy `GET /plans/:id` acepta UUID y `listPublic` ya incluye `slug` en filas, pero el detalle rico (`base_activities`, `optional_activities`, room vinculada, medios) requiere `getDetail`. Resolver por slug evita que la landing cargue todo el catálogo para mapear slug → id.

**Alternatives considered**:

- Resolver solo en cliente con `GET /public/plans` y filtrar por slug — **rechazado** si el listado marketing no trae opcionales ni actividades base en profundidad (payload incompleto y más bytes).
- Usar `GET /plans/:id` con id en query string (`?slug=`) — **rechazado** por semántica REST y riesgo de colisión con `:id` UUID.

## R-002 — Reserva web sin sesión de portal (anónimo)

**Decision**: Añadir rutas **`POST /api/v1/public/reservations`** (y opcionalmente **`POST /api/v1/public/payments/create`** o reutilizar lógica interna compartida) **sin** `authGuard` de usuario portal, con **controles compensatorios**: `Idempotency-Key` obligatorio, **rate limiting** por IP (y opcionalmente por fingerprint leve), validación Joi estricta, reutilización del **mismo servicio de dominio** que `POST /reservations` (snapshots + transacción + bloqueo de disponibilidad) con **actor de auditoría** documentado (p. ej. `null` + `set_config` específico para canal `WEB_PUBLIC` o usuario técnico solo servidor — ver tarea en plan).

**Rationale**: Hoy `POST /api/v1/reservations` exige roles `AGENT|ADMIN|BUSINESS` (`reservations.routes.js`). La landing pública no tiene JWT de esos roles; exponer el mismo endpoint sin auth rompería RBAC. Un namespace `/public/*` acota el riesgo y permite políticas distintas (solo crear, sin listar).

**Alternatives considered**:

- Incrustar token AGENT en el build de la landing — **rechazado** (secreto expuesto, viola IV).
- BFF en Netlify Functions con secreto — **viable** pero duplica lógica y despliegue; **no** alineado a “API única” salvo que se documente como capa obligatoria; para este proyecto se prefiere **API Node** con rate limit.

## R-003 — Inicio de pago desde la landing

**Decision**: Tras `201` de reserva pública, la landing llama **`POST /api/v1/public/payments/create`** (o nombre equivalente) que valida que la reserva está en estado que permite checkout, que el `amount` coincide con `total_amount`, emite preferencia MP y devuelve `checkout_url` — misma lógica que `payments.service.createCheckoutPreference` con **idempotencia** y sin requerir rol `ADMIN`/`AGENT` del portal, sustituido por **comprobación de tenencia**: por ejemplo `reservation_id` + **token opaco de un solo uso** devuelto en la respuesta de creación de reserva (hash en BD o JWT de cortísima vida firmado por servidor).

**Rationale**: `POST /payments/create` actual exige `authGuard` + `ADMIN|AGENT` (`payments.routes.js`). El huésped no tiene esas credenciales.

**Alternatives considered**:

- Solo redirigir con `preference_id` si MP lo permitiera sin servidor — **no** aplica; la creación de preferencia ocurre en backend.

## R-004 — Estructura de archivos de la landing

**Decision**: Mantener **vanilla JS** en `landing-page/` coherente con constitución: extender `app.js` por secciones o dividir en `scripts/home.js`, `scripts/plan-detail.js`, `scripts/chat-widget.js` según mantenibilidad; **Tailwind CDN** en HTML; páginas estáticas `plan.html` (detalle por query `?slug=`), `success.html`, `failure.html`, `pending.html` **o** una sola `checkout-result.html?status=` — preferir **tres archivos** alineados a `CONTEXTO_MAESTRO.md` §12 y a `LANDING_URL/success` ya usado en MP `back_urls` (verificar que rutas físicas coincidan con `LANDING_URL` en env).

**Rationale**: MP `back_urls` en código usan `${landingBase}/success` (sin `.html`). Netlify debe servir esa ruta (`success.html` en raíz con rewrite, o `success/index.html`).

**Alternatives considered**:

- SPA con router — **rechazado** por stack declarado (HTML estático).

## R-005 — Widget de chat y Markdown seguro

**Decision**: `chat-widget.js` — clase única; `fetch` POST a `window.CHAT_WEBHOOK_URL`; sesión `sessionStorage`; render de respuestas con **lista blanca** (regex muy acotada o **DOMPurify** desde CDN con perfil estricto `ALLOWED_TAGS`) — **sin** `innerHTML` de markdown crudo sin sanitizar.

**Rationale**: Cumple FR-009 / SC-005 (anti-XSS).

**Alternatives considered**:

- `marked.js` sin sanitizar — **rechazado**.

## R-006 — CORS y orígenes

**Decision**: Asegurar en `backend` que el origen de `LANDING_URL` esté en la lista CORS para `POST` públicos con preflight; en dev, `localhost` del puerto de la landing.

**Rationale**: Sin esto el flujo falla en navegador.

## R-007 — Alcance MCP (explicitamente fuera)

**Decision**: No investigar ni diseñar herramientas MCP en esta carpeta; el agente web puede compartir webhook con flujo n8n existente solo a nivel de **URL configurable**.

**Rationale**: Acuerdo con `spec.md` §Alcance.

## R-008 — Alineación constitución §IV vs reserva pública

**Decision**: La constitución del proyecto incorpora (v1.2.0) la subsección **“Public Web Acquisition Channel”**: escrituras anónimas permitidas solo en la superficie HTTP documentada, con idempotencia obligatoria, rate limit y mismos servicios de dominio que el portal.

**Rationale**: Cierra el hallazgo CRITICAL del análisis Speckit entre JWT obligatorio para operadores y visitantes sin sesión.

**Alternatives considered**: BFF con secreto en Netlify — pospone el problema; se prefiere API Node explícita.
