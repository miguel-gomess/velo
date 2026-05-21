/**
 * Mejoras TFG: SLA (fecha_limite), índices de rendimiento.
 */
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
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS fecha_limite TIMESTAMPTZ;
`);

await pool.query(`
  ALTER TABLE incidencia_lecturas
  ADD COLUMN IF NOT EXISTS ultima_asignacion_vista_at TIMESTAMPTZ;
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencias_asignado_estado_idx
  ON incidencias (asignado_a, estado) WHERE asignado_a IS NOT NULL;
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencias_estado_prioridad_idx
  ON incidencias (estado, prioridad);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencias_fecha_limite_idx
  ON incidencias (fecha_limite) WHERE fecha_limite IS NOT NULL;
`);

await pool.query(`
  ALTER TABLE incidencia_mensajes
  ADD COLUMN IF NOT EXISTS es_interno BOOLEAN NOT NULL DEFAULT false;
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS incidencia_mensajes_interno_idx
  ON incidencia_mensajes (incidencia_id, es_interno);
`);

/**
 * La columna usuarios.password se mantiene por compatibilidad con instalaciones
 * previas, pero el login real lo gestiona Better Auth contra la tabla "account".
 * Hacerla NULLABLE evita tener que mantener hashes duplicados que se desincronizan.
 */
await pool.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'password' AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;
    END IF;
  END $$;
`);

console.log("Mejoras aplicadas: fecha_limite, comentarios internos, índices, password nullable.");
await pool.end();
