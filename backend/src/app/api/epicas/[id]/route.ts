import { actualizarEpica } from "@/lib/epicas";
import { getUsuarioFromRequest, isAdminUsuario } from "@/lib/session";
import { actualizarEpicaSchema, parseJson } from "@/lib/validate";

type PgError = { code?: string; constraint?: string };

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminUsuario(usuario)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseJson(actualizarEpicaSchema, body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const item = await actualizarEpica(id, parsed.data);
    if (!item) {
      return Response.json({ error: "Épica no encontrada" }, { status: 404 });
    }
    return Response.json({ item });
  } catch (e) {
    const pg = e as PgError;
    if (pg.code === "23505") {
      return Response.json({ error: "Ya existe una épica con esa clave" }, { status: 409 });
    }
    throw e;
  }
}
