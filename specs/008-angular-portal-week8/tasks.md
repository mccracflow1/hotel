# Tasks: Portal Angular — Semana 8 (008) — CMS, usuarios, configuración y landing

**Input**: `E:\Proyectos\multi_stage\hotel\specs\008-angular-portal-week8\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)  
**Referencias**: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/README.md](./contracts/README.md), [quickstart.md](./quickstart.md)

## Implementation strategy

- **MVP**: Phase 1 (setup) + Phase 2 (fundaciones API pública + nav) + **[US1]** biblioteca de medios mínima usable + **[US2]** hero/contacto/FAQs.
- **Incremento 2**: **[US3]** usuarios + perfil + configuración + políticas cancelación + enmascarado MP.
- **Incremento 3**: **[US4]** landing secciones principales + **[US5]** galería lightbox, mapa, lazy images, OG.
- **Paralelo `[P]`**: tareas en archivos distintos sin dependencia de tareas incompletas del mismo bloque (p. ej. dos componentes admin separados tras existir el servicio).

## Grafo de dependencias

```text
Phase 1 Setup
    │
    ▼
Phase 2 Foundational (catálogo público + rutas admin vacías + nav)
    │
    ├──► [US1] Media library (backend upload/list/delete + admin UI + picker)
    │         │
    │         ▼
    ├──► [US2] CMS site_content + FAQs + preview (usa medios)
    │         │
    │         ▼
    └──► [US3] Users + profile + business-config (independiente de landing)
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[US4] Landing core   [US5] Landing polish (depende de US4 + bundle público)
              │
              ▼
        Phase Polish
```

## Criterios de prueba independiente (por historia)

| Historia | Criterio |
|----------|----------|
| **US1** | Subida imagen/video con progreso; listado filtrable; delete bloqueado si en uso; picker inserta medio en room/plan. |
| **US2** | PUT secciones reflejadas en `GET /api/v1/site-content/public`; FAQ orden público; preview visible. |
| **US3** | CRUD usuario respeta elevación de roles; MP enmascarado para ADMIN; `cancellation_policy` coherente con policy de reserva. |
| **US4** | Landing sin auth muestra secciones con datos o mensaje explícito; OG tags no vacíos si hay contenido. |
| **US5** | Lightbox FAQ mapa lazy sin romper layout móvil. |

## Ejemplos de ejecución en paralelo

| Historia | Tareas típicas `[P]` |
|----------|----------------------|
| **US1** | Tests `media.service` mientras otro implementa `media-library` grid. |
| **US2** | Form hero vs form contact en paralelo tras existir `cms.service.ts`. |
| **US3** | `users-list` vs `settings-page` en paralelo tras servicios HTTP. |
| **US4** | Secciones HTML `#services` vs `#plans` en paralelo en `landing-page/index.html`. |

---

## Phase 1: Setup

**Goal**: Estructura landing y convenciones documentadas.

- [x] T001 [P] Crear `landing-page/index.html` con secciones semánticas `#hero`, `#services`, `#plans`, `#gallery`, `#faq`, `#map`, `footer` y placeholders de contenido vacío explícito
- [x] T002 [P] Incluir Tailwind CDN y estilos base responsive en `landing-page/index.html` (o `landing-page/styles.css` vinculado)
- [x] T003 [P] Crear `landing-page/README.md` con instrucciones de servido local (`npx serve`, Live Server) y variable `API_BASE_URL`
- [x] T004 [P] Añadir `landing-page/.gitkeep` o assets mínimos en `landing-page/public/` si hace falta para el servidor estático
- [x] T005 Verificar que `specs/008-angular-portal-week8/quickstart.md` mantiene la convención **`API_BASE_URL`** solo en la sección homónima (§ API_BASE_URL); no duplicar reglas en otros `.md` sin enlazar ahí

---

## Phase 2: Foundational

**Goal**: Catálogo público para landing + rutas/guards admin para módulos S8 + navegación.

