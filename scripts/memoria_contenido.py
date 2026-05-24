# Contenido de la memoria TFG — lenguaje claro, 10 apartados de la guía del centro

# --- 2. Abstract ---
ABSTRACT_ES = [
    (
        "Velo es una aplicación web para gestionar solicitudes e incidencias dentro de una empresa. "
        "Permite que cualquier empleado abra una petición, haga seguimiento de su estado y hable con "
        "el equipo que la atiende, mientras los técnicos organizan el trabajo en un tablero visual "
        "y la dirección consulta resúmenes y plazos. El proyecto se ha desarrollado como Trabajo "
        "de Fin de Grado del ciclo DAM en modalidad dual y está publicado en un repositorio abierto."
    ),
    (
        "La solución consta de tres zonas: un portal sencillo para el empleado, un espacio de trabajo "
        "tipo tablero para los equipos de soporte (Sistemas, RRHH, Mantenimiento, etc.) y un panel "
        "de administración con listados, estadísticas, planificación por épicas (roadmap, cronograma "
        "y calendario) y configuración. Se ha cuidado la claridad de la interfaz, el registro de "
        "lo que ocurre en cada solicitud y el cumplimiento de plazos según la prioridad elegida."
    ),
]

ABSTRACT_EN = [
    (
        "Velo is a web application for managing internal requests and incidents in an organisation. "
        "Employees can open a ticket, track its status and communicate with support staff, while "
        "technicians organise work on a visual board and managers review summaries and deadlines. "
        "The project was developed as an undergraduate thesis (DAM cycle, dual mode)."
    ),
    (
        "The solution has three areas: a simple employee portal, a Kanban-style workspace for support "
        "teams, and an administration panel with listings, statistics and settings. The design "
        "focuses on clarity, a full history of each request and deadline tracking by priority."
    ),
]

# Texto ampliado (lenguaje no técnico) para alcanzar extensión de memoria
AMPLIACION = [
    (
        "Velo no sustituye el trato humano entre compañeros, pero sí deja constancia de lo acordado: "
        "qué se pidió, cuándo, quién responde y cómo se cerró. Eso es especialmente útil cuando "
        "cambia la persona de turno o cuando hace falta justificar tiempos ante la dirección."
    ),
    (
        "Para el centro educativo, el proyecto demuestra que el alumno domina el ciclo completo: "
        "detectar necesidad, diseñar pantallas, programar, probar, documentar y desplegar. "
        "La memoria que se entrega acompaña al código y permite al tribunal seguir el razonamiento "
        "aunque no ejecute la aplicación en el momento de la defensa."
    ),
    (
        "La interfaz se ha revisado para que sea legible en móvil y en ordenador, porque muchos "
        "empleados consultarán el estado de su solicitud desde el teléfono. Los colores y la "
        "tipografía se mantienen coherentes en todas las zonas para transmitir seriedad y claridad."
    ),
]

FASES_DESARROLLO = [
    (
        "Fase 1 — Acceso y portal básico: entrar con correo, ver listado y crear la primera solicitud."
    ),
    (
        "Fase 2 — Tablero del equipo: columnas de trabajo, mover tarjetas y asignar responsable."
    ),
    (
        "Fase 3 — Conversación y archivos: mensajes con capturas e imágenes en el hilo, "
        "comentarios internos solo para el equipo, archivos adjuntos y edición o borrado "
        "de mensajes y evidencias por quien las creó."
    ),
    (
        "Fase 4 — Cierre ordenado: motivo obligatorio y texto de resolución al terminar."
    ),
    (
        "Fase 5 — Dirección y estadísticas: vista global, gráficos y exportar a Excel."
    ),
    (
        "Fase 6 — Ajustes finales: plazos por prioridad, versión móvil, seguridad y publicación."
    ),
    (
        "Fase 7 — Planificación por épicas: roadmap ejecutivo, cronograma tipo Gantt, calendario "
        "de plazos, arrastre de fechas límite y métricas SLA desglosadas por épica."
    ),
]

