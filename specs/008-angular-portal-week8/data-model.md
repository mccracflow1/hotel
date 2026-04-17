# Data model — Semana 8 (008)

**Sources**: `CONTEXTO_MAESTRO.md` §7 (CMS y configuración), módulos `cms`, `media`, `users`, `business-config` en `backend/`.

## Entity: `media_library` (medios)

| Campo (lógico) | Tipo | Notas |
|----------------|------|--------|
| `id` | UUID | PK |
| `filename` / nombre visible | text | Renombrable vía API si se implementa PATCH |
| `original_url`, `thumbnail_url` | text | Imagen; video puede usar `original_url` + poster opcional |
| `file_type` | enum/text | `image`, `video`, … |
| `size` | bigint | Bytes |
| `created_by` | UUID FK users | Auditoría |
| `created_at` | timestamptz | |

**Relaciones**: referenciado por `rooms.cover_media_id`, `plans` + `plan_media`, valores `site_content` tipo `image_url` / `list_json` (galería), `business_config.logo_url`.

## Entity: `site_content`

| Campo | Tipo | Notas |
|-------|------|--------|
| `section` | varchar | `hero`, `contact`, `about`, `gallery`, … |
| `key` | varchar | `title`, `subtitle`, `cta_text`, `phone`, … |
| `value` | text | Contenido serializado si aplica |
| `type` | enum | `text`, `image_url`, `list_json`, `richtext` |
| UNIQUE(section, key) | | |

**Invariantes**: claves conocidas documentadas en maestro §17; la landing solo lee **bundle público** agregado.

## Entity: `faqs`

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `question`, `answer` | text |
| `sort_order` | smallint |
| `is_active` | boolean |
| `created_at` | timestamptz |

**Transiciones**: borrado físico vía `DELETE /cms/faqs/:id` (admin) — evaluar soft-delete si negocio lo pide más adelante.

## Entity: `users` (portal)

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `name`, `email` | varchar |
| `password_hash` | varchar |
| `role` | enum `user_role` |
| `avatar_url` | text nullable |
| `is_active` | boolean |
| `last_login_at` | timestamptz nullable |
| `created_at`, `updated_at` | timestamptz |

**Reglas**: `ADMIN` no eleva a `SUPER_ADMIN` (aplicación); `AGENT` no usa portal.

## Entity: `business_config` (singleton lógico)

| Campo | Tipo |
|-------|------|
| `hotel_name`, `nit`, `address` | text/varchar |
| `checkin_time`, `checkout_time` | time |
| `cancellation_policy` | JSONB | Array `{ hours_before, penalty_pct }` |
| `mp_public_key`, `mp_access_token`, `mp_webhook_secret` | text encriptado/masked |
| `logo_url`, `primary_color` | text/char(7) |
| `updated_at` | timestamptz |

## API aggregates

- **`GET /cms/site-content/public`**: agregación de secciones para landing (sin auth).
- **`GET /cms/faqs` (público)**: solo `is_active = true` ordenadas por `sort_order`.

## Validation rules (UI + server)

- Email usuario único; contraseña mínima acordada (p. ej. 8+ con clase de caracteres).
- `cancellation_policy`: `hours_before` no negativos, orden decreciente sugerido; `penalty_pct` 0–100.
- `primary_color`: regex `#RRGGBB`.
