import { listEquiposConMiembros } from "@/lib/equipos";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;
  const items = await listEquiposConMiembros();
  return Response.json({ items });
}
