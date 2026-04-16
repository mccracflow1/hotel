# Plan de Trabajo — Plataforma Hotelera IA
## Día a Día · Semana a Semana · Fases MVP

> **250 horas · 10 semanas · 5 horas/día · $80.000 COP/hora · Total: $20.000.000 COP**

---

## Leyenda de Componentes

| Código | Componente | Stack | Horas |
|--------|-----------|-------|-------|
| **C1** | Base de Datos | PostgreSQL + Knex | 25h |
| **C2** | API Backend | Node.js + Express | 85h |
| **C3** | Módulo de Pagos | MercadoPago SDK | 15h |
| **C4** | Portal de Administración | Angular 17+ | 65h |
| **C5** | Landing Page + Widget IA | HTML / Tailwind / JS | 20h |
| **C6** | MCP Server | n8n Cloud | 15h |
| **C7** | Agente IA WhatsApp | n8n + GPT-4o-mini | 15h |
| **C8** | DevOps y Despliegue | Docker + Railway | 10h |
| | **TOTAL** | | **250h — $20.000.000 COP** |

---

## Resumen Semanal

| Sem. | Fase | Foco principal | Componentes | Entregable clave |
|------|------|----------------|-------------|-----------------|
| S1 | FASE 0 | Diseño del modelo de datos y cimientos del proyecto | C1 · C2 | BD completa + proyecto Node.js configurado |
| S2 | FASE 0 | Autenticación JWT, RBAC y módulo de disponibilidad | C1 · C2 | Login funcional + consulta de disponibilidad |
| S3 | FASE 1 | Habitaciones, planes y actividades base/opcionales | C2 | CRUD de habitaciones, planes y actividades listo |
| S4 | FASE 1 | Reservas completas + inventario + usuarios | C2 | Sistema de reservas funcional de extremo a extremo |
| S5 | FASE 2 | Pagos MercadoPago + biblioteca de medios + CMS | C2 · C3 | Cobros en línea activos + gestión de archivos |
| S6 | FASE 3 | Portal Angular — auth, dashboard, habitaciones, disponibilidad | C4 | Portal admin parcial: primeras 4 secciones |
| S7 | FASE 3 | Portal Angular — reservas, planes y opcionales | C4 | Portal admin: reservas y planes con actividades |
| S8 | FASE 3 → 4 | Portal completo + inicio landing page | C4 · C5 | Portal admin completo + landing estructurada |
| S9 | FASE 4 | Landing completa + MCP Server activo | C5 · C6 | Sitio público en línea + 8 herramientas MCP |
| S10 | FASE 5 | Agente IA WhatsApp + DevOps + entrega final | C7 · C8 | Sistema completo en producción |

---

## Plan Día a Día

---

### SEMANA 1 — Diseño del Modelo de Datos y Cimientos del Proyecto
*MVP Fase 0 en curso*

---

#### Día 1 · Lunes — `C1` Diseño del Modelo de Datos

- Modelar las 19 entidades del sistema y sus relaciones
- Diagrama entidad-relación: users, roles, rooms, services, plans, activities
- Definir tipos de dato, restricciones y valores por defecto de cada campo
- Diseñar las relaciones para planes: `plan_activities` + `optional_activities` + `plan_optional_activities`
- Documentar el diagrama en el repositorio como punto de referencia del equipo

**5h · Semana 1**

---

#### Día 2 · Martes — `C1` Migraciones de la Base de Datos — Parte 1

- Configurar Knex.js con conexión a PostgreSQL y variables de entorno
- Migración 001: `users` + `roles` (con datos semilla: SUPER_ADMIN, ADMIN, BUSINESS, VIEWER)
- Migración 002: `rooms` + `services` + `room_media`
- Migración 003: `plans` + `plan_activities` + `optional_activities` + `plan_optional_activities`
- Verificar que las migraciones `up/down` funcionan correctamente

**5h · Semana 1**

---

#### Día 3 · Miércoles — `C1` Migraciones de la Base de Datos — Parte 2

- Migración 004: `availability` (cupos por fecha/servicio/plan, bloqueos, temporadas)
- Migración 005: `reservations` (estados ENUM, campo `version` para bloqueo optimista)
- Migración 006: `reservation_activity_snapshot` + `reservation_optional_activities`
- Migración 007: `payments` + `payment_attempts` + `idempotency_keys`
- Migración 008: `inventory_items` + `inventory_movements` + `suppliers`

**5h · Semana 1**

---

#### Día 4 · Jueves — `C1` Migraciones Parte 3 + Mecanismo de Idempotencia

- Migración 009: `media_library` (biblioteca central de archivos)
- Migración 010: `site_content` + `faqs` + `business_config` + `audit_logs`
- Crear índices compuestos críticos: `(room_id, date_start, date_end, status)` en `reservations`
- Implementar tabla `idempotency_keys` con TTL 24h e índice parcial `WHERE expires_at > NOW()`
- Configurar `pg_cron` para limpieza automática de claves expiradas cada hora

**5h · Semana 1**

---

#### Día 5 · Viernes — `C2` Setup del Proyecto Node.js

