**SOLICITUD DE SOFTWARE**

**Especificación de Requerimientos del Sistema**

Plataforma de Gestión Hotelera con Inteligencia Artificial

| Nombre del sistema | Plataforma de Gestión Hotelera con IA |
|---|---|
| Versión del documento | 1.0 |
| Fecha de elaboración | Abril 2026 |
| Preparado por | Hector Fabian Rodriguez — Principal Software Architect |
| Dirigido a | Equipo de desarrollo — Área técnica |
| Tipo de documento | Solicitud de Software / Especificación de Requerimientos (SRS) |
| URL Pública | www.[dominio].com  →  Landing page del hotel |
| URL Administración | www.[dominio].com/admin  →  Portal de gestión |

# 1. PROPÓSITO DEL DOCUMENTO
Este documento describe de forma completa y no ambigua todos los requerimientos funcionales, de contenido y de comportamiento que debe cumplir el sistema de software a desarrollar. Está dirigido al equipo de desarrollo como guía de construcción y sirve también como contrato funcional entre el cliente y el proveedor de software.

El sistema se compone de tres elementos que funcionan de forma integrada:

| Elem. | Componente | Descripción |
|---|---|---|
| 01 | Landing Page pública | Sitio web del hotel accesible desde www.[dominio].com. Es la vitrina digital para clientes finales, con información de servicios, planes, galería y acceso al asistente de IA. |
| 02 | Portal de Administración | Aplicación web accesible desde www.[dominio].com/admin. Es el panel de control completo del negocio: reservas, habitaciones, planes, inventario, usuarios, contenido y configuración. |
| 03 | API (Interfaz de Programación) | Servicio de datos que alimenta tanto la landing como el portal admin, gestiona archivos multimedia, expone las operaciones del negocio al agente de IA y centraliza toda la lógica del sistema. |

# 2. ESTRUCTURA DE URLS Y ACCESO
Todo el sistema opera bajo un único dominio. La separación entre la parte pública y la parte privada se hace a través de rutas (paths) del mismo dominio.

| URL | A qué sirve | Quién puede acceder |
|---|---|---|
| www.[dominio].com | Landing page pública del hotel | Cualquier persona en internet sin autenticación |
| www.[dominio].com/[nombre-plan] | Detalle público de un plan específico | Cualquier persona — URL compartible |
| www.[dominio].com/admin | Pantalla de inicio de sesión del portal | Cualquier visitante (sin sesión activa, solo ve el login) |
| www.[dominio].com/admin/dashboard | Dashboard principal del portal | Usuarios autenticados con cualquier rol |
| www.[dominio].com/admin/[modulo] | Acceso a módulos del portal | Usuarios autenticados según su rol |
| www.[dominio].com/api/v1/[recurso] | Endpoints del API (datos) | Sistemas autorizados (portal, landing, agente IA) |

| ℹ️ Nota importante:  La landing y el portal admin son la misma aplicación desde el punto de vista técnico (mismo servidor, mismo dominio). La ruta /admin protege todas sus páginas con autenticación: si un usuario no ha iniciado sesión y visita /admin/[cualquier-cosa], el sistema lo redirige automáticamente a /admin (pantalla de login). |
|---|

# 3. ROLES Y PERMISOS DE USUARIO
El sistema define cuatro tipos de usuario. Cada uno tiene acceso a un conjunto diferente de funcionalidades dentro del portal de administración.

| Rol | Nombre visible | Qué puede hacer |
|---|---|---|
| SUPER_ADMIN | Superadministrador | Todo lo del Administrador General + gestión de otros administradores + configuración global del sistema + acceso a logs de auditoría completos + cambio de credenciales de pasarela de pagos. |
| ADMIN | Administrador General | Acceso completo a todos los módulos: habitaciones, planes, reservas, inventario, usuarios (excepto superadmin), reportes, configuración del negocio y gestión de contenido multimedia. |
| BUSINESS | Operaciones | Gestión de reservas (crear, modificar, cancelar), consulta y ajuste de disponibilidad, registro de movimientos de inventario, visualización de reportes. No puede modificar precios ni crear usuarios. |
| VIEWER | Solo lectura | Puede consultar reservas, disponibilidad, reportes e inventario. No puede crear, modificar ni eliminar ningún registro. Ideal para socios o inversionistas. |

El portal de administración debe mostrar únicamente las secciones y botones a los que tiene acceso el usuario autenticado. Un usuario con rol VIEWER no debe ver botones de "Crear", "Editar" o "Eliminar" en ninguna parte de la interfaz.

# 4. MÓDULOS DEL PORTAL DE ADMINISTRACIÓN
El portal de administración agrupa sus funcionalidades en módulos accesibles desde un menú lateral. A continuación se describe cada módulo con sus pantallas y las operaciones que debe permitir.

| 4.1  Inicio de Sesión |
|---|

Pantalla de acceso al portal, disponible en www.[dominio].com/admin.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-001 | La pantalla de login debe solicitar correo electrónico y contraseña. | Alta | Funcional |
| RF-002 | Debe mostrar un mensaje de error claro cuando las credenciales sean incorrectas, sin indicar cuál de los dos campos es el incorrecto (seguridad). | Alta | Funcional |
| RF-003 | Debe incluir la opción 'Olvidé mi contraseña', que envía un enlace de restablecimiento al correo del usuario. | Alta | Funcional |
| RF-004 | La sesión debe mantenerse activa mientras el usuario esté navegando. Después de 2 horas de inactividad, el sistema debe cerrar la sesión automáticamente y redirigir al login. | Alta | Funcional |
| RF-005 | Si un usuario sin sesión activa intenta acceder a cualquier ruta bajo /admin, debe ser redirigido automáticamente a la pantalla de login. | Alta | Funcional |
| RF-006 | Debe ser posible cerrar sesión desde cualquier pantalla del portal mediante un botón visible en la barra superior. | Alta | Funcional |

| 4.2  Dashboard — Pantalla Principal |
|---|

