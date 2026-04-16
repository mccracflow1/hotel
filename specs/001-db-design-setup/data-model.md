# Data Model: DB Design & Project Setup (Semana 1)

## Entities

### Users
- `id`: UUID (PK)
- `name`: VARCHAR(120)
- `email`: VARCHAR(200) (Unique)
- `password_hash`: VARCHAR(255)
- `role`: ENUM ('SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT')
- `is_active`: BOOLEAN
- `created_at`: TIMESTAMPTZ

### Rooms
- `id`: UUID (PK)
- `name`: VARCHAR(100)
- `type`: ENUM ('cabin', 'room', 'pasadia', 'additional')
- `capacity`: SMALLINT
- `base_price`: DECIMAL(12,2)
- `is_active`: BOOLEAN
- `deleted_at`: TIMESTAMPTZ (Soft delete)

### Plans
- `id`: UUID (PK)
- `name`: VARCHAR(100)
- `base_price`: DECIMAL(12,2)
- `room_id`: UUID (FK -> Rooms)
- `is_active`: BOOLEAN

### PlanActivities (Snapshot)
- `id`: UUID (PK)
- `plan_id`: UUID (FK -> Plans)
- `name`: VARCHAR(150)
- `description`: TEXT
- `extra_cost`: DECIMAL(10,2)

### Reservations
- `id`: UUID (PK)
- `reservation_number`: VARCHAR(20) (Unique)
- `customer_name`: VARCHAR(200)
- `customer_document`: VARCHAR(30)
- `date_start`: DATE
- `date_end`: DATE
- `status`: ENUM ('PENDING', 'CONFIRMED', 'CANCELLED')
- `total_amount`: DECIMAL(12,2)
- `version`: INTEGER (For optimistic locking fallback)

### ReservationActivitySnapshot
- `id`: UUID (PK)
- `reservation_id`: UUID (FK -> Reservations)
- `activity_name`: VARCHAR(150)
- `price_snapshot`: DECIMAL(10,2)

### IdempotencyKeys
- `key`: VARCHAR(128) (PK)
- `operation`: VARCHAR(60)
- `response_body`: JSONB
- `expires_at`: TIMESTAMPTZ

## Relationships
- `Plans` belong to one `Rooms`.
- `Reservations` link to one `Plans` or `Rooms`.
- `ReservationActivitySnapshot` is an immutable copy of `PlanActivities` at the time of booking.
- `AuditLogs` track changes to all critical entities.
