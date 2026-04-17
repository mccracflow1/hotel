# Data Model — Pagos, medios y CMS (Semana 5)

**Feature**: `005-payments-media-cms`  
**Fuente de verdad SQL**: `CONTEXTO_MAESTRO.md` §7 (tablas `payment_attempts`, `payments`, `media_library`, `room_media`, `plan_media`, `site_content`, `faqs`).

## 1. Pagos

### `payment_attempts`

| Campo | Uso en esta feature |
|-------|---------------------|
| `id` | PK |
| `reservation_id` | FK — toda Preference debe estar ligada a una reserva |
| `idempotency_key` | UNIQUE — misma clave → mismo intento / replay |
| `preference_id` | ID devuelto por MercadoPago |
| `checkout_url` | URL de redirección al checkout |
| `status` | `pending`, `approved`, `rejected`, `expired` (strings según dominio MP mapeados) |
| `expires_at` | Si MP devuelve TTL o regla propia de expiración de preferencia |

**Reglas**

- INSERT solo si pasan validaciones de reserva + monto + rol.
- `idempotency_key` obligatorio vía middleware de idempotencia para `POST /payments/create`.

### `payments`

| Campo | Uso |
|-------|-----|
| `reservation_id` | Una fila de cobro confirmado por reserva en MVP (ajustar si el negocio exige pagos parciales en el futuro) |
| `amount` | Debe coincidir con monto aprobado en MP (tolerancia 0 — moneda COP entera) |
| `currency` | `COP` default |
| `payment_method` | `mercadopago_checkout`, `pse`, etc. derivado de MP |
| `external_id` | `payment` id MP — **deduplicación** por UNIQUE si se añade constraint, o comprobar antes de INSERT |

**Transición de reserva (webhook aprobado)**

1. `BEGIN`
2. `SELECT … FROM payments WHERE external_id = ? FOR UPDATE` (o equivalente) — si existe → `COMMIT` noop.
3. `INSERT payments`
4. `UPDATE reservations SET status = 'CONFIRMED', updated_at = now() WHERE id = ? AND status IN ('PENDING','PAYMENT_PENDING')`
5. `INSERT audit_logs` (operación sobre `reservations` / `payments` según trigger existente + `user_id` NULL si es sistema)
6. `COMMIT`

**Estados de reserva relacionados**

| Estado antes | Evento | Estado después |
|--------------|--------|----------------|
| `PENDING` | Preference creada OK | `PAYMENT_PENDING` (recomendado en research) |
| `PAYMENT_PENDING` | Pago aprobado | `CONFIRMED` |
| `PENDING` | Pago aprobado directo (sin paso intermedio) | `CONFIRMED` (aceptable si se omite PAYMENT_PENDING) |
| `CONFIRMED` | Webhook duplicado | sin cambio |
| `CANCELLED` | Webhook | no confirmar pago; log warn |

> **Nota de implementación**: alinear con enum real en migraciones Knex del repo (`reservation_status`).

---

## 2. Medios

### `media_library`

- `filename`, `original_url`, `thumbnail_url` (nullable si video/youtube), `file_type`, `mime_type`, `size_bytes`, `uploaded_by` → `users.id`.

### `room_media` / `plan_media`

- PK compuesta (`room_id`,`media_id`) / (`plan_id`,`media_id`).
- `is_cover`, `sort_order`.

**Eliminación**

- `DELETE /media/:id` permitido solo si **no** existe en `room_media`, `plan_media`, ni referenciado por `optional_activities.media_id`, ni en valores `site_content` tipo lista/galería (consulta por `media_id` en JSON — puede requerir query JSONB o tabla de vínculos; MVP: deny si hay FK en tablas relacionadas conocidas).

---

## 3. CMS

### `site_content`

- UNIQUE (`section`, `key`).
- `type`: `text` | `image_url` | `list_json` | `richtext`.
- `value` TEXT / JSON serializado según tipo.

**Secciones mínimas para `GET …/public`**

| section | keys típicas |
|---------|----------------|
| `hero` | `title`, `subtitle`, `cta_text`, `background_image_url` |
| `contact` | `phone`, `whatsapp`, `email`, `address`, `maps_embed_url`, redes |
| `about` | `description` |
| `gallery` | `images` (`list_json` de `media_id`) |

### `faqs`

- `question`, `answer`, `sort_order`, `is_active`.

**Reordenamiento**

- `PUT /faqs/reorder` con array ordenado de `id` (ver contrato OpenAPI).

---

## 4. Auditoría

- Confirmación de pago debe disparar `audit_logs` (trigger en `payments` / `reservations` ya existente o insert explícito desde servicio si el trigger no cubre `user_id` NULL — documentar decisión en implementación).

---

## 5. Índices recomendados (si faltan)

- `payment_attempts(reservation_id, created_at DESC)`
- `payments(external_id)` UNIQUE partial `WHERE external_id IS NOT NULL`
- `media_library(created_at DESC)` para listados recientes
