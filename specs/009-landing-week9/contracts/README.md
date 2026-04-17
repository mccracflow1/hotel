# Contratos HTTP — extensión pública landing (009)

> Complementa `CONTEXTO_MAESTRO.md` §9. Los endpoints **ya existentes** que la landing puede usar sin autenticación hoy incluyen (entre otros):  
> `GET /api/v1/site-content/public`, `GET /api/v1/public/rooms`, `GET /api/v1/public/plans`, `GET /api/v1/faqs`, `GET /api/v1/plans/:id` (**optionalAuth** — anónimo permitido para plan activo).

## Decisión canónica — prefijo URL (sin ambigüedad)

Todas las mutaciones públicas de reserva/pago de esta feature usan el **mismo prefijo** que el catálogo público existente:

| Uso | Método | Ruta canónica |
|-----|--------|----------------|
| Crear reserva (visitante) | POST | `/api/v1/public/reservations` |
| Crear preferencia de pago (visitante, con token de tenencia) | POST | `/api/v1/public/payments/create` |

La landing (`plan-detail.js` y tests) **DEBE** usar solo estas rutas relativas a `API_BASE_URL`. El router se implementa montando un `Router` adicional en el mismo prefijo `/api/v1/public` **después** de las rutas `GET` del catálogo para no sombrear `GET /public/rooms` y `GET /public/plans`.

## Nuevos / ajustados (propuesta de implementación — alinear con Swagger al codificar)

### Catálogo

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/plans/by-slug/:slug` | No | Detalle de plan activo por `slug`; **404** si inactivo o borrado. Misma forma que `GET /plans/:id` (`data` con `base_activities`, `optional_activities`, room, medios). |

**Nota de implementación**: colocar la ruta **antes** de `GET /plans/:id` en el router si Express interpreta `by-slug` como `:id`.

### Reserva pública

| Método | Ruta | Auth | Cabeceras | Descripción |
|--------|------|------|-----------|-------------|
| POST | `/api/v1/public/reservations` | No | `Idempotency-Key` **obligatorio** | Crea reserva en nombre del visitante. Body alineado a `backend/src/modules/reservations/reservations.schema.js` → `createReservationSchema`. Rate limit por IP (`PUBLIC_BOOKING_RESERVE_MAX`). |

**Body JSON** (`createReservationSchema`):

| Campo | Tipo | Notas |
|-------|------|--------|
| `plan_id` | UUID \| null | Exactamente uno de `plan_id` o `room_id` |
| `room_id` | UUID \| null | Idem |
| `customer_name` | string | requerido |
| `customer_document` | string | requerido |
| `customer_email` | email \| null | |
| `customer_phone` | string | requerido |
| `date_start` | `YYYY-MM-DD` | requerido |
| `date_end` | `YYYY-MM-DD` \| null | |
| `adults` | int ≥ 1 | requerido |
| `children` | int ≥ 0 | default 0 |
| `notes` | string \| null | |
| `optional_activity_ids` | UUID[] | default `[]`; solo si `plan_id` |

**Respuesta `201`**: `data` con `id`, `reservation_number`, `total_amount`, `status`, `plan_id`, `room_id`, **`payment_intent_token`** (plaintext una sola vez; hash en BD).

### Pago público (checkout)

| Método | Ruta | Auth | Cabeceras | Descripción |
|--------|------|------|-----------|-------------|
| POST | `/api/v1/public/payments/create` | No | `Idempotency-Key` | Body: `{ reservation_id, amount, payment_intent_token }` (`public-booking.schema.js`). Valida token opaco y montos; delega en `createCheckoutPreference`; invalida tokens tras éxito. |

### Errores

Mantener envelope estándar `{ error: { code, message, details } }`:

- `429` — rate limit.
- `400` — validación / idempotency faltante.
- `409` — sin disponibilidad u conflicto de negocio.
- `503` — MP no configurado (igual que flujo admin).

### Webhook MercadoPago

Sin cambio de contrato: `POST /api/v1/payments/webhook` (firma / verificación existentes).

### Chat web (no REST del repo Node)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `{CHAT_WEBHOOK_URL}` (n8n u otro) | Cuerpo JSON mínimo: `{ sessionId, message, channel: "web" }`. Respuesta esperada por la landing documentada en `quickstart.md` (contrato de integración externa). |
