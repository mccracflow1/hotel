# Research — MVP Fase 2 (Semana 5): Pagos, medios y CMS

**Feature**: `005-payments-media-cms`  
**Date**: 2026-04-17  

## 1. Pasarela de pagos (MercadoPago)

### Decision

Usar el SDK oficial **`@mercadopago/sdk-node`** con **Checkout Pro** vía **Preference API** para generar `init_point` / `sandbox_init_point` y persistir `preference_id` + `checkout_url` en `payment_attempts`.

### Rationale

- SDK mantenido por MercadoPago; soporte de credenciales por entorno (test/prod).
- Preference permite `back_urls`, `notification_url`, `external_reference` = `reservation_id`, ítems descriptivos y monto total alineado a la reserva.
- Alineado con `CONTEXTO_MAESTRO.md` §10 y plan Semana 5 día 21.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| API REST Preference sin SDK | Más verboso y propenso a errores de contrato; el SDK encapsula versionado. |
| Checkout API brick-only | Mayor trabajo de front embebido; Checkout Pro cubre PSE y tarjetas con menos UI propia en esta fase. |

---

## 2. Webhook — respuesta inmediata y procesamiento seguro

### Decision

- Responder **HTTP 200** al cuerpo de la petición de MercadoPago **antes** de await pesados (patrón: `res.status(200).send('OK')` luego `setImmediate` / cola in-process para MVP, o `res.end` + background con cuidado de errores logueados).
- Validar **`x-signature`** con manifiesto `id:{dataId};request-id:{requestId};ts:{timestamp};` y `MP_WEBHOOK_SECRET` usando comparación en tiempo constante (`crypto.timingSafeEqual`).
- Tras validar, **consultar** el pago en la API de MercadoPago por `id` antes de marcar aprobado (no confiar solo en el cuerpo del webhook).

### Rationale

- MercadoPago reintenta si no recibe 200 rápido; el procesamiento puede ser asíncrono siempre que el idempotente interno evite doble confirmación.
- La consulta GET al pago reduce riesgo de payloads manipulados si la firma estuviera comprometida en otro vector.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| Procesar todo inline antes de 200 | Riesgo de timeout y tormenta de reintentos MP. |
| Confiar solo en notificación sin GET | Menos defensa en profundidad. |

---

## 3. Idempotencia de creación de pago

### Decision

- Header **`Idempotency-Key`**: recomendación documentada `SHA256(reservation_id + amount + currency)` (hex), coherente con `CONTEXTO_MAESTRO.md` §10.
- Tabla `idempotency_keys` existente para replay de respuesta HTTP cacheada; además verificar `payment_attempts` por misma clave lógica antes de llamar a MP si el negocio exige un solo intento activo por reserva+monto.

### Rationale

- Constitución II: pagos son operación crítica; reintentos del agente o del portal no deben multiplicar Preferences activas sin control.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| Solo UUID libre por cliente | Válido pero menos determinístico para dedupe humano y logs; el hash es reproducible entre canales si comparten regla. |

---

## 4. PSE y estados pendientes

### Decision

- Soportar **`payment_method_id=pse`** cuando el checkout lo ofrezca (configuración en Preference / checkout MP).
- Mapear `reservation.status` a **`PAYMENT_PENDING`** al crear checkout exitoso si la reserva estaba en `PENDING`; solo **`CONFIRMED`** tras pago `approved` en MP.
- Webhooks con estado `pending` / `in_process` **no** insertan fila en `payments` ni confirman reserva.

### Rationale

- PSE puede tardar horas; el modelo de negocio ya prevé `PAYMENT_PENDING` en enum de reservas.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| Confirmar en `pending` | Viola reglas de negocio y reportes de ingresos. |

---

## 5. Conciliación

### Decision

`GET /payments/reconciliation` (query: `from`, `to` opcional) — rol `ADMIN`: lista `payment_attempts` en ventana, para cada uno con `preference_id` / `external_reference` consulta estado en MP y devuelve `{ internal, external, mismatch_reason }`.

### Rationale

- Cumple FR-013 del spec; operación de lectura intensiva — acotar rango y paginar.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| Job nocturno solo | Útil más adelante; el MVP necesita disparador manual vía API. |

---

## 6. Almacenamiento de medios

### Decision

Variable de entorno **`STORAGE_PROVIDER`**: `s3` | `cloudinary` | `local` (MVP puede implementar `s3` + `local` primero). URLs públicas guardadas en `media_library.original_url` y `thumbnail_url`.

### Rationale

- `CONTEXTO_MAESTRO.md` deja la elección al cliente; el código debe estar detrás de una interfaz `StorageAdapter` en servicio de media.

### Alternatives considered

| Alternativa | Por qué no |
|--------------|------------|
| Solo disco local en prod | Railway efímero sin volumen montado — riesgo de pérdida. |

---

## 7. Miniaturas y límites de subida

### Decision

- **Sharp**: redimensionar ancho máx 800px, calidad ~75%, formato webp o jpeg según origen.
- **Multer**: límites `fileSize` 10MB imágenes, 200MB video; MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, …).

### Rationale

- Plan Semana 5 día 24 y §17 CONTEXTO.

---

## 8. CMS público

### Decision

- `GET /api/v1/site-content/public` agrega secciones `hero`, `contact`, `about`, `gallery` (lista de `media_id` resuelta a URLs), más `faqs` activas ordenadas.
- Sin autenticación; posible **rate limit** más estricto que rutas admin (middleware reutilizable).

### Rationale

- Landing estática necesita un solo round-trip; reduce acoplamiento de N+1 desde el browser.

---

## 9. Reintentos tras webhook (FR-012)

### Decision

Si el GET a MP falla por timeout: encolar reintento en proceso con backoff **1s, 2s, 4s** (máx 3 intentos) antes de abandonar con log `error`; la respuesta al webhook ya fue 200.

### Rationale

- Balance entre resiliencia y no bloquear el worker indefinidamente en MVP.

---

## Referencias internas

- `CONTEXTO_MAESTRO.md` §10, §17, §9 (tabla de endpoints), §20 variables MP.
- `plan_trabajo.md` Semana 5 días 21–25.
- `specs/004-complete-reservation-lifecycle/contracts/openapi.yaml` — estados de reserva y errores estándar.