- Inicializar proyecto Node.js 20 LTS con ESM modules y estructura de carpetas
- Instalar y configurar Express 5, Knex.js, dotenv, Joi, Winston
- Crear estructura modular: `/modules/{auth,rooms,plans,reservations,payments,inventory,cms,users,reports}`
- Configurar archivos de entorno (`.env.dev`, `.env.prod`) con todas las variables requeridas
- Crear middleware centralizado de manejo de errores y clases personalizadas (`AppError`, `ConflictError`, `NotFoundError`)

**5h · Semana 1**

---

### SEMANA 2 — Autenticación, RBAC y Módulo de Disponibilidad
*MVP Fase 0 en curso*

---

#### Día 6 · Lunes — `C1` Concurrencia, Triggers de Auditoría e Índices

- Implementar función PL/pgSQL `check_availability(room_id, plan_id, date_start, date_end)` con `SELECT FOR UPDATE SKIP LOCKED`
- Crear trigger `log_changes()` para `audit_logs` en `INSERT/UPDATE/DELETE` de tablas críticas
- Crear índice parcial en `reservations WHERE status IN ('PENDING','CONFIRMED')`
- Configurar `pg_stat_statements` y ejecutar `EXPLAIN ANALYZE` en los 5 queries más frecuentes
- Crear wrapper de transacciones reutilizable en el repositorio base de Knex

**5h · Semana 2**

---

#### Día 7 · Martes — `C2` Autenticación JWT — Login, Logout y Seguridad

- Implementar `POST /auth/login`: validar con Joi, `bcrypt.compare()`, generar access token 15min
- Generar refresh token 7 días, almacenarlo en BD, enviarlo en `httpOnly cookie`
- Implementar `POST /auth/logout`: invalidar refresh token en BD
- Implementar `POST /auth/forgot-password`: generar token temporal y enviar correo
- Aplicar rate limiting a `/auth/*`: máximo 5 intentos fallidos por IP, bloqueo 15min

**5h · Semana 2**

---

#### Día 8 · Miércoles — `C2` Autenticación — Refresh Tokens y RBAC

- Implementar `POST /auth/refresh`: validar refresh token, rotar y emitir nuevo access token
- Crear middleware `authGuard(roles[])`: verificar JWT, extraer payload, validar rol
- Crear middleware `idempotencyCheck`: capturar respuesta, almacenar en BD, replay en reintentos
- Configurar Swagger/OpenAPI 3.0 con `swagger-jsdoc` y `swagger-ui-express` en `/api/docs`
- Escribir pruebas manuales del flujo completo de autenticación en Postman

**5h · Semana 2**

---

#### Día 9 · Jueves — `C2` Módulo de Disponibilidad — Parte 1

- Implementar `GET /availability`: filtro por `fecha_inicio`, `fecha_fin`, `tipo_servicio`, `num_personas`
- Integrar con función `check_availability()` de PostgreSQL para consultas en tiempo real
- Implementar `GET /availability/calendar`: vista mensual por habitación/plan con % de ocupación
- Configurar caché en memoria (`node-cache`) TTL 60 segundos para la vista de calendario
- Documentar endpoints de disponibilidad en Swagger con ejemplos de request/response

**5h · Semana 2**

---

#### Día 10 · Viernes — `C2` Módulo de Disponibilidad — Parte 2 + Temporadas

- Implementar `POST /availability`: configurar cupos base por fecha y servicio (solo ADMIN)
- Implementar `POST /availability/block`: bloquear fechas con motivo (mantenimiento, evento privado)
- Implementar `POST /seasons`: configurar temporadas con rango de fechas y multiplicador de precio
- Implementar `GET /seasons`: listar temporadas activas (consumida por landing y agente IA)
- Validar que el precio calculado en reservas respeta el multiplicador de temporada vigente

**5h · Semana 2**

---

> ### 🚀 MVP FASE 0 — Fundación Lista
>
> Al finalizar la Semana 2, el sistema tiene la base de datos completamente diseñada, todas las migraciones ejecutadas, el mecanismo de idempotencia y concurrencia activos, y una API funcional con autenticación JWT+RBAC y el módulo de disponibilidad operativo.
>
> **Entregables verificables:**
> - ✅ Base de datos PostgreSQL con 19 entidades, índices y triggers de auditoría
> - ✅ API con JWT: login, refresh, logout y guards de autorización por rol
> - ✅ Módulo de disponibilidad: consulta en tiempo real y vista de calendario
> - ✅ Temporadas de precios configurables desde el API

---

### SEMANA 3 — Habitaciones, Planes y Actividades Base/Opcionales
*MVP Fase 1 en curso*

---

#### Día 11 · Lunes — `C2` Módulo de Habitaciones y Servicios — CRUD Completo

- Implementar `GET /rooms` con filtros (tipo, estado, capacidad) y paginación cursor-based
- Implementar `GET /rooms/:id` con detalle completo incluyendo media URLs
- Implementar `POST /rooms`, `PUT /rooms/:id`, `PATCH /rooms/:id/status` (activar/desactivar)
- Implementar `DELETE /rooms/:id` con soft-delete (`deleted_at`) y validación de reservas futuras
- Crear CRUD análogo para `/services` (cuatrimotos, restaurante, pasadías)