# --- 4. Justificación ---
JUSTIFICACION = [
    (
        "En muchas empresas y centros de formación las incidencias se gestionan por correo, "
        "llamadas o mensajes sueltos. Eso provoca pérdida de información, retrasos y dificultad "
        "para saber quién lleva cada caso. Velo nace para concentrar todo en un solo sitio: "
        "cada solicitud tiene número, estado, responsable, conversación y archivos adjuntos."
    ),
    (
        "El proyecto responde a una necesidad real del entorno dual: disponer de una herramienta "
        "creíble, fácil de explicar y útil en el día a día, no solo un ejercicio de laboratorio. "
        "Además cumple competencias del ciclo formativo: diseñar pantallas usables, guardar datos "
        "de forma ordenada, proteger el acceso por roles y poder instalar la aplicación en internet."
    ),
    (
        "Frente a programas genéricos y caros, Velo se centra en el flujo concreto de esta "
        "organización: el empleado no necesita formación técnica; el agente ve su cola de trabajo "
        "en columnas; el administrador supervisa el conjunto. Esa adaptación justifica el desarrollo "
        "propio frente a una herramienta estándar."
    ),
    (
        "Por último, al usar tecnologías habituales en el sector y alojamiento en la nube de bajo "
        "coste, el mantenimiento queda asequible una vez terminado el TFG, lo que refuerza la "
        "viabilidad del proyecto más allá de la entrega académica."
    ),
]

# --- 5. Introducción ---
INTRODUCCION = [
    (
        "Este documento presenta el trabajo realizado con Velo: qué problema resuelve, qué se "
        "ha construido, cómo se ha organizado el desarrollo y qué resultados se obtienen. "
        "La memoria sigue la estructura indicada por el centro educativo y las figuras que "
        "la acompañan son capturas reales de la aplicación funcionando en el ordenador de desarrollo."
    ),
    (
        "El sistema distingue tres perfiles. El empleado crea y consulta sus solicitudes. "
        "El agente de soporte atiende las de su equipo en un tablero con columnas (nueva, "
        "en curso, cerrada). El administrador ve todas las incidencias, usuarios, plazos y "
        "resúmenes. Cada uno entra con su correo y contraseña y solo ve lo que le corresponde."
    ),
    (
        "El desarrollo se hizo por fases: primero el acceso y el portal, después el tablero, "
        "la mensajería y los adjuntos, el cierre con motivo escrito, el panel de estadísticas, "
        "las vistas de planificación por épicas (roadmap, cronograma y calendario) y, por último, "
        "mejoras de seguridad y adaptación a móvil y tablet. En el apartado de Desarrollo se "
        "detalla cada bloque con apoyo de imágenes."
    ),
]

# --- 6. Objetivos ---
OBJETIVO_GENERAL = (
    "Crear una aplicación web que permita a los empleados registrar y seguir sus solicitudes "
    "internas, a los equipos de soporte gestionarlas de forma ordenada y a la administración "
    "supervisar plazos y resultados, con un historial claro de cada caso."
)

OBJETIVOS_ESPECIFICOS = [
    "Que cada usuario entre de forma segura con correo y contraseña y acceda solo a su zona.",
    "Ofrecer un portal claro para abrir solicitudes, adjuntar pruebas y ver el estado.",
    "Dar a los equipos un tablero visual para asignar, comentar y cerrar incidencias.",
    "Guardar el historial de cambios, mensajes y archivos para poder revisar qué ocurrió.",
    "Calcular y mostrar plazos según la prioridad (baja, media, alta).",
    "Permitir comentarios internos entre técnicos que el empleado no vea.",
    "Ofrecer al administrador listados, filtros, gráficos y exportación a hoja de cálculo.",
    "Agrupar el trabajo en épicas (líneas de actuación) y mostrar avance y plazos en roadmap y cronograma.",
    "Permitir ajustar fechas límite desde el cronograma y medir el cumplimiento SLA por épica.",
    "Publicar la aplicación en internet con instrucciones para instalarla y mantenerla.",
    "Probar los flujos principales con usuarios de demostración antes de la defensa.",
]

