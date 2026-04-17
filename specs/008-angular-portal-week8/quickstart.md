# Quickstart — Semana 8 (008)

## Prerrequisitos

- API `backend/` en `:3000` con migraciones aplicadas.
- `admin-portal/` con `npm start` y `proxy.conf.json` → `/api` → backend.
- Variables de almacenamiento (`STORAGE_PROVIDER`, credenciales S3 o local) para probar upload real.

## API_BASE_URL (landing y smoke)

- **Landing estática** (`landing-page/`): definir en JS o HTML la base del API (p. ej. `http://localhost:3000/api/v1` en dev). Mismo nombre de variable que en `landing-page/README.md` cuando exista (`API_BASE_URL`).
- **Portal admin**: las mutaciones idempotentes hacia `PUT /site-content/:section`, `PUT /business-config` y `POST /media/upload` deben incluir cabecera **`Idempotency-Key`** (ver `IdempotencyService` en `admin-portal`).
- **Smoke por rol** (post-implementación S8): validar acceso a `/admin/cms` (incl. `/admin/cms/media`), `/admin/users`, `/admin/settings`, `/admin/profile` según matriz §6; anotar desviaciones en este archivo.
- **Responsive (T073)**: con el portal y la landing abiertos, comprobar manualmente **360px** y **1280px** (sin regresiones de overflow en tablas CMS y medios).
- **Imágenes / Lighthouse (T080)**: opcional — registrar en este archivo notas de Lighthouse o auditoría manual de peso de imágenes tras subir contenido real.
- **Smoke final (T084)**: repetir matriz por rol tras cambios en rutas lazy; mantener enlaces a esta sección como única fuente de verificación manual S8.

## 1. Arranque local

```powershell
Set-Location e:\Proyectos\multi_stage\hotel\backend
npm run dev
```

```powershell
Set-Location e:\Proyectos\multi_stage\hotel\admin-portal
npm start
```

## 2. Smoke por rol (portal)

| Rol | Qué validar |
|-----|--------------|
| `VIEWER` / `BUSINESS` | No entran a `/admin/cms`, `/admin/users`, `/admin/settings` |
| `ADMIN` | CMS completo, usuarios (sin crear SUPER_ADMIN), settings sin ver secretos MP en claro |
| `SUPER_ADMIN` | Puede editar credenciales MP y cualquier usuario |

## 3. Smoke CMS

1. Subir imagen y video (cuando exista soporte) → aparecen en biblioteca con tipo correcto.
2. Editar hero + contacto → `GET /api/v1/site-content/public` refleja cambios.
3. Reordenar FAQs en admin → orden en `GET /api/v1/faqs` público coincide.
4. Intentar borrar medio en uso → error 409 con mensaje.

## 4. Landing estática

```powershell
Set-Location e:\Proyectos\multi_stage\hotel\landing-page
# servir con extensión Live Server o `npx serve` apuntando al directorio
```

- Abrir `index.html` y verificar consola de red: bundle público y FAQs sin 401.
- Si las peticiones a habitaciones/planes devuelven 401, aplicar contrato `public/*` del plan (research R-002).

## 5. Referencias

- [spec.md](./spec.md)
- [plan.md](./plan.md)
- [research.md](./research.md)
- `CONTEXTO_MAESTRO.md` §6, §17