**5h · Semana 3**

---

#### Día 12 · Martes — `C2` Módulo de Planes — Estructura y CRUD Base

- Implementar `GET /plans`: lista pública (solo activos) y lista admin (todos, con filtros)
- Implementar `GET /plans/:id` con actividades base ordenadas y opcionales disponibles
- Implementar `POST /plans` y `PUT /plans/:id`: validación completa con Joi
- Implementar `POST /plans/:id/duplicate`: clonar plan con sus actividades (sin las opcionales asociadas)
- Implementar `PATCH /plans/:id/status`: activar/desactivar plan

**5h · Semana 3**

---

#### Día 13 · Miércoles — `C2` Módulo de Planes — Actividades Base

- Implementar `POST /plans/:id/activities`: agregar actividad base con nombre, descripción, costo adicional, orden
- Implementar `PUT /plans/:id/activities/:actId`: editar actividad base
- Implementar `DELETE /plans/:id/activities/:actId`: eliminar con advertencia si hay reservas futuras
- Implementar `PUT /plans/:id/activities/reorder`: actualizar campo `sort_order` en lote
- Lógica de advertencia: contar reservas futuras CONFIRMED que usan ese plan y devolver el número

**5h · Semana 3**

---

#### Día 14 · Jueves — `C2` Módulo de Planes — Catálogo de Actividades Opcionales

- Implementar CRUD completo de `/optional-activities`: catálogo global del hotel
- Implementar `POST /plans/:id/optional-activities/:actId`: asociar actividad opcional a un plan
- Implementar `DELETE /plans/:id/optional-activities/:actId`: desasociar
- Implementar `PATCH /plans/:id/optional-activities/:actId`: marcar como default (pre-seleccionada)
- Validación: `GET /plans/:id` debe devolver opcionales ordenadas por default primero, luego por nombre

**5h · Semana 3**

---

#### Día 15 · Viernes — `C2` Módulo de Reservas — Creación con Transacción Completa

- Implementar `POST /reservations`: validación Joi, verificar `idempotency-key` header
- Dentro de transacción Knex: llamar `check_availability FOR UPDATE SKIP LOCKED`
- Si disponible: `INSERT reservation` (status=PENDING) + `INSERT reservation_activity_snapshot` (copia de actividades base del plan)
- Registrar actividades opcionales elegidas en `reservation_optional_activities` con `precio_snapshot`
- Generar número de reserva único (`HT-2026-XXXXX`) y devolver en respuesta

**5h · Semana 3**

---

### SEMANA 4 — Reservas Completas + Inventario + Usuarios
*MVP Fase 1 en curso*

---

#### Día 16 · Lunes — `C2` Módulo de Reservas — Consulta y Ciclo de Estado

- Implementar `GET /reservations`: lista con filtros (status, fecha, habitación/plan, cliente) y paginación
- Implementar `GET /reservations/:id`: detalle completo con snapshot de actividades y estado de pago
- Implementar `GET /reservations/:numero_reserva`: búsqueda por número legible (para agente IA)
- Implementar `PATCH /reservations/:id/status`: confirmar manualmente (ADMIN)
- Exponer `GET /reservations/:id/policy`: calcular penalidad de cancelación según horas de anticipación

**5h · Semana 4**

---

#### Día 17 · Martes — `C2` Módulo de Reservas — Modificación, Cancelación y Actividades Extra

- Implementar `PUT /reservations/:id`: modificar fechas con validación previa de disponibilidad en nuevas fechas
- Implementar `DELETE /reservations/:id`: cancelar con motivo, aplicar política de penalidad, actualizar estado
- Implementar `POST /reservations/:id/optional-activities`: agregar actividad opcional (solo si pertenece al plan)
- Validar que no es posible eliminar actividades base de una reserva ya existente bajo ninguna circunstancia
- Registrar cada cambio de estado en `audit_logs` con usuario responsable

**5h · Semana 4**

---

#### Día 18 · Miércoles — `C2` Módulo de Inventario Completo

- Implementar CRUD `/inventory/items`: nombre, categoría, unidad, `stock_actual`, `stock_mínimo`, proveedor
- Implementar `POST /inventory/movements`: entrada/salida con actualización automática de `stock_actual`
- Implementar `GET /inventory/alerts`: items donde `stock_actual < stock_mínimo`
- Implementar `GET /inventory/items/:id/history`: historial de movimientos con filtros de tipo y fecha
- Implementar CRUD completo de `/suppliers` con asociación a `inventory_items`

**5h · Semana 4**

---

#### Día 19 · Jueves — `C2` Módulo de Usuarios y Configuración del Negocio

- Implementar CRUD `/users`: crear, listar, actualizar, activar/desactivar (solo ADMIN)
- Implementar `POST /users/:id/reset-password`: generar token temporal y enviar correo
- Implementar `PATCH /users/me/profile`: actualizar nombre, foto y contraseña propia
- Implementar `GET/PUT /business-config`: configuración general, políticas de cancelación, horarios
- Implementar `GET/POST /seasons`: gestión de temporadas de precios desde el admin

