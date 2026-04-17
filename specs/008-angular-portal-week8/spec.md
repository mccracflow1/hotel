# Especificación: Portal Semana 8 — CMS completo, usuarios, configuración e inicio de sitio público (landing)

**Rama sugerida**: `008-angular-portal-week8`  
**Creado**: 2026-04-17  
**Estado**: Borrador  
**Fuentes**: `plan_trabajo.md` (Semana 8 · FASE 3 → 4, días 36–40), `CONTEXTO_MAESTRO.md` (§5 URLs, §6 RBAC, §11 C4/C5, §17 CMS, §7 `site_content` / `faqs` / `business_config` / `users`, principios de idempotencia y auditoría donde aplique)

## Resumen ejecutivo

Esta entrega cierra el **MVP de Fase 3** del plan maestro: el **portal de administración** incorpora los módulos que faltan para que el hotel **autogestione medios, textos del sitio, usuarios internos y parámetros del negocio** sin desarrollador, y se inicia el **sitio público del hotel (landing)** con todas las secciones principales **alimentadas por datos del sistema** (contenido editorial, habitaciones y planes activos, galería, preguntas frecuentes, contacto y mapa).

El trabajo se alinea al desglose diario de la **Semana 8** del `plan_trabajo.md` (días 36 a 40) y a la arquitectura y matriz de permisos del `CONTEXTO_MAESTRO.md`.

## Dependencias y precondiciones

- **Portal base (Semanas 6–7)**: autenticación, layout, dashboard, habitaciones, disponibilidad, reservas, planes, opcionales, inventario y reportes operativos según lo acordado para Semana 7.
- **Contrato de datos**: existencia (o entrega en paralelo) de las capacidades del servidor descritas en el maestro para **subida y listado de medios**, **contenido del sitio por sección**, **FAQs**, **usuarios del portal**, **configuración del negocio** y **endpoints públicos de lectura** para la landing. Si algún agregado no está listo, se documentará como riesgo y se acotará la UI con **mensajes explícitos** (sin datos ficticios).
- **Principios transversales** (sin detallar implementación): operaciones sensibles que el negocio defina como no duplicables deben respetar **idempotencia** donde el contrato del sistema ya la exija; credenciales de pasarela y acciones críticas deben quedar **acotadas por rol** según el maestro.

## Alcance incluido (Semana 8)

### A. Biblioteca de medios (portal administrativo)

- Visualización en **cuadrícula** de archivos de imagen y video con **búsqueda** y **filtro por tipo**.
- **Carga de archivos** mediante selección explícita o arrastre, con **retroalimentación de progreso** durante la subida.
- **Vista previa** de imágenes y **reproducción** de video dentro de la biblioteca.
- **Selector reutilizable** de medios: desde flujos ya existentes (p. ej. habitaciones o planes), abrir la biblioteca y **elegir** un archivo ya subido en lugar de repetir carga.
- **Acciones sobre ítems**: renombrar, eliminar con **validación de uso** (no eliminar si está referenciado sin confirmación de impacto o si el negocio lo prohíbe), **copiar URL pública** utilizable en otros flujos.

### B. Contenido del sitio y FAQs (portal administrativo)

- Formulario de **cabecera principal (hero)**: título, subtítulo, texto de llamada a la acción, imagen de fondo asociada a un medio del sistema.
- Formulario de **datos de contacto**: teléfono, WhatsApp, correo, dirección, horarios y **enlaces de redes** según el modelo de contenido acordado.
- **Gestor de preguntas frecuentes**: listado **ordenable**, altas/edición/baja lógica con **activación** explícita.
- **Previsualización** del impacto visual del contenido en el sitio público **antes de publicar** cambios relevantes (al menos para bloques principales del hero y contacto).
- **Galería general del hotel**: cuadrícula con **reordenamiento** y **carga múltiple** de imágenes vinculadas a medios.

### C. Usuarios, perfil y configuración (portal administrativo)

- **Listado de usuarios del portal** con rol, estado (activo/inactivo) y **fecha del último acceso** cuando el sistema la provea.
- **Alta y edición de usuarios** con **selector de rol** acotado a los roles que el negocio permite crear para ese operador (p. ej. un administrador general no gestiona superadministradores si así lo define la política).
- **Perfil propio** (cualquier rol con sesión): actualizar **nombre**, **foto de perfil** y **contraseña** con validaciones de seguridad básicas (fortaleza, confirmación).
- **Configuración del negocio**: datos identificatorios del hotel, horarios operativos, **logo**, **colores corporativos** y **credenciales de pago** visibles/editables **solo para roles autorizados** por el maestro.
- **Políticas de cancelación**: tabla editable de **franjas temporales** (horas antes del check-in o equivalente negocio) y **porcentaje de penalidad** por franja, coherente con el modelo de configuración global.

