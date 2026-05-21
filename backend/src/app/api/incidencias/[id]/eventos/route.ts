import { listarEventosIncidencia } from "@/lib/eventos";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const items = await listarEventosIncidencia(res.id);
  return Response.json({ items });
}
