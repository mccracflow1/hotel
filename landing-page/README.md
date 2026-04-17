# Sitio público (landing) — Semana 8 y Semana 9 (009)

## Servir en local

- Con [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) abriendo `index.html`, o
- `npx --yes serve .` desde esta carpeta (puerto por defecto 3000/8080 según versión).

## Variable `API_BASE_URL`

Los scripts de datos (`app.js` cuando exista) deben apuntar al API, por ejemplo:

- Desarrollo: `http://localhost:3000/api/v1`
- Producción: URL pública del backend + `/api/v1`

La convención detallada y el smoke por rol están en `specs/008-angular-portal-week8/quickstart.md` (§ API_BASE_URL).

## Semana 9 — archivos y rutas (`specs/009-landing-week9`)

| Archivo | Rol |
|---------|-----|
| `index.html` | Home + planes + chat + footer privacidad |
| `app.js` | Cards de planes → `/planes/<slug>` o `plan.html?slug=` |
| `plan.html` / `plan-detail.js` | Detalle por slug, total en vivo, reserva pública, checkout MP |
| `chat-widget.js` | Widget flotante; requiere `window.CHAT_WEBHOOK_URL` opcional |
| `success.html` / `failure.html` / `pending.html` | Resultados MP (`back_urls` alineadas al backend) |
| `nginx.conf` | `/planes/*`, `/success`, etc. (ver comentarios CSP) |
| `preview.html` | Preview interno (si aplica al flujo S8) |

### Variables globales (antes de cargar scripts)

- `window.API_BASE_URL` — base del API, ej. `http://localhost:3000/api/v1` (sin barra final).
- `window.CHAT_WEBHOOK_URL` — URL del webhook del bot (POST JSON `{ sessionId, message, channel: 'web' }`). Si está vacío, el widget no envía mensajes.
- `window.PRIVACY_POLICY_URL` — enlace de política de privacidad en footer; si falta, se usa `#`.

### Contrato `CHAT_WEBHOOK_URL`

El cliente envía `POST` con cuerpo JSON:

```json
{ "sessionId": "<uuid estable en sessionStorage>", "message": "<texto usuario>", "channel": "web" }
```

Respuesta esperada (ejemplo): objeto JSON con `reply` (HTML o texto). Si incluye `payment_url` y `reservation_number`, el widget muestra tarjeta CTA. El HTML del bot pasa por **DOMPurify** antes de insertarse en el DOM (mitigación XSS; ver prueba manual en checklist S9).

### QA responsive — `plan.html`

- **360px**: formulario en una columna; total `aria-live` visible; botón enviar accesible sin solapar el chat flotante.
- **1280px**: hero + media + formulario con espaciado consistente; sin overflow horizontal.

### Checklist E2E manual (resumen)

1. Backend con `DATABASE_URL`, migraciones aplicadas, `LANDING_URL` / `CORS_EXTRA_ORIGINS` si servís landing en otro origen.
2. Home: planes cargan; click abre detalle (`/planes/<slug>` o `plan.html?slug=`).
3. Detalle: total cambia al marcar opcionales; enviar reserva con `Idempotency-Key` → redirect a MP (requiere credenciales MP en backend).
4. Chat: mensaje de prueba; probar respuesta con `<script>alert(1)</script>` — no debe ejecutarse (solo texto sanitizado / escapado).
5. Abrir `success.html` / `failure.html` / `pending.html` directo y vía rutas nginx si usás ese stack.

Detalle de tiempos **SC-001** / tabla **SC-002**: `specs/009-landing-week9/quickstart.md`.

### Procedimiento manual XSS (SC-005)

**Objetivo**: confirmar que HTML malicioso en la respuesta del bot no ejecuta scripts.

1. Configurá un mock de webhook que devuelva JSON con `reply` igual a `Hola <script>alert('xss')</script>`.
2. Abrí `index.html` o `plan.html`, abrí el chat y enviá un mensaje.
3. **Esperado**: el texto se muestra sin ejecutar `alert`; en DevTools → Elements no debe aparecer un nodo `<script>` insertado por el render del bot (DOMPurify elimina tags peligrosos).
4. **Registro**: anotá fecha y revisor aquí al completar la prueba — _pendiente hasta ejecución humana_.
