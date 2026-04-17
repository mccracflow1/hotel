# Implementation Plan: Portal Semana 8 — CMS, usuarios, configuración y landing (C4 + C5 inicio)

**Branch**: `008-angular-portal-week8` (objetivo; el script de setup puede reportar otra rama activa de git)  
**Date**: 2026-04-17  
**Spec**: [spec.md](./spec.md)  
**Input**: Especificación Semana 8 — cierre MVP Fase 3 (`plan_trabajo.md` días 36–40, `CONTEXTO_MAESTRO.md` §5–7, §17)

## Summary

Esta entrega completa el **portal de administración** con **CMS de medios**, **contenido del sitio** (hero, contacto, galería vía `site_content`), **FAQs**, **gestión de usuarios del portal**, **perfil propio**, **configuración del negocio** (incl. políticas de cancelación y branding) y arranca el **sitio público (landing)** con secciones **consumiendo el API** (bundle público CMS + listados públicos de habitaciones/planes donde aplique).

**Enfoque técnico**:

- **Admin (`admin-portal/`)**: nuevos módulos lazy bajo `/admin/cms`, `/admin/users`, `/admin/settings`, `/admin/profile` (perfil puede reutilizar ruta existente o crearse), Angular Material + CDK (drag-drop FAQs, upload con progreso), `HttpClient` contra `/api/v1`, guards alineados a matriz §6.
- **Backend (`backend/`)**: ya existen módulos `media`, `cms`, `users`, `business-config`; el plan detalla **ampliaciones** (video, rename, uso-before-delete, PATCH usuario estado si falta, multipart) y pruebas de contrato.
- **Landing (`landing-page/` o carpeta acordada)**: HTML + Tailwind (constitución) — **no existe** carpeta hoy; se crea estructura mínima con fetch a `GET /api/v1/site-content/public` y endpoints públicos de catálogo según contrato.
- **Rutas admin canónicas (UX)**: la biblioteca de medios vive bajo **`/admin/cms/media`** (hijo del shell CMS en `/admin/cms`), sin duplicar otra ruta raíz salvo decisión explícita en este `plan.md`.

## Technical Context

**Language/Version**: Node.js 20 LTS (backend), Angular 20+ standalone (admin-portal), HTML5 + Tailwind CDN (landing-page)  
**Primary dependencies**: Express 5, Knex, PostgreSQL 14+, Angular Material, RxJS, Sharp/S3 (media pipeline)  
**Storage**: PostgreSQL (fuente de verdad), S3 o almacenamiento local para blobs de medios  
**Testing**: Tests de integración en backend para CMS/media; tests de componente/servicio en admin donde aplique  
**Target platform**: Windows dev + despliegue Railway/Vercel/Netlify según maestro  

| Aspecto | Valor |
|---------|--------|
| **Backend** | Node.js 20 + Express; Knex/PostgreSQL; módulos `media`, `cms`, `users`, `business-config` presentes |
| **Admin** | Angular 20+ (repo actual), standalone, signals, OnPush, Material, proxy a API |
| **Landing** | HTML5 + Tailwind CDN (constitución VI + Technology Standards) |
| **Auth** | JWT + refresh; roles `SUPER_ADMIN`, `ADMIN`, `BUSINESS`, `VIEWER`, `AGENT` |
| **Storage medios** | Abstracción `media/storage` (S3/local); upload actual orientado a **imagen** |
| **Tests** | Jasmine/Karma o Vitest según repo admin; integración backend para rutas CMS/media críticas |
| **Despliegue** | Railway (API), Vercel (admin), Netlify (landing) — referencia maestro; fuera del código S8 salvo docs |

**Gaps conocidos respecto a la spec S8** (derivados de inspección de código):

- `POST /media/upload` usa `singleImage` → **solo imagen** hoy; la spec pide **video** y barra de progreso → ampliar middleware (multipart fields, límites por tipo) y servicio.
- No hay **PATCH rename** explícito en rutas media → añadir `PATCH /media/:id` o equivalente si el producto lo requiere.
- Eliminación media **sin** endpoint de “impacto” visible en rutas → implementar comprobación de referencias (`rooms`, `plans`, `site_content`, etc.) antes de `DELETE`.
- **Usuarios**: rutas `GET/POST/PUT` existen; verificar si falta **`PATCH /users/:id/status`** o desactivación según spec; `PATCH /users/me` para perfil/contraseña.
- **business-config**: validar que `cancellation_policy` JSONB se edita con UI de tabla y que credenciales MP siguen **solo SUPER_ADMIN** según matriz (ajustar `requireRoles` si hoy es demasiado permisivo).

## Constitution Check

*GATE: cumplir antes de implementación; re-verificar tras diseño.*

