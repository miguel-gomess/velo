/**
 * Datos de demostración completos para capturas de la memoria TFG.
 * Usuarios Better Auth + incidencias con épicas, plazos SLA y estados variados.
 *
 * Uso: npm run seed:memoria (desde backend o raíz)
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generarPngDemo, varianteDesdeTipo } from "./lib/demo-png";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_PASSWORD = process.env.VELO_DEMO_PASS ?? "DemoVelo2025!";

function loadEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadEnv();

/** Adjuntos demo en PostgreSQL (Neon/Vercel); disco local no sirve en producción. */
process.env.UPLOAD_STORAGE = "db";

function fechaMensaje(fechaCreacionInc: string, dias = 0, hora = 11): string {
  const d = new Date(fechaCreacionInc);
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 15, 0, 0);
  return d.toISOString();
}

async function insertarMensajesDemo(
  pool: Awaited<ReturnType<typeof import("../src/lib/db")>>["pool"],
  registrarEvento: typeof import("../src/lib/eventos").registrarEventoIncidencia,
  incidenciaId: number,
  ids: Record<string, number>,
  mensajes: MensajeDemo[],
  fechaCreacionInc: string,
): Promise<void> {
  const { guardarImagenIncidencia } = await import("../src/lib/adjuntos");
  let seq = 0;

  for (const msg of mensajes) {
    let imagenRuta: string | null = null;
    if (msg.imagen) {
      const seqActual = seq++;
      const variant = varianteDesdeTipo(msg.imagen, incidenciaId, seqActual, msg.contenido);
      const buffer = generarPngDemo(variant, msg.contenido, incidenciaId + seqActual);
      const file = new File(
        [buffer],
        `demo-${incidenciaId}-${seqActual}-${variant}.png`,
        { type: "image/png" },
      );
      const guardada = await guardarImagenIncidencia(incidenciaId, file);
      imagenRuta = guardada.ruta;
    }

    const contenido = msg.contenido.trim();
    const esInterno = msg.es_interno ?? false;
    const fecha = fechaMensaje(fechaCreacionInc, msg.dias ?? 0, msg.hora ?? 10);

    await pool.query(
      `
      INSERT INTO incidencia_mensajes (incidencia_id, autor_id, contenido, imagen_url, es_interno, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
    `,
      [incidenciaId, ids[msg.autor], contenido, imagenRuta, esInterno, fecha],
    );

    const detalleEvento = esInterno
      ? `[Interno] ${contenido || "Imagen adjunta"}`
      : contenido || "Imagen adjunta";

    await registrarEvento({
      incidenciaId,
      usuarioId: ids[msg.autor],
      tipo: "comentario",
      detalle: detalleEvento.slice(0, 200),
    });
  }
}

function isoDesdeOffsetDias(dias: number, hora = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
}

type UsuarioDemo = {
  nombre: string;
  email: string;
  departamento: string;
  es_admin: boolean;
};

type IncidenciaDemo = {
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  equipo_codigo: string;
  solicitante: string;
  asignado_a: string | null;
  epica_clave: string | null;
  dias_creacion: number;
  dias_limite: number | null;
  dias_cierre?: number | null;
  motivo_cierre?: string;
  resolucion?: string;
  mensajes?: MensajeDemo[];
};

type MensajeDemo = {
  autor: string;
  contenido: string;
  es_interno?: boolean;
  /** Adjunta captura de demostración (PNG). */
  imagen?: "captura" | "evidencia";
  /** Días respecto a la fecha de creación de la incidencia. */
  dias?: number;
  hora?: number;
};

const USUARIOS: UsuarioDemo[] = [
  { nombre: "Ana García", email: "ana@velo.com", departamento: "RRHH", es_admin: false },
  { nombre: "Carlos Ruiz", email: "carlos@velo.com", departamento: "IT", es_admin: false },
  { nombre: "María López", email: "maria@velo.com", departamento: "FINANZAS", es_admin: false },
  { nombre: "Pedro Sánchez", email: "pedro@velo.com", departamento: "COMERCIAL", es_admin: false },
  { nombre: "Laura Méndez", email: "laura@velo.com", departamento: "IT", es_admin: true },
];

