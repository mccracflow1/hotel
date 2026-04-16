# Research: 004 — Ciclo completo de reservas, inventario, administración y reportes

Decisiones técnicas para implementar la spec sobre Express + Knex + PostgreSQL, alineadas a `CONTEXTO_MAESTRO.md` y constitución v1.1.0.

---

## 1. Listado de reservas: inclusión de VIEWER

- **Decision**: `GET /reservations` permite roles `VIEWER`, `BUSINESS`, `ADMIN`, `SUPER_ADMIN` (y `AGENT` si el contrato unifica listado para soporte — alinear con §9 tabla auth: listar solo ADMIN, BUSINESS en tabla maestra; la **spec 004** y matriz §6 indican VIEWER con “Reservas (ver)”). **Implementación**: seguir **matriz §6 + spec 004**: VIEWER puede listar y ver detalle; la tabla §9 del contexto maestro puede quedar desactualizada respecto a VIEWER — actualizar OpenAPI del repo al implementar.
- **Rationale**: Criterios de aceptación Semana 4 (plan de trabajo) explícitos para VIEWER.
- **Alternatives considered**:
  - Restringir listado a ADMIN/BUSINESS solo: rechazado — contradice spec firmada.

---

## 2. Resolución de reserva por número legible

- **Decision**: `GET /reservations/by-number/:reservationNumber` o `GET /reservations/number/:reservationNumber` **antes** del router `/:id` para evitar colisión; validar formato `^HT-\d{4}-\d{5}$` (o el patrón ya generado en 003).
- **Rationale**: Búsqueda operativa y MCP/WhatsApp sin UUID.
- **Alternatives considered**:
  - Query `?number=`: viable; menos RESTful para agente.

---

## 3. Política de cancelación (`GET …/policy`)

- **Decision**: Leer `business_config.cancellation_policy` (JSON array de reglas ordenadas por `hours_before` descendente). Calcular horas hasta `date_start` (zona: UTC o `America/Bogota` documentada). Devolver `{ penalty_pct | penalty_amount, rule_matched, hours_before_checkin }` según esquema Joi compartido con `PUT business-config`.
- **Rationale**: FR-005 y una sola fuente de verdad (FR-022).
- **Alternatives considered**:
  - Tabla aparte de reglas: innecesario si JSON ya está en migración 008.

---

## 4. Cambio de fechas (`PUT /reservations/:id`)

- **Decision**: Transacción Knex: `setAuditUserOnTrx`; re-ejecutar `check_availability` / solapes para `room_id` o `plan_id` excluyendo el `id` de la reserva actual; bloqueo pesimista coherente con 003; si OK, `UPDATE reservations` fechas + opcional bump `version` (optimistic lock si el cliente envía `If-Match` o body `version` — opcional en MVP). **Idempotencia**: middleware de replay para misma clave y mismo payload.
- **Rationale**: FR-006, constitución II.
- **Alternatives considered**:
  - Solo validación en app sin función SQL: rechazado — riesgo de carrera con otra reserva.

---

## 5. Cancelación (`DELETE /reservations/:id`)

- **Decision**: Body o query `cancellation_reason` obligatorio (Joi). `UPDATE status = CANCELLED`, `cancellation_reason` persistido. Si existiera `PAYMENT_PENDING` / intentos MP, no ejecutar cobro; dejar hook documentado para Fase 2 (webhook). Idempotencia: segundo DELETE idempotente devuelve misma reserva cancelada o 409 si ya cancelada — definir en OpenAPI.
- **Rationale**: FR-007, edge case spec (coherencia con pagos futuros).
- **Alternatives considered**:
  - Borrado físico: prohibido por integridad referencial e historial.

---

## 6. Opcionales adicionales (`POST …/optional-activities`)

