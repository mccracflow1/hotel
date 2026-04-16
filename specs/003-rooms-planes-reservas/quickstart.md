# Quickstart: 003 — Habitaciones, Planes y Reservas

Guía mínima para desarrollar y probar esta feature en local contra el repo `hotel`.

## Prerrequisitos

- Node.js 20 LTS
- PostgreSQL 14+ con extensiones usadas por migraciones (`pgcrypto`; `pg_cron` opcional)
- Variables de entorno del backend (copiar desde `.env.example` si existe en el repo; incluir `JWT_SECRET`, cadena `DATABASE_URL` o equivalente Knex)

## Base de datos

Desde `C:\Users\hfrodrigueac\Desktop\proyectos\hotel\backend`:

```bash
npm install
npx knex migrate:latest
```

Las tablas relevantes se crean en migraciones `002_rooms_media`, `003_plans_activities`, `004_availability_seasons`, `005_reservations`, `006_payments` (incluye `idempotency_keys`), `008_cms_config` (`audit_logs`), `010_triggers_functions` (`check_availability`, triggers). Esta feature añade o espera: `012` (`rooms.short_desc`, secuencias de número de reserva), `013` (triggers de auditoría en tablas hijas de plan — tarea T026), `014` (`log_changes` con `user_id` vía GUC `app.audit_user_id` — ya en repo; consumir con `setAuditUserOnTrx` en servicios).

## Arrancar API

```bash
npm run dev
```

Comprobar salud: `GET http://localhost:<PORT>/api/v1/health`

## Habilitar rutas (implementación pendiente)

En `backend/src/app.js` están comentados los mounts de `rooms`, `plans`, `reservations`. Tras implementar los routers, descomentar:

- `/api/v1/rooms`
- `/api/v1/plans`
- `/api/v1/reservations`

## Pruebas sugeridas (manual / integración)

1. **Rooms admin**: JWT `ADMIN`, `POST/PATCH` habitación; público `GET` sin token solo activas.
2. **Plans**: crear plan + actividades base; `PATCH` reorder batch; `GET` detalle con opcionales ordenados (`is_default` primero).
3. **Reservas**: `POST /api/v1/reservations` con header `Idempotency-Key`; verificar misma respuesta en replay; dos hilos misma habitación/fechas → una falla con conflicto/disponibilidad.
4. **Snapshot**: tras reserva, cambiar precio de opcional en catálogo; `GET` reserva debe mostrar `price_snapshot` histórico.

## Contratos

Ver `specs/003-rooms-planes-reservas/contracts/openapi.yaml` para paths previstos y esquemas alineados a la spec.