const INCIDENCIAS: IncidenciaDemo[] = [
  {
    titulo: "No puedo acceder al VPN corporativo",
    descripcion:
      "Equipo: IT\n---\nDesde el lunes el cliente VPN devuelve error de certificado al conectar desde casa.",
    estado: "en_curso",
    prioridad: "alta",
    equipo_codigo: "IT",
    solicitante: "ana@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "INFRA",
    dias_creacion: -12,
    dias_limite: -2,
    mensajes: [
      { autor: "carlos@velo.com", contenido: "¿Puedes enviarme captura del error exacto?", dias: 1, hora: 10 },
      {
        autor: "ana@velo.com",
        contenido: "Adjunto captura. Aparece «certificate expired».",
        imagen: "captura",
        dias: 2,
        hora: 11,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Escalado a infraestructura externa. Ticket proveedor #8842.",
        es_interno: true,
        dias: 3,
        hora: 14,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Log del gateway con el fallo de certificado.",
        imagen: "evidencia",
        es_interno: true,
        dias: 4,
        hora: 9,
      },
    ],
  },
  {
    titulo: "Servidor de backups con rendimiento degradado",
    descripcion: "Equipo: IT\n---\nLas copias nocturnas tardan el triple desde la última actualización.",
    estado: "abierta",
    prioridad: "media",
    equipo_codigo: "IT",
    solicitante: "laura@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "INFRA",
    dias_creacion: -5,
    dias_limite: 4,
    mensajes: [
      { autor: "laura@velo.com", contenido: "Las copias de ayer tardaron más de 6 horas.", dias: 0, hora: 9 },
      {
        autor: "carlos@velo.com",
        contenido: "Revisando I/O del NAS y cola de trabajos.",
        es_interno: true,
        dias: 1,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Gráfica de uso de disco durante la ventana de backup.",
        imagen: "evidencia",
        dias: 2,
        hora: 11,
      },
      { autor: "carlos@velo.com", contenido: "Programada ventana de mantenimiento el viernes.", dias: 3, hora: 16 },
    ],
  },
  {
    titulo: "Error al entrar en el portal de nómina",
    descripcion:
      "Equipo: RRHH\n---\nTras el cambio de contraseña el portal de nómina muestra pantalla en blanco.",
    estado: "en_curso",
    prioridad: "alta",
    equipo_codigo: "RRHH",
    solicitante: "ana@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "PORTAL",
    dias_creacion: -8,
    dias_limite: 1,
    mensajes: [
      { autor: "ana@velo.com", contenido: "Ocurre en Chrome y Edge, mismo resultado.", dias: 1, hora: 9 },
      {
        autor: "ana@velo.com",
        contenido: "Pantalla en blanco tras el login.",
        imagen: "captura",
        dias: 2,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Error 502 en el balanceador del IdP. Reinicio programado.",
        es_interno: true,
        dias: 3,
        hora: 11,
      },
      { autor: "carlos@velo.com", contenido: "Revisando logs del SSO. Te aviso en breve.", dias: 4, hora: 15 },
    ],
  },
  {
    titulo: "Mejora: ordenar «Mis solicitudes» por última actividad",
    descripcion: "Equipo: IT\n---\nSolicitud de mejora para ver primero las incidencias con mensajes nuevos.",
    estado: "cerrada",
    prioridad: "baja",
    equipo_codigo: "IT",
    solicitante: "maria@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "PORTAL",
    dias_creacion: -20,
    dias_limite: -3,
    dias_cierre: -5,
    motivo_cierre: "resuelta",
    resolucion: "Desplegado en producción el orden por fecha de última actualización.",
    mensajes: [
      { autor: "maria@velo.com", contenido: "Sería útil ver primero las que tienen respuesta nueva.", dias: 1, hora: 10 },
      {
        autor: "carlos@velo.com",
        contenido: "PR #142 listo para desplegar en staging.",
        es_interno: true,
        dias: 5,
        hora: 11,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Captura del listado ordenado en staging.",
        imagen: "captura",
        dias: 8,
        hora: 12,
      },
      { autor: "maria@velo.com", contenido: "Perfecto, en producción funciona bien. ¡Gracias!", dias: 12, hora: 9 },
    ],
  },
  {
    titulo: "Revisión de permisos en carpeta compartida Finanzas",
    descripcion: "Equipo: IT\n---\nVarios usuarios ven documentos que no deberían.",
    estado: "en_curso",
    prioridad: "alta",
    equipo_codigo: "IT",
    solicitante: "maria@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "SEGURIDAD",
    dias_creacion: -10,
    dias_limite: -1,
    mensajes: [
      { autor: "maria@velo.com", contenido: "Usuarios de Comercial ven la carpeta «Presupuestos 2025».", dias: 1, hora: 9 },
      {
        autor: "carlos@velo.com",
        contenido: "ACL heredada del grupo antiguo FIN_COMERCIAL.",
        es_interno: true,
        dias: 2,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Export de permisos efectivos en el servidor.",
        imagen: "evidencia",
        es_interno: true,
        dias: 3,
        hora: 11,
      },
      { autor: "carlos@velo.com", contenido: "Aplicando corrección; aviso cuando esté listo.", dias: 5, hora: 14 },
    ],
  },
  {
    titulo: "Renovación certificado SSL portal interno",
    descripcion: "Equipo: IT\n---\nEl certificado del portal caduca en 15 días.",
    estado: "abierta",
    prioridad: "media",
    equipo_codigo: "IT",
    solicitante: "laura@velo.com",
    asignado_a: null,
    epica_clave: "SEGURIDAD",
    dias_creacion: -2,
    dias_limite: 12,
    mensajes: [
      { autor: "laura@velo.com", contenido: "Caduca el 8 de junio según el aviso del navegador.", dias: 0, hora: 10 },
      {
        autor: "laura@velo.com",
        contenido: "Captura del aviso de certificado en Chrome.",
        imagen: "captura",
        dias: 1,
        hora: 11,
      },
    ],
  },
  {
    titulo: "Automatizar alta de empleados en directorio activo",
    descripcion: "Equipo: RRHH\n---\nPropuesta de flujo automático al crear ficha en RRHH.",
    estado: "en_curso",
    prioridad: "media",
    equipo_codigo: "RRHH",
    solicitante: "ana@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "PROCESOS",
    dias_creacion: -14,
    dias_limite: 8,
    mensajes: [
      { autor: "ana@velo.com", contenido: "¿Podemos sincronizar alta en RRHH con el AD automáticamente?", dias: 1, hora: 9 },
      {
        autor: "carlos@velo.com",
        contenido: "Evaluando Power Automate vs script propio.",
        es_interno: true,
        dias: 3,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Diagrama del flujo propuesto.",
        imagen: "evidencia",
        dias: 5,
        hora: 11,
      },
      { autor: "carlos@velo.com", contenido: "Necesito validar con DPO antes de activar.", dias: 7, hora: 15 },
    ],
  },
  {
    titulo: "Documentar flujo portal → soporte → cierre",
    descripcion: "Equipo: IT\n---\nGuía interna para el equipo de soporte sobre cierre formal.",
    estado: "cerrada",
    prioridad: "baja",
    equipo_codigo: "IT",
    solicitante: "laura@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "PROCESOS",
    dias_creacion: -25,
    dias_limite: -7,
    dias_cierre: -8,
    motivo_cierre: "resuelta",
    resolucion: "Publicada en Confluence y enlazada desde Velo.",
    mensajes: [
      { autor: "laura@velo.com", contenido: "Falta documentar el cierre formal para el equipo.", dias: 2, hora: 10 },
      {
        autor: "carlos@velo.com",
        contenido: "Borrador en Confluence pendiente de revisión.",
        es_interno: true,
        dias: 10,
        hora: 11,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Índice de la guía publicada.",
        imagen: "captura",
        dias: 15,
        hora: 12,
      },
      { autor: "laura@velo.com", contenido: "Enlace guardado en favoritos del equipo. Gracias.", dias: 17, hora: 9 },
    ],
  },
  {
    titulo: "Solicitud de teclado ergonómico",
    descripcion: "Equipo: IT\n---\nMaterial ergonómico para puesto de teletrabajo.",
    estado: "abierta",
    prioridad: "baja",
    equipo_codigo: "IT",
    solicitante: "pedro@velo.com",
    asignado_a: null,
    epica_clave: "SOPORTE",
    dias_creacion: -3,
    dias_limite: 10,
    mensajes: [
      { autor: "pedro@velo.com", contenido: "Modelo preferido: Microsoft Ergonomic Keyboard.", dias: 0, hora: 10 },
      { autor: "pedro@velo.com", contenido: "Enlace del producto en la tienda corporativa.", dias: 1, hora: 11 },
    ],
  },
  {
    titulo: "Formación Velo para equipo de RRHH",
    descripcion: "Equipo: RRHH\n---\nSesión de 1 h para usar portal y seguimiento de incidencias.",
    estado: "cerrada",
    prioridad: "media",
    equipo_codigo: "RRHH",
    solicitante: "ana@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "SOPORTE",
    dias_creacion: -18,
    dias_limite: -4,
    dias_cierre: -6,
    motivo_cierre: "resuelta",
    resolucion: "Sesión impartida el martes; material enviado por correo.",
    mensajes: [
      { autor: "ana@velo.com", contenido: "¿Podemos agendar formación para el equipo de RRHH?", dias: 1, hora: 9 },
      {
        autor: "carlos@velo.com",
        contenido: "Reservada sala B y Teams el martes 10:00.",
        es_interno: true,
        dias: 3,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Invitación de calendario enviada.",
        imagen: "captura",
        dias: 4,
        hora: 11,
      },
      { autor: "ana@velo.com", contenido: "Sesión muy clara, gracias por el material.", dias: 12, hora: 16 },
    ],
  },
  {
    titulo: "Impresora planta 2 sin toner",
    descripcion: "Equipo: MANTENIMIENTO\n---\nImpresora HP recepción muestra toner agotado.",
    estado: "cerrada",
    prioridad: "baja",
    equipo_codigo: "MANTENIMIENTO",
    solicitante: "pedro@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "SOPORTE",
    dias_creacion: -9,
    dias_limite: -2,
    dias_cierre: -1,
    motivo_cierre: "resuelta",
    resolucion: "Cartucho sustituido e impresión de prueba correcta.",
    mensajes: [
      { autor: "pedro@velo.com", contenido: "La impresora de recepción no imprime.", dias: 0, hora: 8 },
      {
        autor: "carlos@velo.com",
        contenido: "Sustituido cartucho negro. Impresión de prueba OK.",
        imagen: "captura",
        dias: 1,
        hora: 11,
      },
      { autor: "pedro@velo.com", contenido: "Confirmado, imprime correctamente.", dias: 2, hora: 9 },
    ],
  },
  {
    titulo: "Consulta sobre plazos de vacaciones",
    descripcion: "Equipo: RRHH\n---\nDuda sobre días pendientes del ejercicio anterior.",
    estado: "abierta",
    prioridad: "baja",
    equipo_codigo: "RRHH",
    solicitante: "ana@velo.com",
    asignado_a: null,
    epica_clave: null,
    dias_creacion: -1,
    dias_limite: 6,
    mensajes: [
      { autor: "ana@velo.com", contenido: "¿Cuántos días del 2025 puedo disfrutar aún?", dias: 0, hora: 10 },
      {
        autor: "ana@velo.com",
        contenido: "Captura de mi saldo en el portal de RRHH.",
        imagen: "captura",
        dias: 1,
        hora: 11,
      },
    ],
  },
  {
    titulo: "Integración firma digital en contratos",
    descripcion: "Equipo: COMERCIAL\n---\nEvaluar proveedor para firma electrónica de contratos comerciales.",
    estado: "en_revision",
    prioridad: "media",
    equipo_codigo: "COMERCIAL",
    solicitante: "pedro@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "PROCESOS",
    dias_creacion: -6,
    dias_limite: 3,
    mensajes: [
      { autor: "pedro@velo.com", contenido: "Tenemos dos proveedores en shortlist.", dias: 1, hora: 10 },
      {
        autor: "carlos@velo.com",
        contenido: "Pendiente OK de Legal antes de piloto.",
        es_interno: true,
        dias: 2,
        hora: 11,
      },
      {
        autor: "pedro@velo.com",
        contenido: "Comparativa de precios adjunta.",
        imagen: "evidencia",
        dias: 3,
        hora: 14,
      },
    ],
  },
  {
    titulo: "Alerta antivirus en portátil comercial",
    descripcion: "Equipo: IT\n---\nEl EDR bloqueó un ejecutable sospechoso ayer por la tarde.",
    estado: "en_curso",
    prioridad: "critica",
    equipo_codigo: "IT",
    solicitante: "pedro@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "SEGURIDAD",
    dias_creacion: -2,
    dias_limite: 0,
    mensajes: [
      {
        autor: "pedro@velo.com",
        contenido: "El EDR bloqueó un .exe al abrir un adjunto de correo.",
        dias: 0,
        hora: 17,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Escalado a SOC. Hash del fichero en análisis.",
        es_interno: true,
        dias: 1,
        hora: 9,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Alerta en consola del EDR.",
        imagen: "evidencia",
        es_interno: true,
        dias: 1,
        hora: 10,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Falso positivo confirmado. Puedes ignorar la alerta.",
        dias: 2,
        hora: 11,
      },
    ],
  },
  {
    titulo: "WiFi sala de reuniones inestable",
    descripcion: "Equipo: IT\n---\nCortes intermitentes durante videollamadas.",
    estado: "abierta",
    prioridad: "alta",
    equipo_codigo: "IT",
    solicitante: "maria@velo.com",
    asignado_a: "carlos@velo.com",
    epica_clave: "INFRA",
    dias_creacion: -4,
    dias_limite: 2,
    mensajes: [
      { autor: "maria@velo.com", contenido: "Cortes cada 10–15 min en Teams.", dias: 1, hora: 10 },
      {
        autor: "carlos@velo.com",
        contenido: "Canal 36 saturado; migrando AP a 5 GHz dedicado.",
        es_interno: true,
        dias: 2,
        hora: 11,
      },
      {
        autor: "carlos@velo.com",
        contenido: "Mapa de cobertura tras el ajuste.",
        imagen: "evidencia",
        dias: 3,
        hora: 12,
      },
      { autor: "maria@velo.com", contenido: "Hoy la reunión de las 11:00 fue estable.", dias: 4, hora: 15 },
    ],
  },
];

