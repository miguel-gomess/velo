import { pool } from "@/lib/db";
import { obtenerResumenNotificaciones } from "@/lib/notificaciones";
import { getUsuarioFromRequest, isAdminUsuario } from "@/lib/session";

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  let incidenciaIds: number[] | undefined;

  if (!isAdminUsuario(usuario)) {
    const { rows } = await pool.query<{ id: number }>(
      `
      SELECT DISTINCT i.id
      FROM incidencias i
      WHERE i.usuario_id = $1
         OR i.asignado_a = $1
         OR i.equipo_codigo IN (
           SELECT e.codigo
           FROM usuario_equipos ue
           INNER JOIN equipos e ON e.id = ue.equipo_id
           WHERE ue.usuario_id = $1
         )
    `,
      [usuario.id],
    );
    incidenciaIds = rows.map((r) => r.id);
    if (incidenciaIds.length === 0) {
      return Response.json({ total: 0, por_incidencia: {}, items: [] });
    }
  }

  const resumen = await obtenerResumenNotificaciones(usuario, incidenciaIds);
  return Response.json(resumen);
}
