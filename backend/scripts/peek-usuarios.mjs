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

const cols = await pool.query(
  `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position`,
);
console.log("usuarios columns:", cols.rows);

const idx = await pool.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'usuarios'`);
console.log("indexes:", idx.rows);

const u = await pool.query(`SELECT id, email FROM usuarios ORDER BY id`);
console.log("usuarios:", u.rows);

const ba = await pool.query(`SELECT id, email FROM "user" ORDER BY id`);
console.log("better-auth user:", ba.rows);

await pool.end();