Primera pantalla que ve el usuario después de iniciar sesión. Ofrece una vista general del estado del negocio en tiempo real.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-007 | El dashboard debe mostrar los siguientes indicadores numéricos del día actual: número de reservas nuevas, número de reservas confirmadas, ingresos del día (suma de pagos confirmados) y número de ocupaciones activas. | Alta | Funcional |
| RF-008 | Debe incluir una gráfica de barras con la ocupación de los últimos 7 días, diferenciando por tipo de servicio (habitaciones, pasadías, planes). | Media | Funcional |
| RF-009 | Debe mostrar una lista de las próximas 10 reservas (ordenadas por fecha de llegada más próxima), con nombre del cliente, servicio reservado, fecha de llegada y estado del pago. | Alta | Funcional |
| RF-010 | Debe mostrar alertas de inventario: ítems cuyo stock actual esté por debajo del mínimo configurado, con el nombre del ítem y la cantidad actual. | Alta | Funcional |
| RF-011 | Los indicadores numéricos deben actualizarse automáticamente cada 30 segundos sin necesidad de recargar la página. | Media | Funcional |

| 4.3  Gestión de Habitaciones y Servicios |
|---|

Permite administrar el catálogo de espacios y servicios del hotel: cabañas, habitaciones, pasadías, cuatrimotos, restaurante y cualquier otro servicio que el negocio ofrezca.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-012 | El listado de habitaciones/servicios debe mostrar: nombre, tipo (cabaña/pasadía/servicio adicional), capacidad máxima, precio base, estado (activo/inactivo) y una miniatura de la foto principal. | Alta | Funcional |
| RF-013 | Debe ser posible crear una nueva habitación o servicio con los siguientes campos: nombre, tipo, descripción detallada, capacidad máxima de personas, precio base por noche (o por persona para pasadías), estado activo/inactivo. | Alta | Funcional |
| RF-014 | Cada habitación o servicio debe poder tener múltiples fotos. El usuario debe poder subir fotos desde su equipo, reordenarlas arrastrando, definir cuál es la foto principal y eliminar fotos individuales. | Alta | Funcional |
| RF-015 | Cada habitación o servicio debe poder tener un video promocional opcional. El usuario puede subir un archivo de video o pegar un enlace de YouTube/Vimeo. | Media | Funcional |
| RF-016 | Las fotos deben almacenarse a través del API. El sistema debe generar automáticamente una versión reducida (thumbnail) de cada foto para optimizar la carga en listados. | Alta | Funcional |
| RF-017 | Debe ser posible gestionar las amenidades (comodidades incluidas) de cada habitación mediante etiquetas. Ejemplos: Wi-Fi, Aire Acondicionado, Piscina Privada, Vista al río, Zona BBQ. | Alta | Funcional |
| RF-018 | Debe ser posible activar o desactivar una habitación/servicio con un interruptor. Las habitaciones inactivas no aparecen en la landing ni están disponibles para reservas. | Alta | Funcional |
| RF-019 | Debe ser posible buscar y filtrar el listado por nombre, tipo y estado. | Media | Funcional |

| 4.4  Gestión de Planes |
|---|

Los planes son paquetes de experiencias que el hotel ofrece a sus clientes. Cada plan tiene un conjunto de actividades incluidas que no pueden ser removidas, y puede tener actividades adicionales opcionales que el cliente puede agregar al momento de reservar.

| 📌 Concepto clave:  Un Plan es diferente a una Habitación. Una habitación es un espacio físico. Un Plan es una experiencia completa que puede incluir alojamiento, alimentación, actividades y más. Un plan puede estar asociado a una habitación específica, a un tipo de habitación, o ser completamente independiente (ej: plan de pasadía sin alojamiento). |
|---|

### 4.4.1 Catálogo de Planes
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-020 | El listado de planes debe mostrar: nombre del plan, precio base, estado (activo/inactivo), número de actividades incluidas, número de actividades opcionales disponibles y una miniatura de la imagen de portada. | Alta | Funcional |
| RF-021 | Debe ser posible crear un nuevo plan con los siguientes campos obligatorios: nombre, descripción corta (para listados), descripción larga (para la página de detalle), precio base, número máximo de personas, noches mínimas (si aplica), imagen de portada, estado activo/inactivo. | Alta | Funcional |
| RF-022 | Cada plan debe poder tener una galería de hasta 10 imágenes y un video opcional, gestionados de la misma forma que las habitaciones. | Alta | Funcional |
| RF-023 | Un plan puede estar vinculado a una habitación/cabaña específica, o puede ser independiente. Si está vinculado, el sistema debe verificar disponibilidad de esa habitación al momento de la reserva. | Alta | Funcional |
| RF-024 | El precio base del plan puede ser por persona, por grupo o por noche. El administrador debe poder seleccionar la unidad de cobro al crear el plan. | Alta | Funcional |
| RF-025 | Debe ser posible duplicar un plan existente para usarlo como base de uno nuevo. | Media | Funcional |

### 4.4.2 Actividades Base (incluidas en el plan)
Las actividades base son los ítems que forman parte del plan y que el cliente recibe siempre al reservarlo. No pueden ser removidas por el cliente al momento de reservar, ni modificadas después de que una reserva con ese plan esté confirmada.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-026 | Dentro del formulario de un plan, debe haber una sección 'Actividades incluidas' donde el administrador puede agregar, editar y eliminar actividades base. Ejemplos: 'Desayuno para 2 personas', 'Tour por el río (2 horas)', 'Acceso a piscina'. | Alta | Funcional |
| RF-027 | Cada actividad base debe tener: nombre, descripción opcional, si está incluida en el precio base o tiene un costo adicional (y cuánto), y un campo de orden para definir cómo se muestran. | Alta | Funcional |
| RF-028 | Las actividades base de un plan solo pueden ser modificadas o eliminadas por el administrador desde el portal admin, nunca por el cliente. Al modificar una actividad base de un plan, las reservas ya confirmadas con ese plan NO se ven afectadas — se guarda un historial de lo que tenía el plan al momento de la reserva. | Alta | Funcional |
| RF-029 | El administrador puede agregar o eliminar actividades base de un plan en cualquier momento, incluso si el plan ya tiene reservas futuras. El sistema debe mostrar una advertencia indicando cuántas reservas futuras se verán afectadas por el cambio. | Alta | Funcional |

