import { pool } from "@/lib/db";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";
import { isSuperadminEmail } from "@/lib/superadmin";
import { ensureSuperadminAuthOnRequest } from "@/lib/superadminAuth";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || !isSuperadminEmail(email)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  await ensureSuperadminAuthOnRequest(email);

  const me = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(me);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const targetEmail = searchParams.get("email")?.trim().toLowerCase();
  if (!targetEmail) {
    return Response.json({ error: "Indica el email del usuario" }, { status: 400 });
  }

  const { rows } = await pool.query<{ id: string; email: string; name: string | null }>(
    `SELECT id, email, name FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [targetEmail],
  );

  if (!rows[0]) {
    return Response.json(
      { error: "No hay cuenta de acceso para ese email. Comprueba que el usuario tenga contraseña en el sistema." },
      { status: 404 },
    );
  }

  return Response.json({
    userId: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
  });
}
