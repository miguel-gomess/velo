import { pool } from "@/lib/db";
import { guardarImagenIncidencia, urlImagenIncidencia } from "@/lib/adjuntos";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { puedeVerMensajesInternos } from "@/lib/incidencias";
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
  es_propio: boolean;
};

function mapMensaje(row: MensajeRow) {
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
    es_propio: row.es_propio,
  };
}

function parseEsInterno(value: unknown): boolean {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId, incidencia } = res;

  const verInternos = await puedeVerMensajesInternos(usuario, incidencia);
  const filtroInterno = verInternos ? "" : " AND COALESCE(m.es_interno, false) = false";

  const { rows } = await pool.query<MensajeRow>(
    `
    SELECT
      m.id,
      m.incidencia_id,
      m.autor_id,
      m.contenido,
      m.imagen_url,
      COALESCE(m.es_interno, false) AS es_interno,
      m.fecha_creacion,
      u.nombre AS autor_nombre,
      u.departamento AS autor_departamento,
      (m.autor_id = $2) AS es_propio
    FROM incidencia_mensajes m
    INNER JOIN usuarios u ON u.id = m.autor_id
    WHERE m.incidencia_id = $1
    ${filtroInterno}
    ORDER BY m.fecha_creacion ASC
  `,
    [incidenciaId, usuario.id],
  );

  return Response.json({
    items: rows.map(mapMensaje),
    puede_comentarios_internos: verInternos,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId, incidencia } = res;

  const puedeInternos = await puedeVerMensajesInternos(usuario, incidencia);

  const contentType = request.headers.get("content-type") ?? "";
  let contenido = "";
  let imagenRuta: string | null = null;
  let esInterno = false;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    contenido = String(form.get("contenido") ?? "").trim();
    esInterno = parseEsInterno(form.get("es_interno"));
    const file = form.get("imagen");
    if (file instanceof File && file.size > 0) {
      try {
        const guardada = await guardarImagenIncidencia(incidenciaId, file);
        imagenRuta = guardada.ruta;
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
    contenido = (parsed.data.contenido ?? "").trim();
    esInterno = parseEsInterno(parsed.data.es_interno);
  }

  if (esInterno && !puedeInternos) {
    return Response.json(
      { error: "No puedes publicar comentarios internos en esta incidencia" },
      { status: 403 },
    );
  }

  if (!contenido && !imagenRuta) {
    return Response.json(
      { error: "Escribe un mensaje o adjunta una imagen" },
      { status: 400 },
    );
  }

  if (contenido.length > 4000) {
    return Response.json(
      { error: "El mensaje no puede superar 4000 caracteres" },
      { status: 400 },
    );
  }

  const { rows } = await pool.query<MensajeRow>(
    `
    INSERT INTO incidencia_mensajes (incidencia_id, autor_id, contenido, imagen_url, es_interno)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id, incidencia_id, autor_id, contenido, imagen_url,
      COALESCE(es_interno, false) AS es_interno,
      fecha_creacion
  `,
    [incidenciaId, usuario.id, contenido || "", imagenRuta, esInterno],
  );

  const inserted = rows[0];
  if (!inserted) {
    return Response.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }

  await pool.query(
    `UPDATE incidencias SET fecha_actualizacion = NOW() WHERE id = $1`,
    [incidenciaId],
  );

  await registrarEventoIncidencia({
    incidenciaId,
    usuarioId: usuario.id,
    tipo: "comentario",
    detalle: esInterno
      ? `[Interno] ${contenido ? contenido.slice(0, 100) : "Imagen adjunta"}`
      : contenido
        ? contenido.slice(0, 120)
        : "Imagen adjunta",
  });

  return Response.json(
    {
      item: mapMensaje({
        ...inserted,
        autor_nombre: usuario.nombre,
        autor_departamento: usuario.departamento,
        es_propio: true,
      }),
    },
    { status: 201 },
  );
}