- [x] T006 Auditar acceso anónimo a listados de habitaciones/planes en `backend/src/modules/rooms/rooms.routes.js` y `backend/src/modules/plans/plans.routes.js` y registrar decisión en `specs/008-angular-portal-week8/research.md` (R-002 actualizado)
- [x] T007 Implementar `backend/src/modules/public-catalog/public-catalog.routes.js` con `GET /rooms` y `GET /plans` (solo campos marketing) si T006 exige endpoints dedicados
- [x] T008 Implementar `backend/src/modules/public-catalog/public-catalog.controller.js` y `backend/src/modules/public-catalog/public-catalog.service.js` (o nombres equivalentes bajo `backend/src/modules/public-catalog/`)
- [x] T009 Registrar rutas públicas en `backend/src/app.js` bajo prefijo `/api/v1/public` coherente con `specs/008-angular-portal-week8/contracts/README.md`
- [x] T010 Añadir rutas lazy vacías o redirect en `admin-portal/src/app/app.routes.ts` para `cms`, `users`, `settings`, `profile` (según rutas finales elegidas)
- [x] T011 Actualizar `admin-portal/src/app/core/layout/nav.config.ts` con ítems CMS, Usuarios, Configuración, Perfil y `roles` según `CONTEXTO_MAESTRO.md` §6
- [x] T012 Asegurar `roleGuard` en rutas `cms`, `users`, `settings` solo `ADMIN`/`SUPER_ADMIN` en `admin-portal/src/app/app.routes.ts` (perfil: todos los roles autenticados)
- [x] T013 [P] Crear `admin-portal/src/app/features/cms/cms.routes.ts` export default con rutas hijas placeholder (`''` redirect)
- [x] T014 [P] Crear `admin-portal/src/app/features/users-admin/users-admin.routes.ts` export default placeholder
- [x] T015 [P] Crear `admin-portal/src/app/features/settings/settings.routes.ts` export default placeholder
- [x] T016 [P] Crear `admin-portal/src/app/features/profile/profile.routes.ts` export default placeholder (o integrar en ruta existente si ya hay perfil)

---

## Phase 3: User Story 1 — Biblioteca de medios `[US1]`

**Goal**: CRUD biblioteca, upload con progreso, video, rename, uso antes de delete, picker en rooms/plans.

**Independent test**: ver criterio US1 en tabla superior.

- [x] T017 [US1] Ampliar middleware de upload en `backend/src/middlewares/upload.js` (o crear `backend/src/middlewares/upload-media.js`) para aceptar **video** (`mp4`,`mov`) además de imagen, con límites de tamaño documentados
- [x] T018 [US1] Extender `backend/src/modules/media/media.service.js` con `uploadVideo` o unificar `uploadMedia` con ramas por `mimetype`
- [x] T019 [US1] Actualizar `backend/src/modules/media/media.controller.js` `postUpload` para usar el nuevo middleware multipart
- [x] T020 [US1] Añadir `GET /api/v1/media/:id/usage` en `backend/src/modules/media/media.routes.js` implementado en `media.controller.js` + `media.service.js` (consulta referencias rooms/plans/site_content/business_config)
- [x] T021 [US1] Añadir `PATCH /api/v1/media/:id` en `backend/src/modules/media/media.routes.js` con validación Joi en `backend/src/modules/media/` (nuevo `media.patch.schema.js` o extensión de schema existente) para renombrar metadatos
- [x] T022 [US1] Endurecer `deleteMedia` en `backend/src/modules/media/media.service.js` para devolver **409** con cuerpo de referencias cuando `usage` no vacío
- [x] T023 [P] [US1] Tests integración upload+delete en `backend/tests/integration/media.test.js` (crear si no existe)
- [x] T024 [US1] Crear `admin-portal/src/app/features/media-library/media-library.service.ts` con `list`, `upload` (progreso vía `HttpEventType`; cabecera **`Idempotency-Key`** en POST upload), `delete`, `patchRename`, `getUsage`
- [x] T025 [US1] Crear `admin-portal/src/app/features/media-library/media-library.routes.ts` con ruta `''` al listado
- [x] T026 [US1] Registrar lazy `media-library` en `admin-portal/src/app/app.routes.ts` como hijo del shell CMS en ruta canónica **`/admin/cms/media`** (ver `plan.md` — no mantener dos rutas equivalentes)
- [x] T027 [US1] Crear `admin-portal/src/app/features/media-library/media-library-page.component.ts` con grid, filtros tipo, búsqueda, `MatPaginator`, preview imagen/video
- [x] T028 [US1] Implementar barra de progreso de subida en `admin-portal/src/app/features/media-library/media-library-page.component.ts` (o subcomponente dedicado)
- [x] T029 [US1] Implementar acciones renombrar, copiar URL (`Clipboard` + `MatSnackBar`) y borrar con diálogo de confirmación leyendo `getUsage` en `admin-portal/src/app/features/media-library/media-library-page.component.ts`
- [x] T030 [US1] Crear `admin-portal/src/app/shared/media-picker/media-picker-dialog.component.ts` (MatDialog) que liste medios y emita `mediaSelected`
- [x] T031 [US1] Integrar `MediaPickerDialog` en `admin-portal/src/app/features/rooms/` formulario de habitación (archivo del formulario existente, p. ej. `rooms-form.component.ts` o equivalente)
- [x] T032 [US1] Integrar `MediaPickerDialog` en `admin-portal/src/app/features/plans/plan-form.component.ts` o `plan-media.helper.ts` según patrón actual de medios de plan
- [x] T033 [P] [US1] Tests HTTP en `admin-portal/src/app/features/media-library/media-library.service.spec.ts` (mockear progreso/eventos mínimos)

