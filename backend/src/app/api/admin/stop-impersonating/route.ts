import { NextResponse } from "next/server";
import { ensureAdminPluginSchema } from "@/lib/adminPluginSchema";
import { forwardAuthCookies, safeRedirectPath } from "@/lib/authRedirect";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isSuperadminEmail } from "@/lib/superadmin";

export async function GET(request: Request) {
  await ensureAdminPluginSchema();

  const session = await auth.api.getSession({ headers: request.headers });
  const impersonatedBy = (session?.session as { impersonatedBy?: string } | undefined)
    ?.impersonatedBy;

  if (!impersonatedBy) {
    return Response.json({ error: "No hay sesión de impersonación activa" }, { status: 400 });
  }

  const { rows } = await pool.query<{ email: string }>(
    `SELECT email FROM "user" WHERE id = $1 LIMIT 1`,
    [impersonatedBy],
  );
  const adminEmail = rows[0]?.email;
  if (!adminEmail || !isSuperadminEmail(adminEmail)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = safeRedirectPath(searchParams.get("redirect") ?? "/dashboard/directorio");

  const baRes = await auth.api.stopImpersonating({
    headers: request.headers,
    asResponse: true,
  });

  if (!baRes.ok) {
    const data = (await baRes.json().catch(() => ({}))) as { message?: string };
    return Response.json(
      { error: data.message || "No se pudo restaurar tu sesión" },
      { status: baRes.status },
    );
  }

  const nextRes = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  return forwardAuthCookies(baRes, nextRes);
}