### D. Sitio público — estructura y secciones principales (inicio C5)

- Estructura **responsive** del sitio público con secciones: **cabecera**, **servicios**, **planes**, **galería**, **preguntas frecuentes**, **mapa**, **pie de página**.
- **Cabecera**: imagen y textos desde el contenido gestionado; botones de llamada a la acción que **disparen flujos públicos** previstos (p. ej. explorar planes o contacto) sin requerir sesión de administrador.
- **Servicios**: tarjetas de **habitaciones activas** con foto, nombre, capacidad y precio **desde el sistema**.
- **Planes**: tarjetas de **planes activos** con portada, descripción y lista breve de actividades **desde el sistema**.
- **Metadatos sociales y SEO básicos**: título, descripción e imagen de vista previa coherentes con el contenido publicado.

### E. Sitio público — galería, FAQ, mapa y rendimiento percibido

- **Galería**: cuadrícula adaptable con **ampliación** de imagen (experiencia tipo “lightbox”) accesible por teclado en la medida de lo razonable para la semana.
- **FAQ**: acordeón alimentado desde el **listado público** de preguntas activas.
- **Mapa**: incrustación del mapa con **coordenada o URL de incrustación** y datos de contacto provenientes del sistema.
- **Pie de página**: logo, navegación secundaria y redes **desde el mismo origen de datos** que el contacto.
- **Carga eficiente de imágenes**: carga diferida (*lazy loading*) de recursos no críticos en el primer viewport; formatos modernos con **alternativa** para navegadores antiguos cuando el pipeline de medios lo permita.

## Alcance excluido (Semana 9 o posteriores)

- **Página de detalle de plan por slug**, **formulario completo de reserva web**, **checkout público** y **widget de chat** (Semana 9 en `plan_trabajo.md`).
- **Servidor MCP**, **automatizaciones n8n** y **WhatsApp Business** como canal de venta integrado.
- **Despliegue productivo** (DNS, CDN, certificados) salvo notas de verificación manual ya habituales en quickstart.
- **Auditoría completa** y **reconciliación de pagos** como módulos de producto (solo se mencionan si el maestro las reserva a superadministrador y no son foco de Semana 8).

## Reglas de autoridad (matriz §6 — resumen operativo)

- **CMS (medios y contenido)**: solo roles **administrativos** habilitados en el maestro (`SUPER_ADMIN`, `ADMIN`); personal operativo y solo lectura **no** publican ni borran medios globales.
- **Usuarios del portal**: gestión por **administradores**; reglas de **quién puede crear o desactivar** a otro administrador o superadministrador según política explícita del maestro.
- **Configuración del negocio y credenciales de pago**: acceso **restringido**; en particular, **credenciales de pasarela** solo donde el maestro lo permita (típicamente **superadministrador**).
- **Perfil propio**: todos los roles autenticados **pueden** ajustar su perfil básico y credenciales de acceso propias.
- **Sitio público**: **lectura** de datos públicos; **ninguna** mutación de negocio desde visitantes sin autenticación en esta semana.

## User Scenarios & Testing *(obligatorio)*

### Historia de usuario 1 — Biblioteca unificada de medios (Prioridad: P1)

**Como** administrador de marketing, **quiero** centralizar fotos y videos **para** reutilizarlos en habitaciones, planes y la web pública sin duplicar archivos ni perder control de derechos de uso.

**Prueba independiente**: Subir tipos de archivo permitidos; buscar y filtrar; previsualizar; renombrar; intentar borrar un medio en uso y ver el bloqueo o advertencia; copiar URL; abrir el selector desde otro flujo y adjuntar un existente.

**Escenarios de aceptación**:

1. **Dado** la biblioteca, **cuando** el usuario sube uno o varios archivos válidos, **entonces** ve progreso y, al completarse, los ítems aparecen en la cuadrícula con tipo discernible.
2. **Dado** un conjunto grande de medios, **cuando** busca por nombre o filtra por tipo, **entonces** el resultado se reduce en tiempo razonable de interacción o muestra vacío explícito.
3. **Dado** un medio referenciado por habitación, plan o galería, **cuando** intenta eliminarlo, **entonces** el sistema **impide o advierte** con explicación antes de confirmar.
4. **Dado** el flujo de edición de una habitación o plan, **cuando** elige “elegir de biblioteca”, **entonces** puede insertar un medio existente sin volver a subirlo.

