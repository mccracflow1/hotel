# Implementation Plan: Gestión de Habitaciones, Planes y Creación de Reservas

**Branch**: `003-rooms-planes-reservas` (feature) — *rama Git local puede seguir en `001-db-design-setup` hasta merge* | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\spec.md`

## Summary

Implementar el núcleo operativo del backend: CRUD de habitaciones/servicios con soft delete y media, CRUD de planes con actividades base (reordenamiento por lote, impacto al eliminar, clonado sin opcionales), catálogo global de actividades opcionales y vínculo a planes, y **creación de reservas** con transacción única que combine verificación de disponibilidad, bloqueo de concurrencia, snapshot inmutable de actividades base, snapshots de precio de opcionales, número `HT-YYYY-NNNNN`, idempotencia persistente y RBAC. Las rutas `rooms`, `plans` y `reservations` existen como stubs vacíos y están **desmontadas** en `app.js` hasta esta implementación.

**Enfoque técnico**: Node.js 20 + Express 5, Knex, PostgreSQL (función `check_availability`, triggers de auditoría, tabla `idempotency_keys`), middlewares `authGuard` / `requireRoles` / `idempotency` (completar persistencia de respuesta).

## Technical Context

| Área | Detalle |
|------|---------|
| **Language/Version** | Node.js 20 LTS (backend); Admin/Landing fuera de scope de esta feature según spec |
| **Primary dependencies** | express, knex, pg, jsonwebtoken, dotenv |
| **Storage** | PostgreSQL 14+ — tablas ya definidas en migraciones `002`, `003`, `005`, `006`, `008`, `010` |
| **Testing** | Tests de integración en `backend/tests/` (patrón `auth.test.js`, `availability.test.js`) para reservas concurrentes e idempotencia |
| **Target platform** | Railway (API/DB) según constitución |
| **Proyecto layout** | `backend/src/modules/{rooms,plans,reservations}/`, `middlewares/`, `config/migrations/` |
| **Integraciones** | Disponibilidad vía `check_availability` + módulo `availability`; sin MCP nuevo en esta fase (consumo vía API autenticada AGENT) |

**Hallazgos de código relevantes**

- `backend/src/app.js` comenta mounts de rooms/plans/reservations.
- `reservations.routes.js`, `rooms.routes.js`, `plans.routes.js` y varios `.schema.js` están **vacíos** — implementación greenfield dentro de la estructura existente.
- `middlewares/idempotency.js` lee caché pero **no persiste** respuestas nuevas y hace fallback silencioso en error; debe endurecerse para `POST /reservations`.
- `availability.repository.js` referencia `r.short_desc` en `rooms`, columna **ausente** en migración `002` — corregir con migración o ajuste de query (documentado en `research.md`).
- Auditoría: migración `014_audit_logs_user_from_session.js` + `backend/src/utils/audit-context.js` (`setAuditUserOnTrx` vía `set_config` en la transacción) para rellenar `audit_logs.user_id` (SC-008). Triggers en tablas hijas de plan vía migración `013` en `tasks.md` (plan_activities, etc.).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|--------|
| **I. API-First** | PASS | Toda la lógica en backend; sin acceso directo a BD desde front/agente. |
| **II. Idempotency & transactional integrity** | PASS con acción | Constitución v1.1.0: `Idempotency-Key` obligatorio en operaciones críticas (reservas/pagos); catálogo con SHOULD. Completar persistencia en `idempotency_keys` y transacción única insert+check. |
| **III. Immutable snapshots** | PASS | Constitución v1.1.0 alineada con spec: snapshots al **crear** reserva; no reescritura posterior de filas de snapshot. |
| **IV. RBAC** | PASS | `authGuard` + `requireRoles`; mapear ADMIN/SUPER_ADMIN escritura catálogo; AGENT/ADMIN/BUSINESS creación reserva; VIEWER lectura donde aplique; público sin auth solo catálogos permitidos. |
| **V. MCP-Driven IA** | N/A directo | Sin nuevo servidor MCP en 003; agente usa API con los mismos contratos. |
| **VI. Angular / signals** | N/A | Portal admin explícitamente fuera de scope de esta spec. |

**Post-design re-check**: Alineado con constitución **v1.1.0** (snapshots al crear reserva; idempotencia en operaciones críticas; auditoría con `user_id`). Artefactos `data-model.md` y `contracts/openapi.yaml` cubren API-first, `reservation_activity_snapshot`, y contratos de catálogo opcional + FR-009 (confirmación explícita).

## Project Structure

### Documentation (this feature)

```text
specs/003-rooms-planes-reservas/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── openapi.yaml     # Phase 1
├── spec.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (touch points previstos)

```text
backend/
├── src/
│   ├── app.js                          # Habilitar routers
│   ├── middlewares/idempotency.js      # Endurecer + guardar respuesta
│   ├── modules/rooms/*                 # Controller, routes, service, repository, schema
│   ├── modules/plans/*
│   ├── modules/reservations/*
│   └── config/migrations/              # Posible nueva migración (rooms.short_desc, secuencia HT-…, triggers)
└── tests/                              # Nuevos tests integración reservas
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ninguna de constitución | — | — |

## Generated artifacts (this run)

| Artifact | Path |
|----------|------|
| Research | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\research.md` |
| Data model | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\data-model.md` |
| Contracts | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\contracts\openapi.yaml` |
| Quickstart | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\003-rooms-planes-reservas\quickstart.md` |

## Next step

Ejecutar implementación siguiendo `tasks.md` (p. ej. `/speckit.implement` o agente `speckit.implement`), luego análisis de consistencia si aplica.
