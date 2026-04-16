# Implementation Plan: Ciclo completo de reservas, inventario, administración y reportes (MVP Fase 1 — Semana 4)

**Branch**: `004-complete-reservation-lifecycle` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\spec.md`

## Summary

Completar el **ciclo de vida de reservas** en el backend: lectura paginada y filtros, detalle por `id` y por **número legible** (`HT-YYYY-NNNNN`), política de cancelación derivada de `business_config.cancellation_policy`, transiciones `PATCH …/status`, **modificación de fechas** (`PUT`) con transacción + `check_availability`, **cancelación** (`DELETE`) con motivo y coherencia de estados frente a pagos futuros, **altas de opcionales** posteriores (`POST …/optional-activities`) con validación contra `plan_optional_activities` y actualización de `total_amount`. Operativizar **inventario** (ítems, movimientos atómicos, alertas, historial, proveedores), **usuarios** y **perfil** (RBAC: `ADMIN` no gestiona `SUPER_ADMIN`), **configuración del negocio** con enmascarado de secretos MP, **temporadas** con validación de solapes, y **reportes** (ocupación, ingresos en modo preliminar hasta Fase 2, detalle de reservas, inventario). **Swagger/OpenAPI** consolidado para alcance semanas 1–4.

**Enfoque técnico**: Node.js 20 + Express 5, Knex, PostgreSQL, middlewares existentes (`authGuard`, `requireRoles`, idempotencia endurecida donde aplique), `setAuditUserOnTrx` en mutaciones, respuesta estándar `{ data, meta }`.

**Estado actual del repo**: `POST /api/v1/reservations` implementado; rutas de **inventory**, **users** y **reports** existen como archivos vacíos y **no están montadas** en `app.js`. `seasons` está montado; falta validación de solapes entre temporadas. No hay módulo montado para `business_config`.

## Technical Context

| Área | Detalle |
|------|---------|
| **Language/Version** | Node.js 20 LTS (backend único en alcance; Admin/Landing fuera de spec) |
| **Primary dependencies** | express, knex, joi, jsonwebtoken, swagger-jsdoc (ya en proyecto) |
| **Storage** | PostgreSQL 14+ — tablas `reservations`, `reservation_activity_snapshot`, `reservation_optional_activities`, `inventory_*`, `suppliers`, `users`, `business_config`, `seasons`, `payments` (vacía hasta Fase 2), `audit_logs`, `idempotency_keys` |
| **Testing** | Tests de integración en `backend/tests/` — reservas (concurrencia, idempotencia), inventario (stock no negativo), RBAC (403) |
| **Target platform** | Railway (API/DB) |
| **Project layout** | `backend/src/modules/{reservations,inventory,users,reports,business-config}/` (+ `suppliers` anidado o módulo aparte según convención), `middlewares/`, `config/migrations/` solo si se requieren columnas nuevas (p. ej. campos faltantes en movimientos) |
| **Integraciones** | Sin MercadoPago en alcance; reporte de ingresos etiquetado como preliminar |

**Hallazgos de código relevantes**

- `backend/src/app.js`: montar `inventory`, `users`, `reports` y el router de `business-config` cuando existan; mantener coherencia con prefijo `/api/v1`.
- `reservations.routes.js`: solo `POST /` — añadir resto de rutas; orden de registro: rutas estáticas (`/policy`, búsqueda por número) antes de `/:id` si se usa path param.
- `inventory.routes.js`, `users.routes.js`, `reports.routes.js`: vacíos — implementación greenfield.
- `seasons`: lógica básica CRUD existe; **no** valida solapes; nombres de campos API (`nombre`, `fecha_inicio`, …) vs CONTEXTO (`date_start` en BD) — ver `seasons.repository` para mapeo.
- Idempotencia: extender política a `PUT`/`DELETE`/`POST optional-activities` **y** a `POST /inventory/movements` (constitución II — inconsistencia de stock ante reintentos).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|--------|
| **I. API-First** | PASS | Toda la lógica en backend; sin BD directa desde agente o front. |
| **II. Idempotency & transactional integrity** | PASS con acción | Creación ya con middleware dedicado; aplicar `Idempotency-Key` en mutaciones de reserva con efecto económico/inventario; transacciones con bloqueo en cambio de fechas. |
| **III. Immutable snapshots** | PASS | No UPDATE/DELETE en `reservation_activity_snapshot`; opcionales solo INSERT nuevos con snapshots de precio/nombre. |
| **IV. RBAC** | PASS | Matriz §6 CONTEXTO: VIEWER lectura reservas/reportes; BUSINESS operación; ADMIN confirmación manual estado; AGENT lectura/escritura según tabla §9; SUPER_ADMIN credenciales MP. |
| **V. MCP-Driven IA** | N/A directo | MCP en fase posterior; mismos contratos HTTP para herramientas futuras. |
| **VI. Angular** | N/A | Fuera de alcance. |

**Post-design re-check**: Alineado con constitución v1.1.0 — artefactos `data-model.md` y `contracts/openapi.yaml` documentan snapshots, idempotencia en mutaciones críticas, auditoría y enmascarado de secretos.

## Project Structure

### Documentation (this feature)

```text
specs/004-complete-reservation-lifecycle/
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
│   ├── app.js                          # Montar inventory, users, reports, business-config, suppliers
│   ├── middlewares/idempotency.js      # Opciones por ruta para PUT/DELETE/POST opcionales
│   ├── modules/reservations/*          # Ampliar controller/service/repository/schema
│   ├── modules/inventory/*             # Implementar
│   ├── modules/users/*               # Implementar (+ perfil /me)
│   ├── modules/business-config/*     # Nuevo — GET/PUT + masking
│   ├── modules/reports/*             # Implementar
│   └── config/swagger.js             # Tags y paths 004 + consolidación 001–004
└── tests/
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ninguna de constitución | — | — |

## Generated artifacts (this run)

| Artifact | Path |
|----------|------|
| Research | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\research.md` |
| Data model | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\data-model.md` |
| Contracts | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\contracts\openapi.yaml` |
| Quickstart | `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\specs\004-complete-reservation-lifecycle\quickstart.md` |

## Next step

Generar `tasks.md` con `/speckit.tasks` e implementar siguiendo el desglose de módulos.