**5h · Semana 4**

---

#### Día 20 · Viernes — `C2` Módulo de Reportes + Swagger Completo

- Implementar `GET /reports/occupancy`: tasa de ocupación por periodo con `GROUP BY date_trunc`
- Implementar `GET /reports/revenue`: ingresos por método de pago y tipo de servicio
- Implementar `GET /reports/reservations`: detalle filtrable, formato exportable
- Implementar `GET /reports/inventory`: movimientos con saldo apertura/cierre por ítem y periodo
- Completar documentación Swagger de todos los endpoints implementados con ejemplos reales

**5h · Semana 4**

---

> ### 🚀 MVP FASE 1 — Núcleo del Negocio Completo
>
> Al finalizar la Semana 4, es posible gestionar habitaciones, crear planes con actividades base inmutables, agregar actividades opcionales al catálogo, crear reservas con snapshot completo y gestionar inventario.
>
> **Entregables verificables:**
> - ✅ CRUD completo de habitaciones y servicios con gestión de medios
> - ✅ CRUD de planes con actividades base (inmutables en reservas) y catálogo de opcionales
> - ✅ Sistema de reservas: crear, consultar, modificar fechas, cancelar con política, agregar opcionales
> - ✅ Inventario: ítems, movimientos, alertas de stock bajo, proveedores
> - ✅ Módulo de usuarios y configuración del negocio (políticas, temporadas, datos generales)

---

### SEMANA 5 — Pagos MercadoPago + Biblioteca de Medios + CMS
*MVP Fase 2 en curso*

---

#### Día 21 · Lunes — `C3` Integración MercadoPago — SDK y Creación de Preferencia

- Instalar `@mercadopago/sdk-node` y configurar con `access_token` desde `business_config`
- Implementar `POST /payments/create`: recibir `reservation_id` + monto, crear Preference MP
- Configurar `items[]`, `back_urls` (success/failure/pending) y `notification_url` en la Preference
- Almacenar `preference_id` y `checkout_url` en `payment_attempts` con `idempotency-key`
- Probar creación de Preference en sandbox de MercadoPago con tarjeta de prueba

**5h · Semana 5**

---

#### Día 22 · Martes — `C3` Webhook MercadoPago — Validación y Actualización de Estado

- Implementar `POST /payments/webhook`: responder 200 OK inmediato (antes de procesar)
- Validar firma HMAC-SHA256 del header `x-signature` usando `MP_WEBHOOK_SECRET`
- Deduplicación: verificar si el `payment_id` ya fue procesado en tabla `payments` antes de actuar
- En transacción: actualizar reserva a CONFIRMED/CANCELLED según status de MP + INSERT en `payments`
- Registrar en `audit_logs` el evento de confirmación con referencia a la reserva

**5h · Semana 5**

---

#### Día 23 · Miércoles — `C3` Flujo PSE + Idempotencia de Pagos

- Configurar flujo PSE nativo vía MercadoPago (`payment_method_id=pse`, `payment_type_id=bank_transfer`)
- Implementar idempotencia de pagos: `SHA256(reservation_id + amount)` como clave única de intento
- Lógica de prevención de doble cobro: verificar `payment_attempts` antes de llamar a la API de MP
- Implementar reintentos con backoff exponencial (1s, 2s, 4s) en caso de timeout del webhook
- Implementar `GET /payments/reconciliation`: comparar `payment_attempts` en BD vs estado real en MP API

**5h · Semana 5**

---

#### Día 24 · Jueves — `C2` Módulo de Medios (CMS Media Library)

- Implementar `POST /media/upload`: recibir archivo (multer), validar tipo y tamaño (imagen ≤10MB, video ≤200MB)
- Generar thumbnail automático de cada imagen subida (Sharp) y almacenar URL reducida
- Almacenar archivos en servicio externo (S3, Cloudinary o Railway Volumes) y registrar en `media_library`
- Implementar `GET /media`: listar biblioteca con búsqueda por nombre y filtro por tipo
- Implementar `DELETE /media/:id`: eliminar archivo del almacenamiento y registro en BD (validar si está en uso)

**5h · Semana 5**

---

#### Día 25 · Viernes — `C2` CMS de Contenido del Sitio y FAQs

- Implementar `GET/PUT /site-content/:section`: gestionar hero, textos, datos de contacto como clave-valor
- Implementar CRUD `/faqs`: crear, editar, eliminar y reordenar preguntas frecuentes
- Implementar `GET /site-content/public`: endpoint público (sin autenticación) con todo el contenido editable para la landing
- Implementar asociación de medios a habitaciones, planes y galería: `POST /rooms/:id/media`, `POST /plans/:id/media`
- Probar ciclo completo: subir imagen → asociar a habitación → verificar URL en `GET /rooms/:id`

**5h · Semana 5**

---

