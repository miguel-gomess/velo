/**
 * Datos de demostración para memoria / defensa TFG.
 * Requiere: npm run db:setup && npm run seed:admin
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

async function main() {
  const bcrypt = (await import("bcryptjs")).default;
  const { pool } = await import("../src/lib/db");

  const demos = [
    { nombre: "Ana García", email: "ana@velo.com", dept: "RRHH", es_admin: false },
    { nombre: "Carlos Ruiz", email: "carlos@velo.com", dept: "Sistemas", es_admin: false },
    { nombre: "Laura Méndez", email: "laura@velo.com", dept: "Sistemas", es_admin: true },
  ];

  const password = "demo123";
  const hash = await bcrypt.hash(password, 10);

  const ids: Record<string, number> = {};

  for (const u of demos) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO usuarios (nombre, email, password, departamento, es_admin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`,
      [u.nombre, u.email, hash, u.dept, u.es_admin],
    );
    ids[u.email] = rows[0]!.id;
  }

  const { rows: adminRows } = await pool.query<{ id: number }>(
    `SELECT id FROM usuarios WHERE email = 'admin@velo.com' LIMIT 1`,
  );
  const adminId = adminRows[0]?.id ?? ids["laura@velo.com"];

  const incidencias = [
    {
      titulo: "No puedo acceder al VPN corporativo",
      descripcion: "Categoría: Conectividad\nEquipo: Sistemas\n---\nDesde ayer el cliente VPN devuelve error de certificado.",
      estado: "en_curso",
      prioridad: "alta",
      usuario_id: ids["ana@velo.com"],
      asignado_a: ids["carlos@velo.com"],
      equipo_codigo: "sistemas",
    },
    {
      titulo: "Solicitud de alta en nómina digital",
      descripcion: "Categoría: RRHH\nEquipo: RRHH\n---\nNecesito activar el acceso al portal de nómina para un becario.",
      estado: "abierta",
      prioridad: "media",
      usuario_id: ids["ana@velo.com"],
      asignado_a: null,
      equipo_codigo: "rrhh",
    },
    {
      titulo: "Impresora planta 2 sin toner",
      descripcion: "Categoría: Instalaciones\nEquipo: Mantenimiento\n---\nLa impresora HP de recepción muestra toner agotado.",
      estado: "cerrada",
      prioridad: "baja",
      usuario_id: ids["carlos@velo.com"],
      asignado_a: adminId,
      equipo_codigo: "mantenimiento",
      motivo_cierre: "resuelta",
      resolucion: "Se sustituyó el cartucho y se verificó una impresión de prueba correcta.",
    },
  ];

  for (const inc of incidencias) {
    const { rows: exists } = await pool.query<{ id: number }>(
      `SELECT id FROM incidencias WHERE titulo = $1 LIMIT 1`,
      [inc.titulo],
    );
    if (exists[0]) continue;

    await pool.query(
      `
      INSERT INTO incidencias (
        usuario_id, titulo, descripcion, estado, prioridad, equipo_codigo,
        asignado_a, motivo_cierre, resolucion, fecha_cierre
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $4 = 'cerrada' THEN NOW() ELSE NULL END)
      `,
      [
        inc.usuario_id,
        inc.titulo,
        inc.descripcion,
        inc.estado,
        inc.prioridad,
        inc.equipo_codigo,
        inc.asignado_a,
        (inc as { motivo_cierre?: string }).motivo_cierre ?? null,
        (inc as { resolucion?: string }).resolucion ?? null,
      ],
    );
  }

  console.log("Demo listo. Usuarios: ana@velo.com, carlos@velo.com, laura@velo.com — contraseña demo123");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
