# Data Model: Autenticación JWT, RBAC y Módulo de Disponibilidad

**Feature**: `002-jwt-auth-disponibilidad`
**Generated**: 2026-04-16

---

## Entities

### 1. User (ya existe — migración 001)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Identificador de login |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt, salt_rounds=12 |
| name | VARCHAR(255) | NOT NULL | Nombre visible |
| role | ENUM user_role | NOT NULL, DEFAULT 'VIEWER' | SUPER_ADMIN/ADMIN/BUSINESS/VIEWER/AGENT |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | FALSE = acceso bloqueado |
| avatar_url | VARCHAR(500) | NULL | URL de avatar |
| last_login_at | TIMESTAMPTZ | NULL | Actualizado en cada login exitoso |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**State invariants**:
- Un usuario con `is_active = false` DEBE ser rechazado con 401 aunque presente token JWT válido.
- El campo `role` es inmutable desde el punto de vista del usuario — solo SUPER_ADMIN puede modificarlo.

---

### 2. RefreshToken (ya existe — migración 001)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE | SHA-256 del token raw |
| expires_at | TIMESTAMPTZ | NOT NULL | NOW() + 7 days |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**State invariants**:
- Inmutable después de creación — nunca se actualiza.
- Se elimina (DELETE) al ser utilizado (rotación) o al hacer logout.
- Si un token rotado vuelve a usarse → reutilización detectada → DELETE de TODOS los tokens del usuario.
- El token raw viaja en la cookie httpOnly; solo el hash se persiste en BD.

**Transición de estado**:
```
[Creado] → [Usado para refresh] → [Eliminado + nuevo token creado]
           ↓
           [Logout] → [Eliminado]
           ↓
           [Reutilización detectada] → [Todos los tokens del usuario eliminados]
```

---

### 3. Availability (ya existe — migración 004)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| room_id | UUID | NULL, FK → rooms(id) | NULL cuando aplica a plan sin habitación |
| plan_id | UUID | NULL, FK → plans(id) | NULL cuando aplica a habitación sin plan |
| date | DATE | NOT NULL | Fecha específica del slot |
| total_slots | SMALLINT | NOT NULL, DEFAULT 1 | Cupos máximos configurados |
| blocked_slots | SMALLINT | NOT NULL, DEFAULT 0 | Cupos bloqueados (mantenimiento, eventos) |
| block_reason | TEXT | NULL | Obligatorio si blocked_slots > 0 vía POST /availability/block |
| special_price | DECIMAL(10,2) | NULL | Override de precio para esta fecha/habitación/plan |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Derived field (calculado en runtime)**:
- `available_slots = total_slots - blocked_slots - COUNT(reservations WHERE status IN ('PENDING','CONFIRMED') AND date solapada)`

**Constraints**:
- `UNIQUE(room_id, plan_id, date)` — un solo registro de disponibilidad por combinación.
- `CHECK(blocked_slots >= 0 AND blocked_slots <= total_slots)`.
- `CHECK(room_id IS NOT NULL OR plan_id IS NOT NULL)`.

**Index crítico (ya existe — migración 009)**:
```sql
idx_availability_lookup ON availability(room_id, plan_id, date) 
WHERE blocked_slots < total_slots
```

---

### 4. Season (ya existe — migración 004)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | Ej: "Semana Santa", "Temporada Alta" |
| date_start | DATE | NOT NULL | Inicio inclusive |
| date_end | DATE | NOT NULL | Fin inclusive |
| price_multiplier | DECIMAL(4,2) | NOT NULL, DEFAULT 1.00 | Ej: 1.5 = 50% más caro |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraints**:
- `CHECK(date_end >= date_start)`.
- `CHECK(price_multiplier > 0)`.
- Los rangos de temporadas pueden solaparse; en ese caso se aplica el multiplicador más alto (lógica en servicio).

**Lógica de precio efectivo**:
```
precio_final = special_price ?? (base_price × MAX(price_multiplier WHERE date BETWEEN date_start AND date_end) ?? 1.0)
```

---

### 5. PasswordResetToken (nuevo — migración 011)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE | SHA-256 del token raw (UUID v4) |
| expires_at | TIMESTAMPTZ | NOT NULL | NOW() + 1 hour |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**State invariants**:
- Inmutable después de creación — nunca se actualiza.
- Se elimina (DELETE) al ser utilizado (`consumePasswordResetToken`) o si el usuario solicita uno nuevo (DELETE previo antes de INSERT).
- El token raw se envía por email (o se logea en consola en desarrollo); solo el hash se persiste.
- Un usuario solo puede tener un token de reset activo a la vez.

**Transición de estado**:
```
[Creado] → [Enviado por email] → [Usado vía POST /reset-password] → [Eliminado]
           ↓
           [Expirado (> 1h)] → [Eliminado en próxima solicitud o cleanup]
```

---

## JWT Payload Structure

### Access Token (15 min, entregado en body JSON)

```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@hotel.com",
  "role": "ADMIN",
  "iat": 1713225600,
  "exp": 1713226500
}
```

### Refresh Token (7 días, httpOnly cookie)

El token raw es un UUID v4 generado aleatoriamente. Solo el `SHA-256(token_raw)` se almacena en `refresh_tokens.token_hash`.

**Cookie settings**:
```
Set-Cookie: refreshToken=<uuid-raw>; HttpOnly; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
```

### Token de Agente IA (1 año, sin cookie)

```json
{
  "sub": "uuid-del-usuario-agent",
  "email": "agent-sofia@hotel.internal",
  "role": "AGENT",
  "iat": 1713225600,
  "exp": 1744761600
}
```

---

## Relationships

```
users ──< refresh_tokens    (one user → many refresh tokens)
users ──> audit_logs        (one user → many audit entries, via created_by)
rooms ──< availability      (one room → many availability records)
plans ──< availability      (one plan → many availability records)
seasons [independent]       (aplican globalmente por rango de fecha)
```

---

## Validation Rules

### Login Request
- `email`: string, formato email válido, max 255 chars, required
- `password`: string, min 8 chars, max 128 chars, required

### Password Reset
- `token`: string, UUID format, required
- `new_password`: string, min 8 chars, max 128 chars, required
- Requisitos mínimos: al menos 1 mayúscula, 1 número

### Availability Query
- `fecha_inicio`: DATE string (YYYY-MM-DD), required, debe ser >= hoy
- `fecha_fin`: DATE string (YYYY-MM-DD), required, debe ser >= fecha_inicio
- `tipo_servicio`: 'room' | 'plan' | null (opcional)
- `num_personas`: integer >= 1, optional
- Máximo rango permitido: 90 días

### Season Create/Update
- `name`: string, min 3 chars, max 255 chars, required
- `date_start`: DATE string, required
- `date_end`: DATE string, required, >= date_start
- `price_multiplier`: number, min 0.01, max 99.99, required
