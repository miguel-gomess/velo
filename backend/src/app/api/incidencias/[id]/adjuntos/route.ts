import { pool } from "@/lib/db";
import { guardarImagenIncidencia, urlImagenIncidencia } from "@/lib/adjuntos";
import { registrarEventoIncidencia } from "@/lib/eventos";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";

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

function mapAdjunto(row: AdjuntoRow) {
  return {
    ...row,
    imagen_url: urlImagenIncidencia(row.ruta),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;

  const { rows } = await pool.query<AdjuntoRow>(
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
    [res.id],
  );

  return Response.json({ items: rows.map(mapAdjunto) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId } = res;

  const MAX_ADJUNTOS = 20;
  const { rows: countRows } = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM incidencia_adjuntos WHERE incidencia_id = $1 AND COALESCE(tipo, 'evidencia') = 'evidencia'`,
    [incidenciaId],
  );
  if ((countRows[0]?.n ?? 0) >= MAX_ADJUNTOS) {
    return Response.json(
      { error: `Máximo ${MAX_ADJUNTOS} archivos adjuntos por incidencia` },
      { status: 400 },
    );
  }

  const form = await request.formData();
  const file = form.get("imagen");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Debes adjuntar una imagen" }, { status: 400 });
  }

  try {
    const guardada = await guardarImagenIncidencia(incidenciaId, file);
    const { rows } = await pool.query<AdjuntoRow>(
      `
      INSERT INTO incidencia_adjuntos (
        incidencia_id, autor_id, ruta, nombre_original, mime_type, tamano_bytes, tipo
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'evidencia')
      RETURNING id, incidencia_id, autor_id, ruta, nombre_original, mime_type, tamano_bytes, fecha_creacion
    `,
      [
        incidenciaId,
        usuario.id,
        guardada.ruta,
        guardada.nombre_original,
        guardada.mime_type,
        guardada.tamano_bytes,
      ],
    );

    const inserted = rows[0];
    if (!inserted) {
      return Response.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    await registrarEventoIncidencia({
      incidenciaId,
      usuarioId: usuario.id,
      tipo: "adjunto",
      detalle: guardada.nombre_original,
    });

    return Response.json(
      {
        item: mapAdjunto({
          ...inserted,
          autor_nombre: usuario.nombre,
        }),
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al subir imagen";
    return Response.json({ error: msg }, { status: 400 });
  }
}
