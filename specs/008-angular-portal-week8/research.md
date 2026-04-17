# Research — Semana 8 (008)

**Date**: 2026-04-17  
**Scope**: CMS medios, CMS contenido, usuarios, configuración, landing pública.

## R-001 — Upload de video en biblioteca de medios

**Decision**: Extender el módulo `media` para aceptar **video** (`mp4`, `mov` u otros permitidos por negocio) además de imagen, con límites de tamaño documentados en el maestro (p. ej. hasta 200MB video), almacenando `file_type` y URLs en `media_library` sin transcodificación obligatoria en S8.

**Rationale**: El `plan_trabajo.md` Día 36 exige reproductor embebido; el backend actual (`singleImage`, `uploadImage`) solo cubre imágenes.

**Alternatives considered**:

- Diferir video a Semana 9 — **rechazado** por desalineación con la spec S8.
- Transcoding con FFmpeg en Railway — **rechazado** por YAGNI/complejidad salvo requisito explícito de negocio.

---

## R-002 — Endpoints públicos para habitaciones/planes en la landing

**Decision**: Antes de implementar la landing, **auditar** `rooms.routes.js` y `plans.routes.js` para confirmar si `GET` lista ya es público (`optionalAuth` o sin guard). Si no lo es, exponer **`GET /api/v1/public/rooms`** y **`GET /api/v1/public/plans`** (o nombre único) que devuelvan **solo** campos de marketing (nombre, capacidad, precio base, foto, slug) sin datos sensibles.

**Rationale**: La constitución exige API-first; la landing no tiene JWT de visitante.

**Alternatives considered**:

- Incrustar datos en `site-content/public` generados por un job — más trabajo operativo; viable como fase 2 si marketing quiere HTML estático cacheado.

---

## R-003 — Previsualización CMS vs sitio real

**Decision**: Implementar **preview** como una **ruta estática** `landing-page/preview.html` (o query en `index.html`) que consume el mismo bundle público pero permite pasar **token de borrador** solo en entorno dev **o** renderizar en el admin un panel “readonly” que replica tipografía/espaciado principales. Producción: preview = recarga de staging o iframe a URL de staging.

**Rationale**: Paridad perfecta local/prod es difícil sin duplicar build; la spec pide “aproximación fiel”.

**Alternatives considered**:

- Storybook — fuera de stack constitución para landing Tailwind vanilla.

---

## R-004 — Renombrar medios y “en uso”

**Decision**: Añadir **`PATCH /api/v1/media/:id`** con payload `{ display_name | filename }` opcional y **`GET /api/v1/media/:id/usage`** (o comprobar en DELETE) que liste entidades referenciadoras para mensaje de error 409.

**Rationale**: Cumple FR-006/FR-007 y evita borrados silenciosos (SC-007).

**Alternatives considered**:

- Solo soft-delete en media — puede ser fase posterior; S8 prioriza **bloqueo con explicación**.

---

## R-005 — Credenciales MercadoPago en `business-config`

**Decision**: Mantener campos en BD pero **`GET /business-config`** devuelve **máscaras** (`***`) para `ADMIN` y valores completos solo para `SUPER_ADMIN`; `PUT` igualmente restringido según matriz §6 (credenciales de pago: solo SUPER_ADMIN).

**Rationale**: Alineación explícita con `CONTEXTO_MAESTRO.md` matriz “Credenciales de pago”.

**Alternatives considered**:

- Separar microservicio de secrets — YAGNI para S8.
