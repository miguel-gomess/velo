import { ensureAdminPluginSchema } from "@/lib/adminPluginSchema";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export const ADMIN_DEPT = "ADMIN";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  email: string;
  departamento: string | null;
  es_admin: boolean;
};

export async function getUsuarioFromRequest(
  request: Request,
): Promise<UsuarioSesion | null> {
  await ensureAdminPluginSchema();
  const session = await auth.api.getSession({ headers: request.headers });
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  const { rows } = await pool.query<UsuarioSesion>(
    `
    SELECT id, nombre, email, departamento, es_admin
    FROM usuarios
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `,
    [email],
  );

  return rows[0] ?? null;
}

/** Admin de panel: departamento ADMIN o flag es_admin en directorio. */
export function isAdminUsuario(usuario: UsuarioSesion): boolean {
  if (usuario.es_admin) return true;
  return (usuario.departamento ?? "").trim().toUpperCase() === ADMIN_DEPT;
}

export function requireAdminResponse(usuario: UsuarioSesion | null): Response | null {
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminUsuario(usuario)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }
  return null;
}