> ### 🚀 MVP FASE 2 — Cobros en Línea Activos
>
> Al finalizar la Semana 5, el sistema puede procesar pagos reales con MercadoPago y PSE. La biblioteca de medios y el CMS están operativos.
>
> **Entregables verificables:**
> - ✅ Pagos con MercadoPago Checkout Pro y PSE funcionando en sandbox y producción
> - ✅ Webhooks de confirmación con validación HMAC-SHA256 y deduplicación de eventos
> - ✅ Reconciliación automática de pagos: detectar diferencias entre BD y API de MP
> - ✅ Biblioteca de medios: subida de imágenes/videos, thumbnails automáticos, gestión de archivos
> - ✅ CMS: contenido editable de la landing (hero, textos, FAQ, contacto) consumible desde el API

---

### SEMANA 6 — Portal Angular — Fundamentos y Primeros Módulos
*MVP Fase 3 en curso*

---

#### Día 26 · Lunes — `C4` Setup Angular — Arquitectura, Autenticación y Layout

- Inicializar proyecto Angular 17+ con standalone components, lazy loading y Angular Material
- Configurar tema personalizado de Angular Material con colores de la marca del hotel
- Implementar `AuthService`: login, logout, almacenamiento de tokens en memoria (no localStorage)
- Crear `AuthInterceptor`: adjuntar Bearer token, capturar 401 y ejecutar refresh automático
- Crear `AuthGuard` + `RoleGuard` para proteger rutas por rol

**5h · Semana 6**

---

#### Día 27 · Martes — `C4` Layout Principal y Módulo de Login

- Construir pantalla de login: formulario reactivo, validación, manejo de errores, redirección post-login
- Construir layout principal: sidebar colapsable con íconos, topbar con perfil y logout, área de contenido
- Implementar navegación dinámica en el sidebar según el rol del usuario autenticado
- Crear componentes reutilizables: `DataTable`, `ConfirmDialog`, `ToastNotification`, `LoadingSpinner`
- Configurar lazy loading de módulos por sección del portal

**5h · Semana 6**

---

#### Día 28 · Miércoles — `C4` Dashboard — KPIs, Gráficas y Alertas

- Construir 4 KPI cards: reservas del día, ocupación %, ingresos del mes, alertas de stock
- Integrar Chart.js: gráfica de barras con ocupación de los últimos 7 días diferenciada por tipo
- Construir lista de próximas 10 reservas: cliente, servicio, fechas, estado de pago
- Configurar polling automático cada 30 segundos para actualizar KPIs sin recargar la página
- Implementar skeleton loaders mientras los datos están cargando

**5h · Semana 6**

---

#### Día 29 · Jueves — `C4` Módulo de Habitaciones — Lista, CRUD y Galería

- Construir listado con tabla paginada server-side, búsqueda y filtros de tipo/estado
- Construir formulario de creación/edición: nombre, tipo, capacidad, precio, descripción
- Implementar subida de fotos: input de archivo con preview, reordenamiento drag-and-drop, foto principal
- Implementar gestión de amenidades como chips: agregar y quitar etiquetas de comodidades
- Implementar toggle de activar/desactivar con confirmación y feedback visual

**5h · Semana 6**

---

#### Día 30 · Viernes — `C4` Módulo de Disponibilidad — Calendario Interactivo

- Construir calendario mensual con CSS Grid: 7 columnas, celdas con color según % de ocupación (verde/amarillo/rojo)
- Al hacer clic en celda: abrir panel lateral con detalle de disponibilidad del día por habitación/plan
- Implementar formulario de bloqueo de fechas: selección de rango, motivo y confirmación
- Implementar selector de temporadas con DateRangePicker: configurar multiplicador de precio
- Navegación de meses: flechas anterior/siguiente + selector de mes/año directo

**5h · Semana 6**

---

### SEMANA 7 — Portal Angular — Reservas, Planes y Opcionales
*MVP Fase 3 en curso*

---

#### Día 31 · Lunes — `C4` Módulo de Reservas — Listado y Filtros Avanzados

- Construir tabla con filtros avanzados: estado (chips), rango de fechas, habitación/plan, texto libre
- Columnas: número, cliente, servicio, fechas, personas, monto, estado, estado de pago
- Construir panel lateral de detalle: datos del cliente, actividades base del snapshot, opcionales elegidas, historial de estados
- Implementar exportación del listado filtrado a Excel y CSV
- Implementar búsqueda rápida por número de reserva o nombre de cliente

**5h · Semana 7**

---

#### Día 32 · Martes — `C4` Módulo de Reservas — Acciones y Creación Manual

- Implementar acciones: confirmar, cancelar (con modal de política y penalidad), modificar fechas
- Implementar acción "Generar link de pago": invocar API de MP y mostrar link copiable
- Implementar acción "Agregar actividad opcional": selector de opcionales disponibles del plan con precio
- Construir formulario de creación manual de reserva (clientes que llaman por teléfono)
- Mostrar badge de estado de pago con colores: sin pago (gris), pendiente (amarillo), pagado (verde)

**5h · Semana 7**

---

#### Día 33 · Miércoles — `C4` Módulo de Planes — CRUD y Actividades Base

- Construir listado de planes con toggle activo/inactivo, foto de portada, precio y conteo de actividades
- Construir formulario de plan: todos los campos + subida de foto de portada + galería de fotos
- Sub-sección "Actividades incluidas": lista ordenable drag-and-drop, agregar/editar/eliminar
- Implementar advertencia al eliminar actividad base: mostrar cuántas reservas futuras se verán afectadas
- Implementar botón "Duplicar plan" con confirmación