# --- 7. Desarrollo (bloques para subapartados sencillos) ---
DESARROLLO_INTRO = [
    (
        "En este apartado se explica cómo está hecha Velo, con un lenguaje cercano al usuario "
        "final y a la persona que evalúa el TFG sin ser especialista en informática. Se describe "
        "el diseño general, cada pantalla importante, cómo se guardan los datos, las medidas de "
        "seguridad, las pruebas realizadas y cómo se publica la aplicación en internet."
    ),
    (
        "Las fotografías de pantalla que aparecen a continuación se tomaron con el programa "
        "funcionando en el ordenador de desarrollo, igual que en una demostración ante el tribunal. "
        "Reflejan el aspecto real de la versión entregada en el repositorio del proyecto."
    ),
]

DESARROLLO_DISENO = [
    (
        "Antes de programar se definieron los tres perfiles y las pantallas que necesitaban. "
        "Se decidió que una misma solicitud pasaría por estados claros: abierta, en curso y "
        "cerrada, y que al cerrar habría que indicar el motivo (resuelta, rechazada o duplicada) "
        "y una breve explicación."
    ),
    (
        "Los datos se guardan en una base de datos relacional (listas de usuarios, solicitudes, "
        "mensajes, archivos, equipos y épicas de trabajo). La Figura 1 resume la arquitectura: "
        "la parte visible en el navegador, el servidor que procesa las peticiones y la base de "
        "datos donde queda todo almacenado. La Figura 2 muestra las tablas principales y cómo "
        "se relacionan."
    ),
]

DESARROLLO_PORTAL = [
    (
        "Cuando el empleado abre Velo, lo primero que ve es un resumen claro, no un panel "
        "lleno de siglas. Puede crear una solicitud en pocos pasos: elegir de qué va "
        "(acceso, material, avería…), indicar si es urgente o no, describir el problema y "
        "adjuntar una foto si ayuda a entenderlo."
    ),
    (
        "El portal está pensado para el empleado que no trabaja con informática a diario. "
        "En la página de inicio ve un resumen: cuántas solicitudes tiene, cuáles requieren "
        "su atención y accesos directos para crear una nueva o ver el listado completo."
    ),
    (
        "Al crear una solicitud elige categoría y prioridad, escribe el problema y puede adjuntar "
        "capturas o documentos. En «Mis solicitudes» filtra por estado, busca por texto y abre "
        "el detalle para leer respuestas del equipo. Solo se avisa del plazo cuando está cerca "
        "de vencer o ya ha vencido, para no saturar con avisos innecesarios."
    ),
    (
        "Las Figuras 3 a 6 y la 5b corresponden al inicio de sesión, la pantalla de inicio del portal, "
        "el listado de solicitudes, el formulario de alta y un ejemplo de seguimiento con "
        "mensajes, tomadas con la aplicación en marcha."
    ),
]

DESARROLLO_PORTAL_SEGUIMIENTO = [
    (
        "En «Mis solicitudes» el empleado abre cualquier petición y ve el estado, el plazo "
        "y el hilo de mensajes con el equipo. Si el técnico adjunta una captura, la imagen "
        "se muestra en el chat (no como enlace público). La Figura 5b recoge un ejemplo de "
        "seguimiento con conversación visible."
    ),
]

