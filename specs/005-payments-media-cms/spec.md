# Feature Specification: Cobros en línea, biblioteca de medios y CMS del sitio (MVP Fase 2 — Semana 5)

**Feature Branch**: `005-payments-media-cms`  
**Created**: 2026-04-17  
**Status**: Draft  

---

## Contexto del negocio

Esta feature cierra el **MVP Fase 2**: el hotel puede **cobrar reservas en línea** mediante la **pasarela de pagos contratada** (incluyendo métodos locales relevantes para Colombia), con **confirmación automática** de la reserva cuando el cobro queda acreditado, **trazabilidad y reconciliación** entre intentos internos y el estado en la pasarela, y puede **gestionar archivos multimedia** y **contenido editable del sitio público** (textos, contacto, galería asociada, preguntas frecuentes) consumible por la landing sin depender de desarrolladores.

Alineación: `CONTEXTO_MAESTRO.md` (§10 flujo de pagos, §17 CMS y medios, §21 MVP Fase 2), **Semana 5** del `plan_trabajo.md` (días 21–25: integración de pasarela, notificaciones de pago, transferencia bancaria local vía pasarela, biblioteca de medios, CMS y asociación a habitaciones y planes).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Personal o canal autorizado genera un enlace de pago para una reserva (Priority: P1)

Recepción, administración o el **canal de automatización** (agente) necesitan, ante una reserva válida y un monto acordado, **obtener un enlace de pago** que el huésped pueda abrir en el navegador para completar el cobro. El sistema debe evitar **doble generación** del mismo intento cuando se reintenta la operación por fallos de red o doble clic.

**Independent Test**: Con una reserva en estado que permita cobro, solicitar enlace de pago dos veces con la misma clave de idempotencia y verificar que se reutiliza el mismo intento; con clave distinta o reglas de negocio distintas, verificar comportamiento documentado.

**Acceptance Scenarios**:
1. **Given** una reserva elegible para cobro y un monto válido, **When** un rol autorizado solicita generar pago, **Then** el sistema devuelve un enlace de checkout y registra el intento con referencias de la pasarela.
2. **Given** la misma solicitud repetida con la misma política de idempotencia definida para pagos, **When** el cliente o integración reintenta, **Then** el sistema no crea un segundo cobro paralelo equivalente ni duplica el efecto de negocio acordado.
3. **Given** un rol sin permiso para iniciar cobros, **When** intenta generar el enlace, **Then** el sistema deniega la acción de forma explícita.
4. **Given** la configuración de URLs de retorno del negocio, **When** se crea el intento de pago, **Then** las URLs de éxito, fallo y pendiente quedan asociadas al flujo de checkout según lo definido en la configuración del proyecto.

---

### User Story 2 — El negocio confirma reservas automáticamente al acreditarse el pago (Priority: P1)

Cuando la pasarela notifica un evento de pago, el sistema debe **reconocer el evento de forma segura**, **no procesar dos veces** el mismo cobro y **actualizar el estado de la reserva** a confirmada cuando corresponda, dejando **constancia auditable** del hecho.

**Independent Test**: Simular dos notificaciones idénticas consecutivas y verificar una sola confirmación contable; simular firma inválida y verificar que no altera datos; verificar que la reserva pasa a confirmada solo ante estados de pago aprobados según reglas de negocio.

**Acceptance Scenarios**:
1. **Given** una notificación válida de pago aprobado asociado a una reserva, **When** el sistema la procesa, **Then** la reserva queda en estado confirmado y existe un registro de cobro confirmado vinculado.
2. **Given** una segunda notificación equivalente al mismo cobro, **When** llega al sistema, **Then** no se duplica el registro de cobro confirmado ni se altera de forma inconsistente la reserva.
3. **Given** una notificación con evidencia criptográfica inválida o incompleta, **When** el sistema la evalúa, **Then** no confirma cobros ni cambia estados de reserva por ese canal.
4. **Given** un pago en estado pendiente (p. ej. transferencia bancaria local en trámite), **When** llega la notificación, **Then** el sistema refleja pendencia sin tratarlo como confirmado hasta recibir la acreditación definitiva según reglas acordadas con la pasarela.

---

### User Story 3 — Administración concilia intentos internos con la pasarela (Priority: P2)

Finanzas o administración necesitan **detectar diferencias** entre lo registrado internamente (intentos, estados) y el estado real consultado en la pasarela, para corregir operaciones atascadas o investigar discrepancias.

**Independent Test**: Crear intentos en distintos estados, ejecutar la operación de conciliación y verificar que lista diferencias de forma accionable para un operador humano.

