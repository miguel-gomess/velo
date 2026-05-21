import { pool } from "@/lib/db";
import { contarMensajesSinLeerUsuario } from "@/lib/lecturas";
import type { UsuarioSesion } from "@/lib/session";

export type NotificacionItem = {
  id: string;
  incidencia_id: number;
  titulo: string;
  tipo: "mensaje" | "asignacion";
  cantidad: number;
  detalle: string;
  fecha: string | null;
};

export async function listarAsignacionesSinVer(
  usuarioId: number,
  incidenciaIds?: number[],
): Promise<
  Array<{
    incidencia_id: number;
    titulo: string;
    fecha_asignacion: string;
    asignado_por_nombre: string;
  }>
> {
  const params: unknown[] = [usuarioId];
  let filtroInc = "";
  if (incidenciaIds?.length) {
    params.push(incidenciaIds);
    filtroInc = ` AND i.id = ANY($${params.length}::int[])`;
  }

  const { rows } = await pool.query<{
    incidencia_id: number;
    titulo: string;
    fecha_asignacion: string;
    asignado_por_nombre: string;
  }>(
    `
    SELECT
      i.id AS incidencia_id,
      i.titulo,
      i.fecha_asignacion::text AS fecha_asignacion,
      u.nombre AS asignado_por_nombre
    FROM incidencias i
    INNER JOIN usuarios u ON u.id = i.asignado_por
    LEFT JOIN incidencia_lecturas l
      ON l.incidencia_id = i.id AND l.usuario_id = $1
    WHERE i.asignado_a = $1
      AND i.asignado_por IS NOT NULL
      AND i.asignado_por <> $1
      AND i.fecha_asignacion IS NOT NULL
      AND (
        l.ultima_asignacion_vista_at IS NULL
        OR i.fecha_asignacion > l.ultima_asignacion_vista_at
      )
      ${filtroInc}
    ORDER BY i.fecha_asignacion DESC
  `,
    params,
  );

  return rows;
}

export async function obtenerResumenNotificaciones(
  usuario: UsuarioSesion,
  incidenciaIds?: number[],
): Promise<{
  total: number;
  por_incidencia: Record<number, number>;
  items: NotificacionItem[];
}> {
  const usuarioId = usuario.id;
  const [{ total: totalMensajes, porIncidencia }, asignaciones] = await Promise.all([
    contarMensajesSinLeerUsuario(usuario, incidenciaIds),
    listarAsignacionesSinVer(usuarioId, incidenciaIds),
  ]);

  const idsMensajes = Object.keys(porIncidencia).map(Number).filter((n) => n > 0);
  const ids = [...new Set([...idsMensajes, ...asignaciones.map((a) => a.incidencia_id)])];

  const titulos = new Map<number, string>();
  if (ids.length > 0) {
    const { rows } = await pool.query<{ id: number; titulo: string }>(
      `SELECT id, titulo FROM incidencias WHERE id = ANY($1::int[])`,
      [ids],
    );
    for (const r of rows) titulos.set(r.id, r.titulo);
  }

  const items: NotificacionItem[] = [];

  for (const a of asignaciones) {
    items.push({
      id: `${a.incidencia_id}-asignacion`,
      incidencia_id: a.incidencia_id,
      titulo: titulos.get(a.incidencia_id) ?? a.titulo,
      tipo: "asignacion",
      cantidad: 1,
      detalle: `${a.asignado_por_nombre} te ha asignado esta incidencia`,
      fecha: a.fecha_asignacion,
    });
  }

  for (const id of idsMensajes) {
    const cantidad = porIncidencia[id] ?? 0;
    if (cantidad < 1) continue;
    items.push({
      id: `${id}-mensaje`,
      incidencia_id: id,
      titulo: titulos.get(id) ?? `Incidencia ${id}`,
      tipo: "mensaje",
      cantidad,
      detalle:
        cantidad === 1 ? "1 mensaje nuevo en el chat" : `${cantidad} mensajes nuevos en el chat`,
      fecha: null,
    });
  }

  items.sort((a, b) => {
    const ta = a.fecha ? new Date(a.fecha).getTime() : 0;
    const tb = b.fecha ? new Date(b.fecha).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return b.cantidad - a.cantidad;
  });

  const total = totalMensajes + asignaciones.length;

  return { total, por_incidencia: porIncidencia, items };
}
