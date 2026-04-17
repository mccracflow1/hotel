# Quickstart — MVP Fase 2 (005): Pagos, medios y CMS

**Rama**: `005-payments-media-cms`  
**API base local**: `http://localhost:3000/api/v1`

## 1. Variables de entorno (backend)

Añadir o completar en `.env` (ver `CONTEXTO_MAESTRO.md` §20):

```env
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...

# URLs usadas en Preference
API_URL=http://localhost:3000
LANDING_URL=http://localhost:5173

# Almacenamiento de medios (ejemplo S3)
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_BUCKET_NAME=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Para desarrollo sin S3, usar `STORAGE_PROVIDER=local` si el adapter lo implementa, o levantar MinIO y apuntar endpoint compatible S3.

## 2. Instalar dependencias nuevas

```bash
cd backend
npm install @mercadopago/sdk-node multer sharp
# opcional según adapter
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

> El usuario pidió no ejecutar `build` en reglas; `npm install` es necesario para implementar — ejecutarlo al momento de codificar.

## 3. MercadoPago — sandbox

1. Crear reserva vía `POST /api/v1/reservations` (token `AGENT` o `ADMIN`).
2. `POST /api/v1/payments/create` con header `Idempotency-Key` (UUID o SHA256 según contrato interno) y body `{ "reservation_id": "…", "amount": 10000 }`.
3. Abrir `checkout_url` en navegador; pagar con tarjeta de prueba de MP.
4. Configurar **ngrok** o túnel similar para que `notification_url` sea alcanzable desde internet y ejecutar el flujo de webhook.

## 4. Ejemplos `curl`

**Crear pago** (sustituir token y UUIDs):

```bash
curl -sS -X POST "http://localhost:3000/api/v1/payments/create" ^
  -H "Authorization: Bearer ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -H "Idempotency-Key: test-key-001" ^
  -d "{\"reservation_id\":\"RESERVATION_UUID\",\"amount\":150000}"
```

**Contenido público (sin auth)**:

```bash
curl -sS "http://localhost:3000/api/v1/site-content/public"
curl -sS "http://localhost:3000/api/v1/faqs"
```

**FAQs para CMS (admin, incluye inactivas)** — requiere Bearer:

```bash
curl -sS "http://localhost:3000/api/v1/faqs/manage" -H "Authorization: Bearer ACCESS_TOKEN"
```

**Subir imagen**:

```bash
curl -sS -X POST "http://localhost:3000/api/v1/media/upload" ^
  -H "Authorization: Bearer ACCESS_TOKEN" ^
  -F "file=@./test.jpg"
```

## 5. Tests

```bash
cd backend
npm test
```

Añadir suites bajo `backend/tests/` para pagos (mock de SDK MP o sandbox dedicado), webhook con firma calculada, y CMS público.

## 6. Swagger

Tras implementar, verificar `http://localhost:3000/api/docs` incluye tags **Payments**, **Media**, **SiteContent**, **FAQs**.

## Referencias

- [spec.md](./spec.md) — requisitos de negocio.
- [research.md](./research.md) — decisiones técnicas.
- [contracts/openapi.yaml](./contracts/openapi.yaml) — contrato HTTP.
- `specs/004-complete-reservation-lifecycle/contracts/openapi.yaml` — estados de reserva previos.