**Acceptance Scenarios**:
1. **Given** intentos de pago registrados en el sistema, **When** un rol autorizado ejecuta la conciliación para un rango o conjunto acordado, **Then** obtiene un informe que contrasta estado interno vs estado en pasarela cuando la consulta está disponible.
2. **Given** un rol sin permisos financieros, **When** intenta conciliar, **Then** el sistema deniega la acción.

---

### User Story 4 — Marketing o administración gestiona la biblioteca de medios (Priority: P1)

El hotel debe poder **subir imágenes y videos** dentro de límites de tamaño y tipo, obtener **vistas previas** adecuadas para imágenes, **listar y buscar** archivos, **eliminar** solo cuando las reglas de uso lo permitan, y **asociar** medios a habitaciones, planes y la galería general del sitio.

**Independent Test**: Subir imagen válida, verificar miniatura y URL; asociar a habitación y verificar en lectura pública de habitación; intentar borrar un archivo en uso y verificar bloqueo o flujo de confirmación según reglas.

**Acceptance Scenarios**:
1. **Given** un archivo de imagen dentro del tamaño máximo permitido, **When** un administrador lo sube, **Then** queda en la biblioteca con metadatos básicos y una vista previa accesible para imágenes.
2. **Given** un archivo de video dentro del tamaño máximo permitido, **When** se sube, **Then** queda registrado y accesible según las políticas de entrega del almacenamiento acordado.
3. **Given** un archivo asociado a habitación o plan, **When** se consulta el detalle público o administrativo de ese recurso, **Then** aparecen las URLs correspondientes coherentes con la biblioteca.
4. **Given** un archivo referenciado por habitación, plan o galería, **When** se intenta eliminar, **Then** el sistema impide la eliminación o exige un flujo de desvinculación previa según la política definida.
5. **Given** un rol sin permisos de gestión de medios, **When** intenta subir o borrar, **Then** el sistema deniega la acción.

---

### User Story 5 — El hotel edita el contenido del sitio y las FAQs; el público consume la versión publicada (Priority: P1)

Administración debe poder **actualizar secciones** del sitio (p. ej. titulares del inicio, textos de contacto, datos de redes) como pares sección/clave, **gestionar preguntas frecuentes** (altas, ediciones, orden, activación) y exponer un **conjunto público consolidado** para la landing sin autenticación.

**Independent Test**: Cambiar un texto de hero, publicar, consultar la versión pública del contenido y verificar el valor nuevo; reordenar FAQs y verificar orden en listado público.

**Acceptance Scenarios**:
1. **Given** un administrador autenticado, **When** actualiza una sección de contenido del sitio con datos válidos, **Then** los cambios quedan persistidos y son visibles en la lectura administrativa de esa sección.
2. **Given** FAQs en distintos estados de actividad, **When** el público consulta el listado público, **Then** solo ve las activas en el orden configurado.
3. **Given** un visitante del sitio sin sesión, **When** consulta el contenido público consolidado y el listado público de FAQs, **Then** obtiene hero, contacto, galería referenciada y FAQs activas ordenadas sin credenciales (rutas públicas alineadas al contrato maestro).
4. **Given** un rol de solo lectura o operaciones sin permiso de CMS, **When** intenta mutar contenido del sitio o FAQs, **Then** el sistema deniega la acción según la matriz de permisos del negocio.

---

## Requirements *(mandatory)*

### Functional Requirements

**Pagos — creación de intento y checkout**

- **FR-001**: El sistema DEBE permitir a roles autorizados (según matriz del negocio: administración y canal de automatización) solicitar la creación de un **intento de pago** para una reserva existente con monto y moneda coherentes con la reserva.
- **FR-002**: El sistema DEBE integrarse con la **pasarela de pagos contratada** para obtener un **enlace de pago** (checkout) con ítems descriptivos alineados a la reserva y URLs de retorno configurables (éxito, fallo, pendiente).
- **FR-003**: El sistema DEBE [Principle II Check] aplicar **idempotencia** a la creación de intentos de pago de modo que reintentos legítimos no generen múltiples cobros equivalentes para la misma combinación reserva-monto según la política acordada.
- **FR-004**: El sistema DEBE persistir cada intento con identificadores de la pasarela, enlace de checkout, estado del intento y ventana de expiración cuando aplique.
- **FR-005**: El sistema DEBE validar precondiciones de negocio (existencia de reserva, estado compatible con cobro, monto permitido) antes de invocar la pasarela.

