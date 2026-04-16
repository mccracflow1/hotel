# CONTEXTO MAESTRO — Plataforma de Gestión Hotelera con IA
> **Archivo de referencia técnica y de negocio para el equipo de desarrollo**
> Versión 1.0 · Abril 2026 · Hector Fabian Rodriguez

---

## ÍNDICE

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Contexto de Negocio](#2-contexto-de-negocio)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Estructura de URLs y Routing](#5-estructura-de-urls-y-routing)
6. [Roles y Permisos](#6-roles-y-permisos)
7. [Modelo de Datos (PostgreSQL)](#7-modelo-de-datos-postgresql)
8. [Componente C1 — Base de Datos](#8-componente-c1--base-de-datos)
9. [Componente C2 — API Backend (Node.js)](#9-componente-c2--api-backend-nodejs)
10. [Componente C3 — Módulo de Pagos (MercadoPago)](#10-componente-c3--módulo-de-pagos-mercadopago)
11. [Componente C4 — Portal de Administración (Angular)](#11-componente-c4--portal-de-administración-angular)
12. [Componente C5 — Landing Page + Widget IA](#12-componente-c5--landing-page--widget-ia)
13. [Componente C6 — MCP Server (n8n)](#13-componente-c6--mcp-server-n8n)
14. [Componente C7 — Agente IA WhatsApp (n8n)](#14-componente-c7--agente-ia-whatsapp-n8n)
15. [Componente C8 — DevOps y Despliegue](#15-componente-c8--devops-y-despliegue)
16. [Sistema de Planes y Actividades](#16-sistema-de-planes-y-actividades)
17. [Sistema de Gestión de Medios (CMS)](#17-sistema-de-gestión-de-medios-cms)
18. [Flujo Completo de una Reserva](#18-flujo-completo-de-una-reserva)
19. [Flujo Completo de un Pago](#19-flujo-completo-de-un-pago)
20. [Variables de Entorno](#20-variables-de-entorno)
21. [Fases MVP y Criterios de Aceptación](#21-fases-mvp-y-criterios-de-aceptación)
22. [Resumen del Plan de Trabajo](#22-resumen-del-plan-de-trabajo)

---

## 1. Visión General del Proyecto

### ¿Qué es este sistema?

Una plataforma de software completa para la gestión operativa de un negocio hotelero o de turismo rural (cabaña, glamping, resort, lodge). El sistema automatiza la atención al cliente, la gestión de reservas, los cobros en línea y la administración del inventario, integrando un agente de IA que opera 24/7 por WhatsApp.

### ¿Qué problema resuelve?

| Problema actual | Lo que resuelve el sistema |
|----------------|---------------------------|
| Clientes esperan horas para saber si hay disponibilidad | Agente IA responde en segundos, 24/7, sin intervención humana |
| Reservas en hojas de cálculo con riesgo de sobreventas | Base de datos transaccional con control de concurrencia (`SELECT FOR UPDATE`) |
| No hay forma de cobrar en línea sin llamar | MercadoPago + PSE integrado — el cliente paga desde WhatsApp o la web |
| El inventario de insumos se revisa a mano | Alertas automáticas de stock bajo desde el portal admin |
| Sin reportes ni datos para tomar decisiones | Dashboard con KPIs en tiempo real y reportes exportables |
| Cambiar el contenido del sitio requiere un desarrollador | CMS integrado en el portal admin — el hotel lo actualiza solo |

### Tres productos en uno

```
www.[dominio].com          →  Landing page pública del hotel
www.[dominio].com/admin    →  Portal de administración del negocio
www.[dominio].com/api/v1   →  API que alimenta ambos + el agente IA
```

### Inversión y alcance

- **250 horas** de desarrollo efectivo
- **10 semanas** calendario (5h/día, 5 días/semana)
- **$80.000 COP/hora** → **$20.000.000 COP total (precio fijo)**
- **5 fases MVP** con entregables verificables cada 2 semanas

---

## 2. Contexto de Negocio

### Tipo de negocio objetivo

Establecimientos de hospedaje y turismo en Colombia que ofrecen:
- Cabañas o habitaciones con estadías por noche
- Pasadías (acceso por el día sin pernoctar)
- Servicios adicionales: restaurante, cuatrimotos, actividades guiadas, spa
- Planes experienciales: combinaciones de alojamiento + actividades + alimentación

### Usuarios del sistema

**Usuarios del portal de administración:**
- Equipo del hotel (2–10 personas): gerentes, recepcionistas, coordinadores
- Roles diferenciados con permisos distintos (ver sección 6)

**Usuarios de la landing page y WhatsApp:**
- Clientes finales: personas buscando planes de descanso, escapadas de fin de semana, viajes en familia o pareja
- No requieren cuenta ni registro previo para reservar

### Procesos de negocio automatizados

1. **Atención al cliente** → Agente IA Sofia en WhatsApp responde consultas, muestra disponibilidad y guía la reserva
2. **Reservas** → Ciclo completo: pendiente → pago pendiente → confirmada → (cancelada/completada)
3. **Cobros** → MercadoPago + PSE; confirmación automática via webhook
4. **Disponibilidad** → Control de cupos en tiempo real con bloqueo de concurrencia
5. **Inventario** → Registro de entradas/salidas con alertas de stock mínimo
6. **Contenido del sitio** → CMS integrado para actualizar fotos, textos, FAQs, precios sin código

### Regla de negocio crítica: Los Planes

Los **Planes** son la innovación central del sistema. Un plan no es solo una habitación — es una experiencia completa con:

- **Actividades base**: incluidas siempre en el plan, no modificables por el cliente
- **Actividades opcionales**: catálogo que el cliente puede agregar al reservar
- El cliente ve el precio total incrementar en tiempo real al seleccionar opcionales
- Las actividades base de una reserva ya confirmada son **inmutables** (snapshot histórico)

---

## 3. Stack Tecnológico

### Decisiones técnicas y por qué

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Base de datos | PostgreSQL | 14+ | ACID nativo, `SELECT FOR UPDATE SKIP LOCKED` para concurrencia, `pg_cron` para tareas automáticas, PL/pgSQL para funciones complejas |
| ORM / Migraciones | Knex.js | latest | Migraciones versionadas con up/down, queries raw cuando se necesita performance, buena integración con Node.js |
| Backend | Node.js + Express | 20 LTS / 5 | Stack unificado JS (front+back), async/await nativo ideal para I/O intensivo, SDK oficial de MercadoPago en Node |
| Validación | Joi | v17+ | Schemas declarativos, mensajes de error descriptivos, validación tanto en entrada como para Swagger |
| Autenticación | JWT + bcrypt | — | Access token 15min + refresh token 7d en httpOnly cookie, bcrypt salt 12 para passwords |
| Frontend portal | Angular | 17+ | Standalone components, lazy loading, AuthInterceptor nativo, Angular Material para UI empresarial |
| Frontend landing | HTML + Tailwind CSS | CDN | Cero dependencias en producción, carga instantánea, SEO óptimo |
| Automatización IA | n8n Cloud | Pro/Business | Único ambiente que soporta MCP Server Trigger nativo + AI Agent + Window Memory en un mismo canvas |
| Modelo LLM | GPT-4o-mini | OpenAI API | Excelente relación costo/calidad para español, fácilmente intercambiable por Claude Haiku u otro modelo |
| Pagos | MercadoPago SDK | Node oficial | Líder en Colombia+LATAM, PSE nativo, sandbox gratuito, webhooks robustos con firma HMAC |
| Subida de archivos | Multer + Sharp | — | Multer maneja multipart, Sharp genera thumbnails automáticos de imágenes |
| Almacenamiento de archivos | S3 / Cloudinary / Railway Volumes | — | A definir con el cliente; todas las URLs de medios se sirven desde CDN |
| Logging | Winston | — | JSON estructurado, niveles configurables por entorno |
| Documentación API | Swagger / OpenAPI 3.0 | — | Generado automáticamente con swagger-jsdoc; disponible en `/api/docs` |
| Hosting API + BD | Railway.app | Pro | PostgreSQL incluido como plugin, deploy desde Dockerfile, SSL auto, `DATABASE_URL` auto-inyectada |
| Hosting portal Angular | Vercel | — | CD automático desde GitHub, CDN global, SPA rewrites |
| Hosting landing | Netlify | — | CD automático, `_redirects` para SPA, CDN |
| Protocolo IA ↔ Backend | MCP (Model Context Protocol) | — | Estándar Anthropic para exponer herramientas a agentes LLM de forma estructurada y segura |

### Alternativas consideradas

| Decisión | Alternativa A (elegida) | Alternativa B (viable) | Por qué se eligió A |
|----------|------------------------|------------------------|---------------------|
| Backend | Node.js + Express | Python + FastAPI | Stack unificado JS; SDK MP oficial Node |
| Portal admin | Angular 17+ | React + Vite | Estructura enterprise más rígida, interceptors nativos |
| Pagos | MercadoPago | PayU Colombia | Integración más simple; sandbox inmediato |
| Hosting | Railway.app | Render.com | PostgreSQL incluido en el mismo servicio |
| Landing | HTML/Tailwind | Next.js | Cero overhead, SEO nativo, carga < 1s |

---

## 4. Arquitectura del Sistema

### Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENTES FINALES                                                   │
│  WhatsApp · Landing Page (www.[dominio].com) · Portal Admin        │
└────────────────────────┬─────────────────────────┬─────────────────┘
                         │                         │
          ┌──────────────▼──────────┐  ┌───────────▼──────────────┐
          │  PRESENTACIÓN           │  │  PRESENTACIÓN            │
          │  Angular 17+            │  │  HTML / Tailwind / JS    │
          │  www.[dominio].com/admin│  │  www.[dominio].com       │
          └──────────────┬──────────┘  └───────────┬──────────────┘
                         │                         │
          ┌──────────────▼─────────────────────────▼──────────────┐
          │  CAPA DE IA — n8n Cloud                               │
          │  Agente Sofia (WhatsApp)  ←─MCP─→  MCP Server        │
          │  AI Agent + GPT-4o-mini             7 tools           │
          └─────────────────────────┬──────────────────────────────┘
                                    │ HTTP REST + JWT
          ┌─────────────────────────▼──────────────────────────────┐
          │  CAPA DE APLICACIÓN — Node.js 20 + Express 5          │
          │  Auth · Rooms · Plans · Reservations · Payments        │
          │  Inventory · CMS · Media · Users · Reports · Config    │
          └─────────────────────────┬──────────────────────────────┘
                                    │ Knex.js + pool
          ┌─────────────────────────▼──────────────────────────────┐
          │  CAPA DE DATOS — PostgreSQL 14+                        │
          │  ACID · Idempotencia · Concurrencia · Auditoría        │
          │  PL/pgSQL · pg_cron · Triggers · Índices               │
          └─────────────────────────┬──────────────────────────────┘
                                    │
          ┌─────────────────────────▼──────────────────────────────┐
          │  SERVICIOS EXTERNOS                                     │
          │  MercadoPago API  ·  Meta WhatsApp Cloud API           │
          │  S3/Cloudinary (medios)  ·  SMTP (correos)             │
          └─────────────────────────────────────────────────────────┘
```

### Hosting por componente

```
Railway.app          →  Node.js API  +  PostgreSQL 14+
Vercel               →  Angular Admin Portal (www.[dominio].com/admin)
Netlify              →  Landing Page (www.[dominio].com)
n8n Cloud (Pro)      →  MCP Server + AI Agent WhatsApp
```

> **Nota crítica:** La landing y el portal admin comparten dominio. En Vercel se configura una rewrite rule: cualquier ruta `/admin*` sirve el `index.html` del build de Angular. Angular Router maneja el resto. Las rutas públicas (`/`, `/planes/*`) sirven el HTML estático de Netlify redirigido correctamente.

### Principios de arquitectura

1. **El API es la única fuente de verdad.** Ni la landing ni el portal acceden directamente a la BD.
2. **El agente IA no tiene estado propio sobre el negocio.** Todo lo consulta al backend via MCP en tiempo real.
3. **Idempotencia end-to-end.** Reservas y pagos no se duplican aunque se reintenten.
4. **Snapshots inmutables.** Las actividades de una reserva confirmada no cambian aunque el plan cambie después.
5. **Soft delete.** Habitaciones, planes e ítems de inventario nunca se eliminan físicamente si tienen reservas asociadas.

---

## 5. Estructura de URLs y Routing

### URLs públicas

| URL | Qué sirve | Auth requerido |
|-----|----------|----------------|
| `www.[dominio].com` | Landing page del hotel (HTML estático) | No |
| `www.[dominio].com/[slug-plan]` | Página de detalle de un plan específico | No |
| `www.[dominio].com/success` | Resultado de pago exitoso | No |
| `www.[dominio].com/failure` | Resultado de pago fallido | No |
| `www.[dominio].com/pending` | Resultado de pago pendiente | No |

### URLs del portal admin (Angular SPA)

| URL | Módulo | Roles que pueden acceder |
|-----|--------|--------------------------|
| `www.[dominio].com/admin` | Login | Público (sin sesión → muestra login) |
| `www.[dominio].com/admin/dashboard` | Dashboard | Todos los roles |
| `www.[dominio].com/admin/rooms` | Habitaciones y servicios | ADMIN, SUPER_ADMIN |
| `www.[dominio].com/admin/plans` | Planes y actividades | ADMIN, SUPER_ADMIN |
| `www.[dominio].com/admin/availability` | Disponibilidad y calendario | ADMIN, BUSINESS, SUPER_ADMIN |
| `www.[dominio].com/admin/reservations` | Reservas | ADMIN, BUSINESS, SUPER_ADMIN |
| `www.[dominio].com/admin/inventory` | Inventario e insumos | ADMIN, BUSINESS, SUPER_ADMIN |
| `www.[dominio].com/admin/reports` | Reportes y analítica | ADMIN, BUSINESS, SUPER_ADMIN, VIEWER |
| `www.[dominio].com/admin/cms` | Gestión de contenido y medios | ADMIN, SUPER_ADMIN |
| `www.[dominio].com/admin/users` | Usuarios del portal | ADMIN, SUPER_ADMIN |
| `www.[dominio].com/admin/settings` | Configuración del negocio | ADMIN, SUPER_ADMIN |
| `www.[dominio].com/admin/profile` | Perfil propio | Todos los roles |

### URLs del API

| Base URL | Propósito |
|----------|-----------|
| `www.[dominio].com/api/v1/` | Todos los endpoints del sistema |
| `www.[dominio].com/api/docs` | Swagger UI — documentación interactiva |
| `www.[dominio].com/api/health` | Health check para Railway y UptimeRobot |

### Regla de routing crítica en Angular

Cualquier usuario sin sesión activa que visite `/admin/[cualquier-ruta]` es redirigido automáticamente a `/admin` (pantalla de login) por el `AuthGuard`. Esta protección se aplica en el cliente (Angular) y complementariamente en el servidor (el API rechaza tokens inválidos con 401).

---

## 6. Roles y Permisos

### Definición de roles

| Rol | Código | Descripción |
|-----|--------|-------------|
| Superadministrador | `SUPER_ADMIN` | Control total. Gestiona otros administradores. Accede a logs de auditoría completos. Cambia credenciales de pasarela de pago. |
| Administrador General | `ADMIN` | Acceso completo a todos los módulos del portal excepto gestión de SUPER_ADMIN. |
| Operaciones | `BUSINESS` | Gestión operativa diaria: reservas, disponibilidad, inventario, reportes. No puede modificar precios ni crear usuarios. |
| Solo lectura | `VIEWER` | Consulta de reservas, disponibilidad y reportes. No puede crear, editar ni eliminar ningún registro. |
| Agente IA (sistema) | `AGENT` | Rol interno del sistema para que el agente de n8n pueda crear reservas y pagos via API. No tiene acceso al portal. |

### Matriz de permisos por módulo

| Módulo | SUPER_ADMIN | ADMIN | BUSINESS | VIEWER |
|--------|:-----------:|:-----:|:--------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Habitaciones (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Planes (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Disponibilidad (ver) | ✅ | ✅ | ✅ | ✅ |
| Disponibilidad (editar) | ✅ | ✅ | ✅ | ❌ |
| Reservas (ver) | ✅ | ✅ | ✅ | ✅ |
| Reservas (crear/editar) | ✅ | ✅ | ✅ | ❌ |
| Inventario (ver) | ✅ | ✅ | ✅ | ✅ |
| Inventario (movimientos) | ✅ | ✅ | ✅ | ❌ |
| Reportes | ✅ | ✅ | ✅ | ✅ |
| CMS (contenido y medios) | ✅ | ✅ | ❌ | ❌ |
| Usuarios del portal | ✅ | ✅ (excepto SUPER_ADMIN) | ❌ | ❌ |
| Configuración del negocio | ✅ | ✅ | ❌ | ❌ |
| Credenciales de pago | ✅ | ❌ | ❌ | ❌ |
| Log de auditoría completo | ✅ | ❌ | ❌ | ❌ |

### Implementación en el API

```js
// Middleware: authGuard(['ADMIN', 'SUPER_ADMIN'])
router.post('/rooms', authGuard(['ADMIN', 'SUPER_ADMIN']), validate(roomSchema), roomController.create);
router.get('/rooms', roomController.list); // público
router.delete('/rooms/:id', authGuard(['ADMIN', 'SUPER_ADMIN']), roomController.delete);
```

### Implementación en Angular

El `RoleGuard` en Angular evalúa el rol del usuario autenticado y redirige a `/admin/dashboard` si intenta acceder a una ruta para la que no tiene permisos. Los botones de acción (Crear, Editar, Eliminar) se muestran u ocultan via `*ngIf` según el rol usando una directiva `hasRole`.

---

## 7. Modelo de Datos (PostgreSQL)

### Entidades del sistema (19 tablas)

#### Usuarios y seguridad

```sql
-- users: usuarios del portal de administración
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'VIEWER',  -- ENUM
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);
-- ENUM: user_role → 'SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'

-- refresh_tokens: almacén de refresh tokens activos
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Habitaciones y servicios

```sql
-- rooms: habitaciones, cabañas y servicios del hotel
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,  -- para URLs amigables
  type         room_type NOT NULL,             -- ENUM: 'cabin', 'room', 'pasadia', 'additional'
  description  TEXT,
  capacity     SMALLINT NOT NULL,
  base_price   DECIMAL(12,2) NOT NULL,
  amenities    JSONB DEFAULT '[]',             -- ['Wi-Fi', 'Piscina', 'Aire acondicionado']
  is_active    BOOLEAN DEFAULT TRUE,
  sort_order   SMALLINT DEFAULT 0,
  deleted_at   TIMESTAMPTZ,                   -- soft delete
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);
```

#### Biblioteca de medios

```sql
-- media_library: repositorio centralizado de imágenes y videos
CREATE TABLE media_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(255) NOT NULL,
  original_url  TEXT NOT NULL,                -- URL del archivo original
  thumbnail_url TEXT,                         -- URL del thumbnail (solo imágenes)
  file_type     media_type NOT NULL,          -- ENUM: 'image', 'video', 'youtube', 'vimeo'
  mime_type     VARCHAR(80),
  size_bytes    BIGINT,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- room_media: relación entre habitaciones y sus archivos
CREATE TABLE room_media (
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  media_id   UUID REFERENCES media_library(id) ON DELETE CASCADE,
  is_cover   BOOLEAN DEFAULT FALSE,           -- foto principal
  sort_order SMALLINT DEFAULT 0,
  PRIMARY KEY (room_id, media_id)
);
```

#### Sistema de Planes y Actividades

```sql
-- plans: planes experienciales del hotel
CREATE TABLE plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(100) UNIQUE NOT NULL,
  short_desc       VARCHAR(300),              -- para tarjetas en la landing
  long_desc        TEXT,                      -- para la página de detalle
  base_price       DECIMAL(12,2) NOT NULL,
  price_unit       price_unit NOT NULL,       -- ENUM: 'per_person', 'per_group', 'per_night'
  max_persons      SMALLINT NOT NULL,
  min_nights       SMALLINT DEFAULT 1,
  room_id          UUID REFERENCES rooms(id), -- habitación vinculada (opcional)
  is_active        BOOLEAN DEFAULT TRUE,
  sort_order       SMALLINT DEFAULT 0,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ
);

-- plan_media: relación entre planes y sus archivos
CREATE TABLE plan_media (
  plan_id    UUID REFERENCES plans(id) ON DELETE CASCADE,
  media_id   UUID REFERENCES media_library(id),
  is_cover   BOOLEAN DEFAULT FALSE,
  sort_order SMALLINT DEFAULT 0,
  PRIMARY KEY (plan_id, media_id)
);

-- plan_activities: actividades BASE incluidas en el plan (inmutables en reservas)
CREATE TABLE plan_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID REFERENCES plans(id) ON DELETE CASCADE,
  name              VARCHAR(150) NOT NULL,
  description       TEXT,
  extra_cost        DECIMAL(10,2) DEFAULT 0,  -- 0 = incluido en el precio base
  sort_order        SMALLINT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- optional_activities: catálogo GLOBAL de actividades opcionales del hotel
CREATE TABLE optional_activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  price            DECIMAL(10,2) NOT NULL,
  price_unit       price_unit NOT NULL,       -- 'per_person', 'per_group', 'per_session'
  duration_minutes SMALLINT,
  max_persons      SMALLINT,
  media_id         UUID REFERENCES media_library(id),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- plan_optional_activities: qué opcionales están disponibles en cada plan
CREATE TABLE plan_optional_activities (
  plan_id              UUID REFERENCES plans(id) ON DELETE CASCADE,
  optional_activity_id UUID REFERENCES optional_activities(id) ON DELETE CASCADE,
  is_default           BOOLEAN DEFAULT FALSE,  -- pre-seleccionada al reservar
  PRIMARY KEY (plan_id, optional_activity_id)
);
```

#### Disponibilidad y Temporadas

```sql
-- availability: cupos configurados por fecha, habitación o plan
CREATE TABLE availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES rooms(id),
  plan_id         UUID REFERENCES plans(id),
  date            DATE NOT NULL,
  total_slots     SMALLINT NOT NULL DEFAULT 1,
  blocked_slots   SMALLINT DEFAULT 0,
  block_reason    VARCHAR(200),               -- 'mantenimiento', 'evento privado', etc.
  special_price   DECIMAL(12,2),              -- override de precio para este día
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- seasons: temporadas de precios del hotel
CREATE TABLE seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(80) NOT NULL,       -- 'Semana Santa', 'Temporada alta diciembre'
  date_start      DATE NOT NULL,
  date_end        DATE NOT NULL,
  price_multiplier DECIMAL(4,2) NOT NULL,     -- 1.0 = precio normal, 1.4 = +40%
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Reservas

```sql
-- reservations: núcleo transaccional del sistema
CREATE TABLE reservations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number   VARCHAR(20) UNIQUE NOT NULL,  -- HT-2026-00001
  room_id              UUID REFERENCES rooms(id),
  plan_id              UUID REFERENCES plans(id),
  customer_name        VARCHAR(200) NOT NULL,
  customer_document    VARCHAR(30) NOT NULL,
  customer_email       VARCHAR(200),
  customer_phone       VARCHAR(30) NOT NULL,
  date_start           DATE NOT NULL,
  date_end             DATE,
  adults               SMALLINT NOT NULL,
  children             SMALLINT DEFAULT 0,
  status               reservation_status NOT NULL DEFAULT 'PENDING',
  -- ENUM: 'PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
  total_amount         DECIMAL(12,2) NOT NULL,
  cancellation_reason  VARCHAR(200),
  notes                TEXT,
  created_by           UUID REFERENCES users(id),  -- NULL si fue el agente IA
  version              INTEGER DEFAULT 0,           -- para bloqueo optimista
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ
);

-- reservation_activity_snapshot: COPIA INMUTABLE de las actividades base del plan al momento de reservar
-- Esta tabla NUNCA se modifica después de que la reserva se crea.
CREATE TABLE reservation_activity_snapshot (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  activity_name  VARCHAR(150) NOT NULL,
  description    TEXT,
  extra_cost     DECIMAL(10,2) DEFAULT 0,
  sort_order     SMALLINT DEFAULT 0
);

-- reservation_optional_activities: actividades opcionales que el cliente eligió al reservar
CREATE TABLE reservation_optional_activities (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id       UUID REFERENCES reservations(id) ON DELETE CASCADE,
  optional_activity_id UUID REFERENCES optional_activities(id),
  activity_name_snapshot VARCHAR(150) NOT NULL,  -- nombre al momento de reservar
  price_snapshot       DECIMAL(10,2) NOT NULL,   -- precio al momento de reservar
  quantity             SMALLINT DEFAULT 1
);
```

#### Pagos

```sql
-- payment_attempts: cada intento de pago (puede haber varios por reserva)
CREATE TABLE payment_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID REFERENCES reservations(id),
  idempotency_key  VARCHAR(128) UNIQUE NOT NULL,  -- SHA256(reservation_id+amount+currency)
  preference_id    VARCHAR(100),                  -- ID de la Preference en MercadoPago
  checkout_url     TEXT,                          -- URL del checkout de MP
  status           VARCHAR(30) DEFAULT 'pending', -- pending/approved/rejected/expired
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- payments: pagos CONFIRMADOS (un pago por reserva confirmada)
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id),
  amount          DECIMAL(12,2) NOT NULL,
  currency        CHAR(3) DEFAULT 'COP',
  payment_method  VARCHAR(50),               -- 'mercadopago_checkout', 'pse', 'manual'
  external_id     VARCHAR(100),              -- ID del pago en MercadoPago
  status          VARCHAR(30) NOT NULL,      -- 'confirmed', 'refunded', 'partial_refund'
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Inventario

```sql
-- inventory_items: ítems del inventario del hotel
CREATE TABLE inventory_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(120) NOT NULL,
  category     inv_category NOT NULL,  -- ENUM: 'food','beverages','cleaning','maintenance','other'
  unit         VARCHAR(30) NOT NULL,   -- 'unidades', 'litros', 'kg', 'rollos'
  current_stock DECIMAL(10,3) DEFAULT 0,
  min_stock    DECIMAL(10,3) DEFAULT 0,
  supplier_id  UUID REFERENCES suppliers(id),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_movements: cada movimiento de inventario
CREATE TABLE inventory_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID REFERENCES inventory_items(id),
  type         mov_type NOT NULL,            -- ENUM: 'ENTRY', 'EXIT', 'ADJUSTMENT'
  quantity     DECIMAL(10,3) NOT NULL,
  notes        TEXT,
  reservation_id UUID REFERENCES reservations(id),  -- opcional: consumo asociado a reserva
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- suppliers: proveedores del hotel
CREATE TABLE suppliers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(120) NOT NULL,
  phone     VARCHAR(30),
  email     VARCHAR(200),
  address   TEXT,
  notes     TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### CMS y Configuración

```sql
-- site_content: contenido editable de la landing (estructura clave-valor)
CREATE TABLE site_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section    VARCHAR(60) NOT NULL,   -- 'hero', 'contact', 'about', 'gallery'
  key        VARCHAR(80) NOT NULL,   -- 'title', 'subtitle', 'cta_text', 'phone'
  value      TEXT,                   -- valor del campo
  type       content_type NOT NULL,  -- ENUM: 'text', 'image_url', 'list_json', 'richtext'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section, key)
);

-- faqs: preguntas frecuentes de la landing
CREATE TABLE faqs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- business_config: configuración global del negocio (una sola fila)
CREATE TABLE business_config (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name            VARCHAR(150) NOT NULL,
  nit                   VARCHAR(30),
  address               TEXT,
  checkin_time          TIME DEFAULT '15:00',
  checkout_time         TIME DEFAULT '12:00',
  cancellation_policy   JSONB,
  -- Ej: [{"hours_before": 72, "penalty_pct": 0}, {"hours_before": 24, "penalty_pct": 50}]
  mp_public_key         TEXT,                -- se almacena encriptado
  mp_access_token       TEXT,                -- se almacena encriptado
  mp_webhook_secret     TEXT,                -- se almacena encriptado
  logo_url              TEXT,
  primary_color         CHAR(7),             -- HEX ej: '#1A3A5C'
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs: registro inmutable de acciones críticas
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  table_name   VARCHAR(60) NOT NULL,
  record_id    UUID,
  operation    VARCHAR(10) NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- idempotency_keys: prevención de operaciones duplicadas
CREATE TABLE idempotency_keys (
  key             VARCHAR(128) PRIMARY KEY,
  operation       VARCHAR(60) NOT NULL,
  response_status SMALLINT,
  response_body   JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
```

### Índices críticos

```sql
-- Disponibilidad: el query más frecuente del sistema
CREATE INDEX idx_availability_lookup
  ON availability(room_id, plan_id, date)
  WHERE blocked_slots < total_slots;

-- Reservas activas: para verificación de concurrencia
CREATE INDEX idx_reservations_active
  ON reservations(room_id, plan_id, date_start, date_end)
  WHERE status IN ('PENDING', 'CONFIRMED');

-- Idempotencia: búsqueda rápida + cleanup automático
CREATE INDEX idx_idempotency_expires
  ON idempotency_keys(expires_at)
  WHERE expires_at > NOW();

-- Inventario: alertas de stock bajo
CREATE INDEX idx_inventory_low_stock
  ON inventory_items(id)
  WHERE current_stock < min_stock AND is_active = TRUE;
```

---

## 8. Componente C1 — Base de Datos

### Responsabilidades

- Almacén persistente de todos los datos del sistema
- Garantía de integridad transaccional (ACID)
- Mecanismo de idempotencia a nivel de base de datos
- Control de concurrencia para reservas simultáneas
- Auditoría automática via triggers PL/pgSQL
- Cleanup automático de registros expirados via `pg_cron`

### Mecanismo de idempotencia

Toda operación crítica (crear reserva, crear pago) incluye un header `Idempotency-Key` en el request. El middleware del API:

1. Busca la clave en `idempotency_keys`
2. Si existe y no ha expirado → devuelve la respuesta cacheada **sin ejecutar la operación**
3. Si no existe → ejecuta la operación, guarda la respuesta y la clave
4. `pg_cron` ejecuta cada hora: `DELETE FROM idempotency_keys WHERE expires_at < NOW()`

### Control de concurrencia para reservas

```sql
-- Función PL/pgSQL que se ejecuta dentro de una transacción Knex
CREATE OR REPLACE FUNCTION check_availability(
  p_room_id UUID, p_plan_id UUID,
  p_date_start DATE, p_date_end DATE
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM reservations
  WHERE (room_id = p_room_id OR plan_id = p_plan_id)
    AND status IN ('PENDING', 'CONFIRMED')
    AND date_start < p_date_end
    AND date_end > p_date_start
  FOR UPDATE SKIP LOCKED;  -- bloqueo pesimista: otras transacciones esperan

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

### Triggers de auditoría

```sql
CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs(table_name, record_id, operation, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION log_changes();
-- (idem para plans, rooms, payments, users, inventory_items)
```

### Gestión de migraciones (Knex)

```
migrations/
  001_users_roles.js
  002_rooms_services_media.js
  003_plans_activities.js
  004_availability_seasons.js
  005_reservations.js
  006_payments.js
  007_inventory.js
  008_cms_config.js
  009_indexes.js
  010_triggers_cron.js
```

Cada migración tiene métodos `exports.up` y `exports.down` para aplicar y revertir.

---

## 9. Componente C2 — API Backend (Node.js)

### Estructura de carpetas

```
src/
├── app.js                    # Express app (sin listen — separado para testing)
├── server.js                 # listen() en PORT
├── config/
│   ├── database.js           # Knex config, pool min:2 max:10
│   ├── env.js                # dotenv + validación de vars obligatorias al startup
│   └── swagger.js            # swagger-jsdoc config
├── middlewares/
│   ├── auth.guard.js         # Verificar JWT, extraer user, validar rol
│   ├── idempotency.js        # Check/replay de operaciones idempotentes
│   ├── rate-limit.js         # express-rate-limit: 100 req/15min, 5/min en /auth
│   ├── validate.js           # Wrapper de validación Joi
│   ├── upload.js             # Multer config para archivos multimedia
│   └── error-handler.js      # Centralizar AppError → respuesta HTTP estructurada
├── modules/
│   ├── auth/
│   ├── rooms/
│   ├── plans/
│   ├── reservations/
│   ├── payments/
│   ├── inventory/
│   ├── media/
│   ├── cms/
│   ├── users/
│   └── reports/
│       ├── [module].routes.js
│       ├── [module].controller.js
│       ├── [module].service.js
│       ├── [module].repository.js
│       └── [module].schema.js    # Joi schemas de validación
└── utils/
    ├── logger.js              # Winston JSON logger
    ├── errors.js              # AppError, ConflictError, NotFoundError, ValidationError
    ├── crypto.js              # SHA256, HMAC helpers
    └── mailer.js              # Envío de correos (reset password, confirmaciones)
```

### Tabla completa de endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/auth/login` | Login → tokens JWT | Público |
| `POST` | `/api/v1/auth/refresh` | Rotar access token | Cookie refresh |
| `POST` | `/api/v1/auth/logout` | Invalidar refresh token | Access token |
| `POST` | `/api/v1/auth/forgot-password` | Solicitar reset | Público |
| `POST` | `/api/v1/auth/reset-password` | Cambiar contraseña con token | Token temporal |
| `GET` | `/api/v1/rooms` | Listar (público: solo activos; admin: todos) | Público / Admin |
| `GET` | `/api/v1/rooms/:id` | Detalle de habitación con media | Público |
| `POST` | `/api/v1/rooms` | Crear habitación | ADMIN |
| `PUT` | `/api/v1/rooms/:id` | Actualizar habitación | ADMIN |
| `PATCH` | `/api/v1/rooms/:id/status` | Activar/desactivar | ADMIN |
| `DELETE` | `/api/v1/rooms/:id` | Soft delete | ADMIN |
| `POST` | `/api/v1/rooms/:id/media` | Asociar archivo de media | ADMIN |
| `DELETE` | `/api/v1/rooms/:id/media/:mediaId` | Desasociar archivo | ADMIN |
| `GET` | `/api/v1/plans` | Listar planes | Público / Admin |
| `GET` | `/api/v1/plans/:id` | Detalle con actividades base y opcionales | Público |
| `POST` | `/api/v1/plans` | Crear plan | ADMIN |
| `PUT` | `/api/v1/plans/:id` | Actualizar plan | ADMIN |
| `POST` | `/api/v1/plans/:id/duplicate` | Clonar plan | ADMIN |
| `PATCH` | `/api/v1/plans/:id/status` | Activar/desactivar | ADMIN |
| `POST` | `/api/v1/plans/:id/activities` | Agregar actividad base | ADMIN |
| `PUT` | `/api/v1/plans/:id/activities/:actId` | Editar actividad base | ADMIN |
| `DELETE` | `/api/v1/plans/:id/activities/:actId` | Eliminar actividad base | ADMIN |
| `PUT` | `/api/v1/plans/:id/activities/reorder` | Reordenar actividades base | ADMIN |
| `GET` | `/api/v1/optional-activities` | Listar catálogo global | Admin + Agente |
| `POST` | `/api/v1/optional-activities` | Crear actividad opcional | ADMIN |
| `PUT` | `/api/v1/optional-activities/:id` | Editar actividad opcional | ADMIN |
| `PATCH` | `/api/v1/optional-activities/:id/status` | Activar/desactivar | ADMIN |
| `POST` | `/api/v1/plans/:id/optional-activities/:actId` | Asociar opcional a plan | ADMIN |
| `PATCH` | `/api/v1/plans/:id/optional-activities/:actId` | Marcar como default | ADMIN |
| `DELETE` | `/api/v1/plans/:id/optional-activities/:actId` | Desasociar opcional | ADMIN |
| `GET` | `/api/v1/availability` | Consultar disponibilidad | Público |
| `GET` | `/api/v1/availability/calendar` | Vista mensual admin | ADMIN, BUSINESS |
| `POST` | `/api/v1/availability` | Configurar cupos base | ADMIN |
| `POST` | `/api/v1/availability/block` | Bloquear fechas | ADMIN, BUSINESS |
| `GET` | `/api/v1/seasons` | Listar temporadas | Público |
| `POST` | `/api/v1/seasons` | Crear temporada | ADMIN |
| `PUT` | `/api/v1/seasons/:id` | Editar temporada | ADMIN |
| `DELETE` | `/api/v1/seasons/:id` | Eliminar temporada | ADMIN |
| `POST` | `/api/v1/reservations` | Crear reserva | AGENT, ADMIN, BUSINESS |
| `GET` | `/api/v1/reservations` | Listar con filtros | ADMIN, BUSINESS |
| `GET` | `/api/v1/reservations/:id` | Detalle con snapshot | ADMIN, BUSINESS, AGENT |
| `GET` | `/api/v1/reservations/:number` | Buscar por número | ADMIN, BUSINESS, AGENT |
| `PUT` | `/api/v1/reservations/:id` | Modificar fechas | ADMIN, BUSINESS, AGENT |
| `PATCH` | `/api/v1/reservations/:id/status` | Confirmar manualmente | ADMIN |
| `DELETE` | `/api/v1/reservations/:id` | Cancelar | ADMIN, BUSINESS, AGENT |
| `GET` | `/api/v1/reservations/:id/policy` | Calcular penalidad | ADMIN, BUSINESS, AGENT |
| `POST` | `/api/v1/reservations/:id/optional-activities` | Agregar opcional | ADMIN, BUSINESS, AGENT |
| `POST` | `/api/v1/payments/create` | Crear Preference MP | ADMIN, AGENT |
| `POST` | `/api/v1/payments/webhook` | Webhook MercadoPago | Público (firma MP) |
| `GET` | `/api/v1/payments/reconciliation` | Comparar BD vs MP | ADMIN |
| `POST` | `/api/v1/media/upload` | Subir archivo | ADMIN |
| `GET` | `/api/v1/media` | Biblioteca de medios | ADMIN |
| `DELETE` | `/api/v1/media/:id` | Eliminar archivo | ADMIN |
| `GET` | `/api/v1/inventory/items` | Listar ítems | ADMIN, BUSINESS |
| `POST` | `/api/v1/inventory/items` | Crear ítem | ADMIN |
| `PUT` | `/api/v1/inventory/items/:id` | Editar ítem | ADMIN |
| `POST` | `/api/v1/inventory/movements` | Registrar movimiento | ADMIN, BUSINESS |
| `GET` | `/api/v1/inventory/alerts` | Ítems bajo mínimo | ADMIN, BUSINESS |
| `GET` | `/api/v1/suppliers` | Listar proveedores | ADMIN, BUSINESS |
| `POST` | `/api/v1/suppliers` | Crear proveedor | ADMIN |
| `GET` | `/api/v1/site-content/public` | Contenido para landing | Público |
| `GET` | `/api/v1/site-content/:section` | Sección específica | ADMIN |
| `PUT` | `/api/v1/site-content/:section` | Actualizar sección | ADMIN |
| `GET` | `/api/v1/faqs` | Listar FAQs activas | Público |
| `POST` | `/api/v1/faqs` | Crear FAQ | ADMIN |
| `PUT` | `/api/v1/faqs/reorder` | Reordenar FAQs | ADMIN |
| `GET` | `/api/v1/users` | Listar usuarios | ADMIN, SUPER_ADMIN |
| `POST` | `/api/v1/users` | Crear usuario | ADMIN, SUPER_ADMIN |
| `PUT` | `/api/v1/users/:id` | Actualizar usuario | ADMIN, SUPER_ADMIN |
| `PATCH` | `/api/v1/users/:id/status` | Activar/desactivar | ADMIN, SUPER_ADMIN |
| `GET` | `/api/v1/business-config` | Configuración del negocio | ADMIN |
| `PUT` | `/api/v1/business-config` | Actualizar configuración | ADMIN, SUPER_ADMIN |
| `GET` | `/api/v1/reports/occupancy` | Reporte de ocupación | ADMIN, BUSINESS, VIEWER |
| `GET` | `/api/v1/reports/revenue` | Reporte de ingresos | ADMIN, VIEWER |
| `GET` | `/api/v1/reports/reservations` | Detalle de reservas | ADMIN, BUSINESS, VIEWER |
| `GET` | `/api/v1/reports/inventory` | Movimientos de inventario | ADMIN, BUSINESS, VIEWER |
| `GET` | `/api/v1/health` | Health check | Público |

### Patrón de respuesta del API

```json
// Éxito
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Error
{ "error": { "code": "CONFLICT", "message": "Habitación no disponible en esas fechas", "details": null } }

// Respuesta de reserva (ejemplo)
{
  "data": {
    "id": "uuid",
    "reservation_number": "HT-2026-00001",
    "status": "PENDING",
    "plan": { "id": "...", "name": "Plan Romántico" },
    "activities_snapshot": [
      { "name": "Desayuno para 2", "extra_cost": 0, "sort_order": 1 },
      { "name": "Tour por el río", "extra_cost": 0, "sort_order": 2 }
    ],
    "optional_activities": [
      { "name": "Cena romántica", "price": 120000, "quantity": 1 }
    ],
    "total_amount": 680000
  }
}
```

---

## 10. Componente C3 — Módulo de Pagos (MercadoPago)

### Flujo completo

```
1. API recibe POST /payments/create con { reservation_id, amount }
2. Verifica idempotency_key = SHA256(reservation_id + amount + 'COP')
3. Si clave existe → replay de la respuesta (no llama a MP de nuevo)
4. Crea Preference en MercadoPago SDK con:
   - items: [{ id: reservation_id, title: "Reserva HT-2026-00001", unit_price: amount }]
   - external_reference: reservation_id
   - notification_url: https://api.[dominio].com/api/v1/payments/webhook
   - back_urls: { success, failure, pending }
5. Guarda preference_id + checkout_url en payment_attempts
6. Devuelve { preference_id, checkout_url } al cliente (agente IA o portal)

7. Cliente paga en MercadoPago
8. MercadoPago envía POST /payments/webhook con header x-signature
9. API responde 200 OK INMEDIATAMENTE (< 500ms, requerido por MP)
10. API procesa en background:
    a. Valida firma HMAC-SHA256: manifest = "id:{dataId};request-id:{reqId};ts:{ts};"
    b. Verifica que el payment_id no fue procesado antes (deduplicación)
    c. Consulta estado real del pago en MP API
    d. En transacción Knex:
       - UPDATE reservations SET status = 'CONFIRMED' WHERE id = external_reference
       - INSERT INTO payments (amount, external_id, status, confirmed_at)
       - INSERT INTO audit_logs
```

### Validación de firma HMAC

```js
// El manifest que firma MercadoPago
const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
const expected = crypto
  .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
  .update(manifest)
  .digest('hex');

const v1 = signature.split(',').find(p => p.startsWith('v1=')).split('=')[1];

if (!crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
  // Ignorar silenciosamente — ya respondimos 200
  return;
}
```

### Política de reintentos

- MercadoPago reintenta el webhook si no recibe 200 en < 500ms
- Usar `timingSafeEqual` para comparar firmas (previene timing attacks)
- Si el pago ya está en tabla `payments` → ignorar sin reprocesar
- Registrar todos los intentos en `payment_attempts` con su estado

---

## 11. Componente C4 — Portal de Administración (Angular)

### Módulos de la aplicación Angular

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts         # Tokens en memoria, refresh silencioso
│   │   ├── auth.interceptor.ts     # Bearer header + retry en 401
│   │   ├── auth.guard.ts           # canActivate: redirige a /admin si no hay sesión
│   │   └── role.guard.ts           # canActivate: valida rol mínimo requerido
│   └── services/
│       ├── api.service.ts          # HttpClient wrapper con URL base
│       └── toast.service.ts        # Notificaciones globales (MatSnackBar)
├── shared/
│   ├── components/
│   │   ├── data-table/             # Tabla reutilizable con paginación server-side
│   │   ├── confirm-dialog/         # Modal de confirmación para acciones destructivas
│   │   ├── media-picker/           # Selector de archivos de la biblioteca de medios
│   │   └── has-role.directive.ts   # *appHasRole="['ADMIN']" para mostrar/ocultar
│   └── pipes/
│       ├── currency-cop.pipe.ts    # Formatear precios en COP
│       └── reservation-status.pipe.ts
├── layout/
│   ├── sidebar/                    # Nav dinámica según rol
│   └── topbar/                     # Perfil + logout + notificaciones
└── features/
    ├── dashboard/                  # KPIs + Chart.js + alertas + próximas reservas
    ├── rooms/                      # CRUD habitaciones + galería + amenities
    ├── plans/                      # CRUD planes + actividades base + opcionales
    ├── availability/               # Calendario CSS Grid + bloqueos + temporadas
    ├── reservations/               # Listado + detalle + acciones + creación manual
    ├── inventory/                  # Ítems + movimientos + proveedores + alertas
    ├── reports/                    # Reportes con Chart.js + exportación Excel/PDF
    ├── cms/                        # Biblioteca de medios + contenido del sitio
    ├── users/                      # Gestión de usuarios del portal
    └── settings/                   # Config del negocio + políticas + credenciales
```

### AuthInterceptor — manejo de tokens

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken(); // Almacenado en memoria (no localStorage)

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refreshToken().pipe(
          switchMap(newToken => next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          }))),
          catchError(() => { auth.logout(); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};
```

### Módulo de Planes — lógica especial

El formulario de planes tiene dos sub-secciones críticas:

**Actividades base:**
- Lista ordenable con `CdkDragDrop` (Angular CDK)
- Al intentar eliminar una actividad → llamar `GET /plans/:id/activities/:actId/impact` → mostrar modal con "X reservas futuras se verán afectadas"
- Confirmar con checkbox explícito "Entiendo que esto afecta reservas existentes"

**Actividades opcionales:**
- Selector multi-select del catálogo global
- Toggle "Pre-seleccionada" por actividad dentro del plan
- Previsualización de precio total: precio base + suma de defaults seleccionados

---

## 12. Componente C5 — Landing Page + Widget IA

### Arquitectura de la landing

```
landing/
├── index.html             # Página principal — todas las secciones
├── [slug].html            # Plantilla de detalle de plan (generada o dinámica)
├── success.html
├── failure.html
├── pending.html
├── styles/
│   └── main.css           # Tailwind CSS (build para producción)
├── scripts/
│   ├── main.js            # Scroll suave, lazy images, FAQ accordion, mapa
│   └── chat-widget.js     # Widget del agente IA (autónomo, ~250 líneas)
└── assets/
    ├── icons/
    └── favicon.ico
```

### Secciones de la landing

1. **Hero**: imagen de fondo + título + subtítulo + CTA "Reservar" / "Chatear con Sofia"
2. **Servicios**: grid de habitaciones activas (datos del API `/rooms`)
3. **Planes**: grid de planes activos con actividades incluidas (datos del API `/plans`)
4. **Galería**: lightbox de fotos (datos del API `/site-content/gallery`)
5. **FAQ**: acordeón (datos del API `/faqs`)
6. **Mapa**: Google Maps Embed + datos de contacto (datos del API `/site-content/contact`)
7. **Footer**: logo + navegación + redes + aviso de privacidad

### Widget de chat (`chat-widget.js`)

```js
const AGENT_WEBHOOK = 'https://n8n.[instancia].cloud/webhook/hotel-chat';

class HotelChatWidget {
  constructor() {
    this.sessionId = sessionStorage.getItem('hotel_session') || crypto.randomUUID();
    sessionStorage.setItem('hotel_session', this.sessionId);
    this.messages = [];
    this.buildUI();
    this.bindEvents();
  }

  async sendMessage(text) {
    this.addBubble(text, 'user');
    this.showTyping();

    const res = await fetch(AGENT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId, message: text, channel: 'web' })
    });
    const data = await res.json();

    this.hideTyping();
    this.addBubble(data.response, 'bot');

    // Si el bot generó un link de pago, mostrar CTA card
    if (data.payment_url) {
      this.showPaymentCard(data.payment_url, data.reservation_number, data.total_amount);
    }
  }
}
```

> **Nota:** El agente n8n recibe el mensaje por un webhook separado (diferente al de WhatsApp), parsea el canal `'web'`, procesa con el mismo AI Agent y devuelve la respuesta en formato JSON `{ response: "...", payment_url?: "..." }`.

---

## 13. Componente C6 — MCP Server (n8n)

### Qué es el MCP Server

Un workflow en n8n Cloud que expone 8 herramientas (tools) al agente IA mediante el protocolo MCP (Model Context Protocol). El agente LLM invoca estas herramientas cuando necesita información real del backend o ejecutar acciones.

### Configuración del workflow

```
Workflow: "01_hotel_mcp_server"
Nodo raíz: MCP Server Trigger
  - Path: /hotel-mcp
  - Autenticación: Bearer Token
  - URL de producción: https://[instancia].n8n.cloud/mcp/hotel-mcp/sse

Variables de entorno requeridas en n8n:
  BACKEND_BASE_URL = https://api.[dominio].com/api/v1
  BACKEND_JWT_TOKEN = [token de rol AGENT]
  MCP_BEARER_TOKEN  = [token para autenticar clientes del MCP]
```

### Las 8 herramientas del MCP Server

| Tool | Método HTTP | Endpoint | Input Schema |
|------|------------|----------|-------------|
| `consultar_disponibilidad` | GET | `/availability` | `fecha_inicio`, `fecha_fin`, `tipo_servicio`, `num_personas` |
| `obtener_precios_planes` | GET | `/plans` + `/rooms` | `tipo_servicio?`, `temporada?` |
| `crear_reserva` | POST | `/reservations` | `nombre`, `documento`, `telefono`, `plan_id/room_id`, `fechas`, `adultos`, `ninos`, `opcionales?` |
| `consultar_reserva` | GET | `/reservations/:numero` | `numero_reserva` |
| `modificar_reserva` | PUT | `/reservations/:id` | `numero_reserva`, `nueva_fecha_inicio`, `nueva_fecha_fin` |
| `cancelar_reserva` | DELETE | `/reservations/:id` | `numero_reserva`, `motivo` |
| `agregar_actividad_opcional` | POST | `/reservations/:id/optional-activities` | `numero_reserva`, `activity_id`, `quantity` |
| `generar_link_pago` | POST | `/payments/create` | `numero_reserva`, `monto` |

### JSON Schema de `crear_reserva` (la más compleja)

```json
{
  "type": "object",
  "properties": {
    "nombre_cliente":   { "type": "string", "description": "Nombre completo del cliente" },
    "documento":        { "type": "string", "description": "Cédula o pasaporte" },
    "email":            { "type": "string", "format": "email" },
    "telefono":         { "type": "string", "description": "WhatsApp con código de país. Ej: +573001234567" },
    "plan_id":          { "type": "string", "description": "ID del plan (de consultar_disponibilidad)" },
    "room_id":          { "type": "string", "description": "ID de habitación si no es plan" },
    "fecha_inicio":     { "type": "string", "format": "date", "description": "YYYY-MM-DD" },
    "fecha_fin":        { "type": "string", "format": "date" },
    "adultos":          { "type": "integer", "minimum": 1 },
    "ninos":            { "type": "integer", "minimum": 0, "default": 0 },
    "opcionales":       {
      "type": "array",
      "items": { "type": "object", "properties": {
        "activity_id": { "type": "string" },
        "quantity": { "type": "integer", "minimum": 1 }
      }},
      "description": "Actividades opcionales elegidas por el cliente"
    }
  },
  "required": ["nombre_cliente", "documento", "telefono", "fecha_inicio", "adultos"]
}
```

### Manejo de errores en el MCP

Cada tool tiene un nodo IF que verifica el status HTTP de la respuesta del backend:
- `200/201` → formato de éxito y devuelve al agente
- `409 Conflict` → "La habitación no está disponible en esas fechas. ¿Deseas consultar otras fechas?"
- `422 Unprocessable` → "Faltan datos: [lista de campos faltantes]"
- `500` → "Estoy teniendo un inconveniente técnico. Intenta de nuevo en un momento."

---

## 14. Componente C7 — Agente IA WhatsApp (n8n)

### Arquitectura del workflow

```
Workflow: "02_hotel_ai_agent"

[Webhook POST /whatsapp-incoming]
  ├── [Respond 200 OK] ← INMEDIATO, antes de cualquier procesamiento
  └── [Code: parsear payload Meta]
        └── [IF: message.type === 'text']
              ├── TRUE: [AI Agent "Sofia"]
              │           ├── [ai_languageModel] → [OpenAI GPT-4o-mini]
              │           ├── [ai_memory]        → [Window Buffer Memory (sessionKey=from, 20 msgs)]
              │           └── [ai_tool]          → [MCP Client Tool → MCP Server C6]
              │         [Code: formatear para WhatsApp]
              │         [HTTP: enviar respuesta → Meta Graph API]
              └── FALSE: [STOP — ignorar mensajes de audio, imagen, etc.]
```

### System Prompt completo de Sofia

```
Eres Sofia, la asistente virtual de [NOMBRE DEL HOTEL].
Atiendes por WhatsApp. Eres amigable, directa y profesional.
Hablas en español colombiano natural. Respuestas cortas (máx 3 párrafos).
Usas emojis con moderación. NUNCA inventes precios ni disponibilidad.

## FLUJO DE RESERVA — SIEMPRE en este orden exacto:
1. Preguntar: ¿qué tipo de servicio? ¿qué fechas? ¿cuántas personas?
2. Invocar [consultar_disponibilidad] con esos datos.
3. Presentar opciones disponibles con precios (invocar [obtener_precios_planes]).
4. Confirmar elección del cliente.
5. Preguntar si desea agregar actividades opcionales disponibles en ese plan.
   → Mostrar lista de opcionales con precios. Esperar respuesta.
6. Recopilar datos: nombre completo, cédula, correo, adultos, niños.
   → Pedir de a UN dato a la vez si el cliente no los da todos.
7. Confirmar TODOS los datos + total antes de crear la reserva.
8. Invocar [crear_reserva] con los opcionales seleccionados.
9. Invocar [generar_link_pago] con el número de reserva.
10. Enviar link y explicar que la reserva se confirma automáticamente al pagar.

## REGLAS ABSOLUTAS:
- Si [consultar_disponibilidad] retorna vacío → "Lo siento, no hay disponibilidad para esas fechas."
- Si una herramienta falla → "Tengo un inconveniente técnico, intenta en un momento."
- Si el usuario pregunta algo fuera de tu alcance por más de 3 intentos:
  → "Te voy a pasar con uno de nuestros asesores. Horario: L-V 8am-6pm, Sáb 9am-2pm."
- NUNCA confirmes una reserva sin haber ejecutado [crear_reserva].
- NUNCA ejecutes [cancelar_reserva] sin mostrar primero la penalidad obtenida de [consultar_reserva].
- Las actividades base del plan son SIEMPRE incluidas — NO preguntes si el cliente las quiere.
- Los opcionales SÍ se preguntan — presenta la lista y espera elección del cliente.
```

### Variables de entorno requeridas en n8n (C7)

| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | Clave de API de OpenAI |
| `WHATSAPP_PHONE_ID` | ID del número de WhatsApp Business en Meta |
| `WHATSAPP_TOKEN` | System User Access Token permanente de Meta |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook en Meta Developers |
| `MCP_SERVER_URL` | URL SSE del MCP Server: `https://[instancia].n8n.cloud/mcp/hotel-mcp/sse` |
| `MCP_BEARER_TOKEN` | Bearer token para autenticar con el MCP Server |

### Formato de respuesta para WhatsApp

```js
// Convertir Markdown estándar → WhatsApp markdown
function formatForWhatsApp(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*')   // **bold** → *bold*
    .replace(/__(.*?)__/g, '_$1_')         // __italic__ → _italic_
    .replace(/#{1,6}\s/g, '*')             // ## heading → *heading*
    .trim();
}

// WhatsApp límite: 4.096 caracteres por mensaje
// Si la respuesta supera el límite → dividir por párrafos y enviar en mensajes separados
```

---

## 15. Componente C8 — DevOps y Despliegue

### Dockerfile multi-stage (Node.js API)

```dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: runtime (imagen final ~180MB)
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "src/server.js"]
```

### Mapa de despliegue por servicio

| Servicio | Plataforma | URL resultante | CI/CD |
|----------|-----------|----------------|-------|
| Node.js API | Railway | `https://api.[dominio].com` | Automático al push a `main` |
| PostgreSQL | Railway Plugin | Interno (no público) | Managed by Railway |
| Angular Portal | Vercel | `https://[dominio].com/admin` | Automático al push a `main` |
| Landing Page | Netlify | `https://[dominio].com` | Automático al push a `main` |
| MCP Server | n8n Cloud | `https://[inst].n8n.cloud/mcp/hotel-mcp/sse` | Manual — activar workflow |
| AI Agent | n8n Cloud | Webhook interno | Manual — activar workflow |

### Monitoreo y respaldo

- **UptimeRobot**: HTTP monitor en `GET /api/health` cada 60 segundos → alerta a correo si cae
- **pg_dump diario**: script cron en Railway que exporta la BD y sube a S3 o Google Drive
- **Retención**: 30 días de backups
- **Logs**: Winston en JSON estructurado; visible en Railway dashboard

---

## 16. Sistema de Planes y Actividades

Este es el módulo más complejo del sistema y requiere comprensión especial.

### Jerarquía de entidades

```
Plan "Plan Romántico 2 noches"
├── Precio base: $580.000 COP (por grupo)
├── Actividades BASE (siempre incluidas, inmutables al reservar):
│   ├── Desayuno para 2 personas (incluido en precio)
│   ├── Tour por el río 2h (incluido)
│   └── Botella de vino de bienvenida (incluido)
└── Actividades OPCIONALES disponibles para este plan:
    ├── Cena romántica a la orilla del río (+$120.000 — por grupo) ← default: NO
    ├── Masaje relajante (+$80.000 — por persona) ← default: NO
    └── Paseo en cuatrimoto 1h (+$60.000 — por persona) ← default: NO
```

### Reglas de negocio críticas

1. **Inmutabilidad del snapshot**: Cuando una reserva se crea con un plan, las actividades base de ese plan se copian a `reservation_activity_snapshot`. Esta copia **nunca cambia**, aunque el administrador modifique el plan después.

2. **Precios congelados**: Las actividades opcionales elegidas en una reserva guardan `price_snapshot` — el precio al momento de la reserva, no el precio actual del catálogo.

3. **El cliente no puede quitar actividades base**: Solo puede agregar opcionales. Las base son fijas.

4. **El administrador puede modificar planes**: Puede agregar/quitar actividades base de un plan en cualquier momento. Las reservas ya confirmadas NO se ven afectadas (tienen su snapshot). Las reservas PENDING sí verán los cambios si se recargan.

5. **Advertencia de impacto**: Al eliminar una actividad base, el API devuelve cuántas reservas futuras CONFIRMED tienen esa actividad en su snapshot. El portal admin muestra esta advertencia antes de confirmar.

### Flujo de cálculo del precio total

```
Precio total de una reserva =
  plan.base_price
  + SUM(plan_activities WHERE extra_cost > 0)  -- actividades base con costo adicional
  + SUM(opcional.price * quantity FOR EACH opcional elegido)
  × temporada_multiplicador (si aplica)
```

---

## 17. Sistema de Gestión de Medios (CMS)

### Cómo funciona

```
1. Admin sube archivo → POST /api/v1/media/upload (multipart/form-data)
2. API valida: tipo (jpg/png/webp/mp4/mov), tamaño (img ≤10MB, video ≤200MB)
3. Si es imagen: Sharp genera thumbnail automático (800px wide, calidad 75%)
4. Archivo se sube al almacenamiento externo (S3/Cloudinary/Railway Volumes)
5. Se registra en media_library: { filename, original_url, thumbnail_url, file_type, size }
6. Admin puede asociar el archivo a: una habitación, un plan, la galería general, el hero del sitio
7. La landing y el portal leen las URLs desde el API — nunca acceden directamente al storage
```

### Tipos de contenido del CMS

| Sección | Clave | Tipo | Descripción |
|---------|-------|------|-------------|
| `hero` | `title` | text | Título principal del hotel |
| `hero` | `subtitle` | text | Subtítulo / tagline |
| `hero` | `cta_text` | text | Texto del botón principal |
| `hero` | `background_image_url` | image_url | Imagen de fondo del banner |
| `about` | `description` | richtext | Descripción del hotel |
| `contact` | `phone` | text | Teléfono de contacto |
| `contact` | `whatsapp` | text | Número de WhatsApp con código país |
| `contact` | `email` | text | Correo de contacto |
| `contact` | `address` | text | Dirección completa |
| `contact` | `maps_embed_url` | text | URL del embed de Google Maps |
| `contact` | `instagram` | text | URL del perfil de Instagram |
| `contact` | `facebook` | text | URL del perfil de Facebook |
| `gallery` | `images` | list_json | Array de media_id de la galería general |

---

## 18. Flujo Completo de una Reserva

### Desde WhatsApp (vía Agente IA)

```
Cliente: "Hola, quiero info para el puente del 19 de abril, somos 2"
→ Sofia invoca [consultar_disponibilidad] { fecha_inicio: '2026-04-19', fecha_fin: '2026-04-20', num_personas: 2 }
→ API: check_availability → hay 2 planes disponibles
→ Sofia: "Tenemos disponible: Plan Romántico ($580.000) y Plan Familiar ($420.000). ¿Cuál te interesa?"

Cliente: "El romántico"
→ Sofia invoca [obtener_precios_planes] para mostrar detalle del plan
→ Sofia: "El Plan Romántico incluye: desayuno, tour por el río y botella de bienvenida. 
         También puedes agregar: Cena romántica (+$120.000), Masaje (+$80.000), Cuatrimoto (+$60.000).
         ¿Deseas agregar algo?"

Cliente: "La cena romántica"
→ Sofia confirma opciones seleccionadas

→ Sofia: "Perfecto. Para completar la reserva necesito tus datos.
         ¿Me das tu nombre completo?"

[...recopila nombre, cédula, correo, adultos, niños...]

Sofia: "Resumen: Plan Romántico 2 noches, 2 adultos, Cena romántica.
       Total: $700.000 COP. ¿Confirmas?"

Cliente: "Sí"
→ Sofia invoca [crear_reserva] {
    nombre_cliente: "María Claudia Vargas",
    documento: "1234567890",
    telefono: "+573001234567",
    email: "maria@email.com",
    plan_id: "uuid-plan-romantico",
    fecha_inicio: "2026-04-19",
    fecha_fin: "2026-04-21",
    adultos: 2,
    ninos: 0,
    opcionales: [{ activity_id: "uuid-cena", quantity: 1 }]
  }
→ API:
  1. Verifica idempotency-key
  2. Transacción: check_availability FOR UPDATE SKIP LOCKED
  3. INSERT reservations (status='PENDING', total=700000)
  4. INSERT reservation_activity_snapshot (copia de actividades base)
  5. INSERT reservation_optional_activities (cena romántica, price_snapshot=120000)
  6. Responde: { reservation_number: "HT-2026-00001", total_amount: 700000 }

→ Sofia invoca [generar_link_pago] { numero_reserva: "HT-2026-00001", monto: 700000 }
→ API crea Preference MP → devuelve checkout_url

Sofia: "¡Listo! Tu reserva HT-2026-00001 está creada 🎉
       Paga aquí para confirmarla: [link de MercadoPago]
       Una vez pagues, recibirás confirmación automática."

[Cliente paga]
→ MercadoPago envía webhook → API valida HMAC → UPDATE reservations status='CONFIRMED'
```

### Desde la Landing Page (sin agente)

```
1. Cliente navega a www.[dominio].com/plan-romantico
2. Ve actividades base (no modificables) + selector de opcionales
3. Selecciona opcionales → precio total se actualiza en tiempo real
4. Completa formulario: fechas, personas, datos de contacto
5. Click "Reservar" → POST /api/v1/reservations
6. Respuesta exitosa → redirección a checkout_url de MercadoPago
7. Pago → webhook → CONFIRMED → success.html
```

---

## 19. Flujo Completo de un Pago

```
Portal Admin / Agente IA
  │
  ▼
POST /api/v1/payments/create
  │  { reservation_id, amount }
  │  Headers: Authorization: Bearer [AGENT/ADMIN token]
  │           Idempotency-Key: SHA256(reservation_id + amount + 'COP')
  │
  ├── Verificar idempotency_key → si existe y no expiró: replay sin llamar MP
  │
  ├── Llamar MercadoPago SDK → Preference.create({ items, back_urls, notification_url })
  │
  ├── INSERT payment_attempts { idempotency_key, preference_id, checkout_url }
  │
  └── Responder: { preference_id, checkout_url }

Cliente paga en MercadoPago (Checkout Pro)
  │
  ▼
MercadoPago → POST /api/v1/payments/webhook
  │  Headers: x-signature, x-request-id
  │  Query: data.id (payment ID), ts
  │
  ├── Responder 200 OK INMEDIATO
  │
  ├── Validar firma HMAC-SHA256
  ├── Verificar que payment_id no está en tabla payments (deduplicación)
  ├── GET payment en MP API → obtener status real
  │
  └── knex.transaction():
      ├── UPDATE reservations SET status = 'CONFIRMED' WHERE id = external_reference
      ├── INSERT payments { amount, external_id, status='confirmed', confirmed_at }
      └── INSERT audit_logs

Reserva confirma → cliente recibe notificación (opcional: WhatsApp via n8n)
```

---

## 20. Variables de Entorno

### Backend (Railway — producción)

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/hotel  # Railway la inyecta automáticamente

# Autenticación
JWT_SECRET=64-char-random-string  # openssl rand -hex 32
JWT_REFRESH_SECRET=otro-64-char-random
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MercadoPago
MP_ACCESS_TOKEN=APP_USR-[production token]
MP_PUBLIC_KEY=APP_USR-[public key]
MP_WEBHOOK_SECRET=[webhook signature secret de MP]

# Almacenamiento de archivos (elegir uno)
STORAGE_PROVIDER=s3  # 's3' | 'cloudinary' | 'local'
AWS_BUCKET_NAME=hotel-media
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[key]
AWS_SECRET_ACCESS_KEY=[secret]
CLOUDINARY_URL=cloudinary://[api_key]:[api_secret]@[cloud_name]  # si se usa Cloudinary

# URLs del sistema
API_URL=https://api.[dominio].com
LANDING_URL=https://www.[dominio].com
CORS_ORIGINS=https://www.[dominio].com,https://portal.[dominio].com

# Correo (para reset de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[correo]
SMTP_PASS=[contraseña de app]
SMTP_FROM="Hotel [Nombre] <noreply@[dominio].com>"

# App
PORT=3000
NODE_ENV=production
```

### n8n Cloud (variables de entorno del workspace)

```env
BACKEND_BASE_URL=https://api.[dominio].com/api/v1
BACKEND_JWT_TOKEN=[JWT de usuario con rol AGENT]
MCP_BEARER_TOKEN=[token secreto para autenticar el MCP Server]
OPENAI_API_KEY=sk-proj-[openai key]
WHATSAPP_PHONE_ID=[phone number ID de Meta]
WHATSAPP_TOKEN=[System User permanent token de Meta]
WHATSAPP_VERIFY_TOKEN=[token de verificación del webhook]
MCP_SERVER_URL=https://[instancia].n8n.cloud/mcp/hotel-mcp/sse
```

### Angular Portal (Vercel — environment.prod.ts)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.[dominio].com/api/v1',
};
```

---

## 21. Fases MVP y Criterios de Aceptación

### MVP FASE 0 — Fundación (fin Semana 2)
**Criterio**: El sistema puede autenticar usuarios y consultar disponibilidad en tiempo real.
- ✅ BD con 19 tablas, índices, triggers y mecanismo de idempotencia
- ✅ Auth: login, refresh, logout, RBAC por rol
- ✅ GET /availability retorna disponibilidad real con `SELECT FOR UPDATE`

### MVP FASE 1 — Núcleo del negocio (fin Semana 4)
**Criterio**: Es posible crear, consultar, modificar y cancelar una reserva con plan y actividades opcionales.
- ✅ CRUD habitaciones, planes, actividades base y catálogo de opcionales
- ✅ POST /reservations crea reserva con snapshot inmutable de actividades base
- ✅ Opcionales elegidas se guardan con precio_snapshot
- ✅ Inventario: ítems, movimientos, alertas de stock bajo

### MVP FASE 2 — Cobros en línea (fin Semana 5)
**Criterio**: El sistema puede generar un link de pago y confirmar la reserva automáticamente al recibir el webhook.
- ✅ POST /payments/create genera Preference en MercadoPago
- ✅ Webhook validado con HMAC-SHA256 actualiza reserva a CONFIRMED
- ✅ PSE funcional via MercadoPago
- ✅ Biblioteca de medios y CMS operativos

### MVP FASE 3 — Portal admin completo (fin Semana 8)
**Criterio**: El equipo del hotel puede operar el negocio completo desde el portal Angular.
- ✅ Todos los módulos del portal: habitaciones, planes, reservas, inventario, CMS, reportes, config
- ✅ Gestión visual de planes con actividades base y opcionales
- ✅ Landing page estructurada y consumiendo el API

### MVP FASE 4 — Sitio público en línea (fin Semana 9)
**Criterio**: Un cliente puede reservar un plan con actividades opcionales desde la landing y pagar.
- ✅ Landing completa con todas las secciones
- ✅ Página de detalle de plan con selector de opcionales y cálculo de precio en tiempo real
- ✅ MCP Server activo con las 8 herramientas

### MVP FASE 5 — Sistema completo en producción (fin Semana 10)
**Criterio**: El agente IA atiende clientes por WhatsApp y puede gestionar planes con opcionales de principio a fin.
- ✅ Agente Sofia activo en WhatsApp: consulta, reserva con opcionales, pago, cancelación
- ✅ Sistema en producción: Railway + Vercel + Netlify + n8n Cloud
- ✅ Monitoreo activo + backups diarios
- ✅ Equipo del hotel capacitado

---

## 22. Resumen del Plan de Trabajo

| Semana | Componentes | Actividades clave |
|--------|------------|-------------------|
| S1 | C1 + C2 inicio | 19 entidades modeladas, 10 migraciones, idempotencia, proyecto Node.js |
| S2 | C1 + C2 | Concurrencia, triggers, Auth JWT+RBAC, disponibilidad completa |
| S3 | C2 | Habitaciones, planes, actividades base, catálogo opcionales, inicio reservas |
| S4 | C2 | Reservas completas con snapshot, inventario, usuarios, reportes, Swagger |
| S5 | C2 + C3 | MercadoPago SDK, webhooks HMAC, PSE, biblioteca de medios, CMS |
| S6 | C4 | Setup Angular, login, layout, dashboard, habitaciones, calendario |
| S7 | C4 | Reservas portal, planes con actividades, inventario, reportes |
| S8 | C4 + C5 inicio | CMS media, contenido sitio, config, usuarios + landing structure |
| S9 | C5 + C6 | Landing completa, widget chat, 8 tools MCP activas |
| S10 | C7 + C8 | Agente WhatsApp, pruebas e2e, Docker, Railway, Vercel, monitoreo |

### Distribución de horas

| Componente | Horas | % | Valor COP |
|-----------|-------|---|-----------|
| C1 — Base de datos | 25h | 10% | $2.000.000 |
| C2 — API Node.js | 85h | 34% | $6.800.000 |
| C3 — MercadoPago | 15h | 6% | $1.200.000 |
| C4 — Angular Portal | 65h | 26% | $5.200.000 |
| C5 — Landing + Widget | 20h | 8% | $1.600.000 |
| C6 — MCP Server | 15h | 6% | $1.200.000 |
| C7 — Agente WhatsApp | 15h | 6% | $1.200.000 |
| C8 — DevOps | 10h | 4% | $800.000 |
| **TOTAL** | **250h** | **100%** | **$20.000.000 COP** |

### Hitos de pago (4 cuotas iguales)

| Cuota | Momento | Hito entregado | Monto |
|-------|---------|----------------|-------|
| 1/4 | Inicio del proyecto | Firma del contrato | $5.000.000 |
| 2/4 | Fin Semana 5 | MVP Fase 2 — API completa + pagos | $5.000.000 |
| 3/4 | Fin Semana 8 | MVP Fase 3 — Portal admin completo | $5.000.000 |
| 4/4 | Fin Semana 10 | MVP Fase 5 — Sistema en producción | $5.000.000 |

---

## Activos requeridos al cliente

| Prioridad | Activo | Formato | Para cuándo |
|-----------|--------|---------|-------------|
| 🔴 Bloqueante | Logo del hotel | SVG + PNG fondo transparente, min 1000px | Semana 1 |
| 🔴 Bloqueante | Paleta de colores | Códigos HEX | Semana 1 |
| 🔴 Bloqueante | Dominio registrado | `.com` o `.com.co` | Semana 1 |
| 🔴 Bloqueante | Razón social y NIT | — | Semana 1 |
| 🟠 Urgente | Fotos de habitaciones y espacios | JPG/PNG, min 1500px, 5+ por espacio | Semana 2 |
| 🟠 Urgente | Lista de servicios y precios | — | Semana 2 |
| 🟠 Urgente | Políticas de cancelación | — | Semana 3 |
| 🟠 Urgente | FAQs del negocio | — | Semana 3 |
| 🟢 Normal | Video del hotel | MP4, max 200MB o link YouTube | Semana 5 |
| 🟢 Normal | Credenciales MercadoPago | Access token + public key (producción) | Semana 5 |
| 🟢 Normal | Cuenta WhatsApp Business verificada | Con acceso Meta Business Manager | Semana 8 |

---

*Hector Fabian Rodriguez · Principal Software Architect & AI Systems*
*Bogotá, Colombia · Abril 2026 · v1.0*