### 4.4.3 Actividades Opcionales (el cliente puede agregar)
Las actividades opcionales son un catálogo de extras que el hotel ofrece y que el cliente puede seleccionar al momento de reservar un plan. No reemplazan las actividades base: se suman a ellas.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-030 | Debe existir un catálogo global de actividades opcionales (independiente de los planes). Ejemplos: 'Paseo en cuatrimoto (1 hora)', 'Cena romántica', 'Masaje relajante', 'Clase de pesca'. | Alta | Funcional |
| RF-031 | Cada actividad opcional del catálogo debe tener: nombre, descripción, precio, unidad de cobro (por persona / por grupo / por sesión), duración estimada, capacidad máxima, foto opcional y estado activo/inactivo. | Alta | Funcional |
| RF-032 | Dentro del formulario de un plan, debe haber una sección 'Actividades opcionales disponibles' donde el administrador selecciona cuáles del catálogo global están disponibles para ese plan específico. | Alta | Funcional |
| RF-033 | El administrador puede marcar una o varias actividades opcionales como 'seleccionada por defecto' dentro de un plan. Esto significa que al reservar ese plan, esa actividad aparecerá pre-seleccionada (aunque el cliente puede desmarcarla). | Media | Funcional |
| RF-034 | El cliente nunca puede ver ni agregar actividades opcionales que no hayan sido asociadas al plan que está reservando. La visibilidad de opcionales está controlada completamente por el administrador. | Alta | Funcional |
| RF-035 | Al reservar un plan, el precio total que ve el cliente debe calcularse en tiempo real: precio base del plan + precio de las actividades opcionales seleccionadas. | Alta | Funcional |

| 4.5  Gestión de Disponibilidad |
|---|

Permite al administrador controlar cuándo y cuántos cupos están disponibles para cada habitación, servicio o plan.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-036 | El módulo de disponibilidad debe presentar un calendario mensual donde cada celda (día) muestra el porcentaje de ocupación de las habitaciones/servicios/planes activos. | Alta | Funcional |
| RF-037 | Al hacer clic en una celda del calendario, debe abrirse un panel con el detalle de disponibilidad de ese día: lista de habitaciones/planes con su cupo total, cupos reservados y cupos libres. | Alta | Funcional |
| RF-038 | Debe ser posible bloquear fechas para una habitación o plan específico (ej: mantenimiento, evento privado) con una razón de bloqueo. | Alta | Funcional |
| RF-039 | Debe ser posible configurar cupos base por temporada (ej: del 15 de junio al 31 de julio, las cabañas tienen precio de temporada alta). Esta configuración afecta los precios que ve el cliente en la landing. | Alta | Funcional |
| RF-040 | El sistema debe impedir que se confirme una reserva para una fecha/habitación que no tiene cupos disponibles, incluso si dos personas intentan reservar simultáneamente. | Alta | Funcional |
| RF-041 | El administrador puede navegar entre meses del calendario con flechas anterior/siguiente y puede ir directamente a un mes específico mediante un selector. | Media | Funcional |

| 4.6  Gestión de Reservas |
|---|

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-042 | El listado de reservas debe mostrar: número de reserva, nombre del cliente, teléfono, servicio/plan reservado, fecha de llegada, fecha de salida, número de personas, monto total, estado de la reserva y estado del pago. | Alta | Funcional |
| RF-043 | Deben existir filtros para el listado: por estado (Pendiente, Pago Pendiente, Confirmada, Cancelada), por rango de fechas, por habitación/plan y por nombre o número de reserva. | Alta | Funcional |
| RF-044 | El administrador debe poder crear una reserva manual (para clientes que llaman por teléfono o llegan en persona) con todos los mismos campos que una reserva web. | Alta | Funcional |
| RF-045 | Al ver el detalle de una reserva, debe mostrarse: todos los datos del cliente, el plan o habitación reservados, las actividades base del plan (snapshot al momento de reservar), las actividades opcionales seleccionadas, el historial de cambios de estado y la información de pago. | Alta | Funcional |
| RF-046 | El administrador puede realizar las siguientes acciones sobre una reserva: Confirmar (marcar como confirmada sin pago electrónico), Generar link de pago (MercadoPago), Modificar fechas (si hay disponibilidad), Agregar actividades opcionales, Cancelar (con selección de motivo y visualización de penalidad según política). | Alta | Funcional |
| RF-047 | El sistema debe mostrar claramente el estado del pago de cada reserva: Sin pago, Pago pendiente (link enviado), Pagado parcialmente, Pagado completo. | Alta | Funcional |
| RF-048 | Debe ser posible exportar el listado de reservas filtradas a formato Excel o CSV. | Media | Funcional |
| RF-049 | El sistema debe asignar automáticamente un número de reserva único al momento de la creación, con formato legible (ej: HT-2026-00847). | Alta | Funcional |

| 4.7  Gestión de Inventario e Insumos |
|---|

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-050 | El listado de inventario debe mostrar: nombre del ítem, categoría, unidad de medida, stock actual, stock mínimo y una indicación visual (ícono o color) cuando el stock esté por debajo del mínimo. | Alta | Funcional |
| RF-051 | Debe ser posible crear ítems de inventario con: nombre, categoría (Alimentos, Bebidas, Limpieza, Mantenimiento, Otro), unidad de medida, stock actual, stock mínimo y proveedor asociado. | Alta | Funcional |
| RF-052 | Debe ser posible registrar movimientos de inventario: Entrada (compra o reposición) y Salida (consumo o pérdida). Cada movimiento debe registrar cantidad, tipo, fecha, responsable y notas opcionales. | Alta | Funcional |
| RF-053 | Debe existir una vista de historial de movimientos por ítem, con filtro por tipo de movimiento y rango de fechas. | Media | Funcional |
| RF-054 | Debe existir un módulo de proveedores con: nombre, teléfono, correo, productos que provee y notas. Los ítems de inventario pueden asociarse a un proveedor. | Media | Funcional |
| RF-055 | El dashboard debe mostrar un resumen de ítems con stock bajo. La lista de ítems críticos también debe ser accesible desde el módulo de inventario con un filtro. | Alta | Funcional |

