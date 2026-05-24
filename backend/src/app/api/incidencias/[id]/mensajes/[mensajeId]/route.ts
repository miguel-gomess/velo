import { pool } from "@/lib/db";
import { borrarArchivoPorRuta, guardarImagenIncidencia, urlImagenIncidencia } from "@/lib/adjuntos";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { puedeGestionarContenidoAutor, puedeVerMensajesInternos } from "@/lib/incidencias";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";
import { mensajeSchema, parseJson } from "@/lib/validate";

type MensajeRow = {
  id: number;
  incidencia_id: number;
  autor_id: number;
  contenido: string;
  imagen_url: string | null;
  es_interno: boolean;
  fecha_creacion: string;
  autor_nombre: string;
  autor_departamento: string | null;
};

function parseEsInterno(value: unknown): boolean {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  return false;
}

function mapMensaje(row: MensajeRow, usuarioId: number) {
  return {
    id: row.id,
    incidencia_id: row.incidencia_id,
    autor_id: row.autor_id,
    contenido: row.contenido,
    imagen_url: row.imagen_url ? urlImagenIncidencia(row.imagen_url) : null,
    es_interno: row.es_interno,
    fecha_creacion: row.fecha_creacion,
    autor_nombre: row.autor_nombre,
    autor_departamento: row.autor_departamento,
    es_propio: row.autor_id === usuarioId,
  };
}

async function cargarMensaje(incidenciaId: number, mensajeId: number): Promise<MensajeRow | null> {
  const { rows } = await pool.query<MensajeRow>(
    `
    SELECT
      m.id, m.incidencia_id, m.autor_id, m.contenido, m.imagen_url,
      COALESCE(m.es_interno, false) AS es_interno,
      m.fecha_creacion,
      u.nombre AS autor_nombre,
      u.departamento AS autor_departamento
    FROM incidencia_mensajes m
    INNER JOIN usuarios u ON u.id = m.autor_id
    WHERE m.id = $1 AND m.incidencia_id = $2
    LIMIT 1
  `,
    [mensajeId, incidenciaId],
  );
  return rows[0] ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mensajeId: string }> },
) {
  const { id: idRaw, mensajeId: mensajeIdRaw } = await params;
  const res = await cargarIncidenciaAccesible(request, Promise.resolve({ id: idRaw }));
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId, incidencia } = res;

  const mensajeId = Number(mensajeIdRaw);
  if (!Number.isFinite(mensajeId) || mensajeId < 1) {
    return Response.json({ error: "ID de mensaje inválido" }, { status: 400 });
  }

  const mensaje = await cargarMensaje(incidenciaId, mensajeId);
  if (!mensaje) {
    return Response.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }
  if (!puedeGestionarContenidoAutor(usuario, mensaje.autor_id)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const puedeInternos = await puedeVerMensajesInternos(usuario, incidencia);
  const contentType = request.headers.get("content-type") ?? "";
  let contenido: string | undefined;
  let esInterno: boolean | undefined;
  let nuevaImagenRuta: string | null = null;
  const rutaImagenAnterior = mensaje.imagen_url;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    if (form.has("contenido")) {
      contenido = String(form.get("contenido") ?? "").trim();
    }
    if (form.has("es_interno")) {
      esInterno = parseEsInterno(form.get("es_interno"));
    }
    const file = form.get("imagen");
    if (file instanceof File && file.size > 0) {
      try {
        const guardada = await guardarImagenIncidencia(incidenciaId, file);
        nuevaImagenRuta = guardada.ruta;
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
    const parsed = parseJson(mensajeSchema, raw);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.data.contenido !== undefined) {
      contenido = parsed.data.contenido.trim();
    }
    if (parsed.data.es_interno !== undefined) {
      esInterno = parseEsInterno(parsed.data.es_interno);
    }
  }

  if (esInterno === true && !puedeInternos) {
    return Response.json({ error: "No puedes marcar el mensaje como interno" }, { status: 403 });
  }

  const contenidoFinal = contenido !== undefined ? contenido : mensaje.contenido;
  const esInternoFinal = esInterno !== undefined ? esInterno : mensaje.es_interno;
  const imagenFinal = nuevaImagenRuta ?? mensaje.imagen_url;

  if (!contenidoFinal && !imagenFinal) {
    return Response.json({ error: "El mensaje no puede quedar vacío" }, { status: 400 });
  }
  if (contenidoFinal.length > 4000) {
    return Response.json({ error: "El mensaje no puede superar 4000 caracteres" }, { status: 400 });
  }

  const nadaQueCambiar =
    contenido === undefined &&
    esInterno === undefined &&
    !nuevaImagenRuta;
  if (nadaQueCambiar) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  await pool.query(
    `
    UPDATE incidencia_mensajes SET
      contenido = $3,
      es_interno = $4,
      imagen_url = $5
    WHERE id = $1 AND incidencia_id = $2
  `,
    [mensajeId, incidenciaId, contenidoFinal, esInternoFinal, imagenFinal],
  );

  if (nuevaImagenRuta && rutaImagenAnterior) {
    await borrarArchivoPorRuta(rutaImagenAnterior);
  }

  await pool.query(`UPDATE incidencias SET fecha_actualizacion = NOW() WHERE id = $1`, [incidenciaId]);

  const actualizado = await cargarMensaje(incidenciaId, mensajeId);
  if (!actualizado) {
    return Response.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }

  await registrarEventoIncidencia({
    incidenciaId,
    usuarioId: usuario.id,
    tipo: "comentario",
    detalle: esInternoFinal ? `[Interno] Comentario editado` : "Comentario editado",
  });

  return Response.json({ item: mapMensaje(actualizado, usuario.id) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mensajeId: string }> },
) {
  const { id: idRaw, mensajeId: mensajeIdRaw } = await params;
  const res = await cargarIncidenciaAccesible(request, Promise.resolve({ id: idRaw }));
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId } = res;

  const mensajeId = Number(mensajeIdRaw);
  if (!Number.isFinite(mensajeId) || mensajeId < 1) {
    return Response.json({ error: "ID de mensaje inválido" }, { status: 400 });
  }

  const mensaje = await cargarMensaje(incidenciaId, mensajeId);
  if (!mensaje) {
    return Response.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }
  if (!puedeGestionarContenidoAutor(usuario, mensaje.autor_id)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  if (mensaje.imagen_url) {
    await borrarArchivoPorRuta(mensaje.imagen_url);
  }
  await pool.query(`DELETE FROM incidencia_mensajes WHERE id = $1 AND incidencia_id = $2`, [
    mensajeId,
    incidenciaId,
  ]);
  await pool.query(`UPDATE incidencias SET fecha_actualizacion = NOW() WHERE id = $1`, [incidenciaId]);

  await registrarEventoIncidencia({
    incidenciaId,
    usuarioId: usuario.id,
    tipo: "comentario",
    detalle: mensaje.es_interno ? "[Interno] Comentario eliminado" : "Comentario eliminado",
  });

  return Response.json({ ok: true });
}
