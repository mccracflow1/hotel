# Research — Portal Angular Semana 7

**Feature**: `007-angular-portal-week7`  
**Date**: 2026-04-17

## 1. Exportación Excel / CSV / PDF

### Decision

- **CSV**: generación en cliente desde datos ya cargados (Blob + `download`), sin librería pesada.
- **Excel**: **ExcelJS** en el browser para listados grandes y reportes tabulares con formato básico.
- **PDF**: **jsPDF** + **jspdf-autotable** para tablas de reporte y listados compactos.

### Rationale

Alineado a `plan_trabajo.md` (Día 31 y 35). ExcelJS y jsPDF son estándar de facto en SPAs Angular con export cliente.

### Alternatives considered

| Alternativa | Por qué no |
|-------------|------------|
| Solo CSV | No cumple requisito explícito de Excel en plan semanal. |
| Server-side export | Añade endpoints y colas; YAGNI salvo performance insuficiente. |

---

## 2. Idempotency-Key desde el portal

### Decision

Servicio `IdempotencyService` (signal o `crypto.randomUUID()` por acción) inyectado en **ReservationsService**, **InventoryService** y **PaymentsService** (cuando exista `POST /payments/create` con middleware de idempotencia) para cabecera `Idempotency-Key` en cada `POST`/`PUT`/`DELETE` que el backend protege con middleware.

### Rationale

Constitución II y rutas existentes (`idempotencyReservation*`, `idempotencyInventoryMovement`, `idempotencyPaymentCreate`).

### Alternatives considered

| Alternativa | Por qué no |
|-------------|------------|
| Interceptor global que siempre mande clave | Riesgo de enviar clave en GET o rutas que no la esperan; mejor explícito por servicio. |

---

## 3. Drag-and-drop actividades base

### Decision

**Angular CDK DragDrop** (`@angular/cdk/drag-drop`) en lista de actividades base del formulario de plan.

### Rationale

`plan_trabajo.md` ctx7 Semana 7 sugiere CDK drag-drop; coherente con Material ya instalado.

---

## 4. Gráficos de reportes (barras apiladas / pie)

### Decision

Reutilizar **Chart.js** (ya en admin-portal por Semana 6) con datasets derivados de `GET /reports/*` y agregados de planes si existen endpoint o composición en cliente documentada.

### Rationale

Una sola dependencia de gráficos en el bundle.

---

## 5. Enlace de pago (MercadoPago) y rol BUSINESS

### Decision

Documentar **brecha**: hoy `POST /api/v1/payments/create` exige roles **`ADMIN` | `AGENT`** (`payments.routes.js`). La spec Semana 7 permite que operaciones soliciten link; **opciones**: (a) extender backend a `BUSINESS` con auditoría, o (b) UI deshabilita acción para `BUSINESS` hasta cambio de API. La implementación por defecto en tasks: **mostrar acción solo si el rol coincide con el contrato actual** y anotar dependencia backend si se elige (a).

### Rationale

Evitar 403 silencioso y cumplir constitución IV sin inventar permisos en cliente.

---

## 6. Rutas Angular

### Decision

Lazy routes bajo `admin-portal/src/app/app.routes.ts`:

- `reservations` → `features/reservations/reservations.routes.ts`
- `plans` → `features/plans/plans.routes.ts`
- `optional-activities` (catálogo) → ruta admin dedicada o anidada según claridad UX (preferencia: **`/admin/optional-activities`**).
- `inventory` → `features/inventory/inventory.routes.ts`
- `reports` → `features/reports/reports.routes.ts`

`nav.config.ts`: entradas visibles según §6 (planes solo ADMIN/SUPER_ADMIN; reservas amplio; inventario/reportes según matriz).

### Alternatives considered

| Alternativa | Por qué no |
|-------------|------------|
| Todo bajo `/admin/plans/:id/optional` sin catálogo global | El API expone `/optional-activities` raíz; catálogo global merece ruta propia. |
