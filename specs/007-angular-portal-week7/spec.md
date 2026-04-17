# Especificación: Portal de administración — Semana 7 (reservas, planes, inventario y reportes)

**Rama sugerida**: `007-angular-portal-week7`  
**Creado**: 2026-04-17  
**Estado**: Borrador  
**Fuentes**: `plan_trabajo.md` (Semana 7 · FASE 3, días 31–35), `CONTEXTO_MAESTRO.md` (§5 URLs, §6 RBAC, §11 C4, §16 planes/actividades, §18 reservas, snapshots)

## Resumen ejecutivo

Esta entrega corresponde a la **segunda semana ampliada del portal web de administración** en la FASE 3 del plan maestro: el equipo interno debe poder **gestionar el ciclo de vida de las reservas** (búsqueda, filtros, detalle, exportación y acciones operativas acordadas al API), **definir y mantener planes con actividades base y opcionales** (según roles permitidos en la matriz de permisos), **operar inventario** (ítems, proveedores, movimientos y alertas de stock) y **consumir reportes analíticos exportables**. El alcance sigue el **desglose diario de la Semana 7** del `plan_trabajo.md`, **sin** incluir CMS de medios, usuarios del portal, configuración del negocio ni landing pública (semanas posteriores).

**Dependencia**: se asume disponible la base del portal de la **Semana 6** (autenticación, layout, rutas bajo `/admin`, dashboard y módulos ya entregados o en curso según el mismo plan maestro).

## Alcance incluido (Semana 7)

1. **Reservas — visibilidad y análisis**: listado con filtros avanzados (estado, rango de fechas, habitación/plan, texto libre); columnas operativas visibles (identificador, cliente, servicio, fechas, personas, montos, estado de reserva y de pago); panel de detalle con datos del cliente, actividades base según **snapshot** de la reserva, opcionales contratadas e historial de estados; exportación del conjunto filtrado a formatos de hoja de cálculo y texto tabular; búsqueda rápida por número de reserva o nombre de cliente.
2. **Reservas — acciones y alta manual**: acciones permitidas por rol (confirmar, cancelar con información de política y penalidad, modificar fechas cuando el negocio y el API lo permitan); generación o recuperación de **enlace de pago** cuando el flujo de negocio lo habilite; agregar actividad opcional a una reserva existente desde catálogo acotado al plan; **creación manual** de reserva para atención telefónica; indicadores visuales claros del estado de pago.
3. **Planes — definición y actividades base**: listado de planes con indicadores de estado, portada y volumen de actividades; formulario de alta/edición con campos de negocio requeridos, portada y galería; subsección de **actividades base** ordenables y editables con advertencia de impacto al eliminar si existen reservas futuras afectadas; duplicación de plan con confirmación.
4. **Planes — opcionales del hotel y del plan**: catálogo global de actividades opcionales del establecimiento; **asociación y desasociación** de opcionales en cada plan (incluida la operación de **desvincular** según el contrato del API, p. ej. `DELETE` de optional-links) con posibilidad de marcarlas como **pre-seleccionadas**; vista previa del precio total (plan + opcionales seleccionadas) coherente con las reglas expuestas por el API; impedir desactivar o retirar una opcional que tenga **reservas futuras** que la incluyan, con mensaje comprensible.
5. **Inventario**: listado de ítems con señalización de alerta de stock bajo; **alta y edición de ítems y proveedores** en UI para roles con mutación permitida; registro de movimientos (entrada/salida) con identificación del ítem y notas u observaciones; **historial de movimientos consultable** alineado al API para roles con acceso de lectura.
6. **Reportes**: selección de rango de fechas; visualizaciones de ocupación e ingresos según datos del API; exportación de reportes a formatos de hoja de cálculo y documento imprimible; reporte orientado a **planes** (reservas por plan, opcionales más elegidas, ingreso promedio) cuando el backend exponga los agregados necesarios.

## Alcance excluido (dejado explícito)

- **CMS** (biblioteca de medios, textos, FAQ), **usuarios del portal**, **configuración del negocio**, **credenciales de pasarela** y **log de auditoría completo** (según límites de rol en el maestro).
- **Landing pública**, **widget de chat**, **MCP / WhatsApp** y **DevOps** de producción.
- Cambios de **modelo de datos** o nuevos endpoints salvo acuerdo explícito cuando un hueco del API impida cumplir una pantalla comprometida (se documentará como dependencia).

## Reglas de autoridad (matriz §6)

