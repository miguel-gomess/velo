import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const EPICAS_CATALOGO = [
  { clave: "INFRA", nombre: "Infraestructura", color: "#6366f1" },
  { clave: "PORTAL", nombre: "Portal del empleado", color: "#2563eb" },
  { clave: "SEGURIDAD", nombre: "Seguridad y cumplimiento", color: "#dc2626" },
  { clave: "PROCESOS", nombre: "Mejora de procesos", color: "#059669" },
  { clave: "SOPORTE", nombre: "Soporte interno", color: "#d97706" },
];

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
  CREATE TABLE IF NOT EXISTS epicas (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(32) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    activa BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

await pool.query(`
  ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS epica_id INTEGER REFERENCES epicas(id) ON DELETE SET NULL;
`);

await pool.query(
  `CREATE INDEX IF NOT EXISTS incidencias_epica_id_idx ON incidencias (epica_id);`,
);

for (const ep of EPICAS_CATALOGO) {
  await pool.query(
    `
    INSERT INTO epicas (clave, nombre, color)
    VALUES ($1, $2, $3)
    ON CONFLICT (clave) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      color = EXCLUDED.color
  `,
    [ep.clave, ep.nombre, ep.color],
  );
}

console.log("Épicas y epica_id en incidencias sincronizados.");
await pool.end();
