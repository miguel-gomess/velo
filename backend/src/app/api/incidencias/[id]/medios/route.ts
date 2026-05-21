import { guardarImagenInlineIncidencia, urlImagenIncidencia } from "@/lib/adjuntos";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";

/** Sube imagen para incrustar en descripción o chat (no crea fila en adjuntos). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { id: incidenciaId } = res;

  const form = await request.formData();
  const file = form.get("imagen");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Imagen requerida" }, { status: 400 });
  }

  try {
    const guardada = await guardarImagenInlineIncidencia(incidenciaId, file);
    return Response.json(
      {
        url: urlImagenIncidencia(guardada.ruta),
        ruta: guardada.ruta,
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al subir imagen";
    return Response.json({ error: msg }, { status: 400 });
  }
}