| 4.8  Gestión de Contenido Multimedia (CMS) |
|---|

El portal de administración funciona también como gestor de contenido del sitio web. Desde aquí el administrador controla toda la información que aparece en la landing page: textos, imágenes, videos, FAQs y configuración visual.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-056 | Debe existir un módulo 'Contenido del Sitio' donde el administrador pueda editar los textos principales de la landing: título principal, subtítulo, descripción del hotel, llamada a la acción (CTA) del botón principal. | Alta | Funcional |
| RF-057 | Debe ser posible gestionar la imagen hero (banner principal) de la landing: subir una nueva imagen, recortarla y previsualizarla antes de publicar. | Alta | Funcional |
| RF-058 | Debe existir una sección de galería general del hotel (independiente de habitaciones o planes) donde el administrador puede subir, reordenar y eliminar fotos que aparecerán en la sección de galería de la landing. | Alta | Funcional |
| RF-059 | El sistema debe aceptar los siguientes formatos de imagen: JPG, PNG, WebP. Tamaño máximo por archivo: 10 MB. El sistema debe rechazar archivos que superen este tamaño con un mensaje claro. | Alta | Funcional |
| RF-060 | El sistema debe aceptar los siguientes formatos de video: MP4, MOV, AVI. Tamaño máximo: 200 MB. Alternativamente, el usuario puede ingresar un enlace de YouTube o Vimeo. | Media | Funcional |
| RF-061 | Todas las imágenes subidas al sistema deben ser almacenadas a través del API y servidas desde un CDN o servidor de archivos dedicado, nunca como archivos locales del servidor de la aplicación. | Alta | No Funcional |
| RF-062 | Debe existir una biblioteca de medios centralizada donde el administrador pueda ver todas las imágenes y videos subidos, buscar por nombre, y reutilizar archivos ya subidos en distintos módulos (habitaciones, planes, galería). | Media | Funcional |
| RF-063 | Debe ser posible gestionar las Preguntas Frecuentes (FAQ) que aparecerán en la landing: agregar, editar, eliminar y reordenar preguntas y respuestas. | Alta | Funcional |
| RF-064 | Debe ser posible configurar los datos de contacto que aparecen en la landing: teléfono, WhatsApp, correo, dirección, horarios de atención y enlaces a redes sociales. | Alta | Funcional |
| RF-065 | Los cambios realizados en el módulo de contenido deben reflejarse en la landing page de forma inmediata (o en un máximo de 5 minutos) sin necesidad de acciones adicionales del administrador. | Alta | No Funcional |

| 4.9  Reportes y Analítica |
|---|

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-066 | Reporte de ocupación: muestra la tasa de ocupación por habitación/plan/servicio para un periodo seleccionable. Incluye gráfica de barras y tabla descargable. | Alta | Funcional |
| RF-067 | Reporte de ingresos: muestra los ingresos totales por periodo, desglosados por método de pago (MercadoPago, PSE, manual) y por tipo de servicio. | Alta | Funcional |
| RF-068 | Reporte de reservas: listado completo de reservas con todos sus datos, filtrable por estado, fechas y servicio, exportable a Excel y CSV. | Alta | Funcional |
| RF-069 | Reporte de inventario: muestra los movimientos de inventario por ítem y periodo, con saldo de apertura, entradas, salidas y saldo final. | Media | Funcional |
| RF-070 | Reporte de planes: muestra cuántas reservas ha tenido cada plan, cuáles actividades opcionales son las más seleccionadas y el ingreso promedio por reserva de ese plan. | Media | Funcional |
| RF-071 | Todos los reportes deben permitir seleccionar el rango de fechas con un selector de tipo calendario (desde / hasta). | Alta | Funcional |

| 4.10  Gestión de Usuarios del Portal |
|---|

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-072 | El listado de usuarios debe mostrar: nombre completo, correo, rol asignado, fecha de creación y estado (activo/inactivo). | Alta | Funcional |
| RF-073 | El Administrador General puede crear nuevos usuarios del portal asignándoles nombre, correo, contraseña temporal y rol. El usuario debe cambiar la contraseña en su primer inicio de sesión. | Alta | Funcional |
| RF-074 | El Administrador General puede cambiar el rol de un usuario existente o desactivarlo. Un usuario desactivado no puede iniciar sesión. | Alta | Funcional |
| RF-075 | Cada usuario puede actualizar su propia foto de perfil, nombre y contraseña desde la sección de perfil, sin necesidad de contactar al administrador. | Media | Funcional |
| RF-076 | El sistema debe registrar en un log de auditoría las acciones críticas de cada usuario: creación/modificación/eliminación de reservas, cambios en planes, movimientos de inventario. Este log es visible para el Superadministrador. | Alta | Funcional |

| 4.11  Configuración del Negocio |
|---|

Permite al Administrador General personalizar el comportamiento del sistema según las reglas del negocio.

| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-077 | El administrador puede configurar los datos generales del negocio: nombre del hotel, dirección, teléfonos, correos, logo, favicon y paleta de colores principal (para personalización del portal y la landing). | Alta | Funcional |
| RF-078 | El administrador puede configurar las políticas de cancelación: porcentaje de penalidad según la anticipación (ej: cancelación con más de 72h = 0% penalidad; menos de 24h = 50% penalidad). | Alta | Funcional |
| RF-079 | El administrador puede definir temporadas con rango de fechas y un multiplicador de precio (ej: del 20 dic al 10 ene, precio × 1.4). Las habitaciones y planes deben respetar este multiplicador automáticamente. | Alta | Funcional |
| RF-080 | El administrador puede configurar el horario de check-in y check-out estándar del hotel. Este horario se muestra en la landing y se usa para calcular la duración de las estadías. | Media | Funcional |
| RF-081 | El administrador puede configurar los datos de la pasarela de pagos (clave pública y privada de MercadoPago) desde el portal, sin necesidad de modificar código. | Alta | Funcional |
| RF-082 | El sistema debe ofrecer una sección de 'Notificaciones' donde el administrador puede activar o desactivar los avisos automáticos: notificación de nueva reserva, recordatorio de llegada (X horas antes), aviso de pago confirmado. | Media | Funcional |

# 5. REQUERIMIENTOS DE LA LANDING PAGE PÚBLICA
La landing page es el sitio web público del hotel, accesible desde www.[dominio].com. Su contenido se gestiona completamente desde el portal de administración (ver sección 4.8). A continuación se describen las secciones y comportamientos que debe tener.

## 5.1 Secciones de la Landing
| Sección | Nombre | Qué muestra |
|---|---|---|
| SEC-01 | Hero / Banner principal | Imagen de fondo a pantalla completa, nombre del hotel, descripción corta, botón 'Reservar ahora' y botón 'Chatear con Sofia' (abre el widget de IA). |
| SEC-02 | Nuestros Servicios | Tarjetas de las habitaciones y servicios activos, con foto, nombre, capacidad y precio base. Clic en una tarjeta lleva al detalle de esa habitación. |
| SEC-03 | Planes y Experiencias | Tarjetas de los planes activos, con foto de portada, nombre, descripción corta, precio base y lista de actividades incluidas. Clic en una tarjeta lleva al detalle del plan. |
| SEC-04 | Galería | Cuadrícula de fotos de la galería general del hotel. Clic en una foto la abre en modo lightbox (pantalla completa con navegación). |
| SEC-05 | Preguntas Frecuentes | Listado en acordeón de las FAQs configuradas desde el admin. Al hacer clic en una pregunta se expande la respuesta. |
| SEC-06 | Cómo llegar | Mapa embebido de Google Maps con la ubicación del hotel y los datos de contacto configurados. |
| SEC-07 | Footer | Logo, nombre del hotel, enlaces rápidos, redes sociales, datos de contacto y aviso de privacidad. |

## 5.2 Página de Detalle de Plan
Cada plan tiene su propia página pública accesible desde una URL como www.[dominio].com/plan-romantico. Esta página debe mostrar:

Galería de fotos del plan (carrusel)

Video del plan (si está configurado)

Nombre, descripción larga y precio base

Lista de actividades incluidas (no modificables por el cliente)

Selector de actividades opcionales con precio individual y total acumulado

Formulario o botón de reserva que inicia el proceso de reserva

Información de la habitación asociada (si aplica)

## 5.3 Widget de Chat con Agente IA
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-083 | Debe existir un botón flotante en la esquina inferior derecha de la landing que abre un panel de chat con el agente de IA. | Alta | Funcional |
| RF-084 | El chat debe mantener el historial de la conversación mientras la pestaña del navegador esté abierta. Al cerrar y reabrir la pestaña, la conversación puede comenzar de nuevo. | Media | Funcional |
| RF-085 | Cuando el agente de IA genere una reserva y un link de pago, el widget debe mostrar una tarjeta especial con el número de reserva y un botón destacado para proceder al pago. | Alta | Funcional |
| RF-086 | El widget debe ser responsivo: en dispositivos móviles debe ocupar toda la pantalla cuando está abierto. | Alta | No Funcional |

# 6. REQUERIMIENTOS DEL API
El API es el componente central que conecta la base de datos con el portal de administración, la landing page y el agente de IA. Todos los datos del sistema deben fluir exclusivamente a través del API — ningún componente debe conectarse directamente a la base de datos.

## 6.1 Principios generales del API
Cada operación disponible en el portal de administración (crear, editar, eliminar) debe tener su correspondiente operación en el API.

Cada dato que se muestra en la landing page (planes, habitaciones, galería, FAQs, configuración) debe tener su correspondiente operación de consulta en el API.

El API debe funcionar también como servidor de archivos multimedia: recibe las imágenes y videos, los almacena, genera versiones optimizadas y devuelve las URLs públicas para mostrarlas.

El API debe exponer las operaciones necesarias para que el agente de IA (a través del protocolo MCP en n8n) pueda consultar disponibilidad, crear reservas y generar links de pago.

Todas las respuestas del API deben estar en formato JSON.

El API debe incluir documentación interactiva (Swagger) accesible en www.[dominio].com/api/docs.

## 6.2 Operaciones requeridas del API
La siguiente tabla describe las operaciones que el API debe soportar, agrupadas por área funcional. El equipo de desarrollo decidirá el diseño técnico exacto de cada operación.

