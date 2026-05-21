import { marcarIncidenciaLeida } from "@/lib/lecturas";
import { cargarIncidenciaAccesible } from "@/lib/routeHelpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await cargarIncidenciaAccesible(request, params);
  if (!res.ok) return res.response;
  const { usuario, id: incidenciaId } = res;

  const body = (await request.json().catch(() => ({}))) as {
    ultimo_mensaje_id?: number | null;
  };

  await marcarIncidenciaLeida(
    incidenciaId,
    usuario.id,
    body.ultimo_mensaje_id ?? null,
  );

  return Response.json({ ok: true });
}
