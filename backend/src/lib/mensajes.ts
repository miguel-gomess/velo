import { pool } from "@/lib/db";
import { getEquiposUsuario, incidenciaEnScopeKanban } from "@/lib/equipos";
import { isAdminUsuario, type UsuarioSesion } from "@/lib/session";
import { puedeVerMensajesInternos } from "@/lib/incidencias";

export type ContextoLecturaMensajes = {
  usuarioId: number;
  esAdmin: boolean;
  equiposCodigos: string[];
};

export async function contextoLecturaMensajes(
  usuario: UsuarioSesion,
): Promise<ContextoLecturaMensajes> {
  const equiposCodigos = await getEquiposUsuario(usuario.id, usuario.departamento);
  return {
    usuarioId: usuario.id,
    esAdmin: isAdminUsuario(usuario),
    equiposCodigos,
  };
}

/** SQL: el usuario puede ver mensajes internos de esta incidencia. */
export function sqlPuedeVerMensajeInterno(
  ctx: ContextoLecturaMensajes,
  equiposParamIndex: number,
): string {
  const { equiposCodigos } = ctx;
  if (ctx.esAdmin) return "TRUE";
  const equipoClause =
    equiposCodigos.length > 0
      ? `(i.equipo_codigo IS NOT NULL AND i.equipo_codigo = ANY($${equiposParamIndex}::text[]))`
      : "FALSE";
  return `(
    COALESCE(m.es_interno, false) = false
    OR i.asignado_a = $1
    OR ${equipoClause}
    OR i.usuario_id <> $1
  )`;
}

export function paramsLecturaMensajes(
  ctx: ContextoLecturaMensajes,
  base: unknown[],
): unknown[] {
  if (ctx.esAdmin) return base;
  return [...base, ctx.equiposCodigos];
}

export async function filtrarMensajesVisiblesParaUsuario<T extends { es_interno?: boolean }>(
  usuario: UsuarioSesion,
  incidencia: {
    usuario_id: number;
    asignado_a: number | null;
    equipo_codigo?: string | null;
  },
  items: T[],
): Promise<T[]> {
  if (await puedeVerMensajesInternos(usuario, incidencia)) return items;
  return items.filter((m) => !m.es_interno);
}
