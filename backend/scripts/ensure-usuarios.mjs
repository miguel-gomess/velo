/**
 * Tabla directorio `usuarios` (Velo) — independiente de Better Auth ("user").
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

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    departamento VARCHAR(64),
    es_admin BOOLEAN NOT NULL DEFAULT false,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await pool.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'es_admin' AND is_nullable = 'NO'
    ) THEN
      NULL;
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'es_admin'
    ) THEN
      ALTER TABLE usuarios ADD COLUMN es_admin BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END $$;
`);

console.log("Tabla usuarios lista.");
await pool.end();