---

### Historia de usuario 2 — Contenido del sitio y FAQs sin desarrollador (Prioridad: P1)

**Como** responsable comercial, **quiero** actualizar textos, hero, contacto, galería y preguntas frecuentes **para** reflejar promociones y datos reales sin pedir cambios de código.

**Prueba independiente**: Editar hero y contacto; reordenar FAQs; activar/desactivar una FAQ; subir galería múltiple y reordenar; usar previsualización antes de guardar.

**Escenarios de aceptación**:

1. **Dado** el editor de hero, **cuando** guarda título, subtítulo, CTA e imagen de fondo válidos, **entonces** el sitio público muestra los mismos valores tras refresco o ventana de previsualización.
2. **Dado** el bloque de contacto, **cuando** actualiza teléfono, WhatsApp, correo y redes, **entonces** esos datos aparecen coherentemente en la landing (footer y sección de contacto).
3. **Dado** el listado de FAQs, **cuando** reordena entradas activas, **entonces** el orden público coincide con el guardado.
4. **Dado** una FAQ en borrador o inactiva, **cuando** el visitante abre la landing, **entonces** no aparece en el acordeón público.
5. **Dado** cambios extensos, **cuando** usa la previsualización, **entonces** ve una aproximación fiel del resultado antes de confirmar publicación.

---

### Historia de usuario 3 — Gobierno de accesos y configuración del negocio (Prioridad: P1)

**Como** director del hotel, **quiero** delegar cuentas del portal y ajustar políticas y apariencia del negocio **para** alinear operación, facturación y marca.

**Prueba independiente**: Crear usuario con rol acotado; desactivar usuario; editar perfil propio; actualizar `business_config` visible; intentar editar credenciales de pago con rol no autorizado; editar tabla de políticas de cancelación.

**Escenarios de aceptación**:

1. **Dado** el listado de usuarios, **cuando** un administrador autorizado crea una cuenta, **entonces** el nuevo usuario puede iniciar sesión o recibe flujo de activación según defina el producto, y aparece en el listado con rol y estado correctos.
2. **Dado** la política de roles, **cuando** un administrador intenta crear o modificar un **superadministrador** sin permiso, **entonces** la interfaz o el servidor lo impiden con mensaje claro.
3. **Dado** la pantalla de perfil, **cuando** el usuario cambia nombre, foto o contraseña con datos válidos, **entonces** los cambios persisten y la sesión se comporta de forma segura (p. ej. solicitud de reautenticación si el producto lo define).
4. **Dado** la configuración del negocio, **cuando** un rol autorizado actualiza nombre del hotel, horarios, logo y color primario, **entonces** la landing y el portal reflejan la marca actualizada en los lugares previstos.
5. **Dado** las credenciales de pago, **cuando** un rol no privilegiado accede a la pantalla, **entonces** no ve campos sensibles o no puede guardarlos.
6. **Dado** la tabla de políticas de cancelación, **cuando** edita franjas y porcentajes, **entonces** el cálculo mostrado al personal en cancelaciones de reserva (flujos ya existentes) se alinea a la nueva configuración **sin contradicciones** con el servidor.

---

### Historia de usuario 4 — Sitio público creíble y navegable (Prioridad: P1)

**Como** visitante potencial, **quiero** entender servicios, planes y cómo contactar **para** decidir una estadía en menos de unos minutos de navegación.

**Prueba independiente**: Navegar en escritorio y móvil; verificar que cada sección tiene datos reales o mensaje de “contenido pendiente”; compartir enlace social y ver título/descripción/imagen razonables.

**Escenarios de aceptación**:

1. **Dado** la landing, **cuando** el visitante recorre hero, servicios y planes, **entonces** ve al menos una disposición clara con datos del sistema o mensajes explícitos de vacío.
2. **Dado** habitaciones activas en el sistema, **cuando** abre la sección de servicios, **entonces** ve capacidad y precio coherentes con el catálogo interno.
3. **Dado** planes activos, **cuando** abre la sección de planes, **entonces** ve portada, descripción y un resumen de actividades alineado al catálogo.
4. **Dado** el enlace compartido en una red social, **cuando** se genera la vista previa, **entonces** título, descripción e imagen no están vacíos si el contenido existe.

---

### Historia de usuario 5 — Galería, ayuda, ubicación y rendimiento (Prioridad: P2)

**Como** visitante en conexión móvil, **quiero** ver fotos y respuestas rápidas sin esperas innecesarias **para** confiar en el establecimiento.

