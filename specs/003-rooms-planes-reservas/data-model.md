# Data Model: 003 — Habitaciones, Planes y Creación de Reservas

Mapeo de entidades de negocio a tablas existentes (migraciones Knex 002–005) más reglas de validación y transiciones.

## Entity: Room (`rooms`)

| Campo (DB) | Tipo | Reglas / notas |
|------------|------|----------------|
| id | UUID PK | `gen_random_uuid()` |
| name | string(100) | Obligatorio |
| slug | string(100) UNIQUE | Generado/normalizado en API |
| type | `room_type` | `cabin`, `room`, `pasadia`, `additional` (spec: cabaña, habitación, pasadía, servicio adicional) |
| description | text | Opcional |
| capacity | smallint | > 0 |
| base_price | decimal(12,2) | ≥ 0 |
| amenities | jsonb | Default `[]` |
| is_active | boolean | Default true; catálogo público solo `true` |
| sort_order | smallint | Default 0 |
| deleted_at | timestamptz | Soft delete; nunca físico si hay reservas (FR-003) |
| created_at / updated_at | timestamptz | Auditoría |

**Relaciones**

- `room_media` (N:N) → `media_library`; máximo una `is_cover = true` recomendada por negocio (FR-005).
- `plans.room_id` opcional (plan asociado a habitación física).

## Entity: RoomMedia (`room_media`)

| Campo | Notas |
|-------|--------|
| room_id, media_id | PK compuesta |
| is_cover, sort_order | FR-005 |

## Entity: Plan (`plans`)

| Campo | Notas |
|-------|--------|
| base_price, price_unit | `price_unit` enum: per_person, per_group, per_night, per_session |
| max_persons, min_nights | Validar contra reserva |
| room_id | Nullable |
| is_active, deleted_at | Igual patrón que rooms |
| slug | Único |

**Relaciones**: `plan_media`, `plan_activities`, `plan_optional_activities`.

## Entity: PlanActivity — actividad base (`plan_activities`)

| Campo | Notas |
|-------|--------|
| plan_id | CASCADE delete |
| name, description | Copiados al snapshot |
| extra_cost | 0 = incluida en precio base |
| sort_order | Reordenamiento por lote (FR-008): API recibe lista ordenada de ids y actualiza en transacción |

**Estado / eliminación**: Antes de borrar fila, endpoint de impacto (FR-009) devuelve conteo de reservas **futuras** (`date_start` ≥ hoy) en `PENDING` o `CONFIRMED` cuyo snapshot incluye esa actividad; el `DELETE` exige confirmación explícita (p. ej. cabecera `X-Confirm-Impact: true`).

## Entity: OptionalActivity — catálogo global (`optional_activities`)

| Campo | Notas |
|-------|--------|
| price, price_unit | Catálogo global (FR-010) |
| is_active | Inactivas no ofrecidas en nuevas reservas |
| media_id | Opcional |

## Entity: PlanOptionalActivity (`plan_optional_activities`)

| Campo | Notas |
|-------|--------|
| plan_id, optional_activity_id | PK compuesta |
| is_default | Preseleccionada en el plan (FR-011); listado: primero `is_default`, luego nombre (FR-012) |

## Entity: Reservation (`reservations`)

| Campo | Notas |
|-------|--------|
| reservation_number | Único, formato HT-YYYY-NNNNN (FR-020) |
| room_id, plan_id | XOR: exactamente uno no nulo (asunción spec) — validar en API |
| customer_* | Obligatorios según schema |
| date_start, date_end | `date_end` nullable en migración; validar reglas de estancia |
| adults, children | ≥ 0 |
| status | Inicial `PENDING` (FR-022); otros estados fuera de scope de esta feature |
| total_amount | Calculado en servidor |
| created_by | Usuario JWT |
| version | Optimistic locking fallback |

## Entity: ReservationActivitySnapshot (`reservation_activity_snapshot`)

Inmutable post-insert. Sin `created_at` a propósito (migración 005).

| Campo | Origen al crear reserva |
|-------|------------------------|
| activity_name, description, extra_cost, sort_order | Copia de `plan_activities` del plan elegido |

## Entity: ReservationOptionalActivity (`reservation_optional_activities`)

| Campo | Notas |
|-------|--------|
| optional_activity_id | Nullable ON DELETE SET NULL; histórico preservado en snapshots de texto/precio |
| activity_name_snapshot, price_snapshot | FR-019 |
| quantity | Default 1 |

## Supporting: Idempotency (`idempotency_keys`)

| Campo | Uso |
|-------|-----|
| key (PK) | Header `Idempotency-Key` |
| operation | p. ej. `reservation:create` |
| response_status, response_body | Respuesta cacheada (completar en implementación) |
| expires_at | TTL 24h default |

## Supporting: Audit (`audit_logs`)

Triggers en tablas críticas (ver `010_triggers_functions.js`). Ampliar si hace falta a tablas de actividades.

## State transitions (reservas)

Dentro de esta feature solo se define:

- **(none) → PENDING** en creación exitosa.

Transiciones posteriores (confirmar, cancelar) explícitamente fuera de scope (spec Scope).

## Validación XOR plan/room

Regla de aplicación: `(plan_id != null && room_id == null) || (room_id != null && plan_id == null)`.