| Principio | Evaluación Semana 8 |
|-----------|---------------------|
| **I. API-First** | PASS — Landing y portal solo consumen API; sin acceso directo a BD desde frontends. |
| **II. Idempotency** | PASS — API: `Idempotency-Key` obligatorio en `PUT /site-content/:section`, `PUT /business-config` y `POST /media/upload` (middleware estricto). Cliente admin debe enviar la cabecera al implementar los servicios HTTP (véase `contracts/README.md`). |
| **III. Snapshots** | N/A directo — Cambios de contenido no reescriben reservas; validar que edición de plan no rompa snapshots (ya regla S7). |
| **IV. RBAC + auditoría** | PASS — Rutas `media` y `cms` restringidas a `ADMIN`/`SUPER_ADMIN`; credenciales MP solo `SUPER_ADMIN`; migración `018_*` + `setAuditUserOnTrx` en transacciones que mutan `site_content`, `faqs`, `business_config`, `media_library` y `users`. |
| **V. MCP** | N/A Semana 8 |
| **VI. Angular** | PASS — Nuevos módulos standalone, signals, OnPush; lógica de negocio en API. |

**Violaciones potenciales a justificar si se aceptan**: subir videos grandes sin pipeline async → mitigar con límite de tamaño y mensajes claros (YAGNI: no cola S3 multipart compleja en S8 salvo requisito explícito).

## Project Structure

### Documentación (esta feature)

```text
specs/008-angular-portal-week8/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas Phase 0
├── data-model.md        # Entidades y mapeo BD/API
├── quickstart.md        # Smoke dev S8
├── contracts/README.md  # Contrato HTTP resumido
└── tasks.md             # (/speckit.tasks) — pendiente
```

### Código relevante

```text
backend/src/modules/
├── media/           # upload, list, delete — extender
├── cms/             # site_content, faqs, bundle público
├── users/           # list, create, update, me
└── business-config/ # get/put configuración global

admin-portal/src/app/
├── app.routes.ts
├── core/layout/nav.config.ts
├── features/
│   ├── media-library/      # NUEVO — Día 36
│   ├── cms/                # NUEVO — Día 37 (hero, contact, gallery, preview)
│   ├── users-admin/        # NUEVO — Día 38
│   ├── settings/           # NUEVO — Día 38 (business + policies + MP fields)
│   └── profile/            # NUEVO o extender — Día 38
└── shared/                 # MediaPicker dialog, upload progress

landing-page/                 # NUEVO — Días 39–40
├── index.html
├── styles (tailwind)
└── public.js                 # fetch público, lightbox, OG meta
```

## Phased delivery (alineado a `plan_trabajo.md`)

### Día 36 — Biblioteca de medios (C4)

**Objetivo**: Cuadrícula, búsqueda/filtro, upload con progreso, preview imagen/video, picker reutilizable, rename/delete con validación de uso, copiar URL.

**Backend**

- Ampliar `media.routes.js`: list query params (`q`, `type`, `page`, `limit`) si no cubiertos.
- Upload: soporte **video** (`mp4`, `mov`) + imagen existente; validar tamaño (maestro: img ≤10MB, video ≤200MB).
- `DELETE /media/:id`: antes comprobar referencias en `rooms`, `plans`, `plan_media`, `site_content` (values que contengan `media_id` / URLs), `business_config.logo_url`; devolver `409 CONFLICT` con detalle si aplica.
- `PATCH /media/:id` (opcional): `filename` o `display_name` para renombrar sin re-subir.

**Admin**

- Feature `media-library`: grid virtual o paginado, chips filtro tipo, `MatPaginator`.
- Upload: CDK dropzone o input + `XMLHttpRequest`/`HttpClient` con evento de progreso (Material progress bar).
- Dialog `MediaPickerComponent` exportado; integrar en `rooms` y `plans` formularios (botón “Biblioteca”).
- Clipboard para URL pública (snackbar confirmación).

**Criterios listos**: US1 spec + SC-002, SC-007.

---

### Día 37 — CMS contenido y FAQs (C4)

**Objetivo**: Hero, contacto, FAQs drag orden, preview antes de publicar, galería con reordenamiento y multi-upload.

**Backend**

- `PUT /api/v1/site-content/:section` ya existe — validar `putSectionSchema` cubre `hero`, `contact`, `gallery`, `about` según `cms.schema.js`.
- `gallery` como `list_json` de `media_id` — orden persistido en JSON o tabla puente si el repo ya migró.
- FAQs: `PUT /cms/faqs/reorder` con body `{ ids: UUID[] }` — UI CDK drag-drop → llamar endpoint.

**Admin**

- Rutas lazy `/admin/cms` con sub-tabs: Hero | Contacto | Galería | FAQs | Vista previa.
- Formularios reactive forms; selector de imagen hero vía MediaPicker.
- Preview: iframe a `landing-page/preview.html` con query `?bundle=draft` **o** componente read-only que renderiza mismos tokens (preferir **iframe** contra build estático para fidelidad).
- Galería: CDK reorder + multi-upload secuencial con progreso agregado.

**Criterios listos**: US2 spec + SC-003.

---

### Día 38 — Usuarios, perfil y configuración (C4)