**5h · Semana 7**

---

#### Día 34 · Jueves — `C4` Módulo de Planes — Actividades Opcionales

- Construir CRUD del catálogo global de actividades opcionales del hotel
- Sub-sección "Actividades opcionales disponibles": selector multi-select del catálogo global dentro del formulario de plan
- Implementar toggle "Pre-seleccionada" por actividad opcional dentro de cada plan
- Previsualización del precio total: precio base del plan + opcionales seleccionadas en tiempo real
- Validación: impedir desactivar una actividad opcional que tenga reservas futuras que la incluyen

**5h · Semana 7**

---

#### Día 35 · Viernes — `C4` Módulo de Inventario + Reportes

- Construir módulo de inventario: lista con badge de alerta de stock, CRUD de ítems, CRUD de proveedores
- Construir formulario de movimiento (entrada/salida) con autocompletado de ítem y notas
- Construir módulo de reportes: DateRangePicker, gráfica de ocupación (barras apiladas), gráfica de ingresos (pie)
- Implementar exportación de reportes a Excel con `exceljs` y a PDF con `jsPDF + autoTable`
- Construir reporte de planes: reservas por plan, actividades opcionales más elegidas, ingreso promedio

**5h · Semana 7**

---

### SEMANA 8 — Portal Admin Completo + Inicio Landing Page
*MVP Fase 3 → 4*

---

#### Día 36 · Lunes — `C4` Módulo de CMS — Biblioteca de Medios

- Construir biblioteca de medios: cuadrícula de imágenes/videos con búsqueda y filtro por tipo
- Implementar drag-and-drop de archivos o clic para subir con barra de progreso
- Vista previa de imágenes y reproductor de video embebido dentro de la biblioteca
- Selector de medios reutilizable: al subir fotos en habitaciones/planes, abrir la biblioteca
- Acciones: renombrar, eliminar (con validación de si está en uso), copiar URL pública

**5h · Semana 8**

---

#### Día 37 · Martes — `C4` Módulo de CMS — Contenido del Sitio y FAQs

- Construir formulario de hero: título, subtítulo, CTA + upload de imagen de fondo
- Construir formulario de datos de contacto: teléfono, WhatsApp, correo, dirección, horarios, redes
- Construir gestor de FAQs: lista ordenable drag-and-drop, formulario de agregar/editar, toggle activo
- Implementar previsualización de cómo quedaría el contenido en la landing antes de guardar
- Construir galería general del hotel: cuadrícula con reordenamiento y subida múltiple

**5h · Semana 8**

---

#### Día 38 · Miércoles — `C4` Módulo de Usuarios y Configuración del Negocio

- Construir listado de usuarios con rol, estado y fecha de último acceso
- Construir formulario de creación/edición de usuarios con selector de rol
- Construir pantalla de perfil propio: cambiar nombre, foto de perfil y contraseña
- Construir pantalla de configuración: datos del negocio, horarios, logo, colores, credenciales de pago
- Construir configuración de políticas de cancelación: tabla de franjas de tiempo y % de penalidad editable

**5h · Semana 8**

---

#### Día 39 · Jueves — `C5` Landing Page — Estructura y Secciones Principales

- Construir estructura HTML/Tailwind responsiva con todas las secciones: hero, servicios, planes, galería, FAQ, mapa, footer
- Implementar sección Hero: imagen desde el CMS, título dinámico, botones CTA que consumen la API pública
- Implementar sección Servicios: tarjetas de habitaciones activas con foto, nombre, capacidad y precio
- Implementar sección Planes: tarjetas de planes activos con foto de portada, descripción y lista de actividades
- Configurar meta tags Open Graph y SEO básico (title, description, image)

**5h · Semana 8**

---

#### Día 40 · Viernes — `C5` Landing Page — Galería, FAQ, Mapa y Optimización

- Implementar sección Galería: cuadrícula CSS responsiva con lightbox nativo
- Implementar sección FAQ en formato acordeón consumido del API
- Implementar sección Mapa: Google Maps Embed con la coordenada y datos de contacto del API
- Implementar Footer: logo, navegación, redes sociales (todos los datos del API)
- Optimizar imágenes: lazy loading nativo, formato WebP con fallback JPG, tamaños responsivos

**5h · Semana 8**

---

> ### 🚀 MVP FASE 3 — Portal de Administración Completo
>
> Al finalizar la Semana 8, el equipo del hotel puede operar el negocio completamente desde el portal Angular.
>
> **Entregables verificables:**
> - ✅ Portal Angular con todos los módulos: dashboard, habitaciones, disponibilidad, reservas, planes, inventario, reportes, CMS, usuarios y configuración
> - ✅ Gestión visual de planes: actividades base ordenables, catálogo global de opcionales, asociación al plan
> - ✅ Landing page estructurada y funcional con todas las secciones consumiendo el API
> - ✅ Toda la información del sitio actualizable desde el portal sin intervención técnica

---