async function upsertUsuarioAuth(
  auth: Awaited<ReturnType<typeof import("../src/lib/auth")>>["auth"],
  pool: Awaited<ReturnType<typeof import("../src/lib/db")>>["pool"],
  u: UsuarioDemo,
): Promise<number> {
  const email = u.email.toLowerCase();
  const { rows: existingAuth } = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE LOWER(email) = $1`,
    [email],
  );
  for (const { id } of existingAuth) {
    await pool.query(`DELETE FROM account WHERE "userId" = $1`, [id]);
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);
  }

  const bcrypt = (await import("bcryptjs")).default;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await pool.query<{ id: number }>(
    `
    INSERT INTO usuarios (nombre, email, password, departamento, es_admin)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      departamento = EXCLUDED.departamento,
      es_admin = EXCLUDED.es_admin
    RETURNING id
  `,
    [u.nombre, email, hash, u.departamento, u.es_admin],
  );
  const usuarioId = rows[0]!.id;

  try {
    await auth.api.signUpEmail({
      body: { name: u.nombre, email, password: DEMO_PASSWORD },
      headers: new Headers({ origin: "http://localhost:5173" }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("already") && !msg.includes("exists")) {
      console.warn(`Auth ${email}: ${msg}`);
    }
  }

  const { syncUsuarioEquiposDesdeDepartamento } = await import("../src/lib/equipos");
  await syncUsuarioEquiposDesdeDepartamento(usuarioId, u.departamento);
  return usuarioId;
}

async function main() {
  const { auth } = await import("../src/lib/auth");
  const { pool } = await import("../src/lib/db");
  const { registrarEventoIncidencia } = await import("../src/lib/eventos");
  const { borrarArchivosIncidencia } = await import("../src/lib/adjuntos");

  const ids: Record<string, number> = {};
  for (const u of USUARIOS) {
    ids[u.email] = await upsertUsuarioAuth(auth, pool, u);
    console.log(`Usuario OK ${u.email} (${u.departamento})`);
  }

  await pool.query(
    `UPDATE usuarios SET departamento = 'ADMIN', es_admin = true WHERE LOWER(email) = 'admin@velo.com'`,
  );

  const { rows: epicas } = await pool.query<{ id: number; clave: string }>(
    `SELECT id, clave FROM epicas WHERE activa`,
  );
  const epicaPorClave = new Map(epicas.map((e) => [e.clave, e.id]));

  let creadas = 0;
  let actualizadas = 0;

  for (const inc of INCIDENCIAS) {
    const { rows: exists } = await pool.query<{ id: number }>(
      `SELECT id FROM incidencias WHERE titulo = $1 LIMIT 1`,
      [inc.titulo],
    );

    const fechaCreacion = isoDesdeOffsetDias(inc.dias_creacion, 9);
    const fechaLimite = inc.dias_limite != null ? isoDesdeOffsetDias(inc.dias_limite) : null;
    const fechaCierre =
      inc.estado === "cerrada" && inc.dias_cierre != null
        ? isoDesdeOffsetDias(inc.dias_cierre, 11)
        : null;
    const epicaId = inc.epica_clave ? (epicaPorClave.get(inc.epica_clave) ?? null) : null;

    const params = [
      ids[inc.solicitante],
      inc.titulo,
      inc.descripcion,
      inc.estado,
      inc.prioridad,
      inc.equipo_codigo,
      inc.asignado_a ? ids[inc.asignado_a] : null,
      epicaId,
      fechaCreacion,
      fechaLimite,
      fechaCierre,
      inc.motivo_cierre ?? null,
      inc.resolucion ?? null,
    ];

    let incidenciaId: number;

    if (exists[0]) {
      incidenciaId = exists[0].id;
      await pool.query(
        `
        UPDATE incidencias SET
          descripcion = $2, estado = $3, prioridad = $4, equipo_codigo = $5,
          asignado_a = $6, epica_id = $7, fecha_creacion = $8::timestamptz,
          fecha_limite = $9::timestamptz, fecha_cierre = $10::timestamptz,
          motivo_cierre = $11, resolucion = $12, fecha_actualizacion = NOW()
        WHERE id = $1
      `,
        [incidenciaId, ...params.slice(2)],
      );
      await pool.query(`DELETE FROM incidencia_mensajes WHERE incidencia_id = $1`, [incidenciaId]);
      await pool.query(`DELETE FROM incidencia_eventos WHERE incidencia_id = $1`, [incidenciaId]);
      await borrarArchivosIncidencia(incidenciaId);
      actualizadas++;
    } else {
      const { rows: inserted } = await pool.query<{ id: number }>(
        `
        INSERT INTO incidencias (
          usuario_id, titulo, descripcion, estado, prioridad, equipo_codigo,
          asignado_a, epica_id, fecha_creacion, fecha_limite, fecha_cierre,
          motivo_cierre, resolucion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12, $13)
        RETURNING id
      `,
        params,
      );
      incidenciaId = inserted[0]!.id;
      creadas++;
    }

    await registrarEventoIncidencia({
      incidenciaId,
      usuarioId: ids[inc.solicitante],
      tipo: "creada",
      detalle: "Incidencia de demostración TFG",
    });

    if (epicaId && inc.epica_clave) {
      await registrarEventoIncidencia({
        incidenciaId,
        usuarioId: inc.asignado_a ? ids[inc.asignado_a]! : ids[inc.solicitante],
        tipo: "epica",
        valorNuevo: inc.epica_clave,
      });
    }

    if (inc.asignado_a) {
      await registrarEventoIncidencia({
        incidenciaId,
        usuarioId: ids[inc.asignado_a],
        tipo: "asignacion",
        valorNuevo: inc.asignado_a.split("@")[0],
      });
    }

    if (inc.mensajes?.length) {
      await insertarMensajesDemo(
        pool,
        registrarEventoIncidencia,
        incidenciaId,
        ids,
        inc.mensajes,
        fechaCreacion,
      );
    }
  }

  const totalMensajes = INCIDENCIAS.reduce((n, i) => n + (i.mensajes?.length ?? 0), 0);
  console.log("");
  console.log(
    `Incidencias demo: ${creadas} nuevas, ${actualizadas} actualizadas (${INCIDENCIAS.length} total, ${totalMensajes} comentarios).`,
  );
  console.log("");
  console.log("Credenciales (contraseña para todos):", DEMO_PASSWORD);
  console.log("  ana@velo.com      — empleada RRHH (portal)");
  console.log("  carlos@velo.com   — agente IT (workspace / kanban)");
  console.log("  maria@velo.com    — empleada Finanzas");
  console.log("  pedro@velo.com    — empleado Comercial");
  console.log("  admin@velo.com    — administración (departamento ADMIN)");
  console.log("");
  console.log("Ejecuta capturas: npm run memoria (desde la raíz, con dev en marcha)");

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
