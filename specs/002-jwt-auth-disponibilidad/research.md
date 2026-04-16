# Research: Autenticación JWT, RBAC y Módulo de Disponibilidad (Semana 2)

## Decision Log

### Decision: JWT con Access Token de 15min + Refresh Token en httpOnly Cookie

- **Chosen**: Access token firmado con HS256 (15 min) entregado en body JSON. Refresh token (7 días) almacenado en httpOnly, SameSite=Strict cookie — nunca accesible desde JavaScript del cliente.
- **Rationale**: La separación en dos tokens limita la ventana de exposición. Si un access token se filtra en un log o un header, caduca en 15 minutos. La cookie httpOnly protege el refresh token de ataques XSS. Rotación de refresh token en cada uso previene replay attacks: si un token rotado vuelve a usarse, se detecta la reutilización y se invalida toda la cadena de sesión del usuario.
- **Alternatives Considered**:
  - Token único de larga duración (rechazado: ventana de exposición inaceptable para un sistema con datos financieros).
  - Refresh token en localStorage (rechazado: vulnerable a XSS; prohibido por Principio IV de la Constitución).
  - OAuth2 externo (rechazado: overhead innecesario para un sistema interno con usuarios acotados; YAGNI).

### Decision: bcrypt con salt rounds = 12

- **Chosen**: `bcrypt` con `saltRounds = 12` para hash de contraseñas.
- **Rationale**: 12 rounds es el estándar recomendado para 2026: suficientemente lento para resistir ataques de fuerza bruta (~250ms por hash en hardware moderno) sin impactar experiencia del usuario en login. Por debajo de 10 es inseguro; por encima de 14 degrada el rendimiento del endpoint de login.
- **Alternatives Considered**:
  - Argon2 (rechazado: `bcrypt` tiene soporte nativo más maduro en el ecosistema Node.js; Argon2 requiere binarios nativos que complican el build de Docker en Railway).
  - SHA-256 (rechazado: no es un algoritmo de password hashing; no tiene salt ni es deliberadamente lento).

### Decision: Rate Limiting con express-rate-limit + store en memoria

- **Chosen**: `express-rate-limit` con ventana deslizante de 15 minutos, límite de 5 intentos fallidos en `/api/v1/auth/login` por IP.
- **Rationale**: Previene ataques de credential stuffing y brute force. Store en memoria es suficiente para la instancia única de Railway en Semana 2. Si se escala horizontalmente en el futuro, se migra a `rate-limit-redis`.
- **Alternatives Considered**:
  - Implementación manual con tabla en PostgreSQL (rechazado: latencia innecesaria en cada request de auth; la BD ya está bajo carga en validación de disponibilidad).
  - Sin rate limiting (rechazado: violación explícita del Principio IV de la Constitución).

### Decision: RBAC implementado como middleware, no como decoradores

- **Chosen**: `requireRoles(...roles)` como función middleware de Express que devuelve un handler. Se aplica a nivel de ruta: `router.post('/rooms', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), handler)`.
- **Rationale**: Compatible con Express 5. Separación clara de responsabilidades: `authGuard` verifica la autenticidad del JWT; `requireRoles` verifica la autorización. Son composables e independientemente testeables. Alineado con el patrón de la Constitución (repositorio pattern).
- **Alternatives Considered**:
  - RBAC en base de datos con tabla `permissions` (rechazado: los roles son fijos y pequeños; la complejidad de una tabla dinámica no se justifica — YAGNI).
  - Decoradores TypeScript (rechazado: el proyecto usa JavaScript puro en backend, no TypeScript).

### Decision: Disponibilidad con función PL/pgSQL + caché en memoria

- **Chosen**: `GET /api/v1/availability` llama a `check_availability()` directamente. `GET /api/v1/availability/calendar` utiliza `node-cache` con TTL de 60 segundos para el mapa mensual.
- **Rationale**: La función PL/pgSQL ya existe (migración 010 de Semana 1) y garantiza el `SELECT FOR UPDATE SKIP LOCKED` dentro de la transacción. El calendario mensual es costoso de calcular (agrega datos por día) pero cambia con baja frecuencia; un caché corto reduce la carga sin sacrificar precisión operacional.
- **Alternatives Considered**:
  - Caché con Redis (rechazado: overhead de infraestructura; Railway requiere un plugin adicional; el TTL de 60s con node-cache es suficiente para el volumen actual — YAGNI).
  - Recalcular el calendario en cada request (rechazado: con 31 días × N habitaciones/planes, el costo es O(días × entidades); bajo carga media esto afecta la latencia del dashboard).

### Decision: Envío de correo con nodemailer en modo graceful-degradation

- **Chosen**: `nodemailer` con configuración SMTP vía variables de entorno. Si `SMTP_HOST` no está configurado, el endpoint de forgot-password devuelve 200 y loguea el token en consola (nivel `warn`) en lugar de lanzar error.
- **Rationale**: Permite que el flujo de desarrollo funcione sin configurar un servidor SMTP real. En producción (Railway), las variables estarán presentes. El comportamiento de degradación elegante evita que la falta de configuración de correo bloquee el desarrollo de otros módulos.
- **Alternatives Considered**:
  - Fallar con 500 si SMTP no está configurado (rechazado: bloquea el desarrollo local innecesariamente).
  - Servicio de email externo como SendGrid o Resend (rechazado: costo y complejidad adicional; SMTP es suficiente para el volumen del hotel — YAGNI).

### Decision: Tokens de Agente IA con larga expiración (1 año)

- **Chosen**: El token JWT para el rol `AGENT` (usado por n8n) tiene expiración de 1 año y no tiene refresh token asociado.
- **Rationale**: n8n Cloud no tiene un mecanismo nativo para rotar tokens automáticamente. Un token de corta duración requeriría intervención manual frecuente o un flujo de renovación complejo en el workflow de n8n. El trade-off de conveniencia operacional vs. ventana de exposición es aceptable dado que el token solo puede crear reservas y pagos (no tiene acceso a configuración ni a datos sensibles de usuarios).
- **Alternatives Considered**:
  - Token de 30 días con renovación manual (rechazado: operacionalmente riesgoso — si vence en producción, el agente IA deja de funcionar silenciosamente).
  - OAuth2 client credentials flow (rechazado: n8n requiere configuración compleja; YAGNI para Semana 2).
