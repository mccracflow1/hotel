# Data model — Vista portal (Semana 6)

**Feature**: `006-angular-portal-week6`  
**Nota**: No se crean tablas nuevas. Estos son **modelos de vista** y DTOs alineados al API.

## 1. Sesión de usuario (`AuthSession`)

| Campo lógico | Origen | Uso en UI |
|--------------|--------|-----------|
| `userId` | JWT `sub` o `/users/me` | Auditoría visual, perfil |
| `email` | `/users/me` o login response | Topbar |
| `role` | JWT o `/users/me` | `RoleGuard`, menú |
| `accessToken` | memoria | Header `Authorization` |

**Estados UI**: `anonymous` | `authenticating` | `authenticated` | `refreshing` | `error`.

## 2. Navegación (`NavItem`)

| Campo | Descripción |
|-------|-------------|
| `id` | clave estable (`dashboard`, `rooms`, …) |
| `label` | texto menú |
| `route` | path Angular (`/admin/dashboard`) |
| `icon` | nombre Material icon |
| `minRoles` | roles que pueden ver la entrada |

Matriz mínima Semana 6 (del maestro):

- Dashboard → todos los roles portal.
- Habitaciones → `ADMIN`, `SUPER_ADMIN`.
- Disponibilidad → `ADMIN`, `BUSINESS`, `SUPER_ADMIN` (editores); `VIEWER` solo lectura.

## 3. Dashboard

### KPI cards (4)

| KPI | Fuente API probable | Rol mínimo |
|-----|---------------------|------------|
| Reservas del día | `GET /api/v1/reservations?date_from=today&date_to=today&limit=1` + meta `total` o agregado dedicado | VIEWER+ |
| Ocupación % (mes o ventana) | `GET /api/v1/reports/occupancy?from&to` | VIEWER+ |
| Ingresos del mes | `GET /api/v1/reports/revenue?from&to` | VIEWER+ |
| Alertas stock bajo | `GET /api/v1/reports/inventory` o endpoint de alertas si existe | VIEWER+ |

> Si algún agregado no existe, la UI muestra “No disponible” y se abre tarea backend — ver `spec.md` dependencias.

### Gráfica ocupación 7 días

Serie `{ date, occupancyPct }[]` derivada de `reports/occupancy` o `availability/calendar` según convenga en implementación.

### Lista próximas 10 reservas

Columnas: número, cliente, servicio, fechas, estado, estado de pago (si viene en DTO).

## 4. Habitaciones (`RoomListRow` / `RoomForm`)

Alineado a `GET/POST/PATCH/DELETE` rooms del API:

- Listado: `id`, `name`, `type`, `capacity`, `base_price`, `is_active`, `cover_media_url`.
- Formulario: campos del contrato Joi existente + `amenities: string[]` + `media_ids` + `cover_media_id` si el API lo soporta en PATCH.

**Estados de fila**: `active` | `inactive` | `deleted` (soft).

## 5. Disponibilidad

### `CalendarMonth`

- `year`, `month`
- `cells: CalendarCell[]` (28–42 celdas)

### `CalendarCell`

- `date` (ISO date)
- `occupancyLevel` | `occupancyPct` (mapeo a color)
- `hasBlock` (opcional, si API expone bloqueos en calendario)

### `DayDetailPanel`

- Lista de entidades ocupables / slots según respuesta de `GET /availability/calendar` o endpoint de detalle acordado.

### `SeasonForm`

- `name`, `date_start`, `date_end`, `price_multiplier`
- Validación solape: mensaje de error del API.

### `BlockForm`

- `date_start`, `date_end`, `reason` (según `POST /availability/block`)

## 6. Componentes compartidos (contrato interno UI)

| Componente | Inputs / outputs clave |
|--------------|-------------------------|
| `DataTable` | `columns`, `data`, `total`, `page`, `pageSize`, `loading`, `(pageChange)`, `(sortChange)` |
| `ConfirmDialog` | `title`, `message`, `confirmLabel`, `(confirmed)` |
| `Toast` | servicio inyectable: `success(msg)`, `error(msg)` |
| `LoadingOverlay` | `visible` signal |
