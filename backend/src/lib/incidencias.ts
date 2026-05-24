import { pool } from "@/lib/db";
import {
  getEquiposUsuario,
  incidenciaEnScopeKanban,
  normalizeEquipoCodigo,
  puedeCambiarEstadoEnTablero,
} from "@/lib/equipos";
import type { UsuarioSesion } from "@/lib/session";
import { isAdminUsuario } from "@/lib/session";

export type IncidenciaDetalle = {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  equipo_codigo: string | null;
  epica_id: number | null;
  epica_nombre: string | null;
  epica_clave: string | null;
  epica_color: string | null;
  asignado_a: number | null;
  asignado_por: number | null;
  fecha_asignacion: string | null;
  fecha_cierre: string | null;
  fecha_limite: string | null;
  motivo_cierre: string | null;
  resolucion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  solicitante_nombre: string;
  solicitante_departamento: string | null;
  asignado_nombre: string | null;
};

const DETALLE_SELECT = `
  i.id, i.usuario_id, i.titulo, i.descripcion, i.estado, i.prioridad, i.equipo_codigo,
  i.epica_id, ep.nombre AS epica_nombre, ep.clave AS epica_clave, ep.color AS epica_color,
  i.asignado_a, i.asignado_por, i.fecha_asignacion, i.fecha_cierre, i.fecha_limite, i.motivo_cierre, i.resolucion,
  i.fecha_creacion, i.fecha_actualizacion,
  u.nombre AS solicitante_nombre,
  u.departamento AS solicitante_departamento,
  a.nombre AS asignado_nombre
`;

const DETALLE_FROM = `
  FROM incidencias i
  INNER JOIN usuarios u ON u.id = i.usuario_id
  LEFT JOIN usuarios a ON a.id = i.asignado_a
  LEFT JOIN epicas ep ON ep.id = i.epica_id
`;

export async function getIncidenciaById(id: number): Promise<IncidenciaDetalle | null> {
  const { rows } = await pool.query<IncidenciaDetalle>(
    `
    SELECT ${DETALLE_SELECT}
    ${DETALLE_FROM}
    WHERE i.id = $1
    LIMIT 1
  `,
    [id],
  );
  return rows[0] ?? null;
}

export async function puedeAccederIncidencia(
  usuario: UsuarioSesion,
  incidencia: {
    usuario_id: number;
    asignado_a: number | null;
    equipo_codigo?: string | null;
  },
): Promise<boolean> {
  if (isAdminUsuario(usuario)) return true;
  if (incidencia.usuario_id === usuario.id) return true;
  if (incidencia.asignado_a === usuario.id) return true;
  const equipos = await getEquiposUsuario(usuario.id, usuario.departamento);
  return incidenciaEnScopeKanban(
    { asignado_a: incidencia.asignado_a, equipo_codigo: incidencia.equipo_codigo ?? null },
    usuario.id,
    equipos,
  );
}

export function puedeGestionarIncidencia(usuario: UsuarioSesion): boolean {
  return isAdminUsuario(usuario);
}

export async function puedeGestionarEstadoIncidencia(
  usuario: UsuarioSesion,
  incidencia: { asignado_a: number | null; equipo_codigo: string | null },
): Promise<boolean> {
  const equipos = await getEquiposUsuario(usuario.id, usuario.departamento);
  return puedeCambiarEstadoEnTablero(
    isAdminUsuario(usuario),
    incidencia,
    usuario.id,
    equipos,
  );
}

export async function puedeGestionarAsignacionIncidencia(
  usuario: UsuarioSesion,
): Promise<boolean> {
  return isAdminUsuario(usuario);
}

export { normalizeEquipoCodigo };

export function puedeEditarContenidoIncidencia(
  usuario: UsuarioSesion,
  incidencia: { usuario_id: number },
): boolean {
  return isAdminUsuario(usuario) || incidencia.usuario_id === usuario.id;
}

export function puedeEliminarIncidencia(
  usuario: UsuarioSesion,
  incidencia: { usuario_id: number },
): boolean {
  return isAdminUsuario(usuario) || incidencia.usuario_id === usuario.id;
}

/** Notas internas: visibles para agentes/admin, no para el solicitante en portal. */
export async function puedeVerMensajesInternos(
  usuario: UsuarioSesion,
  incidencia: {
    usuario_id: number;
    asignado_a: number | null;
    equipo_codigo?: string | null;
  },
): Promise<boolean> {
  if (isAdminUsuario(usuario)) return true;
  if (incidencia.asignado_a === usuario.id) return true;
  const equipos = await getEquiposUsuario(usuario.id, usuario.departamento);
  if (
    incidenciaEnScopeKanban(
      { asignado_a: incidencia.asignado_a, equipo_codigo: incidencia.equipo_codigo ?? null },
      usuario.id,
      equipos,
    )
  ) {
    return true;
  }
  return false;
}
