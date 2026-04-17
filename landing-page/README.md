# Sitio público (landing) — Semana 8

## Servir en local

- Con [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) abriendo `index.html`, o
- `npx --yes serve .` desde esta carpeta (puerto por defecto 3000/8080 según versión).

## Variable `API_BASE_URL`

Los scripts de datos (`app.js` cuando exista) deben apuntar al API, por ejemplo:

- Desarrollo: `http://localhost:3000/api/v1`
- Producción: URL pública del backend + `/api/v1`

La convención detallada y el smoke por rol están en `specs/008-angular-portal-week8/quickstart.md` (§ API_BASE_URL).