**Prueba independiente**: Abrir galería y FAQ; expandir mapa; medir subjetivamente que imgenes fuera de pantalla no bloquean la interacción inicial; verificar fallback de formato de imagen.

**Escenarios de aceptación**:

1. **Dado** la galería, **cuando** el visitante abre y cierra el ampliado de una foto, **entonces** puede volver al listado sin perder el contexto de página.
2. **Dado** FAQs públicas, **cuando** expande una pregunta, **entonces** ve la respuesta completa y puede colapsarla.
3. **Dado** la sección de mapa, **cuando** el sistema tiene coordenada o URL de incrustación, **entonces** el visitante ve el mapa o un mensaje explícito si falta configuración.
4. **Dado** imágenes por debajo del primer pantallazo, **cuando** hace scroll, **entonces** las imágenes se cargan al aproximarse (carga diferida) sin romper el diseño.

---

## Requirements *(obligatorio)*

### Funcionales — Medios

- **FR-001**: El sistema **debe** permitir listar medios con metadatos mínimos (nombre, tipo, tamaño aproximado o fecha) para usuarios con permiso de biblioteca.
- **FR-002**: El sistema **debe** permitir subir archivos de imagen y video dentro de los **límites de tamaño y formatos** definidos por el negocio, rechazando el resto con mensaje comprensible.
- **FR-003**: El sistema **debe** mostrar **progreso** de subida mientras el archivo no haya finalizado.
- **FR-004**: El sistema **debe** ofrecer **vista previa** de imagen y reproducción de video para ítems de la biblioteca.
- **FR-005**: El sistema **debe** exponer un **selector** reutilizable de medios usable desde otros módulos del portal para adjuntar un archivo existente.
- **FR-006**: El sistema **debe** permitir **renombrar** un medio y **copiar** su URL pública cuando aplique política de enlaces.
- **FR-007**: El sistema **debe** impedir o advertir con **impacto** antes de **eliminar** un medio referenciado por otro recurso del negocio.

### Funcionales — Contenido y FAQs

- **FR-008**: El sistema **debe** permitir editar los campos del **hero** acordados (título, subtítulo, CTA, imagen de fondo vía medio).
- **FR-009**: El sistema **debe** permitir editar el bloque de **contacto y redes** de forma coherente con el modelo `site_content` / equivalente.
- **FR-010**: El sistema **debe** permitir CRUD de FAQs con **orden explícito** y **activación/inactivación**.
- **FR-011**: El sistema **debe** permitir **previsualizar** el resultado de los cambios principales del sitio antes de confirmarlos.
- **FR-012**: El sistema **debe** permitir gestionar la **galería general** con reordenamiento y carga múltiple.

### Funcionales — Usuarios y perfil

- **FR-013**: El sistema **debe** listar usuarios del portal con rol, estado y último acceso cuando el dato exista.
- **FR-014**: El sistema **debe** permitir crear y actualizar usuarios con **rol seleccionable** dentro de los límites del operador actual.
- **FR-015**: El sistema **debe** impedir que un operador **violet políticas de elevación** (p. ej. crear o editar superadministrador sin autorización).
- **FR-016**: El sistema **debe** permitir a cada usuario autenticado actualizar **nombre**, **foto de perfil** y **contraseña** con validaciones de formato y confirmación.

### Funcionales — Configuración

- **FR-017**: El sistema **debe** permitir editar datos identificatorios del hotel, horarios, logo y color primario a roles autorizados.
- **FR-018**: El sistema **debe** restringir la visibilidad y edición de **credenciales de pasarela de pago** a los roles definidos en el maestro.
- **FR-019**: El sistema **debe** permitir editar la **tabla de políticas de cancelación** como estructura de franjas y porcentajes interpretable por el módulo de reservas.

### Funcionales — Sitio público

- **FR-020**: El sistema **debe** publicar una landing con las secciones acordadas: hero, servicios, planes, galería, FAQ, mapa y pie.
- **FR-021**: El sistema **debe** poblar **servicios** con habitaciones activas y datos visibles de capacidad y precio desde el catálogo.
- **FR-022**: El sistema **debe** poblar **planes** con planes activos, portada y descripción desde el catálogo.
- **FR-023**: El sistema **debe** exponer **metadatos** de título, descripción e imagen social coherentes con el contenido publicado.
- **FR-024**: El sistema **debe** mostrar **FAQ pública** solo con entradas activas, en orden configurado.
- **FR-025**: El sistema **debe** incrustar mapa según URL o coordenadas provistas por configuración.
- **FR-026**: El sistema **debe** mostrar **pie de página** con logo, enlaces de navegación secundaria y redes a partir de la misma fuente de verdad que contacto.
- **FR-027**: El sistema **debe** aplicar **carga diferida** de imágenes no críticas al primer pantallazo y proveer **fallback** de formato cuando el negocio genere variantes.

