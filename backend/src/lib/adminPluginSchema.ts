import { pool } from "@/lib/db";

let ensured = false;
let ensurePromise: Promise<void> | null = null;

type PgError = { code?: string };

async function columnExists(table: string, column: string): Promise<boolean> {
  const { rows } = await pool.query<{ ok: number }>(
    `
    SELECT 1 AS ok
    FROM pg_attribute a
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
  return Boolean(rows[0]);
}

async function addColumnIfMissing(table: string, column: string, ddl: string) {
  if (await columnExists(table, column)) return;
  try {
    await pool.query(ddl);
  } catch (e) {
    const err = e as PgError;
    if (err.code === "42701") return;
    throw e;
  }
}

/** Columnas del plugin Admin de Better Auth (idempotente). */
export async function ensureAdminPluginSchema(): Promise<void> {
  if (ensured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await addColumnIfMissing("user", "role", `ALTER TABLE "user" ADD COLUMN role TEXT DEFAULT 'user'`);
    await addColumnIfMissing(
      "user",
      "banned",
      `ALTER TABLE "user" ADD COLUMN banned BOOLEAN DEFAULT false`,
    );
    await addColumnIfMissing("user", "banReason", `ALTER TABLE "user" ADD COLUMN "banReason" TEXT`);
    await addColumnIfMissing(
      "user",
      "banExpires",
      `ALTER TABLE "user" ADD COLUMN "banExpires" TIMESTAMPTZ`,
    );
    await addColumnIfMissing(
      "session",
      "impersonatedBy",
      `ALTER TABLE session ADD COLUMN "impersonatedBy" TEXT`,
    );
    ensured = true;
  })().finally(() => {
    ensurePromise = null;
  });

  return ensurePromise;
}
