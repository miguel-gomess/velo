/**
 * Columnas del plugin Admin de Better Auth (role, banned, impersonatedBy, …).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

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
    /* .env opcional en CI */
  }
}

loadEnv();

const superadminEmails = (process.env.SUPERADMIN_EMAIL?.trim() || "miguel@velo.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function addColumnIfMissing(table, column, ddl) {
  const { rows } = await pool.query(
    `
    SELECT 1 FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = $1
      AND lower(a.attname) = lower($2)
      AND a.attnum > 0
      AND NOT a.attisdropped
    LIMIT 1
  `,
    [table, column],
  );
  if (rows[0]) return;
  try {
    await pool.query(ddl);
    console.log(`  + ${table}.${column}`);
  } catch (e) {
    if (e?.code === "42701") return;
    throw e;
  }
}

await addColumnIfMissing("user", "role", `ALTER TABLE "user" ADD COLUMN role TEXT DEFAULT 'user'`);
await addColumnIfMissing("user", "banned", `ALTER TABLE "user" ADD COLUMN banned BOOLEAN DEFAULT false`);
await addColumnIfMissing("user", "banReason", `ALTER TABLE "user" ADD COLUMN "banReason" TEXT`);
await addColumnIfMissing("user", "banExpires", `ALTER TABLE "user" ADD COLUMN "banExpires" TIMESTAMPTZ`);
await addColumnIfMissing(
  "session",
  "impersonatedBy",
  `ALTER TABLE session ADD COLUMN "impersonatedBy" TEXT`,
);

if (superadminEmails.length > 0) {
  const { rowCount } = await pool.query(
    `UPDATE "user" SET role = 'admin' WHERE LOWER(email) = ANY($1::text[])`,
    [superadminEmails],
  );
  console.log(`Superadmin(s) con rol Better Auth admin: ${rowCount ?? 0} fila(s).`);
}

console.log("Plugin Admin (Better Auth): esquema listo.");
await pool.end();
