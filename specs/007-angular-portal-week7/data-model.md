# Data model (vista UI) — Semana 7

Vista de modelos consumidos o proyectados por el portal; la fuente de verdad sigue siendo el API y PostgreSQL.

## Reservas

| Concepto UI | Origen API típico | Notas |
|-------------|-------------------|--------|
| `ReservationListRow` | `GET /reservations` → `data[]` + `meta` | Columnas: número, cliente, servicio, fechas, personas, montos, `status`, estado de pago derivado de payload o join expuesto. |
| `ReservationDetail` | `GET /reservations/:id` | Incluye cliente, snapshot actividades base, opcionales contratadas, historial. |
| `ReservationFilters` | query params list schema | `status`, `date_from`, `date_to`, `room_id`, `plan_id`, `q`, `page`, `limit`. |
| `CancellationPolicyView` | `GET /reservations/:id/policy` | Texto/estructura para modal cancelación. |

**Transiciones UI**: listado → drawer detalle; acciones disparan PATCH/PUT/DELETE y refresco de detalle o fila.

## Planes

| Concepto UI | Origen API | Notas |
|-------------|------------|--------|
| `PlanListRow` | `GET /plans` | `is_active`, cover URL, conteo actividades desde payload o campo agregado. |
| `PlanFormModel` | `GET/PATCH/POST /plans` | Campos Joi alineados a `plans.schema`. |
| `PlanActivityRow` | anidado en plan detail | `sort_order`, nombre, duración según API. |
| `DeleteImpact` | `GET /plans/:id/activities/:activityId/delete-impact` | Mostrar conteo antes de `DELETE`. |

## Actividades opcionales

| Concepto UI | Origen API | Notas |
|-------------|------------|--------|
| `OptionalActivity` | `GET/POST/PATCH/DELETE /optional-activities` | Catálogo global. |
| `PlanOptionalLink` | `POST /plans/:id/optional-links`, `DELETE /plans/:id/optional-links/:optionalId` | Asociación y **desasociación** plan ↔ opcional; flags `is_default` / pre-selección si el API los expone. |

## Inventario

| Concepto UI | Origen API | Notas |
|-------------|------------|--------|
| `InventoryItemRow` | `GET /inventory/items` | Badge stock bajo vs `GET /inventory/alerts`. |
| `MovementForm` | `POST /inventory/movements` | Tipo entrada/salida, `item_id`, cantidad, notas + **Idempotency-Key**. |

## Proveedores

| Concepto UI | Origen API | Notas |
|-------------|------------|--------|
| `Supplier` | `GET/POST/PATCH/DELETE /suppliers` (según implementación backend) | CRUD en sub-ruta inventario o feature dedicada. |

## Reportes

| Concepto UI | Origen API | Notas |
|-------------|------------|--------|
| `ReportRange` | query `from`/`to` en `/reports/*` | Misma familia que dashboard S6. |
| `PlanPerformanceReport` | compuesto o endpoint futuro | Si no existe, degradación + tarea backend opcional. |
