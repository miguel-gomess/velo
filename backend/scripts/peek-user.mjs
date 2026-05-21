import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  if (process.env[m[1].trim()] === undefined) process.env[m[1].trim()] = m[2].trim();
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const email = "admin@velo.com";

const users = await pool.query(`SELECT id, email, name FROM "user" WHERE email = $1`, [email]);
console.log("user:", users.rows);

const accounts = await pool.query(
  `SELECT a.id, a."providerId", a."accountId", (a.password IS NOT NULL) AS has_password
   FROM account a JOIN "user" u ON u.id = a."userId" WHERE u.email = $1`,
  [email],
);
console.log("account:", accounts.rows);

const usuarios = await pool.query(
  `SELECT id, email, nombre, departamento FROM usuarios WHERE email = $1`,
  [email],
);
console.log("usuarios:", usuarios.rows);

await pool.end();
