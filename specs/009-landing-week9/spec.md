# Feature Specification: Sitio público — reserva web y asistente en la landing (Semana 9, solo C5)

**Feature Branch**: `009-landing-week9`  
**Created**: 2026-04-17  
**Status**: Draft  

## Resumen ejecutivo

Completar la experiencia del **sitio web público del hotel** para que un visitante pueda **entender un plan**, **personalizarlo con actividades opcionales**, **enviar una reserva** y **continuar hacia el pago**, además de **conversar con el asistente virtual** desde la misma web y **ver el resultado del pago** en páginas dedicadas. Esta especificación cubre únicamente lo previsto en la **Semana 9** del plan maestro que afecta al **sitio público (C5)**. **Queda explícitamente fuera de alcance** todo lo relativo al **servidor MCP, herramientas n8n para agentes y automatización C6** (Días 43–45 del plan de trabajo).

## Alcance y límites

| Incluido (esta spec) | Excluido (otra spec / fase) |
|----------------------|----------------------------|
| Página de detalle de plan accesible por URL amigable (p. ej. slug) | Configuración del servidor MCP, JSON Schemas de tools, pruebas de canvas n8n |
| Flujo de reserva web con opcionales y total dinámico | Agente WhatsApp (C7) salvo que la landing reutilice el mismo canal web documentado |
| Widget de chat embebido y páginas de resultado de pago | Despliegue Netlify/Railway como runbook completo (puede referenciarse en fase posterior) |

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Explorar un plan y reservar (Priority: P1)

Una persona interesada llega al sitio, abre la ficha de un plan concreto, ve qué incluye el plan (sin poder alterar lo incluido), elige actividades opcionales con cantidades y ve el **precio total actualizarse al instante**. Completa fechas, número de personas y sus datos de contacto. Al confirmar, el sistema registra la intención de reserva y la guía hacia el **siguiente paso de pago** cuando corresponda.

**Independent Test**: Con datos de catálogo de prueba, recorrer la ficha de plan hasta el paso posterior al envío del formulario y verificar que el total mostrado coincide con la suma acordada a reglas de negocio (base + opcionales).

**Acceptance Scenarios**:

1. **Given** un plan publicado y visible al público, **When** el visitante abre su URL de detalle, **Then** ve nombre, descripción ampliada, medios (imagen y/o video) y la habitación o alojamiento vinculado de forma clara.
2. **Given** el detalle del plan, **When** el visitante revisa actividades incluidas, **Then** aparecen como información de solo lectura, ordenada y sin controles que sugieran modificación.
3. **Given** actividades opcionales disponibles para ese plan, **When** el visitante marca o desmarca opciones y cantidades, **Then** el precio total visible se recalcula sin recargar la página completa.
4. **Given** fechas y datos de huésped incompletos o inválidos, **When** el visitante intenta enviar, **Then** recibe mensajes de error comprensibles junto a los campos afectados.
5. **Given** un envío válido y disponibilidad favorable, **When** el visitante confirma la reserva, **Then** el sistema avanza hacia el flujo de pago definido por el negocio (enlace o redirección) o comunica con claridad si debe esperar o reintentar.

---

### User Story 2 — Chatear con el asistente desde la web (Priority: P1)

Un visitante usa el **botón de chat** en cualquier página pública del sitio, escribe preguntas y recibe respuestas en el mismo hilo. Si el asistente genera una **reserva y un enlace de pago**, el visitante ve una **tarjeta de acción** con el número de reserva y un botón para pagar. Las respuestas admiten formato legible (énfasis, listas, enlaces).

**Independent Test**: Simular respuestas del servicio conversacional (entorno de prueba) y verificar persistencia de sesión, renderizado de mensajes y aparición de la tarjeta de pago cuando el payload lo indica.

**Acceptance Scenarios**:

1. **Given** la landing cargada, **When** el visitante abre el chat, **Then** ve un panel usable en escritorio y móvil sin tapar contenido crítico de forma permanente.
2. **Given** un mensaje enviado, **When** llega la respuesta del asistente, **Then** se muestra en burbujas distinguibles de las del usuario y con indicador de “escribiendo” mientras espera.
3. **Given** una respuesta con texto enriquecido simple, **When** se renderiza, **Then** listas, enlaces y énfasis son legibles y los enlaces son activables de forma segura (misma pestaña o nueva, según política del producto).
4. **Given** una respuesta que incluye datos de reserva y pago, **When** el visitante acepta la acción, **Then** puede abrir el flujo de pago desde la tarjeta sin reescribir manualmente el número de reserva.

---

### User Story 3 — Resultado del pago (Priority: P2)

Después de intentar pagar, el visitante aterriza en una **página de resultado** coherente con el estado: éxito, fallo o pendiente. Cada página comunica el estado en lenguaje claro y ofrece **próximos pasos** (volver al inicio, revisar correo, contactar al hotel).

**Independent Test**: Navegar directamente a cada resultado con parámetros o tokens de prueba que el negocio defina y validar mensajes y enlaces de retorno.

**Acceptance Scenarios**:

