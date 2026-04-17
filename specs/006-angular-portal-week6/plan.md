# Implementation Plan: Portal Angular — Semana 6 (fundamentos y primeros módulos)

**Branch**: `006-angular-portal-week6` (sugerida; git actual puede diferir) | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Especificación Semana 6 — FASE 3 parcial (`plan_trabajo.md` días 26–30 + `CONTEXTO_MAESTRO.md` §5–§6, §11)

## Summary

Entregar el **primer corte del portal de administración (Angular)** en un nuevo workspace `admin-portal/`: autenticación contra el API existente (JWT en memoria + refresh por cookie `httpOnly`), **guards** alineados a la matriz RBAC, **shell** (sidebar + topbar + router-outlet), **cuatro features** — dashboard (KPIs + gráfica + lista + polling), habitaciones (lista server-side + formulario + medios + amenities + toggle), disponibilidad (calendario + detalle día + bloqueos + temporadas), y **librería de componentes compartidos** reutilizables. Toda la lógica de negocio y persistencia sigue en el **backend** (Constitución I); el front solo orquesta UI y validación superficial (Constitución VI).

**Lista de trabajo atómica**: ver [tasks.md](./tasks.md) (generada en esta misma pasada de planificación; sustituye la salida típica de `/speckit.tasks` para esta feature).

## Technical Context

| Área | Detalle |
|------|---------|
| **Repositorio UI** | Nuevo árbol `admin-portal/` en la raíz del monorepo (no existe `angular.json` hoy). |
| **Framework** | Angular **17+** (objetivo **20** si el CLI instalado lo permite), **standalone** components, **Signals** para estado de sesión y vistas, **OnPush** por defecto (Constitución VI). |
| **UI kit** | Angular Material + tema con colores de marca (variables desde `theme.scss` + paleta del cliente). |
| **HTTP** | `provideHttpClient(withInterceptors([...]))` — interceptor funcional: `Authorization`, manejo **401 → refresh → replay**, `withCredentials: true` en llamadas que dependan de cookie refresh. |
| **Gráficas** | `chart.js` + wrapper ligero en componente standalone (o `ng2-charts` si se prefiere en implementación; ver `research.md`). |
| **API base** | `environment.apiUrl` → mismo host que `CONTEXTO_MAESTRO` (`/api/v1`). |
| **Tests** | Vitest/Jest + Angular Testing Utilities (o Karma si el generador aún lo empuja); mínimo: servicios de auth y guards; e2e opcional Cypress/Playwright fuera del alcance obligatorio Semana 6. |
| **Despliegue** | Vercel SPA rewrites `/admin/**` (documentado en maestro); fuera del código de la semana salvo `environment.prod.ts`. |

**Unknowns resueltos en research**: versión exacta de Chart, estructura de carpetas `core/features/shared`, estrategia de refresh concurrente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|--------|
| **I. API-First** | PASS | El portal solo consume `https://…/api/v1/*`; sin acceso directo a PostgreSQL. |
| **II. Idempotency** | N/A crítico en UI | Las mutaciones que el portal dispare y que el API marque como idempotentes (p. ej. futuras reservas) enviarán `Idempotency-Key` cuando el contrato lo exija; Semana 6 no crea reservas desde el portal. |
| **III. Snapshots** | PASS | No se modifica snapshot desde UI en esta semana; módulo habitaciones/disponibilidad no escribe en tablas de snapshot. |
| **IV. RBAC** | PASS | `RoleGuard` + ocultación de acciones; matriz §6 (habitaciones solo ADMIN/SUPER_ADMIN; disponibilidad lectura amplia, edición según fila del maestro). |
| **V. MCP-Driven IA** | N/A | No hay herramientas MCP en esta entrega. |
| **VI. Angular Standards** | PASS | Standalone + Signals + OnPush obligatorio en componentes nuevos. |

**Post-design**: Sin violaciones; complejidad acotada a un SPA cliente.

## Project Structure (documentación + código previsto)

```text
specs/006-angular-portal-week6/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md              # backlog atómico (esta entrega)
└── contracts/
    └── README.md         # matriz consumo API ↔ pantalla

admin-portal/             # (nuevo — crear en implementación)
├── src/app/
│   ├── core/
│   │   ├── auth/
│   │   ├── interceptors/
│   │   └── layout/
│   ├── shared/
│   └── features/
│       ├── auth-login/
│       ├── dashboard/
│       ├── rooms/
│       └── availability/
```

## Complexity Tracking

| Violación | Por qué | Alternativa descartada |
|-----------|-----------|--------------------------|
| — | Ninguna | — |

## Phase 0 & Phase 1 Outputs

| Artefacto | Descripción |
|-----------|-------------|
| [research.md](./research.md) | Decisiones técnicas (interceptor, Chart, estructura). |
| [data-model.md](./data-model.md) | Modelos de vista y transiciones de UI (no tablas SQL nuevas). |
| [contracts/README.md](./contracts/README.md) | Contrato de consumo: endpoints y roles por pantalla. |
| [quickstart.md](./quickstart.md) | Cómo levantar API + portal en local. |
| [tasks.md](./tasks.md) | **Plan de tareas atómico** (T001…). |

## Next steps (después de este plan)

1. Revisión humana de `tasks.md` (orden y prioridad por sprint interno).  
2. `/speckit.implement` o ejecución manual por fase.  
3. Preparar Semana 7 (`speckit.specify` siguiente) cuando Semana 6 esté verificada en staging.
