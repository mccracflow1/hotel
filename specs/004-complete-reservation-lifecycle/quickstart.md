# Quickstart: 004 — Ciclo completo de reservas, inventario, administración y reportes

Guía mínima para desarrollar y probar esta feature en local contra el repo `hotel`.

## Prerrequisitos

- Node.js 20 LTS
- PostgreSQL 14+ con datos de migraciones aplicadas (incluye `005_reservations`, `008_cms_config` → `business_config`, inventario en migraciones previas del proyecto)
- Variables de entorno del backend (`JWT_SECRET`, `DATABASE_URL`, etc.)

## Base de datos

Desde `backend/`:

```bash
npm install
npx knex migrate:latest
```

Si se añaden migraciones en la implementación (p. ej. `CHECK (current_stock >= 0)` en `inventory_items`), aplicarlas antes de tests.

## Arrancar API

```bash
npm run dev
```

Salud: `GET http://localhost:<PORT>/api/v1/health`

## Montajes en `app.js`

Habilitar cuando los routers estén implementados:

- `/api/v1/inventory` (y rutas anidadas o `/api/v1/suppliers` según código)
- `/api/v1/users`
- `/api/v1/reports`
- `/api/v1/business-config` (o nombre acordado en router)

Las rutas de `reservations` ya están montadas; ampliar el mismo router con los nuevos paths **antes** de `/:id` para rutas estáticas (`by-number`, etc.).

## Pruebas sugeridas

1. **Reservas**: `GET` listado con JWT `VIEWER`; `GET by-number`; `GET policy`; `PUT` fechas con conflicto de disponibilidad → 409; `POST optional-activities` con opcional ajeno al plan → error; `DELETE` con motivo.
2. **Idempotencia**: reintentar `PUT`/`DELETE`/`POST` opcionales con misma `Idempotency-Key` donde el middleware esté activo.
3. **Inventario**: movimiento `EXIT` que exceda stock → rechazo; alertas listan solo `is_active = true` bajo mínimo.
4. **Users**: como `ADMIN`, intento de crear `SUPER_ADMIN` → 403.
5. **Business config**: `GET` como `BUSINESS` — sin secretos MP completos; `PUT` credenciales como `SUPER_ADMIN`.
6. **Reportes**: dos `GET` con mismos `from`/`to` → mismos totales; `revenue` incluye `meta.revenue_basis`.

## Contratos

Ver `specs/004-complete-reservation-lifecycle/contracts/openapi.yaml` y consolidación Swagger en `/api/docs` tras implementar JSDoc.
