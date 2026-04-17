# HTTP contracts — Semana 8 (008)

Base: `/api/v1` (ver `CONTEXTO_MAESTRO.md` §9). Roles según matriz §6.

**Idempotencia (cabecera HTTP)**: en `PUT /api/v1/site-content/:section`, `PUT /api/v1/business-config` y `POST /api/v1/media/upload` el cliente **debe** enviar `Idempotency-Key` (UUID recomendado, ≤128 caracteres). Sin cabecera → `400 VALIDATION_ERROR`.

## CMS (montaje: `app.use('/api/v1', cms.routes)` → rutas bajo `/api/v1`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/site-content/public` | No | Bundle landing (hero, contact, gallery, …) |
| GET | `/api/v1/site-content/:section` | ADMIN, SUPER_ADMIN | Edición por sección |
| PUT | `/api/v1/site-content/:section` | ADMIN, SUPER_ADMIN | Reemplazo de `entries[]` validadas |
| GET | `/api/v1/faqs` | No | FAQs activas (público) |
| GET | `/api/v1/faqs/manage` | ADMIN, SUPER_ADMIN | FAQs incl. inactivas |
| POST | `/api/v1/faqs` | ADMIN, SUPER_ADMIN | Crear |
| PUT | `/api/v1/faqs/:id` | ADMIN, SUPER_ADMIN | Parchear |
| PUT | `/api/v1/faqs/reorder` | ADMIN, SUPER_ADMIN | Body `{ ids: UUID[] }` |
| DELETE | `/api/v1/faqs/:id` | ADMIN, SUPER_ADMIN | Eliminar |

## Media (`app.use('/api/v1/media', media.routes)`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/media/upload` | ADMIN, SUPER_ADMIN | Multipart `file` — imagen o video (`mp4` / `quicktime`) + **`Idempotency-Key`** |
| GET | `/api/v1/media/` | ADMIN, SUPER_ADMIN | Lista paginada + filtros |
| GET | `/api/v1/media/:id/usage` | ADMIN, SUPER_ADMIN | Referencias (`rooms`, `plans`, `site_content`, …) |
| PATCH | `/api/v1/media/:id` | ADMIN, SUPER_ADMIN | `{ filename }` — renombrar |
| DELETE | `/api/v1/media/:id` | ADMIN, SUPER_ADMIN | Borrar si sin uso; **409** con `error.details` si está en uso |

## Users (`/api/v1/users`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/users/me` | JWT | Perfil actual |
| PATCH | `/api/v1/users/me` | JWT | Nombre, avatar, password |
| GET | `/api/v1/users` | ADMIN, SUPER_ADMIN | Lista |
| POST | `/api/v1/users` | ADMIN, SUPER_ADMIN | Crear |
| PATCH | `/api/v1/users/:id/status` | ADMIN, SUPER_ADMIN | `{ is_active }` — activar/desactivar |
| PUT | `/api/v1/users/:id` | ADMIN, SUPER_ADMIN | Actualizar |

## Business config (`/api/v1/business-config`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/business-config` | ADMIN, SUPER_ADMIN | GET enmascarado según rol |
| PUT | `/api/v1/business-config` | SUPER_ADMIN o mix según campo | Actualizar; MP keys solo SUPER_ADMIN |

## Público catálogo (`app.use('/api/v1/public', public-catalog.routes)`)

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/public/rooms` | No | Alias de catálogo público (misma carga útil que `GET /rooms` sin rol admin) |
| GET | `/api/v1/public/plans` | No | Idem para planes |

> También válidos sin token: `GET /api/v1/rooms` y `GET /api/v1/plans` con `optionalAuth` (ver `research.md` R-002).

> Montaje verificado en `backend/src/app.js` para `media`; CMS sin subprefijo `/cms`.