- **Decision**: Validar `plan_optional_activities` para `reservation.plan_id`; INSERT en `reservation_optional_activities` con `activity_name_snapshot` y `price_snapshot` desde catálogo actual; recalcular y persistir `reservations.total_amount` en la misma transacción. Idempotencia recomendada si el body incluye `client_ref` o mediante `Idempotency-Key` + hash de ítems.
- **Rationale**: FR-008; sin tocar snapshot base.
- **Alternatives considered**:
  - Permitir duplicar mismo opcional: negocio puede querer sumar cantidades — spec pide `quantity` válida; permitir incremento en misma fila o segunda fila según UX; por defecto **sumar quantity** si mismo `optional_activity_id`.

---

## 7. Inventario: stock atómico

- **Decision**: `INSERT inventory_movements` + `UPDATE inventory_items SET current_stock = current_stock + delta` en una transacción; constraint CHECK `current_stock >= 0` en BD (migración si no existe) o validación previa + bloqueo fila ítem `FOR UPDATE`.
- **Rationale**: FR-015, SC-005.
- **Alternatives considered**:
  - Solo validación en app: vulnerable a carrera sin lock.
- **Idempotencia (constitución II)**: `POST /inventory/movements` **DEBE** aceptar `Idempotency-Key` y persistir/replay en `idempotency_keys` igual que reservas críticas — un reintento no puede duplicar el efecto en stock.

---

## 8. Proveedores y rutas

- **Decision**: Montar `GET/POST/PUT /api/v1/suppliers` según CONTEXTO §9; asociación `inventory_items.supplier_id` ya en modelo.
- **Rationale**: FR-018, descubribilidad.
- **Alternatives considered**:
  - Solo sub-recurso `/inventory/suppliers`: menos alineado al documento maestro.

---

## 9. Configuración del negocio y secretos

- **Decision**: `GET /business-config` devuelve `mp_access_token`, `mp_webhook_secret` como `***` o truncado salvo `SUPER_ADMIN`; `PUT` valida Joi incluyendo `cancellation_policy` array. `SUPER_ADMIN` único rol que escribe credenciales MP (matriz).
- **Rationale**: FR-022, constitución IV.
- **Alternatives considered**:
  - No devolver campos: rompe UI de configuración; enmascarado es estándar.

---

## 10. Temporadas: solapes

- **Decision**: En `POST/PUT seasons`, consultar `seasons` existentes por rango solapado (interval overlap `[start,end]`) excluyendo `id` en update; rechazar con `VALIDATION_ERROR` o 409 según estándar del API. Unificar nombres API internos (`date_start`/`date_end` en BD vs Joi actual en español) en una iteración de refactor opcional — mínimo: validación de solape con columnas reales del repositorio.
- **Rationale**: FR-023, plan Semana 4 día 19.
- **Alternatives considered**:
  - Permitir solapes y aplicar multiplicador máximo: más complejo; fuera de spec.

---

## 11. Reportes: ingresos preliminares

- **Decision**: `GET /reports/revenue` incluye `meta.revenue_basis: "reservation_totals"` y lista explícita de `status` incluidos (p. ej. `CONFIRMED`, `PAYMENT_PENDING`) hasta que `payments` alimente Fase 2; documentar en Swagger.
- **Rationale**: FR-025, transparencia (SC-007).
- **Alternatives considered**:
  - Ocultar reporte hasta Fase 2: rechazado — spec pide reporte con supuestos.

---

## 12. Swagger consolidado (FR-028)

- **Decision**: Un solo `swagger-jsdoc` con tags: Auth, Rooms, Plans, Availability, Seasons, Reservations, Inventory, Suppliers, Users, BusinessConfig, Reports. Eliminar paths fantasma o marcar `deprecated` si quedan stubs.
- **Rationale**: Constitución — documentación sincronizada con código.
- **Alternatives considered**:
  - OpenAPI solo en `specs/`: duplicación; el contrato fuente de verdad ideal es comentarios JSDoc + YAML merge.

---

## Resolución NEEDS CLARIFICATION

No quedan ítems sin decidir: las ambigüedades VIEWER vs tabla §9 y nombres de campos `seasons` se resuelven con las decisiones anteriores y ajuste de documentación maestra en la misma PR de implementación si aplica.