- **Reservas**: todos los roles con acceso al módulo pueden **ver**; la **creación y edición** corresponde a quienes el maestro habilita (`SUPER_ADMIN`, `ADMIN`, `BUSINESS`); **`VIEWER`** no completa acciones mutadoras.
- **Planes (CRUD y actividades)**: según matriz del maestro, **solo** `SUPER_ADMIN` y `ADMIN` definen y modifican planes y su estructura; **`BUSINESS`** y **`VIEWER`** no utilizan estas pantallas para mutaciones (el plan diario de desarrollo que menciona “operaciones” en planes se interpreta como **contenido administrativo** reservado a roles administrativos; operaciones sigue centrada en **reservas, inventario y reportes**).
- **Inventario**: visualización según matriz; **movimientos** solo roles autorizados (`VIEWER` no registra movimientos).
- **Reportes**: acceso de lectura/exportación alineado a la matriz (incluye `VIEWER` donde aplique).

## User Scenarios & Testing *(obligatorio)*

### Historia de usuario 1 — Explorar y exportar reservas (Prioridad: P1)

**Como** personal de recepción o gerencia, **quiero** filtrar y revisar reservas con detalle y exportar el resultado **para** auditar ocupación y facturación sin depender de hojas externas manuales.

**Prueba independiente**: Con datos de prueba en el API, aplicar combinaciones de filtros y comprobar que el listado, el panel de detalle y los archivos exportados reflejan la misma información que una consulta equivalente al backend.

**Escenarios de aceptación**:

1. **Dado** el listado de reservas, **cuando** el usuario aplica filtros por estado, rango de fechas y texto libre, **entonces** la tabla muestra solo filas que cumplen los criterios y el total o la paginación se mantiene coherente con el servidor.
2. **Dado** una reserva seleccionada, **cuando** abre el panel de detalle, **entonces** ve datos del cliente, actividades base **tal como quedaron capturadas en la reserva**, opcionales contratadas e historial de estados sin contradecir al API.
3. **Dado** un conjunto filtrado, **cuando** solicita exportación, **entonces** obtiene archivos descargables en al menos dos formatos estándar (hoja de cálculo y texto separado por delimitador) con las columnas acordadas para operación diaria, y si la operación puede prolongarse ve **indicador de progreso o mensaje informativo** explícito.
4. **Dado** un número de reserva o nombre de cliente, **cuando** usa la búsqueda rápida, **entonces** localiza la reserva en un tiempo percibido aceptable en red de oficina o muestra estado vacío explícito.

---

### Historia de usuario 2 — Operar reservas y registrar ventas manuales (Prioridad: P1)

**Como** personal de operaciones autorizado, **quiero** confirmar, cancelar o ajustar reservas, generar cobro cuando corresponda y dar de alta reservas por teléfono **para** cerrar el ciclo comercial sin errores de doble confirmación.

**Prueba independiente**: Flujo completo en entorno de pruebas: confirmación, cancelación con visualización de política, modificación de fechas si el API lo permite, alta manual y agregado de opcional; verificación de que un rol solo lectura no completa mutaciones.

**Escenarios de aceptación**:

1. **Dado** una reserva en estado operable, **cuando** el usuario confirma o cancela, **entonces** el sistema muestra confirmaciones y mensajes de resultado alineados al API, incluyendo información de política y penalidad en cancelación, **y** el detalle disponible refleja el nuevo estado tras **actualización explícita o automática** claramente perceptible.
2. **Dado** una reserva elegible, **cuando** se solicita enlace de pago, **entonces** el usuario obtiene un enlace copiable o instrucción clara si el flujo no está disponible.
3. **Dado** una reserva con plan que admite opcionales, **cuando** se agrega una actividad opcional, **entonces** la selección muestra precio y el resultado queda reflejado en el detalle de la reserva.
4. **Dado** el formulario de creación manual, **cuando** el operador completa datos mínimos requeridos por negocio, **entonces** puede registrar la reserva y ver el identificador generado según contrato del sistema.
5. **Dado** un usuario **`VIEWER`**, **cuando** intenta acciones mutadoras, **entonces** no puede completarlas por interfaz y, si el API responde por permisos, ve un mensaje comprensible.

---

### Historia de usuario 3 — Definir planes y actividades base (Prioridad: P1)

**Como** administrador del establecimiento, **quiero** crear y mantener planes con actividades base ordenadas y medios asociados **para** que la oferta comercial coincida con lo vendido y con los snapshots de las reservas futuras.