| Área | Operación requerida | Consumidor principal |
|---|---|---|
| Autenticación | Iniciar sesión con correo y contraseña | Portal Admin |
| Autenticación | Cerrar sesión | Portal Admin |
| Autenticación | Refrescar sesión sin volver a pedir contraseña | Portal Admin |
| Autenticación | Solicitar restablecimiento de contraseña | Portal Admin |
| Habitaciones | Consultar lista de habitaciones (con filtros) | Portal + Landing + Agente IA |
| Habitaciones | Consultar detalle de una habitación | Portal + Landing + Agente IA |
| Habitaciones | Crear habitación | Portal Admin |
| Habitaciones | Editar habitación | Portal Admin |
| Habitaciones | Activar / desactivar habitación | Portal Admin |
| Habitaciones | Eliminar habitación (si no tiene reservas futuras) | Portal Admin |
| Planes | Consultar lista de planes activos (para la landing) | Landing + Agente IA |
| Planes | Consultar todos los planes con filtros (para el admin) | Portal Admin |
| Planes | Consultar detalle de un plan con actividades base y opcionales | Portal + Landing + Agente IA |
| Planes | Crear plan | Portal Admin |
| Planes | Editar plan | Portal Admin |
| Planes | Duplicar plan | Portal Admin |
| Planes | Activar / desactivar plan | Portal Admin |
| Actividades base | Agregar actividad base a un plan | Portal Admin |
| Actividades base | Editar actividad base de un plan | Portal Admin |
| Actividades base | Eliminar actividad base de un plan | Portal Admin |
| Actividades base | Reordenar actividades base de un plan | Portal Admin |
| Actividades opcionales | Consultar catálogo global de actividades opcionales | Portal Admin + Agente IA |
| Actividades opcionales | Crear actividad opcional en el catálogo | Portal Admin |
| Actividades opcionales | Editar actividad opcional | Portal Admin |
| Actividades opcionales | Activar / desactivar actividad opcional | Portal Admin |
| Actividades opcionales | Asociar / desasociar actividad opcional a un plan | Portal Admin |
| Disponibilidad | Consultar disponibilidad por fechas, servicio y personas | Portal + Landing + Agente IA |
| Disponibilidad | Consultar vista de calendario mensual | Portal Admin |
| Disponibilidad | Bloquear fechas con motivo | Portal Admin |
| Disponibilidad | Configurar cupos base y precios por temporada | Portal Admin |
| Reservas | Crear reserva (con o sin plan, con o sin actividades opcionales) | Portal + Agente IA |
| Reservas | Consultar lista de reservas con filtros | Portal Admin |
| Reservas | Consultar detalle de una reserva | Portal + Agente IA |
| Reservas | Modificar fechas de una reserva | Portal + Agente IA |
| Reservas | Agregar actividades opcionales a una reserva existente | Portal + Agente IA |
| Reservas | Cancelar reserva con cálculo de penalidad | Portal + Agente IA |
| Reservas | Confirmar reserva manualmente | Portal Admin |
| Pagos | Generar link de pago (MercadoPago) | Portal + Agente IA |
| Pagos | Recibir confirmación de pago (webhook de MercadoPago) | MercadoPago → API |
| Pagos | Consultar estado de un pago | Portal + Agente IA |
| Medios | Subir imagen (recibe archivo, devuelve URL pública) | Portal Admin |
| Medios | Subir video (recibe archivo o URL YouTube/Vimeo) | Portal Admin |
| Medios | Consultar biblioteca de medios con búsqueda | Portal Admin |
| Medios | Eliminar un archivo de la biblioteca | Portal Admin |
| Inventario | Consultar ítems de inventario con filtros | Portal Admin |
| Inventario | Crear / editar ítem de inventario | Portal Admin |
| Inventario | Registrar movimiento de inventario (entrada/salida) | Portal Admin |
| Inventario | Consultar historial de movimientos de un ítem | Portal Admin |
| Inventario | Consultar ítems con stock bajo el mínimo | Portal Admin |
| Proveedores | CRUD completo de proveedores | Portal Admin |
| Contenido | Consultar configuración del sitio (hero, textos, contacto) | Landing + Portal Admin |
| Contenido | Actualizar sección de contenido del sitio | Portal Admin |
| Contenido | CRUD de FAQs | Portal Admin |
| Contenido | Consultar FAQs activas | Landing + Agente IA |
| Usuarios | Consultar lista de usuarios del portal | Portal Admin |
| Usuarios | Crear / editar usuario | Portal Admin |
| Usuarios | Activar / desactivar usuario | Portal Admin |
| Usuarios | Cambiar contraseña propia | Portal Admin |
| Reportes | Reporte de ocupación por periodo | Portal Admin |
| Reportes | Reporte de ingresos por periodo | Portal Admin |
| Reportes | Reporte de reservas filtrable | Portal Admin |
| Reportes | Reporte de movimientos de inventario | Portal Admin |
| Configuración | Consultar configuración del negocio | Portal Admin + Landing |
| Configuración | Actualizar configuración del negocio | Portal Admin |
| Configuración | Actualizar políticas de cancelación | Portal Admin |
| Configuración | Actualizar credenciales de pasarela de pagos | Superadmin |

# 7. REQUERIMIENTOS DE LA BASE DE DATOS
La base de datos debe almacenar de forma organizada y segura toda la información del sistema. Los siguientes requerimientos definen qué datos deben guardarse y qué comportamientos debe garantizar el motor de base de datos.

## 7.1 Entidades de datos requeridas
Las siguientes entidades (grupos de información) deben estar representadas en la base de datos:

