import { NextResponse } from "next/server";
import { ensureAdminPluginSchema } from "@/lib/adminPluginSchema";
import { forwardAuthCookies, safeRedirectPath } from "@/lib/authRedirect";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";
import { isSuperadminEmail } from "@/lib/superadmin";
import { ensureSuperadminAuthOnRequest } from "@/lib/superadminAuth";

async function impersonateRequest(
  request: Request,
  targetEmail: string,
  redirectPath: string,
): Promise<Response> {
  await ensureAdminPluginSchema();

  const session = await auth.api.getSession({ headers: request.headers });
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || !isSuperadminEmail(email)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  await ensureSuperadminAuthOnRequest(email);

  const me = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(me);
  if (denied) return denied;

  const normalized = targetEmail.trim().toLowerCase();
  if (!normalized) {
    return Response.json({ error: "Indica el email del usuario" }, { status: 400 });
  }

  const { rows: perfil } = await pool.query<{ id: number }>(
    `SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [normalized],
  );
  if (!perfil[0]) {
    return Response.json(
      { error: "Ese usuario no tiene ficha en el directorio de Velo" },
      { status: 404 },
    );
  }

  const { rows: authUser } = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [normalized],
  );
  if (!authUser[0]) {
    return Response.json(
      { error: "No hay cuenta de acceso para ese email" },
      { status: 404 },
    );
  }

  const baRes = await auth.api.impersonateUser({
    body: { userId: authUser[0].id },
    headers: request.headers,
    asResponse: true,
  });

  if (!baRes.ok) {
    const data = (await baRes.json().catch(() => ({}))) as { message?: string };
    const raw = data.message ?? "";
    const error =
      raw.includes("not allowed to impersonate")
        ? "Tu cuenta no tiene permiso de impersonación. Recarga la página e inténtalo de nuevo."
        : raw || "No se pudo iniciar sesión como ese usuario";
    return Response.json({ error }, { status: baRes.status });
  }

  const redirectTo = safeRedirectPath(redirectPath);
  const nextRes = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  return forwardAuthCookies(baRes, nextRes);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetEmail = searchParams.get("email") ?? "";
  const redirectPath = searchParams.get("redirect") ?? "/";
  return impersonateRequest(request, targetEmail, redirectPath);
}

export async function POST(request: Request) {
  let body: { email?: string; redirect?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }
  return impersonateRequest(request, body.email ?? "", body.redirect ?? "/");
}
