import { getIncidenciaById, puedeAccederIncidencia } from "@/lib/incidencias";
import { leerImagen } from "@/lib/adjuntos";
import { getUsuarioFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { path: segments } = await params;
  if (!segments?.length || segments.length < 2) {
    return Response.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const incidenciaId = Number(segments[0]);
  if (!Number.isFinite(incidenciaId) || incidenciaId < 1) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  // Cualquier segmento sospechoso (vacío, '..', barras) se rechaza ya aquí
  for (const seg of segments) {
    if (!seg || seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\")) {
      return Response.json({ error: "Ruta inválida" }, { status: 400 });
    }
  }

  const incidencia = await getIncidenciaById(incidenciaId);
  if (!incidencia) {
    return Response.json({ error: "Incidencia no encontrada" }, { status: 404 });
  }

  if (!(await puedeAccederIncidencia(usuario, incidencia))) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const rutaRelativa = segments.join("/");
  if (!rutaRelativa.startsWith(`${incidenciaId}/`)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { buffer, mime_type } = await leerImagen(rutaRelativa);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": mime_type,
        // No cachear en navegador: la autorización depende del usuario y de
        // su scope actual, que puede cambiar mientras la URL sigue siendo válida.
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
