# Quickstart: Autenticación JWT y Disponibilidad

**Feature**: `002-jwt-auth-disponibilidad`
**Prerequisito**: Migraciones de Semana 1 ejecutadas (`npm run migrate` en backend/)

---

## 1. Setup de entorno

Agrega las siguientes variables a `backend/.env`:

```env
# JWT
JWT_SECRET=un-secreto-de-al-menos-64-caracteres-generado-con-openssl-rand-base64-64
JWT_REFRESH_SECRET=otro-secreto-diferente-de-64-caracteres-para-el-refresh-token
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SMTP (opcional en desarrollo — si no está, forgot-password logea el token en consola)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@hotel.com
```

---

## 2. Crear el primer usuario SUPER_ADMIN

En desarrollo, usar el script de seed o insertar directamente:

```bash
cd backend
npm run seed -- --file=seeds/001_admin_user.js
```

O via SQL:
```sql
INSERT INTO users (email, password_hash, name, role) VALUES (
  'admin@hotel.com',
  '$2b$12$...',  -- bcrypt.hashSync('Admin2026!', 12)
  'Administrador',
  'SUPER_ADMIN'
);
```

---

## 3. Flujo de autenticación completo

### 3.1 Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@hotel.com","password":"Admin2026!"}'
```

Respuesta:
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "admin@hotel.com", "role": "SUPER_ADMIN" },
  "expiresIn": 900
}
```

La cookie `refreshToken` queda guardada en `cookies.txt`.

### 3.2 Llamada autenticada

```bash
ACCESS_TOKEN="eyJ..."

curl http://localhost:3000/api/v1/availability/calendar?year=2026&month=5 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3.3 Refresh de token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

La cookie se rota automáticamente; el nuevo `accessToken` viene en el body.

### 3.4 Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt
```

---

## 4. Consultar disponibilidad (endpoint público)

```bash
curl "http://localhost:3000/api/v1/availability?fecha_inicio=2026-05-01&fecha_fin=2026-05-05&num_personas=2"
```

Respuesta con precios incluyendo multiplicador de temporada si aplica.

---

## 5. Configurar disponibilidad (ADMIN)

```bash
curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "uuid-de-habitacion",
    "plan_id": null,
    "fecha": "2026-05-15",
    "total_slots": 2
  }'
```

---

## 6. Crear una temporada de precios

```bash
curl -X POST http://localhost:3000/api/v1/seasons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Semana Santa",
    "fecha_inicio": "2026-04-18",
    "fecha_fin": "2026-04-21",
    "multiplicador": 1.5
  }'
```

Luego verificar:
```bash
curl "http://localhost:3000/api/v1/availability?fecha_inicio=2026-04-19&fecha_fin=2026-04-20"
# El precio_efectivo debe ser base_price × 1.5
```

---

## 7. Generar token para el Agente IA (n8n)

Solo SUPER_ADMIN puede ejecutar este endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/auth/agent-token \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

El token retornado (validez 1 año) se configura en n8n como header de autenticación fijo.

---

## 8. Verificar rate limiting

```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hotel.com","password":"wrongpassword"}' \
    -w "\n[Attempt $i] Status: %{http_code}\n"
done
# El 6to intento debe devolver 429 RATE_LIMIT_EXCEEDED
```

---

## 9. Test de concurrencia de disponibilidad

```bash
# Crear una habitación con 1 slot disponible, luego hacer 2 reservas simultáneas
# Solo una debe tener éxito

for i in 1 2; do
  curl -X POST http://localhost:3000/api/v1/reservations \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: test-concurrent-$i" \
    -d '{
      "room_id": "uuid-con-1-slot",
      "fecha_inicio": "2026-05-20",
      "fecha_fin": "2026-05-22",
      "adults": 2
    }' &
done
wait
# Una respuesta debe ser 201, la otra 409 AVAILABILITY_CONFLICT
```

---

## Variables de entorno requeridas (resumen)

| Variable | Requerida | Default Dev | Notas |
|----------|-----------|-------------|-------|
| JWT_SECRET | ✓ | — | Min 64 chars |
| JWT_REFRESH_SECRET | ✓ | — | Min 64 chars, diferente de JWT_SECRET |
| JWT_EXPIRES_IN | ✗ | `15m` | |
| JWT_REFRESH_EXPIRES_IN | ✗ | `7d` | |
| SMTP_HOST | ✗ | null | Sin SMTP, forgot-password logea en consola |
| SMTP_PORT | ✗ | `587` | |
| SMTP_USER | ✗ | null | |
| SMTP_PASS | ✗ | null | |
| SMTP_FROM | ✗ | `noreply@hotel.com` | |
