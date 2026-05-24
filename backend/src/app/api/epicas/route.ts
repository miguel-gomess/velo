import { crearEpica, listEpicasActivas, listEpicasTodas } from "@/lib/epicas";
import { getUsuarioFromRequest, isAdminUsuario } from "@/lib/session";
import { crearEpicaSchema, parseJson } from "@/lib/validate";

type PgError = { code?: string; constraint?: string };

export async function GET(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const url = new URL(request.url);
  const todas = url.searchParams.get("todas") === "1" && isAdminUsuario(usuario);
  const items = todas ? await listEpicasTodas() : await listEpicasActivas();
  return Response.json({ items });
}

export async function POST(request: Request) {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminUsuario(usuario)) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseJson(crearEpicaSchema, body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const item = await crearEpica(parsed.data);
    return Response.json({ item }, { status: 201 });
  } catch (e) {
    const pg = e as PgError;
    if (pg.code === "23505") {
      return Response.json({ error: "Ya existe una épica con esa clave" }, { status: 409 });
    }
    throw e;
  }
}
