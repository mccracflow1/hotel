# Quickstart — desarrollo local (009 Landing)

## Prerrequisitos

- API en `http://localhost:3000` (o la base que uses) con variables **`API_URL`**, **`LANDING_URL`**, **`MP_ACCESS_TOKEN`** cuando pruebes pago real/sandbox.
- CORS del backend permitiendo el origen desde el que servís la landing (p. ej. `http://localhost:8080`).

## Variables de entorno / `window` — landing

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `window.API_BASE_URL` | `http://localhost:3000/api/v1` | Fetch catálogo, CMS, reservas públicas |
| `window.CHAT_WEBHOOK_URL` | `https://…/webhook/hotel-chat` | Widget de chat (no commitear secretos) |
| `window.PRIVACY_POLICY_URL` | `https://…/privacidad` o `#` | Enlace legal en footer / `plan.html` |
| `window.LANDING_BASE` | `http://localhost:8080` | Links absolutos en emails opcionales / debug |

## Mercado Pago — URLs de retorno

El backend arma `back_urls` con `${LANDING_URL}/success|failure|pending` (`payments.service.js`).

**Debés** publicar esas rutas en el host estático:

- Opción A: archivos `success.html`, `failure.html`, `pending.html` + redirects en Netlify de `/success` → `/success.html` (o viceversa: fijar `LANDING_URL` con sufijo `.html` si MP lo permite).
- Opción B: carpetas `success/index.html`, etc.

Verificá que **`LANDING_URL` no tenga barra final** o que coincida exactamente con lo que espera MP.

## Flujo manual de verificación (E2E ligero)

1. Abrí `landing-page/index.html` vía servidor estático (no `file://` si CORS molesta).
2. Navegá a detalle de plan por slug (una vez implementado `GET /plans/by-slug/:slug`).
3. Seleccioná opcionales y verificá total en vivo.
4. Enviá reserva con **DevTools → Network** confirmando cabecera `Idempotency-Key`.
5. Iniciá pago; completá sandbox MP; confirmá que aterrizás en la página de resultado correcta.
6. Abrí el chat, enviá mensaje, verificá sesión estable al cambiar de página.

### SC-001 — Tiempo de flujo (≤ 5 min)

Cronometrá desde “abrir ficha de plan” hasta “pantalla posterior al envío” (checkout MP o error de negocio legible). Anotá duración en esta sección al validar:

| Fecha | Plan (slug) | Duración (min) | OK (≤5) |
|-------|-------------|----------------|---------|
| | | | ☐ |

### SC-002 — Tres combinaciones de opcionales (100 % coincidencia total)

Para un mismo plan y mismas fechas/personas, ejecutá **tres** reservas de prueba (o cálculo previo + una reserva si el entorno no permite múltiples) con distintas selecciones de opcionales. Compará **total mostrado en UI antes del submit** vs **`total_amount` en la respuesta `201`** del `POST /api/v1/public/reservations`:

| Caso | Opcionales (ids/cant) | Total UI esperado | `total_amount` API | Coincide |
|------|------------------------|-------------------|--------------------|----------|
| A | | | | ☐ |
| B | | | | ☐ |
| C | | | | ☐ |

### Rate limit (429)

Tras implementar rate limit en `POST /api/v1/public/reservations`, verificar manualmente o con script corto que tras N solicitudes se obtiene **429** con mensaje usable (sin tumbar el proceso de otros clientes en staging compartido — usá entorno local).

## Contrato sugerido respuesta chat (integración)

Request:

```json
{ "sessionId": "uuid", "message": "texto usuario", "channel": "web" }
```

Response mínima esperada por la landing (ajustar con n8n):

```json
{
  "response": "markdown o texto seguro",
  "payment_url": null,
  "reservation_number": null,
  "total_amount": null
}
```

Cuando haya pago, rellenar `payment_url` y `reservation_number` para que el widget muestre la tarjeta CTA (spec FR-010).

## Tests automatizados sugeridos

- **Backend**: integración `POST /public/reservations` (éxito, 409 disponibilidad, 400 sin idempotency, 429 rate limit).
- **Landing**: pruebas E2E opcionales (Playwright) fuera del repo si no hay infra hoy — como mínimo checklist manual arriba.
