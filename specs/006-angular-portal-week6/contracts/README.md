# Contratos de consumo — Portal Semana 6 ↔ API

**Base**: `{apiUrl}` = `environment.apiUrl` (ej. `http://localhost:3000/api/v1`)

Todas las rutas autenticadas llevan `Authorization: Bearer <accessToken>` salvo login/forgot.

## Auth

| Método | Ruta | Uso portal |
|--------|------|--------------|
| POST | `/auth/login` | Body `{ email, password }` → guardar access en memoria; cookie refresh la setea el servidor |
| POST | `/auth/refresh` | `withCredentials: true`, sin body |
| POST | `/auth/logout` | Bearer + invalidar sesión servidor |

## Usuario actual (si hace falta rol)

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/users/me` | Perfil y rol si no está en JWT |

## Dashboard

| Método | Ruta | Rol (backend) |
|--------|------|----------------|
| GET | `/reports/occupancy?from=&to=` | VIEWER, BUSINESS, ADMIN, SUPER_ADMIN, AGENT |
| GET | `/reports/revenue?from=&to=` | idem |
| GET | `/reports/reservations?from=&to=&…` | idem |
| GET | `/reports/inventory?…` | idem |
| GET | `/reservations?…` | Listado compacto próximas reservas |

## Habitaciones

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/rooms` | Público opcional auth; admin usa filtros query |
| GET | `/rooms/:id` | Detalle + media |
| POST | `/rooms` | ADMIN, SUPER_ADMIN |
| PATCH | `/rooms/:id` | ADMIN, SUPER_ADMIN |
| DELETE | `/rooms/:id` | ADMIN, SUPER_ADMIN (soft) |
| POST | `/media/upload` + `/rooms/:id/media` | Asociar medios (spec 005) |

## Disponibilidad y temporadas

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/availability?fecha_inicio&fecha_fin&…` | Público / según implementación actual |
| GET | `/availability/calendar` | VIEWER+ |
| POST | `/availability` | BUSINESS, ADMIN, SUPER_ADMIN |
| POST | `/availability/block` | ADMIN, SUPER_ADMIN |
| GET | `/seasons` | VIEWER+ |
| POST | `/seasons` | ADMIN, SUPER_ADMIN |
| PUT | `/seasons/:id` | ADMIN, SUPER_ADMIN |
| DELETE | `/seasons/:id` | ADMIN, SUPER_ADMIN |

> Confirmar query params exactos en `specs/004-complete-reservation-lifecycle/contracts/openapi.yaml` y módulos `availability` / `seasons` del repo antes de codificar.