DESARROLLO_TABLERO = [
    (
        "Los técnicos de soporte están habituados a ver tareas en lista; el tablero aporta "
        "una imagen rápida de cuánto trabajo hay en cada fase. Una columna recoge lo nuevo, "
        "otra lo que ya se está haciendo y otra lo cerrado. Así se evita que una petición "
        "quede olvidada en el fondo de un correo."
    ),
    (
        "El espacio de trabajo muestra las incidencias en columnas, como un tablero de notas. "
        "El agente puede arrastrar una tarjeta de una columna a otra si pertenece al equipo "
        "responsable. Si la solicitud la creó otra persona pero está en otro departamento, "
        "la tarjeta aparece para consulta pero no se puede mover."
    ),
    (
        "Desde cada tarjeta se abre el detalle: descripción, chat con el solicitante, comentarios "
        "solo visibles para el equipo, archivos, asignación de épica, fecha límite editable y "
        "botón para cerrar con el motivo obligatorio. La Figura 7 muestra el tablero en "
        "funcionamiento."
    ),
    (
        "El hilo de actividad permite adjuntar imágenes en cada mensaje (capturas de error, "
        "logs, etc.). Los técnicos pueden marcar comentarios como internos para coordinarse sin "
        "que el empleado los vea. Quien publicó un mensaje o un archivo adjunto puede editarlo "
        "o eliminarlo; el administrador también puede hacerlo. Las Figuras 8 y 9 muestran un "
        "ejemplo con varios comentarios, una imagen visible en el chat y la sección de archivos "
        "adjuntos."
    ),
]

DESARROLLO_LISTA = [
    (
        "La vista Lista complementa al tablero cuando hay muchas incidencias: muestra diez "
        "tarjetas por página, ordenación por fecha o prioridad y paginación al pie. "
        "La Figura 7b ilustra este listado compacto."
    ),
]

DESARROLLO_PLANIFICACION = [
    (
        "Para la memoria del TFG se ha añadido un bloque de planificación que conecta el trabajo "
        "del equipo con los plazos SLA. Las incidencias pueden clasificarse en épicas —líneas de "
        "actuación como Infraestructura, Portal del empleado o Seguridad— con un catálogo inicial "
        "gestionable desde Configuración por el administrador."
    ),
    (
        "El tablero ofrece cinco vistas complementarias. Además del tablero Kanban y la lista "
        "detallada, la vista Roadmap resume cada épica en una tarjeta: porcentaje de casos "
        "cerrados, cumplimiento de plazos, próximo vencimiento y accesos rápidos para filtrar "
        "o saltar al cronograma o al calendario."
    ),
    (
        "El cronograma muestra una línea temporal agrupada por épica, con barras desde la "
        "fecha de creación hasta el límite SLA. El agente puede arrastrar el borde derecho de "
        "una barra para cambiar la fecha límite; el cambio queda registrado en el historial "
        "de la incidencia. El calendario concentra las mismas tareas por día de vencimiento, "
        "con colores que indican si van en plazo, vencen pronto o están fuera de plazo."
    ),
    (
        "Los filtros del tablero permiten acotar por épica, estado, prioridad o solo incidencias "
        "fuera de SLA; las vistas de planificación respetan esos filtros para analizar un "
        "subconjunto concreto del trabajo."
    ),
    (
        "Las Figuras 13 a 15 ilustran el roadmap, el cronograma y el calendario cuando la "
        "aplicación está en marcha."
    ),
]

DESARROLLO_FLUJO = [
    (
        "El recorrido completo que se puede demostar ante el tribunal sigue estos pasos: "
        "(1) el empleado crea la solicitud en el portal con prioridad y equipo; el sistema "
        "asigna un plazo automático; (2) el agente la ve en el tablero, le asigna épica y "
        "responsable, conversa por el chat y mueve la tarjeta entre columnas; (3) desde el "
        "roadmap o el cronograma se supervisa el avance por épica y, si hace falta, se "
        "ajusta la fecha límite arrastrando la barra; (4) al cerrar, el agente indica motivo "
        "(resuelta, rechazada o duplicada) y texto de resolución; (5) la administración consulta "
        "en Análisis el porcentaje global y por épica de casos resueltos dentro del plazo."
    ),
]

