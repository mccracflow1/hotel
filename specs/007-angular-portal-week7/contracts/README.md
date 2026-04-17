# Contratos de consumo — Semana 7 (portal ↔ API)

Base URL: `{apiUrl}` = `/api/v1` (dev con proxy). Autenticación: Bearer + cookie refresh (Semana 6).

## Leyenda roles

| Rol | Reservas mutar | Planes CRUD | Opcionales catálogo | Inventario mov. | Reportes export |
|-----|-----------------|-------------|----------------------|-----------------|-----------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| BUSINESS | ✅ | ❌ | ❌ | ✅ | ✅ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ✅ lectura |
| AGENT | API only | — | — | — | — |

## Reservas (`/reservations`)

| Pantalla / acción | Método y ruta | Roles (backend) | Idempotencia |
|-------------------|---------------|-----------------|--------------|
| Listado filtrado | `GET /reservations` | readRoles | — |
| Detalle | `GET /reservations/:id` | readRoles | — |
| Por número | `GET /reservations/by-number/:n` | readRoles | — |
| Política cancelación | `GET /reservations/:id/policy` | readRoles | — |
| Crear (manual) | `POST /reservations` | AGENT, ADMIN, BUSINESS | ✅ header |
| Actualizar fechas | `PUT /reservations/:id` | writeReservationRoles | ✅ |
| Cancelar | `DELETE /reservations/:id` | writeReservationRoles | ✅ |
| Cambiar estado | `PATCH /reservations/:id/status` | ADMIN, SUPER_ADMIN | — |
| Agregar opcional post-reserva | `POST /reservations/:id/optional-activities` | writeReservationRoles | ✅ |

## Pagos (`/payments`)

| Pantalla / acción | Método y ruta | Roles (backend actual) | Notas |
|-------------------|---------------|-------------------------|--------|
| Crear preferencia / checkout | `POST /payments/create` | **ADMIN, AGENT** | Idempotencia: enviar `Idempotency-Key` si el middleware del backend lo exige; ver `research.md` si se extiende a BUSINESS. |

## Planes (`/plans`)

| Pantalla / acción | Método y ruta | Roles |
|-------------------|---------------|--------|
| Listar | `GET /plans` | optionalAuth / autenticado |
| Crear | `POST /plans` | ADMIN, SUPER_ADMIN |
| Detalle | `GET /plans/:id` | optionalAuth |
| Parchear | `PATCH /plans/:id` | ADMIN, SUPER_ADMIN |
| Medios | `POST/DELETE /plans/:id/media...` | ADMIN, SUPER_ADMIN |
| Reordenar actividades | `POST /plans/:id/activities/reorder` | ADMIN, SUPER_ADMIN |
| Impacto borrado actividad | `GET /plans/:id/activities/:activityId/delete-impact` | ADMIN, SUPER_ADMIN |
| Borrar actividad | `DELETE /plans/:id/activities/:activityId` | ADMIN, SUPER_ADMIN |
| Clonar | `POST /plans/:id/clone` | ADMIN, SUPER_ADMIN |
| Vincular opcional | `POST /plans/:id/optional-links` | ADMIN, SUPER_ADMIN |
| Desvincular | `DELETE /plans/:id/optional-links/:optionalId` | ADMIN, SUPER_ADMIN |

## Opcionales globales (`/optional-activities`)

| Pantalla / acción | Método y ruta | Roles |
|-------------------|---------------|--------|
| Listar | `GET /optional-activities` | optionalAuth |
| CRUD | `POST`, `PATCH`, `DELETE` | ADMIN, SUPER_ADMIN |

## Inventario (`/inventory`, `/suppliers`)

| Pantalla / acción | Método y ruta | Roles | Idempotencia |
|-------------------|---------------|--------|--------------|
| Ítems | `GET/POST /inventory/items`, `PUT /inventory/items/:id` | list VIEWER+; create/update ADMIN+ | — |
| Movimientos | `GET .../movements`, `POST /inventory/movements` | mov POST BUSINESS+ | ✅ `idempotencyInventoryMovement` |
| Alertas | `GET /inventory/alerts` | VIEWER+ | — |

## Reportes (`/reports`)

| Pantalla | Método y ruta | Roles |
|----------|---------------|--------|
| Ocupación / revenue / inventario / reservas agregado | `GET /reports/occupancy`, `revenue`, `inventory`, `reservations` | según `reports.routes.js` |

Swagger: mantener coherencia con implementación (`backend` OpenAPI si existe en el repo).