---

## Phase 4: User Story 2 — CMS contenido y FAQs `[US2]`

**Goal**: Hero, contacto, galería `site_content`, FAQs CRUD+reorder, preview.

- [x] T034 [US2] Revisar y extender `backend/src/modules/cms/cms.schema.js` `putSectionSchema` para cubrir keys faltantes de hero/contact/gallery según `CONTEXTO_MAESTRO.md` §17
- [x] T035 [US2] Asegurar `putSection` en `backend/src/modules/cms/cms.service.js` persiste `gallery` como `list_json` de `media_id` con orden explícito
- [x] T036 [US2] Auditoría CMS: verificar en BD que `audit_logs` recibe `user_id` en mutaciones de `site_content`/`faqs` — backend listo vía migración `018_audit_triggers_cms_media_business.js` + `setAuditUserOnTrx` en `cms.service.js` (incl. FAQs/reorder)
- [x] T037 [P] [US2] Tests integración FAQs reorder en `backend/tests/integration/cms-faqs.test.js` (crear si no existe)
- [x] T038 [US2] Crear `admin-portal/src/app/features/cms/cms.service.ts` con métodos `getPublicBundle`, `getSection`, `putSection`, `listFaqsManage`, `createFaq`, `patchFaq`, `deleteFaq`, `reorderFaqs` — en **`putSection`** enviar cabecera `Idempotency-Key` (`IdempotencyService`)
- [x] T039 [US2] Reemplazar placeholder en `admin-portal/src/app/features/cms/cms.routes.ts` con rutas `''` (shell), `hero`, `contact`, `about`, `gallery`, `faqs`, `preview`
- [x] T040 [US2] Crear `admin-portal/src/app/features/cms/cms-shell.component.ts` con `MatTabNav` o router-outlet secundario
- [x] T041 [US2] Crear `admin-portal/src/app/features/cms/cms-hero-form.component.ts` enlazando MediaPicker para `background_image_url`
- [x] T042 [US2] Crear `admin-portal/src/app/features/cms/cms-contact-form.component.ts` con campos de contacto y redes
- [x] T043 [US2] Crear `admin-portal/src/app/features/cms/cms-gallery-editor.component.ts` con CDK drag-drop de ítems y multi-upload a medios
- [x] T046b [US2] Crear `admin-portal/src/app/features/cms/cms-about-form.component.ts` para sección `about` de `site_content` (texto/imagen según maestro) y ruta lazy asociada en `cms.routes.ts`
- [x] T044 [US2] Crear `admin-portal/src/app/features/cms/cms-faqs-page.component.ts` con lista, toggle activo, formulario crear/editar, drag-drop → `reorderFaqs`
- [x] T045 [US2] Crear `admin-portal/src/app/features/cms/cms-preview.component.ts` que abra `landing-page/preview.html` en iframe o nueva pestaña con query de entorno (documentar en `plan.md` si cambia)
- [x] T046 [US2] Añadir `landing-page/preview.html` reutilizando el mismo JS de render que `index.html` con flag de solo lectura
- [x] T047 [P] [US2] Tests HTTP en `admin-portal/src/app/features/cms/cms.service.spec.ts`

---

## Phase 5: User Story 3 — Usuarios, perfil y configuración `[US3]`

**Goal**: Lista usuarios, CRUD con elevación, perfil, business-config con MP enmascarado y políticas cancelación.