### No funcionales y seguridad (mínimos de la semana)

- **FR-028**: Las mutaciones de contenido, usuarios y configuración **deben** quedar sujetas a **autenticación** y **autorización** según matriz.
- **FR-029**: Las acciones destructivas (borrado de medios, desactivación de usuarios) **deben** requerir **confirmación explícita** del operador.
- **FR-030**: Los textos de error **deben** ser comprensibles para personal no técnico (sin códigos crudos como única información).

### Key Entities

- **Medio (biblioteca)**: identificador, nombre visible, tipo, URLs de reproducción o miniatura, estado de uso referenciado.
- **Contenido del sitio (`site_content` o equivalente)**: pares sección/clave/valor con tipo de dato (texto, URL de imagen, lista estructurada, texto enriquecido).
- **FAQ**: pregunta, respuesta, orden, activo.
- **Usuario del portal**: identidad, rol, estado, metadatos de acceso.
- **Configuración del negocio**: datos legales y operativos, branding, políticas de cancelación estructuradas, credenciales de integración de pago (solo roles elevados).

## Success Criteria *(obligatorio)*

### Resultados medibles

- **SC-001**: El **100%** de las secciones obligatorias de la landing (hero, servicios, planes, galería, FAQ, mapa, pie) **renderizan** con datos reales del sistema **o** con un **mensaje explícito** de configuración pendiente — nunca cadenas vacías críticas sin explicación.
- **SC-002**: Un administrador de marketing completa **subida + renombrado + copia de URL** de un medio en **men de 3 minutos** en red de oficina típica, sin pasos técnicos externos.
- **SC-003**: Un administrador actualiza **hero y contacto** y verifica el resultado en **previsualización o recarga pública** en **men de 5 minutos** de trabajo efectivo.
- **SC-004**: Un director crea un **nuevo usuario operativo**, inicia sesión con esa cuenta y confirma permisos esperados (acceso permitido y **bloqueo** a módulos restringidos) en **una sesión de verificación**.
- **SC-005**: En dispositivo móvil común, el **primer pantallazo** de la landing permanece utilizable (texto legible y CTA accesible) mientras el resto de imágenes **carga al hacer scroll** sin bloqueos perceptibles de más de **2 segundos** atribuibles solo a imágenes diferidas fuera de vista.
- **SC-006**: **Cero** credenciales de pasarela visibles en texto claro para roles no autorizados en pruebas de matriz documentadas.
- **SC-007**: **Cero** eliminaciones silenciosas de medios en uso: siempre **bloqueo o confirmación con impacto** explícito.

## Assumptions

- El **modelo de permisos** del `CONTEXTO_MAESTRO.md` es la fuente de verdad para CMS, usuarios y configuración; cualquier desviación temporal en el API se negocia explícitamente.
- La **landing** consume **solo lecturas públicas** del sistema; las mutaciones ocurren en el portal autenticado.
- Los **límites de archivo** y el **procesamiento de miniaturas** siguen las políticas ya descritas en el maestro (tamaños máximos, miniaturas automáticas, almacenamiento externo).
- La **coexistencia** de rutas `/admin/*` y rutas públicas en el mismo dominio sigue la regla de enrutado del maestro (el tráfico de administración se sirve bajo el prefijo acordado sin interferir con el sitio público).

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Endpoints de CMS o configuración incompletos | Bloqueo de pantallas | Acotar UI con mensajes claros; priorizar lectura pública mínima para landing |
| Inconsistencia entre matriz maestro y API real | Confusión de QA | Matriz de pruebas por rol documentada en quickstart de la semana |
| Contenido pesado en móvil | Abandono del sitio | SC-005 + lazy loading y compresión según pipeline de medios |

## Trazabilidad con `plan_trabajo.md` (días 36–40)

| Día | Tema | Cobertura en historias / FR |
|-----|------|------------------------------|
| 36 | Biblioteca de medios | US1, FR-001–FR-007 |
| 37 | Contenido del sitio y FAQs | US2, FR-008–FR-012 |
| 38 | Usuarios y configuración | US3, FR-013–FR-019 |
| 39 | Landing estructura y secciones principales | US4, FR-020–FR-023 |
| 40 | Galería, FAQ, mapa, footer, optimización | US5, FR-024–FR-027 |

---

**Listo para**: `/speckit.plan` (o `/speckit.clarify` si el negocio decide cambiar límites de rol o alcance de la landing).
