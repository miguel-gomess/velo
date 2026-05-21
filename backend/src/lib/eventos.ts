import { pool } from "@/lib/db";

export type TipoEventoIncidencia =
  | "creada"
  | "estado"
  | "prioridad"
  | "asignacion"
  | "descripcion"
  | "comentario"
  | "adjunto"
  | "cerrada";

export type IncidenciaEvento = {
  id: number;
  incidencia_id: number;
  usuario_id: number;
  tipo: string;
  detalle: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  fecha_creacion: string;
  usuario_nombre: string;
};

export async function registrarEventoIncidencia(opts: {
  incidenciaId: number;
  usuarioId: number;
  tipo: TipoEventoIncidencia;
  detalle?: string | null;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
}): Promise<void> {
  await pool.query(
    `
    INSERT INTO incidencia_eventos
      (incidencia_id, usuario_id, tipo, detalle, valor_anterior, valor_nuevo)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [
      opts.incidenciaId,
      opts.usuarioId,
      opts.tipo,
      opts.detalle ?? null,
      opts.valorAnterior ?? null,
      opts.valorNuevo ?? null,
    ],
  );
}

export async function listarEventosIncidencia(
  incidenciaId: number,
): Promise<IncidenciaEvento[]> {
  const { rows } = await pool.query<IncidenciaEvento>(
    `
    SELECT
      e.id, e.incidencia_id, e.usuario_id, e.tipo, e.detalle,
      e.valor_anterior, e.valor_nuevo, e.fecha_creacion,
      u.nombre AS usuario_nombre
    FROM incidencia_eventos e
    INNER JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.incidencia_id = $1
    ORDER BY e.fecha_creacion DESC
    LIMIT 200
  `,
    [incidenciaId],
  );
  return rows;
}