| Entidad | Datos que almacena | Relaciones importantes |
|---|---|---|
| Usuarios | Nombre, correo, contraseña (encriptada), rol, foto de perfil, estado, fechas. | Un usuario tiene un rol. Un usuario puede crear/modificar muchas reservas. |
| Roles y permisos | Nombre del rol, lista de permisos habilitados. | Un rol puede tener muchos usuarios. |
| Habitaciones / Servicios | Nombre, tipo, descripción, capacidad, precio base, estado, orden de visualización. | Puede tener muchas fotos/videos. Puede estar asociada a muchos planes. |
| Medios (fotos/videos) | URL del archivo original, URL del thumbnail, tipo (imagen/video), nombre, fecha de subida, tamaño. | Un medio puede estar asociado a habitaciones, planes, galería general o contenido del sitio. |
| Planes | Nombre, descripción corta, descripción larga, precio base, unidad de cobro, capacidad, noches mínimas, habitación vinculada (opcional), estado. | Un plan tiene actividades base y actividades opcionales. Tiene fotos y videos. |
| Actividades base del plan | Nombre, descripción, costo adicional (si aplica), orden, plan al que pertenece. | Pertenece a un plan. Se copia como snapshot al crearse una reserva. |
| Catálogo de actividades opcionales | Nombre, descripción, precio, unidad de cobro, duración, capacidad máxima, estado. | Puede asociarse a múltiples planes. Puede ser seleccionada en múltiples reservas. |
| Disponibilidad | Fecha, habitación/servicio/plan, cupos totales, cupos bloqueados, precio especial (si es temporada), motivo de bloqueo. | Relacionada con habitaciones, servicios y planes. |
| Reservas | Número de reserva, datos del cliente, habitación/plan reservado, fechas, personas, estado (PENDING / PAYMENT_PENDING / CONFIRMED / CANCELLED), monto total, notas. | Tiene actividades base (snapshot) y actividades opcionales elegidas. Tiene pagos. |
| Snapshot de actividades de reserva | Copia de las actividades base del plan al momento de crear la reserva, más las opcionales elegidas y sus precios en ese momento. | Vinculada a una reserva. Inalterable después de confirmada. |
| Pagos | Monto, método, estado, referencia externa (ID de MercadoPago), fecha de confirmación. | Vinculado a una reserva. |
| Ítems de inventario | Nombre, categoría, unidad, stock actual, stock mínimo, proveedor. | Tiene movimientos de inventario. |
| Movimientos de inventario | Tipo (entrada/salida), cantidad, fecha, usuario responsable, notas, reserva asociada (opcional). | Vinculado a un ítem. Registra quién lo hizo. |
| Proveedores | Nombre, teléfono, correo, dirección, notas. | Puede estar asociado a múltiples ítems de inventario. |
| Contenido del sitio | Clave, valor, tipo (texto, imagen, lista), módulo al que pertenece (hero, contacto, FAQ, etc.). | Estructura clave-valor flexible para contenido editable. |
| Preguntas frecuentes | Pregunta, respuesta, orden, estado activo/inactivo. | Independiente, se muestra en la landing. |
| Configuración del negocio | Nombre del hotel, logo, colores, política de cancelación, horarios, temporadas, datos de pago. | Registro único por negocio. |
| Log de auditoría | Usuario que realizó la acción, tipo de acción, entidad afectada, datos antes y después, fecha y hora. | Vinculado a un usuario. Solo lectura. |
| Claves de idempotencia | Clave única, operación, respuesta guardada, fecha de expiración. | Asociada a operaciones de creación de reservas y pagos. |

## 7.2 Comportamientos requeridos de la base de datos
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RF-084 | La base de datos debe garantizar que dos reservas nunca puedan confirmar el mismo cupo al mismo tiempo, incluso si dos personas hacen la solicitud en el mismo instante. | Alta | No Funcional |
| RF-085 | Ninguna operación de pago debe poder procesarse dos veces para la misma reserva, aunque el sistema intente ejecutarla por error más de una vez. | Alta | No Funcional |
| RF-086 | Todos los registros críticos (reservas, pagos, usuarios) deben registrar automáticamente la fecha y hora de creación y de última modificación. | Alta | No Funcional |
| RF-087 | Las habitaciones, planes y ítems de inventario no deben eliminarse permanentemente si tienen registros asociados (reservas, movimientos). En su lugar deben poderse marcar como inactivos. | Alta | No Funcional |
| RF-088 | El sistema debe registrar automáticamente en el log de auditoría cualquier modificación realizada sobre reservas, planes, habitaciones y usuarios, indicando qué cambió, quién lo cambió y cuándo. | Alta | No Funcional |
| RF-089 | El historial de snapshots de actividades de una reserva debe ser inmutable: una vez creada la reserva, el registro de qué actividades tenía y a qué precio nunca debe modificarse aunque el plan cambie después. | Alta | No Funcional |

# 8. REQUERIMIENTOS NO FUNCIONALES
## 8.1 Rendimiento
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RNF-001 | La landing page debe cargar completamente en menos de 3 segundos en una conexión de banda ancha estándar. | Alta | Rendimiento |
| RNF-002 | El portal de administración debe responder a las acciones del usuario (carga de listas, guardado de formularios) en menos de 2 segundos. | Alta | Rendimiento |
| RNF-003 | El sistema debe poder atender al menos 200 solicitudes simultáneas sin degradación notable del tiempo de respuesta. | Media | Rendimiento |
| RNF-004 | Las imágenes en la landing deben servirse en formato optimizado (WebP cuando el navegador lo soporte) y en tamaños apropiados para cada dispositivo (responsivo). | Alta | Rendimiento |

## 8.2 Seguridad
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RNF-005 | Toda la comunicación entre el navegador y el servidor debe estar cifrada con HTTPS (certificado SSL válido). | Alta | Seguridad |
| RNF-006 | Las contraseñas de los usuarios nunca deben almacenarse en texto plano. Deben almacenarse como un hash encriptado no reversible. | Alta | Seguridad |
| RNF-007 | El API debe rechazar solicitudes que no incluyan credenciales válidas para operaciones que requieren autenticación. | Alta | Seguridad |
| RNF-008 | El sistema debe limitar el número de intentos fallidos de inicio de sesión: después de 5 intentos fallidos consecutivos, el sistema debe bloquear temporalmente el acceso desde esa IP por 15 minutos. | Alta | Seguridad |
| RNF-009 | Los webhooks de MercadoPago deben validarse mediante la firma digital que envía MercadoPago en cada notificación. Webhooks sin firma válida deben ser ignorados. | Alta | Seguridad |

## 8.3 Usabilidad
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RNF-010 | El portal de administración debe ser usable en pantallas de escritorio (mínimo 1280px de ancho). No se requiere diseño móvil para el portal admin. | Alta | Usabilidad |
| RNF-011 | La landing page debe verse y funcionar correctamente en teléfonos móviles, tablets y computadores (diseño responsivo). | Alta | Usabilidad |
| RNF-012 | Todos los formularios del portal admin deben validar los campos antes de enviar y mostrar mensajes de error específicos por campo cuando la información sea incorrecta o incompleta. | Alta | Usabilidad |
| RNF-013 | El sistema debe mostrar confirmaciones visuales (mensajes de éxito o error) después de cada acción importante del usuario: guardar, eliminar, enviar. | Alta | Usabilidad |
| RNF-014 | Las acciones destructivas (eliminar un plan, cancelar una reserva) deben solicitar confirmación explícita del usuario antes de ejecutarse. | Alta | Usabilidad |

