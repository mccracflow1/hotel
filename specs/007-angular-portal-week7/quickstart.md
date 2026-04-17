# Quickstart — Portal Semana 7

## Prerrequisitos

- API en `backend/` levantada (`npm run dev` en `:3000`).
- `admin-portal/` con proxy (`npm start` en `:4200`) según Semana 6.
- Usuarios de prueba por rol (`ADMIN`, `SUPER_ADMIN`, `BUSINESS`, `VIEWER`) y datos semilla de reservas/planes/inventario.

## 1. Instalar dependencias nuevas (S7)

Si el `package.json` del repo ya declara las libs de S7, alcanza con `npm install` en `admin-portal/`. Solo si faltan entradas:

```powershell
Set-Location e:\Proyectos\multi_stage\hotel\admin-portal
npm install exceljs jspdf jspdf-autotable @angular/cdk --save
```

(`@angular/cdk` si aún no está transitivamente cubierto por Material.)

## 2. Rutas a verificar manualmente

| Ruta portal | Módulo |
|-------------|--------|
| `/admin/reservations` | Reservas |
| `/admin/plans` | Planes |
| `/admin/optional-activities` | Catálogo opcionales |
| `/admin/inventory` | Inventario |
| `/admin/reports` | Reportes |

Tras implementar, actualizar `nav.config.ts` para que el menú refleje §6.

## 3. Flujo de smoke test

1. **VIEWER**: abrir reservas (lista + detalle + export si habilitado), reportes; confirmar que **no** aparecen acciones mutadoras ni POST movimientos.
2. **BUSINESS**: confirmar cancelación/ fechas en reserva permitidas; inventario movimiento; **no** debe ver CRUD planes.
3. **ADMIN**: CRUD plan, opcionales, clonar plan, enlace de pago (`POST /payments/create` si rol coincide).

### SC-001 / SC-002 (manual)

- **SC-001**: exportaciones pesadas — en reservas, CSV/Excel con muchos registros debe mostrarse feedback de progreso o mensaje informativo (no bloqueo silencioso).
- **SC-002**: matriz de roles — `VIEWER` no completa mutaciones en reservas ni movimientos de inventario; planes/opcionales solo `ADMIN`/`SUPER_ADMIN` (rutas + `*appHasRole`).

## Referencias

- [spec.md](../spec.md)
- [contracts/README.md](./contracts/README.md)
- `CONTEXTO_MAESTRO.md` §6