- [x] T048 [US3] Verificar/ajustar `backend/src/modules/users/users.routes.js` para `PATCH /:id/status` o equivalente (`is_active`) con `requireRoles('ADMIN','SUPER_ADMIN')`
- [x] T049 [US3] Implementar handler en `backend/src/modules/users/users.controller.js` + lógica en `backend/src/modules/users/users.service.js` respetando reglas de elevación SUPER_ADMIN
- [x] T050 [US3] Extender `backend/src/modules/users/users.schema.js` para validar roles permitidos en create/update
- [x] T051 [US3] Endurecer `patchMe` en `backend/src/modules/users/users.service.js` para password actual + hash y `avatar_url` opcional
- [x] T052 [US3] Implementar enmascarado de secretos MP en `GET` y validación de campos sensibles en `PUT` dentro de `backend/src/modules/business-config/business-config.service.js` y `business-config.controller.js` según rol (`SUPER_ADMIN` vs `ADMIN`)
- [x] T053 [US3] Validar `cancellation_policy` JSONB en `backend/src/modules/business-config/business-config.schema.js` y persistencia en `business-config.service.js`
- [x] T054 [P] [US3] Tests integración business-config masking en `backend/tests/integration/business-config.test.js` (crear si no existe)
- [x] T055 [US3] Crear `admin-portal/src/app/features/users-admin/users-admin.service.ts` para `list`, `create`, `update`, `patchStatus`
- [x] T056 [US3] Crear `admin-portal/src/app/features/users-admin/users-list.component.ts` con tabla, filtros mínimos, último acceso
- [x] T057 [US3] Crear `admin-portal/src/app/features/users-admin/user-form-dialog.component.ts` o ruta dedicada con selector de rol y bloqueo de SUPER_ADMIN para ADMIN
- [x] T057b [US3] Al desactivar usuario (`is_active` false), **`MatDialog`** de confirmación explícita alineado a FR-029 (mismo patrón que borrado de medio con impacto visible)
- [x] T058 [US3] Actualizar `admin-portal/src/app/features/users-admin/users-admin.routes.ts` con rutas `''` lista y `new`/`:id/edit` si aplica UX
- [x] T059 [US3] Crear `admin-portal/src/app/features/profile/profile-page.component.ts` con formulario nombre, avatar (MediaPicker), cambio de contraseña
- [x] T060 [US3] Conectar `profile-page` a `PATCH /api/v1/users/me` vía servicio en `admin-portal/src/app/features/profile/profile.service.ts` (nuevo) o reutilizar `AuthService` si corresponde
- [x] T061 [US3] Crear `admin-portal/src/app/features/settings/settings.service.ts` para `getBusinessConfig`, `putBusinessConfig` con tipado de `cancellation_policy` — en **`putBusinessConfig`** enviar `Idempotency-Key`
- [x] T062 [US3] Crear `admin-portal/src/app/features/settings/settings-page.component.ts` con tabs: General | Branding | Horarios | Políticas cancelación | Pagos (oculto si no SUPER_ADMIN)
- [x] T063 [US3] Implementar editor de tabla `cancellation_policy` en `admin-portal/src/app/features/settings/cancellation-policy-editor.component.ts`
- [x] T064 [US3] Actualizar `admin-portal/src/app/features/settings/settings.routes.ts` para cargar `SettingsPageComponent`
- [x] T065 [P] [US3] Tests HTTP `admin-portal/src/app/features/users-admin/users-admin.service.spec.ts`
- [x] T066 [P] [US3] Tests HTTP `admin-portal/src/app/features/settings/settings.service.spec.ts`

---

## Phase 6: User Story 4 — Landing estructura principal `[US4]`

**Goal**: Consumir bundle público + catálogo; SEO OG; responsive.

- [x] T067 [US4] Crear `landing-page/app.js` (o `landing-page/main.js`) con función `fetchJson` centralizando `API_BASE_URL`
- [x] T068 [US4] Implementar render de hero y contacto desde `GET /api/v1/site-content/public` en `landing-page/app.js` actualizando DOM de `landing-page/index.html`
- [x] T069 [US4] Implementar render de sección servicios desde `GET /api/v1/public/rooms` (o endpoint acordado en T006–T009) en `landing-page/app.js`
- [x] T070 [US4] Implementar render de sección planes desde `GET /api/v1/public/plans` en `landing-page/app.js`
- [x] T071 [US4] Poblar `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:image`) en `landing-page/index.html` vía `app.js` usando datos del bundle y `business_config` si se expone en bundle público (si no, derivar de hero)
- [x] T072 [US4] Añadir manejo explícito de secciones vacías (mensajes “Configuración pendiente”) en `landing-page/app.js` para incumplir SC-001
- [x] T073 [P] [US4] Verificación manual documentada en `specs/008-angular-portal-week8/quickstart.md` para viewports 360px y 1280px (checklist responsive)

---