### SEMANA 9 — Landing Completa + MCP Server Activo
*MVP Fase 4 en curso*

---

#### Día 41 · Lunes — `C5` Página de Detalle de Plan + Flujo de Reserva Web

- Construir página `www.[dominio].com/[slug-plan]`: galería, video, descripción larga, habitación vinculada
- Sección de actividades incluidas: lista visual no modificable (solo lectura para el visitante)
- Selector de actividades opcionales: checkboxes con precio, cantidad, calculadora de total en tiempo real
- Formulario de reserva: fechas, número de personas, datos del cliente con validación front-end
- Al enviar: llamar `POST /reservations` del API y redirigir a pago si hay éxito

**5h · Semana 9**

---

#### Día 42 · Martes — `C5` Widget de Chat IA + Páginas de Resultado de Pago

- Construir clase `HotelChatWidget` en JS vanilla: botón flotante, panel expandible, burbujas de mensajes
- Comunicación via `fetch()` al webhook del agente de n8n con `sessionId` en `sessionStorage`
- Renderizar Markdown básico en respuestas del bot: negrita, listas, links clicables
- Implementar CTA card de pago: cuando el bot genera reserva, mostrar tarjeta con número y botón de pagar
- Construir páginas `success.html`, `failure.html` y `pending.html` con mensaje y animación

**5h · Semana 9**

---

#### Día 43 · Miércoles — `C6` MCP Server n8n — Setup y Primeras Herramientas

- Crear workspace n8n Cloud, configurar credenciales Bearer y variable `BACKEND_BASE_URL`
- Workflow MCP Server Trigger: configurar path `/hotel-mcp`, autenticación Bearer, activar en producción
- Tool `consultar_disponibilidad`: JSON Schema completo, `HTTP GET /availability`, manejo de error sin cupos
- Tool `obtener_precios_planes`: `HTTP GET /plans` + `/services`, respuesta enriquecida con temporada vigente
- Tool `consultar_reserva`: `HTTP GET /reservations/:id`, retornar estado + actividades + pago

**5h · Semana 9**

---

#### Día 44 · Jueves — `C6` MCP Server n8n — Herramientas de Escritura

- Tool `crear_reserva`: validar JSON Schema, `HTTP POST /reservations` con `Idempotency-Key` auto-generado (UUID)
- Tool `modificar_reserva`: `HTTP PUT /reservations/:id`, verificar disponibilidad antes de confirmar cambio
- Tool `cancelar_reserva`: `GET` política de penalidad → devolver al agente para confirmación → `DELETE`
- Tool `generar_link_pago`: `HTTP POST /payments/create` con `Idempotency-Key = SHA256(reservation_id + amount)`
- Tool `agregar_actividad_opcional`: `HTTP POST /reservations/:id/optional-activities` con validación de pertenencia al plan

**5h · Semana 9**

---

#### Día 45 · Viernes — `C6` MCP Server n8n — Seguridad, Errores y Pruebas

- Agregar nodo IF en cada tool para verificar status HTTP de respuesta del backend (200/201 vs 4xx/5xx)
- Configurar mensajes de error estructurados para que el agente los entienda y comunique al usuario
- Probar cada tool individualmente desde el canvas de n8n con inputs válidos e inválidos
- Documentar JSON Schemas en Sticky Notes del canvas de n8n para referencia del equipo
- Verificar que la URL de producción del MCP Trigger es accesible via HTTPS desde internet

**5h · Semana 9**

---

> ### 🚀 MVP FASE 4 — Sitio Público en Línea
>
> Al finalizar la Semana 9, la landing page está completa y el MCP Server tiene las 8 herramientas activas que conectarán al agente IA con el backend.
>
> **Entregables verificables:**
> - ✅ Landing page completa: hero, servicios, planes, galería, FAQ, mapa, footer con datos del API
> - ✅ Página de detalle de plan: selección de actividades opcionales con cálculo de precio en tiempo real
> - ✅ Widget de chat integrado en la landing con comunicación al agente n8n
> - ✅ MCP Server activo con las 8 herramientas: disponibilidad, precios, crear/consultar/modificar/cancelar reserva, agregar opcionales y generar pago

---

### SEMANA 10 — Agente IA WhatsApp + DevOps + Entrega Final
*MVP Fase 5 — ENTREGA*

---

#### Día 46 · Lunes — `C7` Agente IA WhatsApp — Webhook, Parser y Memoria

- Configurar webhook n8n para recibir mensajes de WhatsApp Cloud API de Meta (verificación del challenge)
- Nodo Respond to Webhook: responder 200 OK inmediato antes de procesar (requerido por Meta < 5s)
- Nodo Code: parsear payload de Meta, extraer `from`, `text`, `display_name`, `phone_number_id`
- Nodo IF: filtrar solo mensajes de tipo `text`, descartar audio e imagen con rama vacía
- Nodo Window Buffer Memory: `sessionKey` = número de WhatsApp del remitente, ventana de 20 mensajes

**5h · Semana 10**

---

#### Día 47 · Martes — `C7` Agente IA WhatsApp — LLM, System Prompt y MCP

