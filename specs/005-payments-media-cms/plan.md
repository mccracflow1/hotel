# Implementation Plan: Cobros en línea, biblioteca de medios y CMS (MVP Fase 2 — Semana 5)

**Branch**: `005-payments-media-cms` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/005-payments-media-cms/spec.md`

## Summary

Implementar en el **backend** el **módulo de pagos** con pasarela **MercadoPago** (Checkout Pro / Preference, notificaciones con validación criptográfica, deduplicación, flujo **PSE**, idempotencia alineada a `payment_attempts` + `idempotency_keys`, conciliación BD ↔ API), la **biblioteca de medios** (multipart, validación de tipo/tamaño, miniaturas con **Sharp**, almacenamiento externo configurable, CRUD de `media_library`, asociación a `rooms` / `plans` / galería vía `site_content`), y el **CMS** (`site_content` por sección, `faqs`, lectura pública consolidada). Habilitar routers comentados en `backend/src/app.js` (`payments`, `media`, `cms` o equivalente modular). **Tests de integración** para creación de pago idempotente, webhook (firma válida/ inválida / duplicado), subida de imagen y lectura pública. **Swagger** actualizado para el alcance Semana 5.

**Enfoque técnico**: Node.js 20 + Express (**4.x en el repo**; la constitución cita Express 5 como estándar objetivo — sin bloquear esta entrega), Knex transaccional, `authGuard` / roles `ADMIN` + `AGENT` para `POST /payments/create`, webhook **sin JWT** pero con **HMAC** + allowlist de IP opcional, **`GET /payments/reconciliation` reservado a rol `ADMIN`** según `CONTEXTO_MAESTRO.md` §9 (en código, `SUPER_ADMIN` debe seguir teniendo acceso si el guard de roles ya lo trata como superset de `ADMIN`), mutaciones de medios/CMS con **`ADMIN` y `SUPER_ADMIN`** según matriz §6, y **auditoría** (`audit_logs` / triggers) en confirmación de pago.

## Technical Context

| Área | Detalle |
|------|---------|
| **Language/Version** | Node.js 20 LTS · JavaScript (CommonJS `require` en backend actual) |
| **Primary dependencies (nuevas)** | `@mercadopago/sdk-node`, `multer`, `sharp`; almacenamiento vía AWS SDK v3 o `cloudinary` según `STORAGE_PROVIDER` |
| **Storage** | PostgreSQL — `payment_attempts`, `payments`, `reservations` (transiciones de estado), `media_library`, `room_media`, `plan_media`, `site_content`, `faqs`, `audit_logs` |
| **Testing** | `jest` + `supertest` — pagos (idempotencia, webhook), medios (límites, delete bloqueado), CMS público sin auth |
| **Target platform** | Railway (API) |
| **Project layout** | `backend/src/modules/payments/`, `backend/src/modules/media/`, `backend/src/modules/cms/` (o `site-content` + `faqs` anidados), reutilizar `middlewares/idempotency`, `middlewares/auth.guard`, `utils/crypto` para SHA256 de clave de pago |
| **Integraciones** | MercadoPago (sandbox/prod), proveedor de objetos/S3 o Cloudinary, variables en `business_config` / env para tokens MP |

**Hallazgos de código relevantes**

- `backend/src/app.js` líneas 61–63: rutas `payments`, `media`, `cms` **comentadas** — descomentar al completar módulos.
- No existe aún `@mercadopago/sdk-node`, `multer` ni `sharp` en `backend/package.json` — añadir en esta feature.
- Reservas ya tienen estados `PENDING`, `PAYMENT_PENDING`, `CONFIRMED` (ver `004` OpenAPI) — alinear transiciones con flujo de checkout y webhook.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| **I. API-First** | PASS | Toda mutación y lectura administrativa vía API; landing consume solo rutas públicas documentadas. |
| **II. Idempotency & transactional integrity** | PASS | `POST /payments/create` con `Idempotency-Key` + persistencia en `idempotency_keys` / replay; transacción Knex en confirmación webhook (`payments` + `reservations` + auditoría). |
| **III. Immutable snapshots** | PASS | El pago **no** modifica `reservation_activity_snapshot` ni filas de opcionales existentes; solo estado global de reserva y tabla `payments`. |
| **IV. RBAC** | PASS | Crear pago: `ADMIN`, `AGENT`; webhook: validación de firma (no JWT); conciliación: `ADMIN` (ingresos en matriz); medios/CMS: `ADMIN`/`SUPER_ADMIN` según §6 CONTEXTO. |
| **V. MCP-Driven IA** | N/A directo | Semana 9 expone MCP; esta feature deja **contratos HTTP** estables (`/payments/create`, reservas existentes) consumibles por n8n. |
| **VI. Angular** | N/A | UI admin fuera de alcance (Semana 6–8). |

**Post-design re-check**: Alineado con constitución v1.1.0 — ver `research.md` (decisiones MP, webhook, PSE), `data-model.md` (transiciones y tablas), `contracts/openapi.yaml` (contratos y seguridad).

## Project Structure

### Documentation (this feature)

```text
specs/005-payments-media-cms/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── openapi.yaml     # Phase 1
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (multi-project)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── payments/    # routes, controller, service, repository, schema
│   │   ├── media/
│   │   └── cms/         # site-content + faqs (+ public aggregator)
│   ├── middlewares/
│   └── config/
└── tests/               # integration: payments, media, cms
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | Ninguna violación de constitución requiere justificación. | — |

## Phase 0 & Phase 1 Outputs

| Fase | Artefacto | Descripción |
|------|-----------|-------------|
| 0 | [research.md](./research.md) | Decisiones MercadoPago (Preference, webhook, PSE), idempotencia, almacenamiento de archivos, orden de respuesta webhook |
| 1 | [data-model.md](./data-model.md) | Tablas, transiciones de estado, reglas de borrado de medios |
| 1 | [contracts/openapi.yaml](./contracts/openapi.yaml) | OpenAPI 3.0 — payments, media, site-content, faqs |
| 1 | [quickstart.md](./quickstart.md) | Variables de entorno, pruebas sandbox, curls de ejemplo |

---

*Plan generado por `/speckit.plan` — listo para `/speckit.tasks`.*