## Phase 7: User Story 5 — Landing galería, FAQ, mapa, rendimiento `[US5]`

**Goal**: Galería desde `site_content`, FAQ acordeón, mapa embed, footer, lazy + picture.

- [x] T074 [US5] Renderizar galería desde ids del bundle en `landing-page/app.js` resolviendo URLs vía datos embebidos del bundle o segunda petición si el contrato público lo requiere
- [x] T075 [US5] Implementar lightbox/acordeón de galería con `<dialog>` o componente mínimo en `landing-page/app.js` + estilos en `landing-page/index.html`
- [x] T076 [US5] Consumir `GET /api/v1/faqs` y construir acordeón FAQ en `landing-page/app.js`
- [x] T077 [US5] Inyectar `maps_embed_url` del bundle en iframe `#map` con `loading="lazy"` en `landing-page/app.js`
- [x] T078 [US5] Renderizar `footer` con mismos datos de contacto/redes en `landing-page/app.js`
- [x] T079 [US5] Añadir `loading="lazy"` a imágenes fuera del primer viewport y `<picture>` WebP+JPG cuando el API entrega ambas URLs en `landing-page/app.js`
- [x] T080 [P] [US5] Pasada Lighthouse o auditoría manual de imágenes documentada en `specs/008-angular-portal-week8/quickstart.md` (notas, sin automatizar CI si no existe)

---

## Phase 8: Polish & cross-cutting

- [x] T081 [P] Añadir `aria-label` a botones icónicos de acción en `admin-portal/src/app/features/media-library/` y `admin-portal/src/app/features/cms/`
- [x] T081b [P] Usar `messageFromApiError` de `admin-portal/src/app/shared/http/api-error-message.ts` en formularios CMS/settings/media y errores globales donde aplique (FR-030)
- [x] T082 Revisar budgets `maximumWarning` en `admin-portal/angular.json` tras nuevos módulos lazy S8
- [x] T083 Sincronizar fragmento OpenAPI o `backend` Swagger descripciones nuevas rutas media/cms/users/business-config en documentación existente del repo (archivo acordado del equipo, p. ej. `specs/008-angular-portal-week8/contracts/README.md` + swagger host)
- [x] T084 Completar checklist smoke por rol y viewports en `quickstart.md` (§ API_BASE_URL); no redefinir `API_BASE_URL` fuera de esa sección — coordinar con T005/T073
- [x] T085 [P] Eliminar `console.log` temporales en `admin-portal/src/app/features/media-library/**`, `admin-portal/src/app/features/cms/**`, `landing-page/**`

---

## Seguimiento — hallazgos análisis consistencia (speckit)

| Ref | Tema | Estado |
|-----|------|--------|
| C1 | Auditoría `user_id` en CMS/medios/business-config | **API**: migración `018_*` + `setAuditUserOnTrx` en `cms`, `media`, `users`, `business-config` |
| C2 | Idempotencia PUT CMS / business-config / upload | **API**: middleware estricto; **Admin**: T024, T038, T061 |
| G1 | FR-030 mensajes error | Helper `api-error-message.ts` + T081b |
| G2 | Sección `about` | Spec/plan + **T046b** |
| G3 | FR-029 desactivar usuario | Spec + **T057b** |
| I1 | T026 ruta media | **Resuelto** texto canónico `/admin/cms/media` |
| I2 | T005 vs T084 duplicado | **Resuelto** § única en quickstart |
| U1 | SC-002–005 solo manuales | Aceptable; detalle en quickstart § API_BASE_URL |

---

## Summary

| Métrica | Valor |
|---------|------:|
| **Total tasks** | 88 |
| **Completadas** | 88 (T001–T085 + T046b + T057b + T081b) |
| **Phase 1 Setup** | 5 (T001–T005) |
| **Phase 2 Foundational** | 11 (T006–T016) |
| **[US1]** | 17 (T017–T033) |
| **[US2]** | 15 (T034–T047 + T046b) |
| **[US3]** | 20 (T048–T066 + T057b) |
| **[US4]** | 7 (T067–T073) |
| **[US5]** | 7 (T074–T080) |
| **Polish** | 6 (T081–T085 + T081b) |

## Format validation

- Cada línea: `- [ ]`, ID `Tnnn`, descripción con ruta bajo `backend/`, `admin-portal/`, `landing-page/` o `specs/008-angular-portal-week8/`.
- `[US1]`–`[US5]` solo en fases de historias; `[P]` en tareas paralelizables explícitas.

