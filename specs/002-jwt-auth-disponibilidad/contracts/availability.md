# API Contract: Disponibilidad y Temporadas

**Base path**: `/api/v1/availability`, `/api/v1/seasons`
**Auth**: Los endpoints marcados con 🔒 requieren `Authorization: Bearer <access_token>`

---

## GET /api/v1/availability

Consulta disponibilidad en tiempo real para un rango de fechas. Endpoint público (sin auth requerida para landing page y agente IA).

### Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| fecha_inicio | DATE (YYYY-MM-DD) | ✓ | Debe ser >= hoy |
| fecha_fin | DATE (YYYY-MM-DD) | ✓ | Debe ser >= fecha_inicio, máx 90 días de rango |
| tipo_servicio | 'room' \| 'plan' | ✗ | Sin filtro = devuelve ambos |
| num_personas | integer >= 1 | ✗ | Filtra por plans.max_persons |

### Response 200

```json
{
  "fecha_inicio": "2026-05-01",
  "fecha_fin": "2026-05-05",
  "resultados": [
    {
      "tipo": "plan",
      "id": "550e8400-...",
      "nombre": "Plan Todo Incluido",
      "descripcion_corta": "3 noches con desayuno y cena",
      "precio_base": 450000,
      "precio_efectivo": 675000,
      "multiplicador_temporada": 1.5,
      "nombre_temporada": "Semana de Receso",
      "disponible": true,
      "slots_disponibles": 3,
      "media_cover": "https://cdn.hotel.com/plan-todo-incluido.jpg"
    },
    {
      "tipo": "room",
      "id": "660e8400-...",
      "nombre": "Cabaña Familiar",
      "descripcion_corta": "Cabaña para 4 personas con vista al río",
      "precio_base": 280000,
      "precio_efectivo": 280000,
      "multiplicador_temporada": null,
      "nombre_temporada": null,
      "disponible": true,
      "slots_disponibles": 1,
      "media_cover": "https://cdn.hotel.com/cabana-familiar.jpg"
    }
  ]
}
```

**Lógica de `precio_efectivo`**:
1. Si existe `availability.special_price` para la fecha → usa ese valor
2. Si existe temporada activa → `plan/room.base_price × MAX(price_multiplier)`
3. Si no hay nada → `plan/room.base_price`

**Lógica de concurrencia**: La función PL/pgSQL `check_availability()` usa `SELECT FOR UPDATE SKIP LOCKED` dentro de una transacción para garantizar que dos requests simultáneos no vean el mismo slot disponible.

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `INVALID_DATE_RANGE` | fecha_fin < fecha_inicio |
| 400 | `DATE_RANGE_TOO_LARGE` | Rango > 90 días |
| 400 | `PAST_DATE` | fecha_inicio < hoy |

---

## GET /api/v1/availability/calendar

🔒 Roles: VIEWER, BUSINESS, ADMIN, SUPER_ADMIN

Mapa mensual de ocupación. Respuesta cacheada en memoria (TTL: 60 segundos) para reducir carga en BD.

### Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| year | integer | ✓ | Ej: 2026 |
| month | integer (1-12) | ✓ | Ej: 5 (mayo) |

### Response 200

```json
{
  "year": 2026,
  "month": 5,
  "timezone": "America/Bogota",
  "dias": [
    {
      "fecha": "2026-05-01",
      "porcentaje_ocupacion": 75,
      "slots_totales": 8,
      "slots_ocupados": 6,
      "slots_bloqueados": 0,
      "tiene_temporada": true,
      "nombre_temporada": "Día del Trabajo"
    },
    {
      "fecha": "2026-05-02",
      "porcentaje_ocupacion": 25,
      "slots_totales": 8,
      "slots_ocupados": 2,
      "slots_bloqueados": 1,
      "tiene_temporada": false,
      "nombre_temporada": null
    }
  ]
}
```

---

## POST /api/v1/availability

🔒 Roles: ADMIN, SUPER_ADMIN, BUSINESS

Configura o actualiza cupos de disponibilidad para una combinación room/plan/fecha.

### Request

```json
{
  "room_id": "550e8400-...",
  "plan_id": null,
  "fecha": "2026-05-15",
  "total_slots": 3,
  "special_price": null
}
```

### Response 201

```json
{
  "id": "770e8400-...",
  "room_id": "550e8400-...",
  "plan_id": null,
  "fecha": "2026-05-15",
  "total_slots": 3,
  "blocked_slots": 0,
  "special_price": null,
  "created_at": "2026-04-16T10:00:00Z"
}
```

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `INVALID_ENTITY` | Ni room_id ni plan_id provistos |
| 409 | `ALREADY_EXISTS` | Ya existe registro para esa combinación (usar PUT para actualizar) |

---

## POST /api/v1/availability/block

🔒 Roles: ADMIN, SUPER_ADMIN

Bloquea slots en un rango de fechas con motivo obligatorio.

### Request

```json
{
  "room_id": "550e8400-...",
  "plan_id": null,
  "fecha_inicio": "2026-05-10",
  "fecha_fin": "2026-05-12",
  "slots_a_bloquear": 1,
  "motivo": "Mantenimiento de infraestructura"
}
```

### Response 200

```json
{
  "fechas_afectadas": ["2026-05-10", "2026-05-11", "2026-05-12"],
  "slots_bloqueados": 1
}
```

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `MISSING_REASON` | motivo ausente o vacío |
| 400 | `INSUFFICIENT_SLOTS` | No hay suficientes slots disponibles para bloquear |
| 404 | `AVAILABILITY_NOT_FOUND` | No existe registro de disponibilidad para la combinación |

---

## GET /api/v1/seasons

🔒 Roles: VIEWER, BUSINESS, ADMIN, SUPER_ADMIN

Lista todas las temporadas ordenadas por fecha de inicio.

### Response 200

```json
{
  "temporadas": [
    {
      "id": "880e8400-...",
      "nombre": "Semana Santa",
      "fecha_inicio": "2026-04-18",
      "fecha_fin": "2026-04-21",
      "multiplicador": 1.5,
      "created_at": "2026-03-01T00:00:00Z"
    }
  ]
}
```

---

## POST /api/v1/seasons

🔒 Roles: ADMIN, SUPER_ADMIN

Crea una nueva temporada de precios.

### Request

```json
{
  "nombre": "Vacaciones de Mitad de Año",
  "fecha_inicio": "2026-06-15",
  "fecha_fin": "2026-06-28",
  "multiplicador": 1.3
}
```

### Response 201

```json
{
  "id": "990e8400-...",
  "nombre": "Vacaciones de Mitad de Año",
  "fecha_inicio": "2026-06-15",
  "fecha_fin": "2026-06-28",
  "multiplicador": 1.3,
  "created_at": "2026-04-16T10:00:00Z"
}
```

---

## PUT /api/v1/seasons/:id

🔒 Roles: ADMIN, SUPER_ADMIN

Actualiza una temporada existente. Todos los campos son opcionales (PATCH semántico).

### Request

```json
{
  "multiplicador": 1.4
}
```

### Response 200

Objeto `Season` actualizado completo.

---

## DELETE /api/v1/seasons/:id

🔒 Roles: ADMIN, SUPER_ADMIN

Elimina una temporada. Los precios de disponibilidad vuelven al valor base.

### Response 204

Sin body.

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 404 | `SEASON_NOT_FOUND` | ID no existe |