DESARROLLO_ADMIN = [
    (
        "El panel de administración concentra la vista global: buscar, filtrar por estado, "
        "prioridad, equipo o épica, y abrir cualquier incidencia. Hay una sección de análisis "
        "con números totales, tiempo medio de resolución, porcentaje de casos resueltos dentro "
        "del plazo y un gráfico apilado de SLA por épica (en plazo frente a fuera de plazo). "
        "Los datos se pueden exportar a hoja de cálculo, incluyendo el desglose por épica."
    ),
    (
        "En configuración se revisan los equipos de soporte, los plazos asociados a cada "
        "prioridad y el catálogo de épicas (clave, nombre, color y estado activo). "
        "Las Figuras 10 a 12 muestran el listado de administración, el panel de análisis con "
        "métricas por épica y la pantalla de configuración."
    ),
]

DESARROLLO_SEGURIDAD = [
    (
        "Solo entra quien tiene cuenta. Las contraseñas no se guardan en texto plano. "
        "Los archivos adjuntos no son enlaces públicos: hace falta estar identificado y "
        "tener permiso sobre esa solicitud. Se comprueba que los datos enviados desde los "
        "formularios sean correctos antes de guardarlos."
    ),
    (
        "Se limitó el número de intentos de login fallidos y se añadieron cabeceras de "
        "seguridad en las respuestas del servidor. En la interfaz, si ocurre un error grave, "
        "se muestra un mensaje comprensible en lugar de dejar la pantalla en blanco."
    ),
]

DESARROLLO_PRUEBAS = [
    (
        "Se probaron manualmente los recorridos más importantes: el empleado crea una solicitud; "
        "el agente la mueve y responde; el administrador consulta estadísticas. También se "
        "comprobó el comportamiento en pantallas pequeñas y que los usuarios de demostración "
        "creados para la memoria funcionan correctamente."
    ),
    (
        "Parte de las comprobaciones automáticas del proyecto se ejecutan al subir cambios "
        "al repositorio. Las imágenes de esta memoria se generaron de forma automática con "
        "la aplicación arrancada en local, para asegurar que coinciden con la versión entregada."
    ),
]

DESARROLLO_DESPLIEGUE = [
    (
        "La aplicación está preparada para publicarse en un servicio en la nube (Vercel) con la "
        "base de datos alojada aparte (Neon). En el repositorio hay una guía paso a paso (archivo "
        "DEPLOY.md) con las claves de configuración necesarias y el orden de las tareas: crear "
        "la base de datos, configurar el servidor y desplegar."
    ),
    (
        "Durante el TFG el trabajo diario se hizo en local: se arranca la parte de pantallas y la "
        "parte de servidor, ambas hablando con la misma base de datos que en producción. Así se "
        "pudo probar y generar las capturas de esta memoria sin sorpresas al subir la versión final."
    ),
]

DESARROLLO_TECNOLOGIAS = [
    (
        "A nivel técnico —solo como referencia en anexos— se utilizaron React para las pantallas, "
        "Next.js para el servidor, PostgreSQL para los datos y una librería de inicio de sesión "
        "integrada. No es necesario dominar estos nombres para entender el funcionamiento descrito "
        "arriba; lo relevante para el usuario es el comportamiento que ven las figuras."
    ),
]

