/**
 * Crea cuentas Better Auth para usuarios demo (ana, carlos, laura).
 * Ejecutar tras seed:demo: npx tsx scripts/seed-demo-auth.ts
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

const DEMOS = [
  { name: "Ana García", email: "ana@velo.com", password: "DemoVelo2025!", dept: "RRHH", es_admin: false },
  { name: "Carlos Ruiz", email: "carlos@velo.com", password: "DemoVelo2025!", dept: "Sistemas", es_admin: false },
  { name: "Laura Méndez", email: "laura@velo.com", password: "DemoVelo2025!", dept: "Sistemas", es_admin: true },
];

async function main() {
  const { auth } = await import("../src/lib/auth");
  const { pool } = await import("../src/lib/db");
  const origin = "http://localhost:5173";

  for (const u of DEMOS) {
    const email = u.email.toLowerCase();
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE email = $1`,
      [email],
    );
    for (const { id } of rows) {
      await pool.query(`DELETE FROM account WHERE "userId" = $1`, [id]);
      await pool.query(`DELETE FROM session WHERE "userId" = $1`, [id]);
      await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);
    }

    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, departamento, es_admin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         departamento = EXCLUDED.departamento,
         es_admin = EXCLUDED.es_admin`,
      [u.name, email, hash, u.dept, u.es_admin],
    );

    try {
      await auth.api.signUpEmail({
        body: { name: u.name, email, password: u.password },
        headers: new Headers({ origin }),
      });
      console.log(`OK ${email}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already") || msg.includes("exists")) {
        console.log(`Ya existe ${email}`);
      } else {
        console.error(email, msg);
      }
    }
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
