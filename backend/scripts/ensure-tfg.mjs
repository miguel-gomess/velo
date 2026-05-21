/**
 * Extensiones TFG: historial, lecturas, cierre formal, adjuntos tipados, índices.
 */
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
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await pool.query(`
  ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS motivo_cierre VARCHAR(32);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencia_eventos (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(48) NOT NULL,
    detalle TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencia_eventos_incidencia_idx
  ON incidencia_eventos (incidencia_id, fecha_creacion DESC);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS incidencia_lecturas (
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ultimo_mensaje_id INTEGER REFERENCES incidencia_mensajes(id) ON DELETE SET NULL,
    ultima_lectura_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultima_asignacion_vista_at TIMESTAMPTZ,
    PRIMARY KEY (incidencia_id, usuario_id)
  );
`);

await pool.query(`
  ALTER TABLE incidencia_lecturas
  ADD COLUMN IF NOT EXISTS ultima_asignacion_vista_at TIMESTAMPTZ;
`);

await pool.query(`
  ALTER TABLE incidencia_adjuntos ADD COLUMN IF NOT EXISTS tipo VARCHAR(16) NOT NULL DEFAULT 'evidencia';
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencias_fecha_creacion_idx ON incidencias (fecha_creacion DESC);
`);

await pool.query(`
  ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS equipo_codigo VARCHAR(32);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencias_equipo_codigo_idx ON incidencias (equipo_codigo);
`);

// Normalizar columna imagen en mensajes (imagen_ruta -> imagen_url si aplica)
await pool.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'incidencia_mensajes' AND column_name = 'imagen_ruta'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'incidencia_mensajes' AND column_name = 'imagen_url'
    ) THEN
      ALTER TABLE incidencia_mensajes RENAME COLUMN imagen_ruta TO imagen_url;
    END IF;
  END $$;
`);

await pool.query(`
  ALTER TABLE incidencia_mensajes ADD COLUMN IF NOT EXISTS imagen_url TEXT;
`);

console.log("Extensiones TFG (eventos, lecturas, motivo_cierre, adjuntos.tipo) aplicadas.");
await pool.end();

const mejorasScript = resolve(dirname(fileURLToPath(import.meta.url)), "ensure-mejoras.mjs");
const mejorasRun = spawnSync(process.execPath, [mejorasScript], {
  stdio: "inherit",
  env: process.env,
});
if (mejorasRun.status !== 0) process.exit(mejorasRun.status ?? 1);