1. **Given** un pago confirmado, **When** el visitante llega a la página de éxito, **Then** ve confirmación positiva y al menos una acción para continuar (inicio o contacto).
2. **Given** un pago rechazado o error, **When** el visitante llega a la página de fallo, **Then** ve explicación humana y opción de reintentar o contactar.
3. **Given** un pago en verificación, **When** el visitante llega a la página pendiente, **Then** entiende que debe esperar y dónde buscar actualización (correo o soporte).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio público MUST ofrecer una **vista de detalle por plan** identificable por un **identificador amigable en URL** (p. ej. slug), estable y enlazable desde el listado de planes.
- **FR-002**: La vista de detalle MUST mostrar **contenido narrativo y visual** del plan (descripción extendida, galería o imagen destacada, video si existe) y la **relación con el alojamiento** asociado de forma comprensible para un visitante sin conocimiento interno del sistema.
- **FR-003**: Las **actividades incluidas** en el plan MUST mostrarse como **solo lectura**, sin flujos que permitan al visitante alterar el paquete base desde la web pública.
- **FR-004**: Las **actividades opcionales** ofrecidas para ese plan MUST poder seleccionarse (incluida cantidad donde aplique) y el **precio total mostrado** MUST **actualizarse en tiempo real** según la selección.
- **FR-005**: El formulario de reserva MUST capturar al menos: **rango de fechas**, **número de personas** (adultos y menores según reglas del negocio) y **datos de contacto del huésped principal** suficientes para la operación del hotel.
- **FR-006**: El formulario MUST validar **entradas obligatorias y formatos** en el cliente antes del envío, con mensajes claros y accesibles.
- **FR-007**: Tras un envío válido, el sistema MUST **crear o registrar la reserva** según el contrato del servicio de reservas del producto y MUST **orientar al visitante hacia el pago** cuando el flujo de negocio lo requiera, o MUST comunicar **errores de negocio** (sin disponibilidad, datos inconsistentes) de forma accionable.
- **FR-008**: El sitio MUST incluir un **widget de chat** persistente y **usable en dispositivos móviles y escritorio**, con identificación de sesión estable para continuidad de conversación en la misma visita al navegador.
- **FR-009**: El widget MUST enviar mensajes del visitante a un **punto de entrada HTTPS del asistente** configurado por entorno y MUST mostrar respuestas con **formato legible** (listas, enlaces, énfasis) sin ejecutar código arbitrario proveniente del mensaje.
- **FR-010**: Cuando la respuesta del asistente incluya **acción de pago** (enlace y referencia de reserva), el widget MUST mostrar una **tarjeta de llamada a la acción** con número de reserva y acceso al pago.
- **FR-011**: El sitio MUST proveer **tres páginas de resultado de pago** (éxito, fallo, pendiente) con mensajes distintivos, coherencia visual con el resto del sitio y rutas de escape claras.

### Key Entities

- **Plan (vista pública)**: Identificador amigable, precio base, medios, descripción, actividades incluidas, catálogo de opcionales visibles al visitante.
- **Selección de opcionales**: Actividad opcional, cantidad, precio unitario mostrado, subtotal.
- **Intención de reserva (borrador enviado)**: Fechas, ocupación, datos del huésped, opcionales elegidos, total acordado a la vista.
- **Sesión de chat**: Identificador de conversación estable en el navegador, historial de mensajes en la UI.
- **Resultado de pago**: Estado final o intermedio presentado al visitante tras el proveedor de pagos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante nuevo puede **completar el flujo** desde la ficha de plan hasta la **pantalla posterior al envío** (pago o mensaje de error de negocio) en **menos de 5 minutos** en condiciones de red normales, sin asistencia humana.
- **SC-002**: En pruebas con al menos **tres combinaciones distintas** de opcionales, el **total mostrado** coincide con la **suma esperada** (base + opcionales) en el **100%** de los casos.
- **SC-003**: El widget de chat permanece **funcional** tras **navegar entre la home y al menos una ficha de plan** sin perder el contexto de sesión del visitante.
- **SC-004**: Las tres páginas de resultado de pago son **comprensibles** para revisores no técnicos en prueba guiada (criterio binario por página: aprobado / requiere ajuste de copy).
- **SC-005**: **Cero** casos aceptados donde enlaces o contenido del chat ejecuten **scripts** no confiables en el contexto del sitio (sanitización o renderizado seguro verificado en revisión de seguridad básica).

## Assumptions

- Los **servicios de catálogo, reservas y pagos** del producto ya están disponibles y alineados con las fases anteriores del MVP; esta especificación describe el comportamiento del **sitio público** que los consume, no redefine el modelo de datos del backend.
- El **contenido editorial** (hero, contacto, galería general, FAQs, etc.) sigue gestionado desde el flujo de administración existente; esta fase **no** sustituye el CMS sino que **consume** el mismo tipo de datos donde aplique.
- La **URL del asistente web** y los **identificadores de comercio / retorno de pago** se configuran por **ambiente** (desarrollo, staging, producción) sin codificar secretos en el repositorio público del sitio estático.
- El trabajo de **servidor MCP y herramientas para el agente** (Semana 9, componente C6) será abordado en **otra especificación**; aquí solo se asume que el **webhook del chat web** puede compartir infraestructura con otros canales si el negocio lo decide.

## Dependencies

- Catálogo público de **planes** y **habitaciones** publicados.
- Servicio de **creación de reservas** con reglas de idempotencia y disponibilidad ya acordadas en fases previas.
- Servicio de **iniciación de pago** coherente con el estado de la reserva.
- **Política de privacidad** y textos legales enlazables desde footer y, si aplica, desde el chat.