**Pagos — notificaciones y confirmación**

- **FR-006**: El sistema DEBE exponer un **canal de notificación de eventos de pago** accesible para la pasarela y DEBE **responder de inmediato** con acuse recibido correcto antes de completar el procesamiento pesado, para cumplir requisitos de la integración.
- **FR-007**: El sistema DEBE **validar la autenticidad** de cada notificación mediante el mecanismo criptográfico provisto por la pasarela (p. ej. firma de manifiesto) antes de aceptar el contenido como fuente de verdad.
- **FR-008**: El sistema DEBE **deduplicar** procesamiento por identificador de pago de la pasarela de forma que notificaciones repetidas no creen múltiples registros de cobro confirmado.
- **FR-009**: Ante pago **aprobado**, el sistema DEBE, en una **transacción de negocio atómica**, actualizar el estado de la reserva a **confirmada** (o equivalente definido en el modelo) y registrar el cobro confirmado con referencia externa y marca temporal.
- **FR-010**: El sistema DEBE registrar en **auditoría** la confirmación de pago con referencia a la reserva y metadatos mínimos trazables.
- **FR-011**: El sistema DEBE soportar el flujo de **transferencia bancaria local** ofrecido por la pasarela (p. ej. PSE en Colombia), reflejando estados **pendiente** vs **aprobado** según las transiciones reales reportadas.
- **FR-012**: El sistema DEBE implementar **reintentos controlados** con esperas crecientes cuando el procesamiento posterior a la notificación no puede consultar de inmediato el estado definitivo en la pasarela, sin violar el requisito de respuesta inmediata al receptor de la notificación.

**Pagos — conciliación**

- **FR-013**: El sistema DEBE ofrecer una operación de **conciliación** consultable solo por roles financieros/administrativos que compare intentos internos con el estado en la pasarela y destaque diferencias.

**Medios — biblioteca**

- **FR-014**: El sistema DEBE permitir **subir archivos** validando tipo y tamaño máximo (imágenes y videos con topes de negocio definidos en asunciones).
- **FR-015**: Para imágenes, el sistema DEBE generar y almacenar una **vista previa reducida** enlazable además del archivo original.
- **FR-016**: El sistema DEBE persistir metadatos de biblioteca (nombre, tipo, tamaño, autor de carga, URLs de entrega) y listar con búsqueda por nombre y filtro por tipo.
- **FR-017**: El sistema DEBE permitir **eliminar** archivos de biblioteca solo si no están en uso o tras cumplir reglas de desvinculación; si está prohibido, DEBE responder con error de negocio claro.
- **FR-018**: El sistema DEBE [Principle IV Check] restringir alta/baja de medios a roles con permiso de CMS/gestión de medios según matriz del negocio.

**Medios y CMS — asociación y contenido**

- **FR-019**: El sistema DEBE permitir **asociar** medios a **habitaciones** y **planes** con roles adecuados (p. ej. portada y galería) y reflejarlo en las lecturas de detalle correspondientes.
- **FR-020**: El sistema DEBE permitir **leer y actualizar** contenido del sitio por **sección** en modelo clave-valor con tipos de dato de contenido (texto, URL de imagen, listas estructuradas, texto enriquecido simple) validados.
- **FR-021**: El sistema DEBE proveer **CRUD y reordenamiento** de FAQs con estado activo/inactivo.
- **FR-022**: El sistema DEBE exponer (1) una **consulta pública consolidada** `GET …/site-content/public` con el contenido editable necesario para la landing (secciones acordadas: inicio, contacto, galería, etc.) sin autenticación, y (2) un **`GET …/faqs` público** que liste **solo FAQs activas** ordenadas, alineado a `CONTEXTO_MAESTRO.md` §9 (ambas rutas deben existir; internamente pueden compartir repositorio/servicio para evitar divergencia de datos).
- **FR-023**: El sistema DEBE [Principle III Check] **no alterar** snapshots históricos de actividades base de reservas ya creadas como consecuencia de operaciones de medios o CMS; cambios de contenido son prospectivos para nuevas visualizaciones.

### Key Entities