# --- 8. Conclusiones ---
EXTENSION_MEMORIA = [
    (
        "Un ejemplo ayuda a entender el flujo: un empleado de RRHH no puede entrar en el portal "
        "de nómina. Abre Velo, describe el problema y marca prioridad media. El equipo de "
        "Sistemas ve la tarjeta en la columna «nueva», la mueve a «en curso», pide una captura "
        "por el chat y, al resolverlo, la cierra indicando «resuelta» y un breve resumen. "
        "El empleado recibe la respuesta en su listado sin haber llamado por teléfono. "
        "Si la incidencia se clasifica en la épica «Portal del empleado», el roadmap muestra "
        "cuántas peticiones similares siguen abiertas y si se cumplen los plazos."
    ),
    (
        "Otro caso: una impresora sin toner en mantenimiento. Aunque la petición la haya "
        "registrado otra persona, el técnico de Mantenimiento la ve en su tablero, cambia el "
        "estado y deja constancia del cambio de consumible. Si el plazo de resolución se acerca, "
        "el sistema avisa sin necesidad de revisar manualmente fechas en una hoja de cálculo."
    ),
    (
        "La dirección, por su parte, puede en un vistazo ver cuántas incidencias hay abiertas, "
        "cuánto tardan en cerrarse y si se cumplen los plazos comprometidos según la prioridad. "
        "Esa información apoya la mejora de procesos internos más allá del propio programa."
    ),
    (
        "En la elaboración de esta memoria se ha preferido explicar el valor para las personas "
        "que usan Velo antes que enumerar librerías o archivos del código. Quien desee el detalle "
        "técnico puede consultar el repositorio y el anexo final con fragmentos de programa."
    ),
    (
        "El trabajo en modalidad dual ha permitido contrastar estas decisiones con la realidad "
        "de un departamento: qué datos son obligatorios, qué mensajes deben ver solo los técnicos "
        "y qué información necesita un responsable para tomar decisiones. Por eso el resultado "
        "no es un prototipo vacío, sino una herramienta demostrable con datos de ejemplo."
    ),
    (
        "Respecto al mantenimiento futuro, basta con seguir la guía de despliegue, renovar las "
        "claves de acceso a la base de datos cuando caduquen y, si se desea, ampliar equipos o "
        "plazos desde la pantalla de configuración sin reprogramar toda la aplicación."
    ),
]

CONCLUSIONES = [
    (
        "Velo cumple el objetivo de reunir en una sola herramienta lo que antes se dispersaba "
        "en correos y conversaciones sueltas. El empleado gana autonomía para registrar y seguir "
        "sus peticiones; el equipo de soporte tiene una cola de trabajo clara; la administración "
        "puede medir tiempos y cumplimiento de plazos, también desglosados por épica de trabajo."
    ),
    (
        "Las vistas de roadmap, cronograma y calendario, junto con la gestión de épicas y el "
        "arrastre de plazos en el Gantt, aportan una capa de planificación útil para la defensa "
        "del TFG: demuestran que el sistema no solo registra tickets, sino que ayuda a priorizar "
        "y controlar compromisos de servicio."
    ),
    (
        "El trabajo demuestra que es posible, en el plazo de un TFG, entregar una aplicación "
        "completa, documentada y desplegable, con mejoras sucesivas de usabilidad y seguridad. "
        "Quedan como ampliación futura las notificaciones al instante en el móvil, la integración "
        "con el directorio de usuarios de la empresa y la generación automática de informes en PDF."
    ),
    (
        "En lo personal, el proyecto ha servido para enlazar la formación académica con la "
        "práctica en empresa: analizar un problema real, proponer solución, implementarla, "
        "probarla y explicarla por escrito y con demo ante el tribunal."
    ),
]

# --- 9. Bibliografía (texto introductorio opcional) ---
BIBLIOGRAFIA_INTRO = [
    (
        "Las referencias siguientes se han utilizado durante el diseño y la implementación. "
        "El formato corresponde a APA 6, según indica la guía del centro."
    ),
]

# --- 10. Anexos ---
ANEXOS_INTRO = [
    (
        "En los anexos se recoge material complementario: dirección del repositorio, galería "
        "completa de capturas y algunos fragmentos de código para quien desee profundizar "
        "en la parte técnica. No es obligatorio leerlos para entender el funcionamiento general "
        "descrito en el apartado de Desarrollo."
    ),
]

ANEXOS_REPOSITORIO = (
    "Repositorio del proyecto: https://github.com/miguelgomes129/velo (rama main). "
    "Guía de instalación en internet: docs/DEPLOY.md del repositorio. "
    "Usuarios de prueba tras preparar la base de datos: empleado ana@velo.com, "
    "agente carlos@velo.com, administrador admin@velo.com (contraseñas documentadas en README)."
)
