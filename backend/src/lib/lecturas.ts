import { pool } from "@/lib/db";
import {
  contextoLecturaMensajes,
  paramsLecturaMensajes,
  sqlPuedeVerMensajeInterno,
  type ContextoLecturaMensajes,
} from "@/lib/mensajes";
import type { UsuarioSesion } from "@/lib/session";

export async function marcarIncidenciaLeida(
  incidenciaId: number,
  usuarioId: number,
  ultimoMensajeId?: number | null,
): Promise<void> {
  await pool.query(
    `
    INSERT INTO incidencia_lecturas (
      incidencia_id, usuario_id, ultimo_mensaje_id, ultima_lectura_at, ultima_asignacion_vista_at
    )
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (incidencia_id, usuario_id)
    DO UPDATE SET
      ultimo_mensaje_id = COALESCE(EXCLUDED.ultimo_mensaje_id, incidencia_lecturas.ultimo_mensaje_id),
      ultima_lectura_at = NOW(),
      ultima_asignacion_vista_at = NOW()
  `,
    [incidenciaId, usuarioId, ultimoMensajeId ?? null],
  );
}

export async function contarMensajesSinLeer(
  usuarioId: number,
  incidenciaIds?: number[],
  ctx?: ContextoLecturaMensajes,
): Promise<{ total: number; porIncidencia: Record<number, number> }> {
  const lecturaCtx = ctx ?? {
    usuarioId,
    esAdmin: false,
    equiposCodigos: [] as string[],
  };

  const params: unknown[] = [usuarioId];
  let filtroInc = "";
  if (incidenciaIds?.length) {
    params.push(incidenciaIds);
    filtroInc = ` AND m.incidencia_id = ANY($${params.length}::int[])`;
  }

  const equiposParamIndex = params.length + 1;
  const visibilidad = sqlPuedeVerMensajeInterno(lecturaCtx, equiposParamIndex);
  const queryParams = paramsLecturaMensajes(lecturaCtx, params);

  const { rows } = await pool.query<{ incidencia_id: number; n: string }>(
    `
    SELECT m.incidencia_id, COUNT(*)::text AS n
    FROM incidencia_mensajes m
    INNER JOIN incidencias i ON i.id = m.incidencia_id
    LEFT JOIN incidencia_lecturas l
      ON l.incidencia_id = m.incidencia_id AND l.usuario_id = $1
    WHERE m.autor_id <> $1
      AND (
        l.ultimo_mensaje_id IS NULL
        OR m.id > l.ultimo_mensaje_id
      )
      AND (${visibilidad})
      ${filtroInc}
    GROUP BY m.incidencia_id
  `,
    queryParams,
  );

  const porIncidencia: Record<number, number> = {};
  let total = 0;
  for (const r of rows) {
    const c = Number(r.n);
    porIncidencia[r.incidencia_id] = c;
    total += c;
  }
  return { total, porIncidencia };
}

export async function contarMensajesSinLeerUsuario(
  usuario: UsuarioSesion,
  incidenciaIds?: number[],
): Promise<{ total: number; porIncidencia: Record<number, number> }> {
  const ctx = await contextoLecturaMensajes(usuario);
  return contarMensajesSinLeer(usuario.id, incidenciaIds, ctx);
}