- Configurar nodo AI Agent (`conversationalAgent`) con GPT-4o-mini (temperatura 0.3, max_tokens 1024)
- Escribir system prompt completo en español: flujo de reserva en 9 pasos, reglas de validación, cuándo escalar a humano
- Conectar MCP Client Tool al MCP Server del workflow C6 con autenticación Bearer
- Nodo Code de formato de salida: convertir Markdown estándar a WhatsApp markdown (`*bold*`, `_italic_`)
- Nodo HTTP Request: enviar respuesta via `graph.facebook.com/v20.0/{phone_id}/messages`

**5h · Semana 10**

---

#### Día 48 · Miércoles — `C7` Fallbacks, Pruebas Conversacionales + Inicio DevOps

- Configurar lógica de fallback: si el agente no resuelve en 3 intentos, activar escalación a humano
- Configurar notificación interna (HTTP POST a Slack o correo) cuando se activa la escalación
- Ejecutar batería de 25 conversaciones de prueba: consulta de disponibilidad, reserva con opcionales, pago, cancelación, modificación
- Verificar que el agente nunca inventa precios ni disponibilidad y siempre usa las herramientas del MCP
- Iniciar configuración del Dockerfile multi-stage para la API de Node.js

**5h · Semana 10**

---

#### Día 49 · Jueves — `C8` DevOps — Contenedores, Despliegue y Variables de Entorno

- Completar Dockerfile multi-stage: stage `builder` (npm ci + build) + stage `runtime` (~180MB final)
- Configurar `.dockerignore` y healthcheck: `GET /health` cada 30 segundos
- Crear servicio en Railway: conectar repositorio, agregar plugin PostgreSQL, configurar variables de entorno de producción
- Configurar dominio personalizado del cliente en Railway con SSL automático
- Desplegar portal Angular en Vercel y landing en Netlify con CD automático desde rama `main` de GitHub

**5h · Semana 10**

---

#### Día 50 · Viernes — `C8` Monitoreo, Backups, Documentación y Entrega Final

- Configurar UptimeRobot: monitor HTTP en `/health` cada 60 segundos con alerta a correo del cliente
- Configurar backup automático diario de PostgreSQL (`pg_dump`) con retención de 30 días en Google Drive o S3
- Ejecutar prueba end-to-end completa de producción: reserva desde landing → pago → confirmación webhook → visible en portal admin → consulta desde WhatsApp
- Elaborar runbook de operaciones: cómo hacer deploy, restaurar backup, agregar usuario admin, troubleshooting común
- Sesión de capacitación con el equipo del hotel (2 horas): portal admin, gestión de planes, reportes y configuración

**5h · Semana 10**

---

> ### 🚀 MVP FASE 5 — Sistema Completo en Producción
>
> Al finalizar la Semana 10, el agente de IA está atendiendo clientes por WhatsApp, todo el sistema está desplegado en producción con monitoreo activo y backups automáticos.
>
> **Entregables verificables:**
> - ✅ Agente IA Sofia activo en WhatsApp Business: atiende consultas, crea reservas con actividades opcionales y gestiona pagos 24/7
> - ✅ Sistema completo en producción: API en Railway, portal en Vercel, landing en Netlify, workflows en n8n Cloud
> - ✅ Monitoreo activo (UptimeRobot) y backups diarios automáticos de PostgreSQL
> - ✅ Dominio del hotel configurado con SSL válido
> - ✅ Sesión de capacitación completada y runbook de operaciones entregado

---

## Resumen de Horas por Componente

| Código | Componente | Stack | Horas | Valor COP |
|--------|-----------|-------|-------|-----------|
| C1 | Base de Datos | PostgreSQL + Knex | 25h | $2.000.000 |
| C2 | API Backend | Node.js + Express | 85h | $6.800.000 |
| C3 | Módulo de Pagos | MercadoPago SDK | 15h | $1.200.000 |
| C4 | Portal de Administración | Angular 17+ | 65h | $5.200.000 |
| C5 | Landing Page + Widget | HTML / Tailwind / JS | 20h | $1.600.000 |
| C6 | MCP Server | n8n Cloud | 15h | $1.200.000 |
| C7 | Agente IA WhatsApp | n8n + GPT-4o-mini | 15h | $1.200.000 |
| C8 | DevOps y Despliegue | Docker + Railway | 10h | $800.000 |
| | **TOTAL** | | **250h** | **$20.000.000 COP** |

---

## Hitos de Pago

| Pago | Al completar | Componentes | Monto |
|------|-------------|-------------|-------|
| Pago 1 — Inicio | Firma del contrato | C1 + C2 inicio | $5.000.000 COP |
| Pago 2 | Fin Semana 5 (MVP Fase 2) | C2 completo + C3 | $5.000.000 COP |
| Pago 3 | Fin Semana 8 (MVP Fase 3) | C4 + C5 inicio | $5.000.000 COP |
| Pago 4 | Fin Semana 10 (MVP Fase 5) | C5 + C6 + C7 + C8 | $5.000.000 COP |
| | **TOTAL** | | **$20.000.000 COP** |

---

*Hector Fabian Rodriguez · Principal Software Architect & AI Systems · Bogotá, Colombia · Abril 2026*