**Prueba independiente**: CRUD de plan de prueba; reordenamiento de actividades base; intento de eliminación con conteo de reservas afectadas; duplicación con confirmación; verificación en API.

**Escenarios de aceptación**:

1. **Dado** el listado de planes, **cuando** el usuario filtra o ordena, **entonces** identifica rápidamente planes activos/inactivos, portada y cantidad de actividades base.
2. **Dado** el formulario de plan, **cuando** guarda cambios válidos, **entonces** los datos y medios quedan persistidos según el API y el usuario recibe retroalimentación visible.
3. **Dado** una actividad base vinculada a reservas futuras, **cuando** el usuario intenta eliminarla, **entonces** ve una advertencia con **cantidad afectada** y solo procede si confirma explícitamente o la operación es rechazada por reglas de negocio con mensaje claro.
4. **Dado** un plan existente, **cuando** elige duplicar, **entonces** obtiene una copia base con confirmación y puede ajustar nombre o slug según reglas del negocio.

---

### Historia de usuario 4 — Gestionar opcionales del hotel y del plan (Prioridad: P1)

**Como** administrador, **quiero** mantener el catálogo de actividades opcionales y vincularlas a cada plan con reglas de pre-selección y precio **para** que recepción y ventas muestren totales correctos al cliente.

**Prueba independiente**: CRUD en catálogo global; asociación y **desasociación** (`DELETE` optional-links) en plan; marca de pre-selección; vista previa de precio total; intento de desactivar o desvincular opcional con reservas futuras → bloqueo o mensaje explícito.

**Escenarios de aceptación**:

1. **Dado** el catálogo global, **cuando** el usuario crea o edita una actividad opcional, **entonces** los cambios quedan disponibles para asociación en planes.
2. **Dado** el formulario de plan en la subsección de opcionales, **cuando** selecciona ítems del catálogo, **entonces** el conjunto guardado coincide con lo esperado por el API.
3. **Dado** opcionales seleccionadas, **cuando** el usuario alterna “pre-seleccionada”, **entonces** el estado queda persistido y es coherente en vistas posteriores.
4. **Dado** opcionales activas en el formulario, **cuando** el usuario revisa la vista previa de precio, **entonces** el total mostrado **no contradice** la respuesta del API para la misma selección.
5. **Dado** una opcional con reservas futuras que la incluyen, **cuando** el usuario intenta desactivarla o quitarla del plan, **entonces** el sistema impide la acción destructiva o explica el bloqueo según contrato del API.
6. **Dado** una opcional asociada al plan sin bloqueo de negocio, **cuando** el usuario solicita **desvincularla del plan**, **entonces** la operación usa el contrato del API (p. ej. `DELETE` de optional-links), la lista del plan refleja el cambio o muestra el error devuelto sin estado ambiguo.

---

### Historia de usuario 5 — Inventario y reportes exportables (Prioridad: P1)

**Como** operaciones o gerencia, **quiero** registrar movimientos de inventario y visualizar reportes con exportación **para** controlar insumos y tomar decisiones con datos consolidados.

**Prueba independiente**: CRUD de ítem y proveedor (roles permitidos); movimiento de entrada/salida; **historial de movimientos** visible y coherente con el API; visualización de reportes con rango de fechas; exportación a hoja de cálculo y documento imprimible; `VIEWER` sin movimientos de inventario.

**Escenarios de aceptación**:

1. **Dado** el listado de inventario, **cuando** hay ítems bajo stock mínimo, **entonces** el usuario identifica alertas sin ambigüedad.
2. **Dado** un ítem y un motivo de movimiento, **cuando** el usuario autorizado registra entrada o salida, **entonces** el saldo reflejado tras guardar coincide con el API.
3. **Dado** el módulo de reportes, **cuando** el usuario elige un rango de fechas válido, **entonces** ve gráficos de ocupación e ingresos que representan los mismos agregados que el backend expone (sin cifras inventadas).
4. **Dado** un reporte de planes disponible, **cuando** el usuario lo abre, **entonces** ve indicadores de reservas por plan, opcionales más elegidas e ingreso promedio según datos reales.
5. **Dado** un usuario **`VIEWER`**, **cuando** accede a inventario, **entonces** puede consultar pero **no** completar formularios de movimiento.
6. **Dado** un usuario con acceso de lectura a inventario, **cuando** abre el **historial de movimientos**, **entonces** ve las entradas devueltas por el API (ítem, sentido/cantidad coherente con el contrato, instante u otros campos expuestos) alineadas con los movimientos ya registrados.
7. **Dado** un rol autorizado a mutar ítems de inventario, **cuando** crea o edita un ítem (o proveedor, según matriz), **entonces** los cambios quedan persistidos vía API y el listado refleja el estado actualizado.

