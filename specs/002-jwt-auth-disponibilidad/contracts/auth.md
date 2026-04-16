# API Contract: Autenticación y RBAC

**Base path**: `/api/v1/auth`
**Auth**: Los endpoints marcados con 🔒 requieren `Authorization: Bearer <access_token>`

---

## POST /api/v1/auth/login

Autentica un usuario y establece la sesión.

**Rate Limit**: 5 intentos fallidos / 15 min / IP → bloqueo automático

### Request

```json
{
  "email": "gerente@hotel.com",
  "password": "S3gur0!2026"
}
```

### Response 200

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "gerente@hotel.com",
    "name": "Carlos Gerente",
    "role": "ADMIN"
  },
  "expiresIn": 900
}
```

Cookie (httpOnly):
```
Set-Cookie: refreshToken=<uuid-raw>; HttpOnly; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
```

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 401 | `INVALID_CREDENTIALS` | Email o contraseña incorrectos |
| 401 | `ACCOUNT_DISABLED` | Usuario con is_active = false |
| 429 | `RATE_LIMIT_EXCEEDED` | > 5 intentos fallidos desde la IP |

---

## POST /api/v1/auth/logout

🔒 Invalida el refresh token activo y limpia la cookie.

### Request

Sin body. Requiere cookie `refreshToken`.

### Response 204

Sin body.

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Access token inválido o expirado |

---

## POST /api/v1/auth/refresh

Renueva el access token usando el refresh token de la cookie. Rotación automática: el refresh token viejo queda invalidado y se emite uno nuevo.

### Request

Sin body. Requiere cookie `refreshToken`.

### Response 200

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 900
}
```

Nueva cookie `refreshToken` emitida con el token rotado.

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 401 | `INVALID_REFRESH_TOKEN` | Token no existe en BD o expirado |
| 401 | `TOKEN_REUSE_DETECTED` | Token ya fue usado (posible robo de sesión) — se invalidan TODOS los tokens del usuario |
| 401 | `ACCOUNT_DISABLED` | Usuario con is_active = false |

---

## POST /api/v1/auth/forgot-password

Inicia el flujo de recuperación de contraseña. Siempre responde 200 para no revelar si el email existe.

### Request

```json
{
  "email": "gerente@hotel.com"
}
```

### Response 200

```json
{
  "message": "Si el correo existe, recibirás instrucciones en breve."
}
```

**Degradación elegante**: Si `SMTP_HOST` no está configurado, el token se loguea en consola (nivel `warn`) y la respuesta es igualmente 200.

---

## POST /api/v1/auth/reset-password

Completa el restablecimiento de contraseña con el token temporal (1 hora de validez).

### Request

```json
{
  "token": "a3f2e1d0-...",
  "newPassword": "NuevaC0ntraseña!"
}
```

### Response 200

```json
{
  "message": "Contraseña actualizada correctamente."
}
```

### Error Responses

| Status | Code | Trigger |
|--------|------|---------|
| 400 | `INVALID_RESET_TOKEN` | Token no existe o expirado |
| 400 | `WEAK_PASSWORD` | No cumple requisitos mínimos |

---

## Middleware: authGuard

Extrae y verifica el JWT en cada endpoint protegido.

**Header esperado**: `Authorization: Bearer <access_token>`

**Adjunta al request**: `req.user = { id, email, role, is_active }`

**Verifica**:
1. Header presente y con formato `Bearer <token>`
2. Firma válida con `JWT_SECRET`
3. Token no expirado
4. Usuario activo en BD (`is_active = true`)

**Errores**:
- `401 UNAUTHORIZED` — header ausente, token malformado, firma inválida, expirado
- `401 ACCOUNT_DISABLED` — usuario con is_active = false

---

## Middleware: requireRoles(...roles)

Verifica el rol del usuario autenticado. Se aplica DESPUÉS de `authGuard`.

**Ejemplo de uso**:
```js
router.post('/rooms', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), handler)
```

**Errores**:
- `403 FORBIDDEN` — el rol del usuario no está en la lista permitida

---

## RBAC Matrix

| Endpoint | VIEWER | BUSINESS | ADMIN | SUPER_ADMIN | AGENT |
|----------|--------|----------|-------|-------------|-------|
| GET /reports/* | ✓ | ✓ | ✓ | ✓ | ✗ |
| GET /reservations | ✗ | ✓ | ✓ | ✓ | ✗ |
| POST /reservations | ✗ | ✓ | ✓ | ✓ | ✓ |
| POST /rooms | ✗ | ✗ | ✓ | ✓ | ✗ |
| PUT /business-config | ✗ | ✗ | ✓ | ✓ | ✗ |
| DELETE /users | ✗ | ✗ | ✗ | ✓ | ✗ |
| POST /availability | ✗ | ✓ | ✓ | ✓ | ✗ |
| POST /availability/block | ✗ | ✗ | ✓ | ✓ | ✗ |
| CRUD /seasons | ✗ | ✗ | ✓ | ✓ | ✗ |
| POST /payments/link | ✗ | ✓ | ✓ | ✓ | ✓ |
