import { pool } from "@/lib/db";
import { urlImagenIncidencia } from "@/lib/adjuntos";
import { puedeVerMensajesInternos } from "@/lib/incidencias";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";

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

function mapAdjunto(row: AdjuntoRow) {
  return {
    ...row,
    imagen_url: urlImagenIncidencia(row.ruta),
  };
}

/** Vista completa de incidencia en una sola petición (menos latencia en producción). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;

  const { usuario, id: incidenciaId, incidencia } = res;
  const verInternos = await puedeVerMensajesInternos(usuario, incidencia);
  const filtroInterno = verInternos ? "" : " AND COALESCE(m.es_interno, false) = false";

  const [mensajesRes, adjuntosRes] = await Promise.all([
    pool.query<MensajeRow>(
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
    ),
    pool.query<AdjuntoRow>(
      `
      SELECT
        a.id, a.incidencia_id, a.autor_id, a.ruta, a.nombre_original,
        a.mime_type, a.tamano_bytes, a.fecha_creacion,
        u.nombre AS autor_nombre
      FROM incidencia_adjuntos a
      INNER JOIN usuarios u ON u.id = a.autor_id
      WHERE a.incidencia_id = $1
        AND COALESCE(a.tipo, 'evidencia') = 'evidencia'
      ORDER BY a.fecha_creacion ASC
    `,
      [incidenciaId],
    ),
  ]);

  return Response.json({
    item: incidencia,
    mensajes: {
      items: mensajesRes.rows.map(mapMensaje),
      puede_comentarios_internos: verInternos,
    },
    adjuntos: { items: adjuntosRes.rows.map(mapAdjunto) },
  });
}
