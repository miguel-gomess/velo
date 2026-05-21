import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
  try {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const k = m[1].trim();
      const v = m[2].trim();
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* .env opcional cuando se pasan variables por CI */
  }
}

loadEnv();

function generarPasswordAleatoria(): string {
  // 24 caracteres alfanuméricos, suficiente entropía para el bootstrap inicial.
  return randomBytes(18).toString("base64url");
}

async function main() {
  const { auth } = await import("../src/lib/auth");
  const { pool } = await import("../src/lib/db");

  const email = (process.env.ADMIN_EMAIL ?? "admin@velo.com").trim().toLowerCase();
  const nombre = process.env.ADMIN_NAME ?? "ADMIN";
  let password = process.env.ADMIN_PASSWORD;
  const passwordGenerada = !password;
  if (!password) password = generarPasswordAleatoria();

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres");
  }

  try {
    const { rows: existing } = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE email = $1`,
      [email],
    );

    for (const { id: userId } of existing) {
      await pool.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
    }

    await pool.query(`DELETE FROM usuarios WHERE email = $1`, [email]);

    await auth.api.signUpEmail({
      body: { name: nombre, email, password },
      headers: new Headers({ origin: "http://localhost:5173" }),
    });

    await pool.query(
      `INSERT INTO usuarios (nombre, email, departamento, es_admin)
       VALUES ($1, $2, $3, $4)`,
      [nombre, email, "ADMIN", true],
    );

    console.log(`Admin creado: ${email}`);
    if (passwordGenerada) {
      console.log("───────────────────────────────────────────────");
      console.log("Contraseña inicial (anótala, no se volverá a mostrar):");
      console.log(`  ${password}`);
      console.log("───────────────────────────────────────────────");
      console.log("Define ADMIN_PASSWORD en tu .env para evitar este aviso.");
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
