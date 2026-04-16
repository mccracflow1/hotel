# Implementation Plan: Autenticación JWT, RBAC y Módulo de Disponibilidad

**Branch**: `002-jwt-auth-disponibilidad` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-jwt-auth-disponibilidad/spec.md`

---

## Summary

Implementar el sistema de autenticación JWT con doble token (access 15min + refresh 7d en httpOnly cookie), RBAC de 5 roles con middleware de Express, y el módulo de disponibilidad que consume la función PL/pgSQL `check_availability()` ya existente. Las tablas `users`, `refresh_tokens`, `availability` y `seasons` ya existen desde la Semana 1; esta semana se implementa la lógica de negocio sobre ellas.

---

## Technical Context

**Language/Version**: Node.js 20 LTS, CommonJS modules, Express 5
**Database**: PostgreSQL 14+ vía Knex.js — todas las tablas ya existen
**Auth Library**: `jsonwebtoken` (firma HS256), `bcrypt` (salt rounds 12), `cookie-parser`
**Rate Limiting**: `express-rate-limit` con store en memoria (suficiente para instancia única en Railway)
**Cache**: `node-cache` con TTL 60s para `/availability/calendar`
**Email**: `nodemailer` con degradación elegante si SMTP no está configurado
**Testing**: Tests de integración con `supertest` para flujos críticos de auth y concurrencia de disponibilidad
**Target Platform**: Railway (API + PostgreSQL)

---

## Constitution Check

- [x] **API-First**: Toda la lógica de auth y disponibilidad está en el backend. Ningún frontend accede a la BD directamente.
- [x] **Idempotency**: Las reservas (módulo siguiente) usarán `Idempotency-Key`. Auth en sí no requiere idempotencia pero el refresh token tiene rotación que previene replay.
- [x] **Snapshots**: Este módulo no modifica reservas existentes. El snapshot aplica en el módulo de reservas (Semana 3).
- [x] **Security**: `authGuard` + `requireRoles` en todos los endpoints protegidos. bcrypt 12 rounds. httpOnly cookie para refresh token.
- [x] **IA Autonomy**: El rol `AGENT` tiene acceso limitado (crear reservas, generar payment links). El token de 1 año es la interfaz para n8n hasta que se implemente MCP en semanas posteriores.
- [ ] **Angular Standards**: N/A — este módulo es backend únicamente.

**Complejidad justificada**:
| Violación | Por qué se necesita | Alternativa rechazada |
|-----------|--------------------|-----------------------|
| Token AGENT de 1 año | n8n no rota tokens automáticamente | Renovación manual cada 30 días → riesgo de corte silencioso en producción |
| node-cache en memoria | Railway no incluye Redis en plan básico | Redis → costo extra + plugin Railway; TTL de 60s es suficiente para el volumen actual |

---

## Project Structure

### Documentación (esta feature)

```text
specs/002-jwt-auth-disponibilidad/
├── plan.md              ← Este archivo
├── research.md          ← Decisiones técnicas (generado)
├── data-model.md        ← Entidades y JWT payload (generado)
├── quickstart.md        ← Guía de integración (generado)
├── contracts/
│   ├── auth.md          ← Contratos de auth endpoints (generado)
│   └── availability.md  ← Contratos de disponibilidad (generado)
├── checklists/
│   └── requirements.md  ← Validación de spec (generado)
└── tasks.md             ← Generado por /speckit-tasks
```

### Código fuente (archivos a implementar)

```text
backend/
├── src/
│   ├── middlewares/
│   │   ├── auth.guard.js         ← AMPLIAR: authGuard + requireRoles (skeleton existe)
│   │   ├── idempotency.js        ← YA IMPLEMENTADO (Semana 1)
│   │   └── rate-limit.js         ← NUEVO: express-rate-limit para /auth/*
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js    ← IMPLEMENTAR
│   │   │   ├── auth.service.js       ← IMPLEMENTAR
│   │   │   ├── auth.repository.js    ← IMPLEMENTAR
│   │   │   ├── auth.routes.js        ← IMPLEMENTAR
│   │   │   └── auth.schema.js        ← IMPLEMENTAR (Joi schemas)
│   │   ├── availability/
│   │   │   ├── availability.controller.js  ← IMPLEMENTAR
│   │   │   ├── availability.service.js     ← IMPLEMENTAR
│   │   │   ├── availability.repository.js  ← IMPLEMENTAR
│   │   │   ├── availability.routes.js      ← IMPLEMENTAR
│   │   │   └── availability.schema.js      ← IMPLEMENTAR (Joi schemas)
│   │   └── seasons/
│   │       ├── seasons.controller.js   ← IMPLEMENTAR (puede vivir en availability/)
│   │       ├── seasons.service.js      ← IMPLEMENTAR
│   │       ├── seasons.repository.js   ← IMPLEMENTAR
│   │       ├── seasons.routes.js       ← IMPLEMENTAR
│   │       └── seasons.schema.js       ← IMPLEMENTAR
│   └── app.js                     ← ACTUALIZAR: montar rutas auth y availability
├── tests/
│   ├── auth.test.js               ← NUEVO: tests de integración auth
│   └── availability.test.js       ← NUEVO: tests de integración + concurrencia
└── seeds/
    └── 001_admin_user.js          ← NUEVO: seed SUPER_ADMIN para desarrollo
```

---

## Implementation Phases

### Phase 1: Infraestructura de Auth

**Dependencias a instalar**:
```bash
npm install jsonwebtoken bcrypt cookie-parser express-rate-limit node-cache nodemailer
npm install --save-dev supertest
```

**1.0 — Migración 011: password_reset_tokens**

Crear `backend/src/config/migrations/011_password_reset_tokens.js`:
```js
// UP
await knex.schema.createTable('password_reset_tokens', t => {
  t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
  t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
  t.string('token_hash', 255).notNullable().unique()
  t.timestamp('expires_at', { useTz: true }).notNullable()
  t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
})
// DOWN
await knex.schema.dropTable('password_reset_tokens')
```
*Prerequisito de T009 (auth.service.js): auth.repository.js necesita esta tabla para `createPasswordResetToken`.*

---

**1.1 — Ampliar auth.guard.js**

El skeleton ya existe. Implementar:
- `authGuard`: middleware que extrae Bearer token, verifica firma JWT, verifica `is_active`, adjunta `req.user`
- `requireRoles(...roles)`: factory que devuelve middleware de verificación de rol
- Exportar ambos

```js
// Patrón de implementación
const authGuard = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new UnauthorizedError('UNAUTHORIZED')
  const payload = jwt.verify(token, process.env.JWT_SECRET)
  const user = await db('users').where({ id: payload.sub, is_active: true }).first()
  if (!user) throw new UnauthorizedError('ACCOUNT_DISABLED')
  req.user = user
  next()
}

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) throw new UnauthorizedError('UNAUTHORIZED')
  if (!roles.includes(req.user.role)) throw new ForbiddenError('FORBIDDEN')
  next()
}
```

**1.2 — rate-limit.js (NUEVO)**

```js
const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 5,
  skipSuccessfulRequests: true,  // solo cuenta intentos fallidos
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiados intentos. Intenta en 15 minutos.' } }
})
```

---

### Phase 2: Módulo Auth

**2.1 — auth.schema.js**: Validaciones Joi para login, forgot-password, reset-password

**2.2 — auth.repository.js**:
- `findByEmail(email)` → usuario completo
- `createRefreshToken(userId, tokenHash, expiresAt)`
- `findRefreshToken(tokenHash)` → join con users
- `deleteRefreshToken(tokenHash)`
- `deleteAllUserRefreshTokens(userId)` — para detección de reutilización
- `updateLastLogin(userId)`
- `createPasswordResetToken(userId, token, expiresAt)`
- `findPasswordResetToken(token)` — verifica expiración
- `consumePasswordResetToken(token)` — DELETE after use
- `updatePassword(userId, passwordHash)`

**2.3 — auth.service.js**:
- `login(email, password)` → `{ accessToken, user }` + emite cookie refresh
- `logout(refreshTokenRaw, res)` → DELETE token + clear cookie
- `refresh(refreshTokenRaw, res)` → rotación: DELETE viejo, INSERT nuevo, emite nueva cookie
- `forgotPassword(email)` → genera token temporal (1h), envía email o logea en consola
- `resetPassword(token, newPassword)` → valida token, actualiza hash, invalida token
- `generateAgentToken(createdBy)` → JWT de 1 año para rol AGENT (solo SUPER_ADMIN)
- `_generateAccessToken(user)` → helper privado
- `_generateRefreshToken()` → UUID random
- `_hashToken(rawToken)` → SHA-256 hex

**2.4 — auth.controller.js**:
- `POST /login` → `auth.service.login`
- `POST /logout` → `auth.service.logout`
- `POST /refresh` → `auth.service.refresh`
- `POST /forgot-password` → `auth.service.forgotPassword`
- `POST /reset-password` → `auth.service.resetPassword`
- `POST /agent-token` → `requireRoles('SUPER_ADMIN')` + `auth.service.generateAgentToken`

**2.5 — auth.routes.js**: Montar controller + `authLimiter` en `/login`, `cookie-parser` para leer la cookie de refresh

---

### Phase 3: Módulo Disponibilidad

**3.1 — availability.schema.js**: Validaciones Joi para query params y body de POST

**3.2 — availability.repository.js**:
- `checkAvailability(roomId, planId, dateStart, dateEnd)` → llama PL/pgSQL `check_availability()` via `knex.raw` dentro de transacción
- `getCalendar(year, month)` → query agregada por día, con JOIN a seasons
- `upsertAvailability(data)` → INSERT ... ON CONFLICT DO UPDATE
- `blockDates(roomId, planId, dateStart, dateEnd, slots, reason)` → UPDATE blocked_slots en rango
- `findByRoomPlanDate(roomId, planId, date)` → lookup simple

**3.3 — availability.service.js**:
- `getAvailability(query)` → llama repository + calcula precio_efectivo con multiplicador de temporada
- `getCalendar(year, month)` → usa node-cache con key `calendar-${year}-${month}`, TTL 60s
- `configureSlots(data, createdBy)` → llama upsertAvailability
- `blockDates(data, createdBy)` → validación + llama repository

**3.4 — availability.controller.js** + **availability.routes.js**:
- `GET /availability` → público (sin authGuard)
- `GET /availability/calendar` → `authGuard` + VIEWER+
- `POST /availability` → `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN','BUSINESS')`
- `POST /availability/block` → `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN')`

---

### Phase 4: Módulo Temporadas

**4.1 — seasons.repository.js**: CRUD completo sobre tabla `seasons`
**4.2 — seasons.service.js**: Lógica de validación (date_end >= date_start, multiplicador > 0)
**4.3 — seasons.controller.js** + **seasons.routes.js**:
- `GET /seasons` → `authGuard` + VIEWER+
- `POST /seasons` → `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN')`
- `PUT /seasons/:id` → `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN')`
- `DELETE /seasons/:id` → `authGuard` + `requireRoles('ADMIN','SUPER_ADMIN')`

---

### Phase 5: Integración en app.js + Swagger

**5.1 — Montar rutas en app.js**:
```js
app.use('/api/v1/auth', require('./modules/auth/auth.routes'))
app.use('/api/v1/availability', require('./modules/availability/availability.routes'))
app.use('/api/v1/seasons', require('./modules/seasons/seasons.routes'))
```

**5.2 — Actualizar swagger.js**: Documentar endpoints de auth y disponibilidad con esquemas OpenAPI 3.0.

---

### Phase 6: Tests de Integración

**6.1 — auth.test.js**:
- Login exitoso → access token + cookie refreshToken
- Login con credenciales inválidas → 401
- Rate limiting → 429 al 6to intento
- Refresh de token → nuevo access token + rotación de cookie
- Reutilización de refresh token → todos los tokens del usuario eliminados
- Logout → cookie limpiada, token invalidado en BD
- Usuario inactivo → 401 aunque tenga token válido
- RBAC: VIEWER intentando POST /rooms → 403

**6.2 — availability.test.js**:
- GET /availability con fecha válida → lista de disponibles con precios
- GET /availability con temporada activa → precio_efectivo = base × multiplicador
- GET /availability/calendar → mapa mensual
- Reserva confirmada → habitación no aparece en disponibilidad
- Test de concurrencia: 2 requests simultáneos al mismo slot → 1 éxito, 1 error

---

## Dependency Stack

```
cookie-parser          → leer httpOnly cookie en /auth/refresh y /auth/logout
jsonwebtoken           → firmar/verificar access tokens y refresh tokens
bcrypt                 → hash de contraseñas y comparación
express-rate-limit     → protección brute force en /auth/login
node-cache             → caché en memoria para /availability/calendar (TTL 60s)
nodemailer             → envío de email para forgot-password (graceful degradation)
supertest (dev)        → tests de integración HTTP sin levantar servidor real
```

**Packages ya instalados (Semana 1)**:
- express, knex, pg, joi, winston, dotenv, swagger-ui-express

---

## Error Codes Reference

| Code | HTTP | Descripción |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token ausente, malformado o expirado |
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos en login |
| `ACCOUNT_DISABLED` | 401 | Usuario con is_active = false |
| `TOKEN_REUSE_DETECTED` | 401 | Refresh token ya usado → posible robo de sesión |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token no existe o expirado |
| `INVALID_RESET_TOKEN` | 400 | Token de reset no existe o expirado |
| `WEAK_PASSWORD` | 400 | No cumple requisitos mínimos |
| `FORBIDDEN` | 403 | Rol sin permiso para la acción |
| `RATE_LIMIT_EXCEEDED` | 429 | > 5 intentos fallidos en 15 min |
| `INVALID_DATE_RANGE` | 400 | fecha_fin < fecha_inicio |
| `DATE_RANGE_TOO_LARGE` | 400 | Rango > 90 días |
| `PAST_DATE` | 400 | fecha_inicio < hoy |
| `AVAILABILITY_CONFLICT` | 409 | No hay slots disponibles (concurrencia) |
| `SEASON_NOT_FOUND` | 404 | Temporada no existe |