- **PaymentAttempt**: Intento de cobro con claves de idempotencia, referencia de preferencia o equivalente en pasarela, URL de checkout, estado y expiración.
- **Payment**: Cobro confirmado vinculado a reserva, monto, moneda, método y referencia externa de la pasarela.
- **Reservation** (existente): Debe transicionar a confirmada cuando el cobro se aprueba; permanece gobernada por reglas previas de snapshot.
- **MediaAsset**: Archivo en biblioteca con URLs de entrega, miniatura opcional, tipo y metadatos.
- **RoomMedia / PlanMedia**: Asociación de medios a habitaciones o planes con roles de portada y orden.
- **SiteContent**: Entradas de contenido por sección y clave con tipo de valor.
- **FAQ**: Pregunta, respuesta, orden y estado activo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En condiciones de red y servicio normales de laboratorio/staging, el **95%** de las solicitudes de enlace de pago válidas completan la obtención del enlace en **menos de 30 segundos** desde la solicitud hasta la respuesta usable por el cliente.
- **SC-002**: Tras una notificación válida de pago aprobado, el **95%** de los casos en pruebas controladas reflejan la reserva como **confirmada** y el cobro como **registrado** en **menos de 2 minutos** desde recibida la notificación (excluyendo casos de pendencia bancaria intencional).
- **SC-003**: En una batería de **20 reenvíos** de la misma notificación aprobada, el sistema mantiene **un único** registro de cobro confirmado asociado a esa transacción externa (cero duplicados).
- **SC-004**: Para imágenes dentro del tope de tamaño, el **90%** de las cargas en pruebas controladas exponen **miniatura y original** accesibles en **menos de 60 segundos** desde completada la subida.
- **SC-005**: Tras publicar un cambio de contenido de inicio o contacto, la **consulta pública consolidada** refleja el nuevo valor en el **100%** de las lecturas inmediatas posteriores en la misma sesión de prueba (consistencia lectura-tras-escritura en el entorno objetivo).
- **SC-006**: Cien por cien de los intentos de crear pago, procesar notificaciones, subir/borrar medios o mutar CMS por roles no autorizados resultan en **denegación explícita** sin filtrar datos sensibles de configuración.

---

## Assumptions

- La **pasarela de pagos** y credenciales de producción/sandbox las provee el cliente según el calendario de activos del proyecto; la moneda principal de operación es la acordada con el hotel (COP por defecto en el contexto del negocio colombiano).
- Los **topes de tamaño** son: imágenes hasta 10 MB y videos hasta 200 MB salvo que el contrato comercial defina otros límites documentados.
- El **almacenamiento de archivos** es un servicio en la nube elegido por el proyecto (objeto o proveedor de medios); las URLs públicas se sirven vía ese proveedor y se registran en la biblioteca.
- Las **URLs de retorno** del checkout y la **URL de notificaciones** están configuradas en los entornos (desarrollo, staging, producción) de forma coherente con el dominio del hotel.
- Los roles **AGENT** (automatización) y **ADMIN** pueden iniciar cobros según la matriz del contexto maestro; la conciliación es responsabilidad de perfiles administrativos financieros.
- El alcance de esta especificación es **capacidad de plataforma (API y reglas de negocio)**; las **pantallas del portal Angular** para estas funciones se entregan en fases posteriores, consumiendo estas capacidades.

## Edge Cases

- **Notificación adelantada vs consulta tardía**: la pasarela responde 200 de inmediato pero el procesamiento difiere el estado hasta consultar origen; debe resolverse con reintentos internos sin marcar pago inexistente como aprobado.
- **Pago pendiente de transferencia**: la reserva no debe figurar como confirmada por pago hasta acreditación; debe mantenerse coherente con estados intermedios definidos en el modelo (p. ej. pago pendiente).
- **Intento de pago con monto distinto al de la reserva**: validación de negocio explícita y rechazo claro.
- **Eliminación de medio en uso**: bloqueo o proceso guiado de desasociación previa.
- **Subida de archivo no permitido o fuera de tamaño**: error de validación sin archivos parciales persistidos en biblioteca.
- **Credenciales de pasarela ausentes o inválidas**: fallo controlado al crear checkout, sin registrar intentos inconsistentes que parezcan pagados.

---

## Out of Scope

- **Interfaz de usuario del portal Angular** para pagos, biblioteca y CMS (se cubre en semanas 6–8 del plan), salvo que se requieran mocks temporales fuera de esta especificación.
- **Landing pública completa** con maquetación final (semana 8–9); aquí solo se exige **API** y contenido público consumible.
- **Agente WhatsApp, MCP Server y orquestación n8n** (semanas 9–10) como producto final; no obstante, los endpoints de pago y contenido público deben ser **compatibles** con los consumidores futuros definidos en el contexto maestro.
- **Cambios de esquema de base de datos** masivos fuera de lo ya previsto para pagos, medios y CMS en el modelo maestro (solo se asume ajuste fino si apareciera brecha de implementación).
