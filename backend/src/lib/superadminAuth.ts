import { pool } from "@/lib/db";
import { ensureAdminPluginSchema } from "@/lib/adminPluginSchema";
import { getSuperadminEmails, isSuperadminEmail } from "@/lib/superadmin";

/**
 * IDs de Better Auth con permiso admin (impersonar, etc.).
 * Se rellena en caliente desde la BD; el plugin Admin lee este mismo array.
 */
export const superadminAuthUserIds: string[] = [];

let refreshPromise: Promise<void> | null = null;

/** Sincroniza adminUserIds y rol `admin` en BD para los superadmins configurados. */
export async function refreshSuperadminAuthAccess(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    await ensureAdminPluginSchema();

    const emails = getSuperadminEmails();
    if (emails.length === 0) return;

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE LOWER(email) = ANY($1::text[])`,
      [emails],
    );

    superadminAuthUserIds.length = 0;
    for (const { id } of rows) {
      superadminAuthUserIds.push(id);
    }

    await pool.query(
      `UPDATE "user" SET role = 'admin' WHERE LOWER(email) = ANY($1::text[])`,
      [emails],
    );
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function ensureSuperadminAuthOnRequest(email: string | null | undefined): Promise<void> {
  if (!isSuperadminEmail(email)) return;
  await refreshSuperadminAuthAccess();
}
