# Data Model: 004 — Ciclo completo de reservas, inventario, administración y reportes

Extiende el modelo de [003](../003-rooms-planes-reservas/data-model.md) con reglas de **ciclo de vida de reserva**, **inventario**, **usuarios**, **business_config** y agregados de **reportes**.

## Reservation (`reservations`) — transiciones de estado

| Campo | Uso en 004 |
|-------|----------------|
| status | Ver enum en BD: `PENDING`, `PAYMENT_PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`. Transiciones manuales `PATCH …/status` solo donde política de negocio permita (p. ej. confirmación manual → `CONFIRMED` rol ADMIN). |
| cancellation_reason | Obligatorio al pasar a `CANCELLED` vía `DELETE` o si se usa cancelación por PATCH documentado. |
| total_amount | Recalculado al agregar opcionales posteriores (suma de líneas opcionales adicionales al total previo o fórmula documentada en servicio). |
| version | Optimistic locking opcional en `PUT`/`PATCH`. |

**Transiciones (referencia — validar en servicio)**

```
PENDING → PAYMENT_PENDING | CONFIRMED | CANCELLED
PAYMENT_PENDING → CONFIRMED | CANCELLED | ...
CONFIRMED → CANCELLED | COMPLETED
CANCELLED → (terminal)
```

**Reglas**

- **Snapshot base**: sin `UPDATE`/`DELETE` en `reservation_activity_snapshot` vía API pública.
- **Opcionales**: solo `INSERT` en `reservation_optional_activities` post-creación; `price_snapshot` / `activity_name_snapshot` al momento del alta de la línea.

## Policy evaluation (no tabla nueva)

Entrada: `reservation_id` o fechas + monto. Fuente: `business_config.cancellation_policy` JSON, p. ej.:

```json
[
  { "hours_before": 72, "penalty_pct": 0 },
  { "hours_before": 24, "penalty_pct": 50 }
]
```

Salida API: penalidad aplicable al `total_amount` o porcentaje según primera regla cuyo umbral cumpla `hours_before_checkin`.

## InventoryItem (`inventory_items`)

| Campo | Reglas |
|-------|--------|
| category | Enum `inv_category`: food, beverages, cleaning, maintenance, other |
| current_stock, min_stock | Decimales; `current_stock >= 0` siempre |
| supplier_id | FK opcional a `suppliers` |

## InventoryMovement (`inventory_movements`)

| Campo | Reglas |
|-------|--------|
| type | `ENTRY` (suma stock), `EXIT` (resta), `ADJUSTMENT` (fija o delta según convención del servicio — documentar una sola semántica) |
| quantity | Positiva; efecto sobre stock según `type` |
| reservation_id | Nullable — trazabilidad de consumo |
| created_by | Usuario JWT |

**Invariante**: tras movimiento, `current_stock` del ítem ≥ 0.

## Supplier (`suppliers`)

CRUD estándar; `is_active` para filtrar en selects de UI/API.

## User (`users`)

| Regla 004 |
|-----------|
| `ADMIN` no puede crear/editar/desactivar usuarios con rol `SUPER_ADMIN`. |
| Perfil propio: subset de campos (`name`, `avatar_url`, password change flow). |

## BusinessConfig (`business_config`) — fila única

| Campo | 004 |
|-------|-----|
| checkin_time, checkout_time | Lectura/escritura validada |
| cancellation_policy | JSONB con esquema Joi compartido con `GET …/policy` |
| mp_* | Lectura enmascarada; escritura solo rol según matriz (SUPER_ADMIN para secretos) |

## Season (`seasons`)

| Regla adicional |
|-----------------|
| No solape con otras temporadas (mismo concepto de “temporada de precio” para el hotel), excluyendo el registro actual en `PUT`. |

Columnas en migración: `date_start`, `date_end`, `price_multiplier`, `name` — alinear nombres en API interna con repositorio existente.

## Reportes (vistas/agregaciones)

No requieren tablas nuevas obligatorias:

- **Ocupación**: agregación sobre `reservations` en rango, filtrando estados incluidos (documentados en respuesta).
- **Ingresos (preliminar)**: suma de `total_amount` por filtros; `meta` indica que no refleja necesariamente cobros confirmados en MP.
- **Detalle reservas**: lista paginada con mismos filtros que listado admin.
- **Inventario**: movimientos en ventana con running balance por ítem o snapshot inicial + suma de movimientos — definir en servicio y documentar en OpenAPI.

## Auditoría

Mutaciones en reservas, inventario, usuarios, `business_config`: `audit_logs` vía triggers + `setAuditUserOnTrx` donde aplique tabla auditada.
