import { pool } from "@/lib/db";
import { borrarArchivosIncidencia } from "@/lib/adjuntos";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { logger } from "@/lib/logger";
import { calcularFechaLimite } from "@/lib/sla";
import {
  puedeEditarContenidoIncidencia,
  puedeEliminarIncidencia,
  puedeGestionarAsignacionIncidencia,
  puedeGestionarEstadoIncidencia,
  getIncidenciaById,
} from "@/lib/incidencias";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";
import { parseJson, patchIncidenciaSchema } from "@/lib/validate";

const MOTIVOS_CIERRE = ["resuelta", "rechazada", "duplicada"] as const;

type IncidenciaRow = {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  asignado_a: number | null;
  asignado_por: number | null;
  fecha_asignacion: string | null;
  fecha_cierre: string | null;
  resolucion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

const RETURNING = `
  id, usuario_id, titulo, descripcion, estado, prioridad, equipo_codigo,
  asignado_a, asignado_por, fecha_asignacion, fecha_cierre, fecha_limite, motivo_cierre, resolucion,
  fecha_creacion, fecha_actualizacion
`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  return Response.json({ item: res.incidencia });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id, incidencia } = res;

  const raw = await request.json().catch(() => null);
  if (raw === null) {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = parseJson(patchIncidenciaSchema, raw);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  const puedeEditarTexto = puedeEditarContenidoIncidencia(usuario, incidencia);
  const puedeEstado = await puedeGestionarEstadoIncidencia(usuario, incidencia);
  const puedeAsignar = await puedeGestionarAsignacionIncidencia(usuario);

  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.estado !== undefined) {
    if (!puedeEstado) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    if (body.estado === "cerrada") {
      const motivo = (body.motivo_cierre ?? "").toLowerCase();
      const resolucion = (body.resolucion ?? incidencia.resolucion ?? "").trim();
      if (!MOTIVOS_CIERRE.includes(motivo as (typeof MOTIVOS_CIERRE)[number])) {
        return Response.json(
          { error: "Indica un motivo de cierre: resuelta, rechazada o duplicada" },
          { status: 400 },
        );
      }
      if (resolucion.length < 10) {
        return Response.json(
          { error: "Añade un comentario de cierre (mínimo 10 caracteres)" },
          { status: 400 },
        );
      }
      sets.push(`motivo_cierre = $${idx++}`);
      values.push(motivo);
      sets.push(`resolucion = $${idx++}`);
      values.push(resolucion);
    }
    sets.push(`estado = $${idx++}`);
    values.push(body.estado);
    if (body.estado === "cerrada") {
      sets.push(`fecha_cierre = COALESCE(fecha_cierre, NOW())`);
    }
  }

  if (body.prioridad !== undefined) {
    const incidenciaCerrada = (incidencia.estado ?? "").trim().toLowerCase() === "cerrada";
    const puedePrioridad = puedeEstado || (puedeEditarTexto && !incidenciaCerrada);
    if (!puedePrioridad) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    sets.push(`prioridad = $${idx++}`);
    values.push(body.prioridad);
    sets.push(`fecha_limite = $${idx++}`);
    values.push(calcularFechaLimite(body.prioridad).toISOString());
  }

  if (body.asignado_a !== undefined) {
    if (!puedeAsignar) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    if (body.asignado_a !== null) {
      const { rows: u } = await pool.query<{ id: number }>(
        `SELECT id FROM usuarios WHERE id = $1 LIMIT 1`,
        [body.asignado_a],
      );
      if (!u[0]) {
        return Response.json({ error: "Usuario asignado no válido" }, { status: 400 });
      }
    }
    sets.push(`asignado_a = $${idx++}`);
    values.push(body.asignado_a);
    sets.push(`asignado_por = $${idx++}`);
    values.push(usuario.id);
    sets.push(`fecha_asignacion = NOW()`);
  }

  if (body.descripcion !== undefined) {
    if (!puedeEditarTexto) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    sets.push(`descripcion = $${idx++}`);
    values.push(body.descripcion);
  }

  if (!sets.length) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  sets.push(`fecha_actualizacion = NOW()`);
  values.push(id);

  const { rows } = await pool.query<IncidenciaRow>(
    `
    UPDATE incidencias
    SET ${sets.join(", ")}
    WHERE id = $${idx}
    RETURNING ${RETURNING}
  `,
    values,
  );

  if (!rows[0]) {
    return Response.json({ error: "Incidencia no encontrada" }, { status: 404 });
  }

  // Registro de eventos (auditoría)
  if (body.estado !== undefined && body.estado !== incidencia.estado) {
    await registrarEventoIncidencia({
      incidenciaId: id,
      usuarioId: usuario.id,
      tipo: body.estado === "cerrada" ? "cerrada" : "estado",
      valorAnterior: incidencia.estado,
      valorNuevo: body.estado,
      detalle: body.estado === "cerrada" ? body.motivo_cierre ?? null : null,
    });
  }
  if (body.prioridad !== undefined && body.prioridad !== incidencia.prioridad) {
    await registrarEventoIncidencia({
      incidenciaId: id,
      usuarioId: usuario.id,
      tipo: "prioridad",
      valorAnterior: incidencia.prioridad,
      valorNuevo: body.prioridad,
    });
  }
  if (body.asignado_a !== undefined && body.asignado_a !== incidencia.asignado_a) {
    await registrarEventoIncidencia({
      incidenciaId: id,
      usuarioId: usuario.id,
      tipo: "asignacion",
      valorAnterior: incidencia.asignado_a ? String(incidencia.asignado_a) : null,
      valorNuevo: body.asignado_a ? String(body.asignado_a) : "sin asignar",
    });
  }
  if (body.descripcion !== undefined && body.descripcion !== incidencia.descripcion) {
    await registrarEventoIncidencia({
      incidenciaId: id,
      usuarioId: usuario.id,
      tipo: "descripcion",
      detalle: "Descripción actualizada",
    });
  }

  const detalle = await getIncidenciaById(id);
  return Response.json({ item: detalle ?? rows[0] });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id, incidencia } = res;

  if (!puedeEliminarIncidencia(usuario, incidencia)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await pool.connect();
  let rowCount = 0;
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM incidencia_mensajes WHERE incidencia_id = $1`, [id]);
    await client.query(`DELETE FROM incidencia_adjuntos WHERE incidencia_id = $1`, [id]);
    const result = await client.query(`DELETE FROM incidencias WHERE id = $1`, [id]);
    rowCount = result.rowCount ?? 0;
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error("DELETE /api/incidencias/[id]", { id, error: (e as Error).message });
    throw e;
  } finally {
    client.release();
  }

  if (!rowCount) {
    return Response.json({ error: "Incidencia no encontrada" }, { status: 404 });
  }

  try {
    await borrarArchivosIncidencia(id);
  } catch (e) {
    logger.warn("No se pudieron borrar archivos físicos", {
      id,
      error: (e as Error).message,
    });
  }

  return Response.json({ ok: true });
}
