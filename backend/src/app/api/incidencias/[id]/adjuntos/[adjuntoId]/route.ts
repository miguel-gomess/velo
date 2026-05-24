import { pool } from "@/lib/db";
import {
  borrarArchivoPorRuta,
  guardarImagenIncidencia,
  urlImagenIncidencia,
} from "@/lib/adjuntos";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { puedeGestionarContenidoAutor } from "@/lib/incidencias";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";
import { adjuntoUpdateSchema, parseJson } from "@/lib/validate";

type AdjuntoRow = {
  id: number;
  incidencia_id: number;
  autor_id: number;
  ruta: string;
  nombre_original: string;
  mime_type: string;
  tamano_bytes: number;
  fecha_creacion: string;
  autor_nombre: string;
};

function mapAdjuntoResponse(row: AdjuntoRow, usuarioId: number) {
  return {
    ...row,
    imagen_url: urlImagenIncidencia(row.ruta),
    es_propio: row.autor_id === usuarioId,
  };
}

async function cargarAdjunto(incidenciaId: number, adjuntoId: number): Promise<AdjuntoRow | null> {
  const { rows } = await pool.query<AdjuntoRow>(
    `
    SELECT
      a.id, a.incidencia_id, a.autor_id, a.ruta, a.nombre_original,
      a.mime_type, a.tamano_bytes, a.fecha_creacion,
      u.nombre AS autor_nombre
    FROM incidencia_adjuntos a
    INNER JOIN usuarios u ON u.id = a.autor_id
    WHERE a.id = $1 AND a.incidencia_id = $2
      AND COALESCE(a.tipo, 'evidencia') = 'evidencia'
    LIMIT 1
  `,
    [adjuntoId, incidenciaId],
  );
  return rows[0] ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; adjuntoId: string }> },
) {
  const { id: idRaw, adjuntoId: adjuntoIdRaw } = await params;
  const res = await cargarIncidenciaAccesible(request, Promise.resolve({ id: idRaw }));
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId } = res;

  const adjuntoId = Number(adjuntoIdRaw);
  if (!Number.isFinite(adjuntoId) || adjuntoId < 1) {
    return Response.json({ error: "ID de adjunto inválido" }, { status: 400 });
  }

  const adjunto = await cargarAdjunto(incidenciaId, adjuntoId);
  if (!adjunto) {
    return Response.json({ error: "Adjunto no encontrado" }, { status: 404 });
  }
  if (!puedeGestionarContenidoAutor(usuario, adjunto.autor_id)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let nombreOriginal: string | undefined;
  let imagenReemplazada = false;
  const nombreAnterior = adjunto.nombre_original;
  const rutaAnterior = adjunto.ruta;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const nombre = String(form.get("nombre_original") ?? "").trim();
    if (nombre) nombreOriginal = nombre;
    const file = form.get("imagen");
    if (file instanceof File && file.size > 0) {
      try {
        const guardada = await guardarImagenIncidencia(incidenciaId, file);
        imagenReemplazada = true;
        await pool.query(
          `
          UPDATE incidencia_adjuntos SET
            ruta = $3,
            nombre_original = COALESCE($4, $5),
            mime_type = $6,
            tamano_bytes = $7,
            contenido = $8
          WHERE id = $1 AND incidencia_id = $2
        `,
          [
            adjuntoId,
            incidenciaId,
            guardada.ruta,
            nombreOriginal ?? null,
            guardada.nombre_original,
            guardada.mime_type,
            guardada.tamano_bytes,
            guardada.buffer,
          ],
        );
        await borrarArchivoPorRuta(rutaAnterior);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al subir imagen";
        return Response.json({ error: msg }, { status: 400 });
      }
    }
  } else {
    const raw = await request.json().catch(() => null);
    if (raw === null) {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }
    const parsed = parseJson(adjuntoUpdateSchema, raw);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    nombreOriginal = parsed.data.nombre_original;
  }

  if (!imagenReemplazada) {
    if (!nombreOriginal) {
      return Response.json({ error: "Nada que actualizar" }, { status: 400 });
    }
    await pool.query(
      `UPDATE incidencia_adjuntos SET nombre_original = $3 WHERE id = $1 AND incidencia_id = $2`,
      [adjuntoId, incidenciaId, nombreOriginal],
    );
  }

  await pool.query(`UPDATE incidencias SET fecha_actualizacion = NOW() WHERE id = $1`, [incidenciaId]);

  const actualizado = await cargarAdjunto(incidenciaId, adjuntoId);
  if (!actualizado) {
    return Response.json({ error: "Adjunto no encontrado" }, { status: 404 });
  }

  await registrarEventoIncidencia({
    incidenciaId,
    usuarioId: usuario.id,
    tipo: "adjunto",
    detalle: imagenReemplazada
      ? `Imagen reemplazada: ${actualizado.nombre_original}`
      : `Adjunto renombrado: ${nombreAnterior} → ${actualizado.nombre_original}`,
    valorAnterior: nombreAnterior,
    valorNuevo: actualizado.nombre_original,
  });

  return Response.json({ item: mapAdjuntoResponse(actualizado, usuario.id) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; adjuntoId: string }> },
) {
  const { id: idRaw, adjuntoId: adjuntoIdRaw } = await params;
  const res = await cargarIncidenciaAccesible(request, Promise.resolve({ id: idRaw }));
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId } = res;

  const adjuntoId = Number(adjuntoIdRaw);
  if (!Number.isFinite(adjuntoId) || adjuntoId < 1) {
    return Response.json({ error: "ID de adjunto inválido" }, { status: 400 });
  }

  const adjunto = await cargarAdjunto(incidenciaId, adjuntoId);
  if (!adjunto) {
    return Response.json({ error: "Adjunto no encontrado" }, { status: 404 });
  }
  if (!puedeGestionarContenidoAutor(usuario, adjunto.autor_id)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  await borrarArchivoPorRuta(adjunto.ruta);
  await pool.query(`DELETE FROM incidencia_adjuntos WHERE id = $1 AND incidencia_id = $2`, [
    adjuntoId,
    incidenciaId,
  ]);
  await pool.query(`UPDATE incidencias SET fecha_actualizacion = NOW() WHERE id = $1`, [incidenciaId]);

  await registrarEventoIncidencia({
    incidenciaId,
    usuarioId: usuario.id,
    tipo: "adjunto",
    detalle: `Adjunto eliminado: ${adjunto.nombre_original}`,
  });

  return Response.json({ ok: true });
}