---

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema **debe** listar reservas con filtros combinables y paginación coherente con el servidor, mostrando columnas operativas acordadas con el negocio (identificador, cliente, servicio, fechas, personas, montos, estados).
- **FR-002**: El sistema **debe** mostrar un panel de detalle de reserva con actividades base **provenientes del snapshot** de la reserva, opcionales contratadas e historial de estados, sin reescribir el histórico desde el plan maestro actual.
- **FR-003**: El sistema **debe** permitir exportar el resultado filtrado del listado de reservas al menos a formato de hoja de cálculo y a texto delimitado para uso operativo. Si el volumen filtrado puede hacer lenta la generación en cliente, el usuario **debe** ver **indicador de progreso** o **mensaje informativo** explícito durante la exportación.
- **FR-004**: El sistema **debe** ofrecer búsqueda rápida por número de reserva o identificador de cliente legible para recepción.
- **FR-005**: El sistema **debe** permitir a roles autorizados ejecutar acciones de reserva alineadas al API (confirmar, cancelar con información de política, modificar fechas cuando aplique), con confirmaciones explícitas antes de efectos irreversibles.
- **FR-006**: El sistema **debe** exponer, cuando el flujo de negocio lo permita, la obtención o regeneración de un **enlace de pago** copiable para una reserva elegible.
- **FR-007**: El sistema **debe** permitir agregar actividades opcionales a una reserva existente desde el conjunto permitido por el plan y mostrar precios de forma consistente con el API.
- **FR-008**: El sistema **debe** permitir **creación manual** de reserva con validación de campos mínimos y retroalimentación de éxito o error.
- **FR-009**: El sistema **debe** mostrar el estado de pago de forma visualmente distinguible (sin pago, pendiente, pagado u otros estados que exponga el contrato).
- **FR-010**: El sistema **debe** restringir mutaciones de reservas según la matriz de roles (por ejemplo, **`VIEWER`** sin crear, editar ni cancelar).
- **FR-011**: El sistema **debe** permitir a roles administrativos (`SUPER_ADMIN`, `ADMIN`) el CRUD de planes con portada y galería, listado ordenable de **actividades base** y acción de **duplicar plan** con confirmación.
- **FR-012**: El sistema **debe** advertir con **conteo de reservas futuras afectadas** antes de eliminar una actividad base que tenga impacto.
- **FR-013**: El sistema **debe** permitir mantener el **catálogo global** de actividades opcionales del hotel y asociarlas a planes, incluyendo marca de **pre-selección** por plan.
- **FR-014**: El sistema **debe** mostrar **vista previa del precio total** (plan más opcionales seleccionadas en el contexto del formulario) alineada al API.
- **FR-015**: El sistema **debe** impedir o explicar bloqueos al desactivar o **desasociar del plan** opcionales con **reservas futuras** que las incluyan; la **desasociación** desde el plan **debe** implementarse según el contrato del API (p. ej. `DELETE` de optional-links), con confirmación cuando la acción sea destructiva.
- **FR-016**: El sistema **debe** listar ítems de inventario con alerta de stock bajo y permitir **mantenimiento** de ítems y proveedores según rol, incluyendo **formularios o diálogos** de alta y edición en la UI para quienes el API autorice a mutar.
- **FR-017**: El sistema **debe** permitir registrar **movimientos** de inventario (entrada/salida) con identificación del ítem y notas, solo a roles autorizados, y **debe** ofrecer un **historial de movimientos consultable** para roles con acceso de lectura, alineado a las respuestas del API.
- **FR-018**: El sistema **debe** ofrecer reportes con selección de rango de fechas y gráficos de ocupación e ingresos basados en datos del API.
- **FR-019**: El sistema **debe** permitir exportar reportes a formatos de hoja de cálculo y de documento imprimible.
- **FR-020**: El sistema **debe** incluir un reporte de desempeño de **planes** (reservas por plan, opcionales más elegidas, ingreso promedio) cuando el backend provea los agregados; si falta algún agregado, **debe** degradar con mensaje explícito.
- **FR-021**: Las acciones que el API defina como **idempotentes** ante reintentos (por ejemplo creación o actualización crítica de reserva, **registro de pago preferencia/checkout** cuando el middleware lo exija, movimientos de inventario) **deben** enviar el identificador de idempotencia que exija el contrato, de modo que un doble clic no genere duplicados inadvertidos.
- **FR-022**: Las rutas y acciones visibles **deben** respetar la matriz §6 del maestro (menú, botones y llamadas mutadoras coherentes con `SUPER_ADMIN`, `ADMIN`, `BUSINESS`, `VIEWER`).

