/**
 * Ajusta usuarios demo para capturas de memoria (workspace + dashboard).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const pg = require(resolve(dirname(fileURLToPath(import.meta.url)), "../backend/node_modules/pg"));

function loadEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../backend/.env");
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

await pool.query(
  `UPDATE usuarios SET departamento = 'IT' WHERE LOWER(email) = 'carlos@velo.com'`,
);
await pool.query(
  `UPDATE usuarios SET departamento = 'ADMIN', es_admin = true WHERE LOWER(email) = 'admin@velo.com'`,
);

const adminPass =
  process.env.VELO_ADMIN_PASS ?? process.env.ADMIN_PASSWORD ?? "VeloAdmin2025!";
const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), "../backend");
const seedAdmin = spawnSync(
  "npx",
  ["tsx", "scripts/seed-admin.ts"],
  {
    cwd: backendDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ADMIN_EMAIL: "admin@velo.com",
      ADMIN_PASSWORD: adminPass,
      ADMIN_NAME: "Administrador Velo",
    },
  },
);
if (seedAdmin.status !== 0) {
  console.warn("Aviso: no se pudo sincronizar admin@velo.com para capturas.");
}

console.log("Usuarios demo listos para capturas (carlos→IT, admin→ADMIN).");
await pool.end();
