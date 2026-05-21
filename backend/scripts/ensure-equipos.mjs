import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const EQUIPOS_CATALOGO = [
  { codigo: "IT", nombre: "Tecnología" },
  { codigo: "RRHH", nombre: "Recursos humanos" },
  { codigo: "ADMIN", nombre: "Administración / sistemas" },
  { codigo: "MANTENIMIENTO", nombre: "Mantenimiento" },
  { codigo: "FINANZAS", nombre: "Finanzas" },
  { codigo: "COMERCIAL", nombre: "Comercial" },
  { codigo: "LEGAL", nombre: "Legal" },
];

const CODIGOS_VALIDOS = new Set(EQUIPOS_CATALOGO.map((e) => e.codigo));

function normalizeEquipoCodigo(raw) {
  const t = (raw ?? "").trim().toUpperCase();
  if (!t || t === "SEGÚN CONTENIDO" || t === "SEGUN CONTENIDO") return null;
  if (t.startsWith("IT")) return "IT";
  if (t.includes("RRHH")) return "RRHH";
  if (t.includes("MANTENIMIENTO")) return "MANTENIMIENTO";
  if (t.includes("FINANZAS")) return "FINANZAS";
  if (t.includes("COMERCIAL")) return "COMERCIAL";
  if (t.includes("LEGAL")) return "LEGAL";
  if (t.includes("ADMIN")) return "ADMIN";
  if (CODIGOS_VALIDOS.has(t)) return t;
  return null;
}

function equipoCodigoFromDescripcion(descripcion) {
  const m = descripcion.match(/^Equipo:\s*(.+)$/im);
  if (!m) return null;
  return normalizeEquipoCodigo(m[1]);
}

function equiposDesdeDepartamento(departamento) {
  const cod = normalizeEquipoCodigo(departamento);
  if (!cod || cod === "ADMIN") return [];
  return [cod];
}

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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(32) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS usuario_equipos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, equipo_id)
  );
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS usuario_equipos_usuario_idx ON usuario_equipos (usuario_id);`,
);

await pool.query(
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS equipo_codigo VARCHAR(32)`,
);

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencias_equipo_codigo_idx ON incidencias (equipo_codigo);`,
);

for (const eq of EQUIPOS_CATALOGO) {
  await pool.query(
    `
    INSERT INTO equipos (codigo, nombre)
    VALUES ($1, $2)
    ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
  `,
    [eq.codigo, eq.nombre],
  );
}

const { rows: usuarios } = await pool.query(`SELECT id, departamento FROM usuarios`);

for (const u of usuarios) {
  const codigos = equiposDesdeDepartamento(u.departamento);
  for (const codigo of codigos) {
    await pool.query(
      `
      INSERT INTO usuario_equipos (usuario_id, equipo_id)
      SELECT $1, e.id FROM equipos e WHERE e.codigo = $2
      ON CONFLICT DO NOTHING
    `,
      [u.id, codigo],
    );
  }
}

const { rows: incidencias } = await pool.query(
  `SELECT id, descripcion, equipo_codigo FROM incidencias WHERE equipo_codigo IS NULL`,
);

for (const inc of incidencias) {
  const codigo = equipoCodigoFromDescripcion(inc.descripcion ?? "");
  if (!codigo) continue;
  await pool.query(`UPDATE incidencias SET equipo_codigo = $1 WHERE id = $2`, [codigo, inc.id]);
}

try {
  await pool.query(`ALTER TABLE usuarios ALTER COLUMN departamento DROP NOT NULL`);
} catch (e) {
  console.warn("ALTER departamento nullable:", e.message);
}

console.log("Equipos, membresías y equipo_codigo en incidencias sincronizados.");
await pool.end();
