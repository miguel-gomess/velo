import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

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

const usuariosScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-usuarios.mjs");
const usuariosRun = spawnSync(process.execPath, [usuariosScript], {
  stdio: "inherit",
  env: process.env,
});
if (usuariosRun.status !== 0) process.exit(usuariosRun.status ?? 1);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(280) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(32) NOT NULL DEFAULT 'abierta',
    prioridad VARCHAR(16) NOT NULL DEFAULT 'normal',
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    asignado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_asignacion TIMESTAMPTZ,
    fecha_cierre TIMESTAMPTZ,
    resolucion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

const alters = [
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS prioridad VARCHAR(16) NOT NULL DEFAULT 'normal'`,
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL`,
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS asignado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL`,
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS fecha_asignacion TIMESTAMPTZ`,
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ`,
  `ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS resolucion TEXT`,
];

for (const sql of alters) {
  try {
    await pool.query(sql);
  } catch (e) {
    console.warn("ALTER (puede ser idempotente):", e.message);
  }
}

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencias_usuario_id_idx ON incidencias (usuario_id);`,
);
await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencias_asignado_a_idx ON incidencias (asignado_a);`,
);
await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencias_estado_idx ON incidencias (estado);`,
);

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencia_mensajes (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    autor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencia_mensajes_incidencia_idx ON incidencia_mensajes (incidencia_id, fecha_creacion);`,
);

await pool.query(
  `ALTER TABLE incidencia_mensajes ADD COLUMN IF NOT EXISTS imagen_ruta TEXT`,
);

await pool.query(`
  ALTER TABLE incidencia_mensajes
  ADD COLUMN IF NOT EXISTS es_interno BOOLEAN NOT NULL DEFAULT false;
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencia_adjuntos (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    autor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ruta TEXT NOT NULL,
    nombre_original TEXT NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    tamano_bytes INTEGER NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencia_adjuntos_incidencia_idx ON incidencia_adjuntos (incidencia_id, fecha_creacion);`,
);

await pool.query(`
  ALTER TABLE incidencia_adjuntos ADD COLUMN IF NOT EXISTS contenido BYTEA;
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencia_archivos (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    ruta TEXT NOT NULL,
    contenido BYTEA NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    tamano_bytes INTEGER NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (incidencia_id, ruta)
  );
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencia_archivos_incidencia_idx ON incidencia_archivos (incidencia_id);`,
);

console.log("Tablas incidencias, mensajes, adjuntos y archivos sincronizadas.");
await pool.end();

const tfgScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-tfg.mjs");
const tfgRun = spawnSync(process.execPath, [tfgScript], {
  stdio: "inherit",
  env: process.env,
});
if (tfgRun.status !== 0) process.exit(tfgRun.status ?? 1);

const equiposScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-equipos.mjs");
const equiposRun = spawnSync(process.execPath, [equiposScript], {
  stdio: "inherit",
  env: process.env,
});
if (equiposRun.status !== 0) process.exit(equiposRun.status ?? 1);

const mejorasScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-mejoras.mjs");
const mejorasRun = spawnSync(process.execPath, [mejorasScript], {
  stdio: "inherit",
  env: process.env,
});
if (mejorasRun.status !== 0) process.exit(mejorasRun.status ?? 1);

const epicasScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-epicas.mjs");
const epicasRun = spawnSync(process.execPath, [epicasScript], {
  stdio: "inherit",
  env: process.env,
});
if (epicasRun.status !== 0) process.exit(epicasRun.status ?? 1);
