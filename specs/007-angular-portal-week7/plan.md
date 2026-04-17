# Implementation Plan: Portal Angular — Semana 7 (reservas, planes, inventario y reportes)

**Branch**: `007-angular-portal-week7` (sugerida; git local puede diferir) | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Especificación Semana 7 — FASE 3 (`plan_trabajo.md` días 31–35 + `CONTEXTO_MAESTRO.md` §6 RBAC, §16 planes, §18 reservas)

## Summary

Extender el workspace **`admin-portal/`** (Semana 6) con **cinco módulos lazy** bajo `/admin`: **reservas** (listado filtrado, detalle drawer/sidenav, exportación CSV/Excel con feedback si el volumen es grande, acciones de estado/fechas/cancelación, alta manual, post-reserva opcionales, badge de pago, refresco de detalle), **planes** (CRUD + medios + actividades base con reorder e impacto de borrado + clone), **actividades opcionales** (catálogo global + vínculos y **desvinculación** en plan + pre-selección + preview de precio), **inventario** (ítems con formulario de mantenimiento, proveedores, movimientos con `Idempotency-Key`, **historial consultable**, alertas) y **reportes** (rangos, gráficos ocupación/ingresos, reporte planes, export Excel/PDF). Toda mutación crítica alinea **constitución II** (headers idempotencia ya exigidos por rutas Express) y **VI** (standalone, signals, OnPush). El listado de tareas atómico vive en **[tasks.md](./tasks.md)** (esta misma pasada sustituye la salida típica de `/speckit.tasks` para esta feature).

## Technical Context

| Área | Detalle |
|------|---------|
| **Repositorio UI** | `admin-portal/` existente (Angular 20, Material, Chart.js, proxy `/api`). |
| **Nuevas dependencias** | `exceljs` (export listados/reportes), `jspdf` + `jspdf-autotable` (PDF), reutilizar **Chart.js** para reportes apilados/pie según `plan_trabajo.md`. |
| **HTTP** | Mismo `authInterceptor`; añadir **`Idempotency-Key`** en cliente para `POST/PUT/DELETE` que el backend envuelve con middleware (`reservations`, `inventory/movements`, `payments/create` si aplica). |
| **API base** | `environment.apiUrl` → `/api/v1` (proxy dev). Ver matriz en [contracts/README.md](./contracts/README.md). |
| **RBAC UI** | `roleGuard` + `nav.config.ts` + `*appHasRole`: planes y catálogo opcionales **solo** `ADMIN`/`SUPER_ADMIN`; reservas mutables `BUSINESS`+; `VIEWER` lectura/export donde aplique; inventario movimientos sin `VIEWER`. |
| **Tests** | **Obligatorio en S7 (portal)**: tests de **servicios** con `HttpClientTestingModule` según `tasks.md`. **Fuera del alcance obligatorio de S7** salvo acuerdo: e2e del portal e integración Angular+API en CI; la constitución sigue exigiendo integración en **módulos críticos del backend** en su pipeline. Harness Material para tablas/drawer cuando aplique. |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|--------|
| **I. API-First** | PASS | Solo consumo de `/api/v1/*`; sin acceso directo a PostgreSQL desde el portal. |
| **II. Idempotency** | PASS | Reservas (create, update dates, cancel, add optional), inventario `movements` y, si el backend lo envuelve, **`POST /payments/create`**, llevan o pueden llevar middleware; el portal **debe** enviar `Idempotency-Key` UUID en cada llamada mutadora que el contrato marque como idempotente. |
| **III. Snapshots** | PASS | Detalle de reserva muestra actividades base desde payload de detalle/snapshot del API; no rearmar desde plan vivo como fuente de verdad. |
| **IV. RBAC** | PASS | Alineado a §6; ver discrepancia **pagos**: `POST /payments/create` hoy `ADMIN`+`AGENT` — documentado en `research.md` (BUSINESS y link de pago). |
| **V. MCP-Driven IA** | N/A | No MCP en esta entrega. |
| **VI. Angular Standards** | PASS | Standalone, signals en estado de listas/filtros, OnPush en componentes nuevos. |

**Post-design**: Sin violaciones; riesgo único documentado en research (rol de pago).

## Project Structure (documentación + código previsto)

```text
specs/007-angular-portal-week7/
├── spec.md
├── plan.md              # este archivo
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md             # backlog atómico (Semana 7)
└── contracts/
    └── README.md        # matriz endpoints ↔ pantallas

admin-portal/src/app/
├── core/
│   ├── layout/nav.config.ts          # nuevas entradas menú
│   └── http/idempotency.interceptor.ts  # (opcional) o helper en servicios
├── shared/
│   └── export/                       # csv/xlsx/pdf helpers
└── features/
    ├── reservations/                 # list, detail, actions, manual-create
    ├── plans/                        # list, form, activities, media, clone
    ├── optional-activities/          # catálogo global (admin)
    ├── plan-optionals/               # (sub-rutas bajo plans) o carpeta bajo plans/
    ├── inventory/
    └── reports/
```

## Complexity Tracking

| Violación | Por qué | Alternativa descartada |
|-----------|---------|-------------------------|
| — | Ninguna | — |

## Phase 0 & Phase 1 Outputs

| Artefacto | Descripción |
|-----------|-------------|
| [research.md](./research.md) | Decisiones (Excel/PDF, Idempotency-Key, CDK drag-drop, pago BUSINESS). |
| [data-model.md](./data-model.md) | Modelos de vista (DTOs UI) y transiciones. |
| [contracts/README.md](./contracts/README.md) | Consumo API por pantalla y roles. |
| [quickstart.md](./quickstart.md) | Cómo levantar API + portal y probar módulos S7. |
| [tasks.md](./tasks.md) | **Plan de tareas atómico** (T001…). |

## Next steps

1. Revisión humana de `tasks.md` (orden por sprint interno).  
2. `/speckit.implement` o ejecución manual por fase.  
3. Preparar Semana 8 (`speckit.specify` siguiente) cuando S7 esté verificada en staging.
