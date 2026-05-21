import { EQUIPOS_CATALOGO } from "@/lib/equipos";
import { getUsuarioFromRequest, requireAdminResponse } from "@/lib/session";

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  const denied = requireAdminResponse(usuario);
  if (denied) return denied;
  return Response.json({ items: EQUIPOS_CATALOGO });
}
