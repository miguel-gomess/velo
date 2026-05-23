import { ensureAdminPluginSchema } from "@/lib/adminPluginSchema";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getEquiposUsuario, puedeUsarKanbanEquipos } from "@/lib/equipos";
import { isAdminUsuario } from "@/lib/session";
import { isSuperadminEmail } from "@/lib/superadmin";
import { ensureSuperadminAuthOnRequest } from "@/lib/superadminAuth";

type UsuarioRow = {
  id: number;
  nombre: string;
  email: string;
  departamento: string | null;
  es_admin: boolean;
  fecha_creacion: string;
};

export async function GET(request: Request) {
  try {
    await ensureAdminPluginSchema();

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    try {
      await ensureSuperadminAuthOnRequest(email);
    } catch {
      /* No bloquear /api/me si falla la promoción de superadmin */
    }

    const { rows } = await pool.query<UsuarioRow>(
      `
    SELECT id, nombre, email, departamento, es_admin, fecha_creacion
    FROM usuarios
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `,
      [email],
    );

    if (!rows[0]) {
      return Response.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const usuario = rows[0];
    const equipos = await getEquiposUsuario(usuario.id, usuario.departamento);
    const admin = isAdminUsuario(usuario);

    return Response.json({
      ...usuario,
      equipos,
      puede_usar_kanban: !admin && puedeUsarKanbanEquipos(usuario.departamento, equipos),
      es_admin_panel: admin,
      es_superadmin: isSuperadminEmail(email),
    });
  } catch (e) {
    console.error("[api/me]", e);
    return Response.json({ error: "Error al cargar el perfil" }, { status: 500 });
  }
}