### Entidades y datos (vista negocio)

- **Reserva**: identificador legible, cliente, plan o habitación asociada, fechas, ocupantes, montos, estado operativo, estado de pago, snapshot de actividades base, opcionales contratadas, historial de estados.
- **Plan**: nombre, descripción comercial, precio base, medios, actividades base ordenadas, opcionales vinculadas y flags de pre-selección.
- **Actividad opcional (catálogo)**: nombre, precio o reglas de precio según API, vigencia o estado.
- **Ítem de inventario y proveedor**: identificación, stock y umbrales, relación con movimientos.
- **Movimiento de inventario**: tipo (entrada/salida), cantidad, ítem, notas, instante o usuario actor vía sesión.
- **Reporte**: parámetros de rango, series o tablas devueltas por el API, exportación.

## Criterios de éxito *(obligatorio)*

### Resultados medibles y agnósticos de tecnología

- **SC-001**: Un operador capacitado completa **filtro + apertura de detalle + exportación** de un subconjunto de reservas en **menos de cinco minutos** en condiciones normales de red de oficina, o ve mensajes de carga/error explícitos en cada paso.
- **SC-002**: En pruebas de rol, **cero** acciones mutadoras de reserva completadas por usuarios **`VIEWER`** (bloqueo por UI y/o rechazo del servidor documentado).
- **SC-003**: Tras una acción de confirmación o cancelación autorizada, el **detalle de la reserva** refleja el nuevo estado tras **refresco explícito o automático** (p. ej. re-fetch o spinner de “actualizado”) claramente indicado al usuario, sin contradicción con el API.
- **SC-004**: El **reporte de planes** o su degradación controlada está disponible para roles con acceso a reportes; si un agregado no existe en backend, el usuario ve **mensaje explícito**, no cifras sustitutas.
- **SC-005**: En inventario, **100%** de los movimientos registrados por un usuario autorizado aparecen en el **historial consultable en UI** con el mismo ítem y signo/cantidad que devuelve el API tras la operación y en las consultas posteriores al listado de movimientos.

## Supuestos

- Los **endpoints y reglas** de reservas, planes, inventario y reportes del backend **ya existen** o se completan en paralelo según contratos previos del proyecto; el portal **no** sustituye validaciones de negocio del servidor.
- La **Semana 6** entrega o está alineada el **shell del portal** (login, layout, guards, rutas `/admin/*` y consumo de API con el mismo modelo de sesión acordado).
- Los formatos de exportación cumplen expectativas de **recepción y gerencia** (apertura en herramientas de hoja de cálculo estándar y lectura humana del delimitado).
- **Verificación (Semana 7)**: el backlog de esta entrega incluye **tests automatizados de servicios** (HTTP mockeado) para reservas, planes e inventario según `tasks.md`. Los **tests de integración extremo-a-extremo** (Angular + API real en CI) y **e2e** del portal quedan **fuera del alcance obligatorio de la semana** salvo acuerdo explícito del equipo; la constitución del proyecto sigue exigiendo integración para **módulos críticos del backend** en su propio repositorio/pipeline.

## Riesgos y dependencias

- **Dependencia**: disponibilidad de **agregados de reportes** (especialmente “planes”) y de **políticas de cancelación** en el API; si faltan, se acota alcance con el negocio y se cumple FR-020.
- **Riesgo**: operaciones masivas o conjuntos muy grandes de reservas pueden afectar tiempos de exportación; la mitigación en portal está en **FR-003** (feedback explícito al usuario).
- **Riesgo**: discrepancia entre expectativas del plan diario y la **matriz de roles**; esta especificación **prioriza el maestro §6** para permisos.

## Fuera de alcance explícito (recordatorio)

CMS completo, usuarios del portal, ajustes finos de landing, integraciones externas no descritas, cambios de pasarela fuera de flujos ya expuestos por API.
