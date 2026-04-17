# Vista de datos — Landing Semana 9 (consumo)

> No introduce tablas nuevas obligatorias en BD: la landing es **cliente** del API. Si se agregan tokens de “checkout session” o intentos públicos, eso se documentará en migración aparte al implementar R-003.

## Entidades consumidas (solo lectura / flujo)

### Plan (detalle público)

| Campo conceptual | Uso en landing |
|-------------------|----------------|
| `slug` | Segmento de URL amigable |
| `name`, `short_desc`, `long_desc` o equivalente | Hero de ficha y SEO |
| `base_price` | Precio base en calculadora |
| `room_id` + datos de habitación embebidos o enlazados | Bloque “Alojamiento incluido” |
| Medios (imágenes / video URL) | Galería y video |
| `base_activities[]` | Solo lectura, orden fijo |
| `optional_activities[]` (`id`, nombre, `price`, `is_default`, límites si existen) | Checkboxes + cantidad |

**Validación en UI**: cantidades mínimas/máximas según reglas expuestas por API (si no existen, mínimo 1 por ítem seleccionado).

### Reserva (creación desde web)

Payload conceptual alineado al contrato existente de creación (nombres exactos en `contracts/`):

- Identificadores: `plan_id` **o** `room_id` según reglas de negocio del hotel.
- Fechas: `date_start`, `date_end` (o nombres canónicos del proyecto).
- Ocupación: `adults`, `children` (o equivalente).
- Cliente: nombre, documento, email, teléfono (subset mínimo según `reservations` schema actual).
- Opcionales: arreglo `{ optional_activity_id, quantity }[]`.
- Cabecera: **`Idempotency-Key`** UUID (regenerar solo en “nuevo intento” consciente del usuario).

**Estados relevantes post-creación**: `PENDING` / `PAYMENT_PENDING` — la UI decide llamar a inicio de pago.

### Pago (preferencia checkout)

- Entrada: `reservation_id`, `amount`, token de tenencia (si se adopta R-003), `Idempotency-Key` para el pago.
- Salida: `checkout_url`, metadatos de intento si el API los expone.

### Sesión de chat (solo cliente)

| Dato | Persistencia |
|------|----------------|
| `sessionId` | `sessionStorage` |
| Historial visible | Memoria en widget (opcional: `sessionStorage` truncado) |

No persiste en PostgreSQL desde la landing.

### Páginas de resultado

Parámetros opcionales de query desde MercadoPago (`status`, `collection_id`, etc.) — **solo para mostrar mensaje**; la verdad de pago sigue siendo **webhook + estado en API** (la landing no confirma pago solo por querystring).

## Relaciones

```text
Plan 1──* OptionalActivity (asociación al plan)
Plan *──1 Room (si el modelo lo exige en este producto)
Reservation *──* OptionalActivity (snapshot al crear)
Reservation 1──* PaymentAttempt
```

## Mapeo payload plan público → UI (FR-002)

> Actualizar esta tabla al implementar **T052–T053** si el API devuelve nombres distintos.

| Sección UI | Origen en JSON (`GET /api/v1/plans/by-slug/:slug` → `data`) | Notas |
|------------|-------------------------------------------------------------|--------|
| Título / hero | `name`, `short_desc` | SEO opcional con `document.title` |
| Descripción larga | `long_desc` | Markdown/HTML según convenio; escapar si es texto plano |
| Precio base | `base_price`, `price_unit` | Mostrar moneda coherente con MP (p. ej. COP) |
| Habitación vinculada | `room_id` + join o objeto `room` si el API lo anida | Si solo hay id, segundo fetch a catálogo público de rooms |
| Actividades incluidas | `base_activities[]` | Solo lectura; `name`, `description`, `extra_cost` |
| Opcionales | `optional_activities[]` | `optional_activity_id`, `name`, `price`, `is_default`, cantidad UI |
| Galería / imágenes | `plan_media` o equivalente hidratado en **T052** | URLs absolutas o relativas a `/uploads` |
| Video | URL en metadata de plan o primer video en medios | `<video>` vs iframe según tipo |

## Reglas de negocio reutilizadas (constitución)

- **Snapshots**: al crear reserva, actividades base y precios de opcionales elegidos quedan congelados en BD — la landing no calcula precios finales autoritativos; **muestra** totales de acuerdo a datos del `GET /plans/...` y **valida** que el servidor coincida en la respuesta de `POST` (mostrar total devuelto por API post-creación si difiere).
