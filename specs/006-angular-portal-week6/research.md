# Research — Portal Angular Semana 6

**Feature**: `006-angular-portal-week6`  
**Date**: 2026-04-17

## 1. Ubicación del proyecto Angular

### Decision

Crear aplicación en **`admin-portal/`** en la raíz del monorepo, separada de `backend/`, alineado a `CONTEXTO_MAESTRO.md` §11 y al plan-template del repo.

### Rationale

- Despliegue independiente en Vercel (build SPA).
- Evita mezclar dependencias Node del API con las del front.

### Alternatives considered

| Alternativa | Por qué no |
|-------------|------------|
| Carpeta `frontend/` genérica | Menos clara para DevOps y documentación existente que habla de “portal admin”. |
| Nx monorepo | Mayor ceremonia; YAGNI si solo hay dos paquetes (back + admin). |

---

## 2. Autenticación y tokens

### Decision

- **Access token** solo en **memoria** (`signal`/`writableSignal` en `AuthService`), no `localStorage` / `sessionStorage`.
- **Refresh**: `POST /api/v1/auth/refresh` con **`withCredentials: true`** para enviar cookie `httpOnly` ya implementada en el API.
- **401 en requests**: intentar **un** refresh serializado; si falla → `logout()` + navegar a `/admin/login`.

### Rationale

Alineado a spec Semana 6 y maestro §11 (fragmento AuthInterceptor).

### Alternatives considered

| Alternativa | Por qué no |
|-------------|------------|
| Guardar JWT en localStorage | Aumenta superficie XSS; contradice spec. |
| Service Worker para refresh | Complejidad innecesaria en Semana 6. |

---

## 3. Interceptores HTTP (Angular moderno)

### Decision

Usar **`HttpInterceptorFn`** + `provideHttpClient(withInterceptors([authInterceptor, ...]))`.

### Rationale

API estable de Angular 15+; encaja con standalone bootstrap sin `NgModule`.

---

## 4. Gráficas en dashboard

### Decision

Usar **Chart.js** directamente desde un componente `standalone` que destruye/crea `Chart` en `ngOnDestroy` / `afterNextRender`, **o** `ng2-charts` si el equipo prefiere plantillas — la implementación concreta se elige en la primera PR del dashboard documentando la dependencia en `admin-portal/package.json`.

### Rationale

Plan de trabajo Semana 6 cita Chart.js; es ampliamente conocido para barras de ocupación.

### Alternatives considered

| Alternativa | Por qué no (por ahora) |
|-------------|-------------------------|
| ngx-charts | Menos mantenimiento activo percibido. |
| ApexCharts | Bundle más pesado para KPI simple. |

---

## 5. RBAC en el cliente

### Decision

- **`RoleGuard`** con `route.data['roles']` y comparación contra `user.role` del JWT decodificado (payload mínimo: `sub`, `role` si el API lo incluye en el access token — **verificar** forma real del JWT en implementación).
- Directiva o **structural** `hasRole` basada en signals para ocultar botones.

### Rationale

Doble capa: UX (ocultar) + seguridad real en API (403).

### Clarification handled at implement time

Si el access token **no** incluye `role`, leer rol desde `GET /api/v1/users/me` post-login y cachear en `AuthService`.

---

## 6. Paginación server-side (tablas)

### Decision

Query params estándar alineados al backend existente: `page`, `limit`, `q`, filtros específicos según OpenAPI de `rooms` / `reservations`.

### Rationale

Consistencia con API ya documentada en specs anteriores.