## 8.4 Disponibilidad y Mantenimiento
| ID | Requerimiento | Prioridad | Tipo |
|---|---|---|---|
| RNF-015 | El sistema debe estar disponible el 99.5% del tiempo mensual. El mantenimiento programado debe notificarse al administrador con al menos 24 horas de anticipación. | Alta | Disponibilidad |
| RNF-016 | El sistema debe realizar copias de seguridad automáticas de la base de datos diariamente. Las copias deben conservarse por al menos 30 días. | Alta | Disponibilidad |
| RNF-017 | El sistema debe incluir una ruta de verificación de estado (/health) que confirme que los servicios principales están funcionando correctamente. | Media | Mantenimiento |

# 9. CRITERIOS DE ACEPTACIÓN DEL SISTEMA
El sistema se considera listo para entrega cuando cumpla satisfactoriamente los siguientes criterios de aceptación:

| Criterio | Descripción | Cómo se verifica |
|---|---|---|
| CA-01 | Es posible crear un plan desde cero con actividades base y opcionales y que este aparezca en la landing page sin intervención técnica. | Prueba funcional completa de extremo a extremo. |
| CA-02 | Un cliente puede reservar un plan desde la landing, seleccionar actividades opcionales, pagar con MercadoPago y recibir confirmación. | Prueba con tarjeta de prueba de MercadoPago en sandbox. |
| CA-03 | El administrador puede ver la reserva confirmada en el portal con todas las actividades base y opcionales elegidas, con sus precios al momento de la reserva. | Verificación visual en el portal admin. |
| CA-04 | Si el administrador modifica las actividades de un plan después de una reserva, la reserva ya realizada debe seguir mostrando las actividades originales. | Prueba de inmutabilidad del snapshot. |
| CA-05 | El administrador puede subir imágenes y videos desde el portal y estos aparecen en la landing sin requerir ayuda técnica. | Prueba con archivos reales de distintos formatos. |
| CA-06 | Un usuario con rol VIEWER no puede realizar ninguna acción de creación, modificación o eliminación. | Prueba de acceso con credenciales de cada rol. |
| CA-07 | Toda la información de contacto, FAQs y textos del sitio se puede actualizar desde el portal admin y el cambio se refleja en la landing. | Prueba de actualización de contenido. |
| CA-08 | El agente de IA puede consultar planes, crear reservas y generar links de pago usando las herramientas del MCP. | Prueba conversacional completa desde WhatsApp. |
| CA-09 | El sistema rechaza correctamente una solicitud de reserva cuando no hay disponibilidad en las fechas solicitadas. | Prueba con fechas bloqueadas o sin cupos. |
| CA-10 | Los reportes muestran datos consistentes con las reservas y movimientos registrados en el sistema. | Verificación cruzada entre reporte y registros individuales. |

# 10. ACTIVOS E INFORMACIÓN REQUERIDA AL CLIENTE
Para iniciar el desarrollo, el equipo del hotel debe entregar los siguientes activos. Sin estos elementos, algunas partes del sistema no podrán completarse o quedarán con contenido de ejemplo.

|  | Activo / Información | Descripción detallada | Para cuándo |
|---|---|---|---|
|  | Logo del negocio | Versión principal, horizontal y solo símbolo. Formatos: SVG + PNG con fondo transparente. Resolución mínima: 1000px de ancho. | Semana 1 — Bloqueante |
|  | Paleta de colores oficial | Códigos HEX o valores RGB de los colores de la marca (principal, secundario, acento, texto). | Semana 1 — Bloqueante |
|  | Razón social y NIT | Para footer del sitio, facturación y configuración del sistema. | Semana 1 — Bloqueante |
|  | Dominio registrado | El dominio donde vivirá el sitio (ej: tuhotel.com.co). Debe estar registrado por el cliente. | Semana 1 — Bloqueante |
|  | Tipografía de la marca | Nombre del font o archivos .ttf/.otf. Si no tienen, se elige una tipografía libre. | Semana 2 |
|  | Fotos de habitaciones y espacios | Mínimo 5 fotos por espacio (cabaña, zonas comunes, piscina, restaurante). Formato JPG/PNG, mínimo 1500px de ancho. | Semana 2 |
|  | Descripción de servicios y precios | Lista de habitaciones/cabañas con nombre, capacidad y precio; servicios adicionales con precio. | Semana 2 |
|  | Políticas del negocio | Política de cancelación (penalidades por tiempo), política de mascotas, horarios de check-in/checkout. | Semana 3 |
|  | Preguntas frecuentes actuales | Lista de las preguntas que reciben con más frecuencia de los clientes, con sus respuestas. | Semana 3 |
|  | Video del hotel (opcional) | Video corto de presentación (30–90 segundos). Si no tienen, se puede enlazar un video de YouTube. | Semana 5 |
|  | Foto aérea o de fachada | Para el banner principal de la landing. Formato JPG/PNG, mínimo 2000px de ancho. | Semana 5 |
|  | Credenciales MercadoPago | Access token y clave pública de la cuenta de MercadoPago del negocio (producción). | Semana 5 |
|  | Cuenta WhatsApp Business verificada | Con acceso al Meta Business Manager para configurar la Cloud API. | Semana 8 |

| ⚠️ Prioridades:  Los activos marcados en rojo son bloqueantes: sin ellos no se puede iniciar la construcción de la landing ni la configuración del sistema. Los activos en naranja se necesitan para la semana 2–3. Los activos en verde pueden entregarse en la fase de integración (semanas 5–8). |
|---|

**Hector Fabian Rodriguez**  ·  Principal Software Architect & AI Systems

Solicitud de Software v1.0  ·  Abril 2026  ·  Bogotá, Colombia