**Objetivo**: Lista usuarios + rol + estado + `last_login_at`; CRUD usuario con límites de rol; perfil propio (nombre, avatar, password); settings negocio + logo/color; políticas cancelación; credenciales MP solo SUPER_ADMIN.

**Backend**

- `users`: confirmar `listUsers` devuelve `last_login_at`, `is_active`; añadir `PATCH /users/:id/status` si no existe.
- `patchMe`: permitir `password` con hash seguro y `avatar_url` (vía `media_id` o URL).
- `business-config`: `GET/PUT` — en `putConfig` validar `cancellation_policy` arreglo `{ hours_before, penalty_pct }[]`; enmascarar campos MP en `GET` para `ADMIN` vs `SUPER_ADMIN` según matriz.

**Admin**

- `/admin/users`: tabla, crear/editar, desactivar (confirmación).
- `/admin/profile`: formulario propio (no mezclar con gestión de otros usuarios).
- `/admin/settings`: secciones — Datos generales | Branding | Horarios | Políticas cancelación (tabla editable) | Pagos (solo superadmin).
- Guards: `roleGuard` datos en `app.routes.ts` según maestro.

**Criterios listos**: US3 + SC-004, SC-006.

---

### Día 39 — Landing estructura principal (C5)

**Objetivo**: HTML/Tailwind responsive; hero/servicios/planes desde API; meta OG.

**Landing**

- Crear proyecto `landing-page/` con `index.html` secciones: `#hero`, `#services`, `#plans`, `#gallery`, `#faq`, `#map`, `footer`.
- `fetch(API_URL + '/site-content/public')` → mapear keys del bundle a DOM.
- `fetch` habitaciones activas: usar endpoint público existente (`GET /rooms` según maestro — verificar si requiere auth; si requiere auth, acordar **endpoint público** `GET /public/rooms` mínimo para S8 o filtrar en bundle CMS — documentar en `research.md`).
- Planes: `GET /plans` optionalAuth en backend — usable públicamente según rutas actuales.
- SEO: actualizar `<title>`, `<meta name="description">`, OG tags desde `site_content` o `business_config.hotel_name`.

**Criterios listos**: US4 + SC-001, SC-004 (visitante).

---

### Día 40 — Landing galería, FAQ, mapa, footer, optimización (C5)

**Objetivo**: Galería lightbox, acordeón FAQ, Maps embed, footer enlaces, lazy images + picture webp.

**Landing**

- Galería: grid CSS + lightbox nativo ( `<dialog>` o script mínimo).
- FAQ: fetch `GET /cms/faqs` público → acordeón.
- Mapa: `contact.maps_embed_url` en `<iframe loading="lazy">`.
- Footer: mismas fuentes que contacto.
- Imágenes: `loading="lazy"` + `<picture>` si el API entrega `webp` + fallback `jpg`.

**Criterios listos**: US5 + SC-005.

## Testing strategy

| Área | Qué probar |
|------|------------|
| Media | Upload límites; delete bloqueado; list filtros; picker inserta `media_id` |
| CMS | putSection round-trip; reorder FAQs; public bundle coherente |
| Users | RBAC creación; no SUPER_ADMIN por ADMIN; patch password |
| Config | PUT cancellation_policy leída por `GET /reservations/:id/policy` |
| Landing | Sin token: secciones render; OG; mobile width 360–430 |

## Risks & mitigations

| Riesgo | Mitigación |
|--------|------------|
| Rooms/plans GET requieren auth | Añadir rutas públicas acotadas o ampliar `optionalAuth` con solo campos marketing |
| Upload video rompe memoria | Stream a storage o límite estricto + error claro |
| Preview desincronizado | Reutilizar mismo template build que producción |

## Complexity tracking

| Tema | Por qué | Alternativa rechazada |
|------|---------|-------------------------|
| Video upload | Spec explícita | Solo imágenes: incumple plan_trabajo |
| Lightbox custom | Constitución pide Tailwind vanilla sin deps pesadas | Librería externa grande |

## Post-Phase 1 — Agent context

Ejecutar `update-agent-context.ps1` tras estabilizar este `plan.md` para refrescar `.cursor/rules/specify-rules.mdc`.

## Constitution Check (post–Phase 1 design)

| Gate | Estado |
|------|--------|
| API-First | PASS |
| Idempotency en operaciones críticas duplicables | PASS condicional (upload masivo / guardado secciones) |
| Snapshots reservas | N/A cambio directo S8 |
| RBAC + auditoría en mutaciones CMS/config/users/media | PASS (revisar en implementación) |
| MCP | N/A |
| Angular standalone + signals + OnPush | PASS |

## Handoff

- Siguiente comando sugerido: **`/speckit.tasks`** — generar `tasks.md` atómico (T001… por día 36–40 y por repo admin/backend/landing).
- Opcional: **`/speckit.checklist`** — checklist de dominio QA (roles, medios, SEO).
