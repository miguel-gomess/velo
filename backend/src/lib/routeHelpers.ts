import { getIncidenciaById, puedeAccederIncidencia, type IncidenciaDetalle } from "@/lib/incidencias";
import { getUsuarioFromRequest, type UsuarioSesion } from "@/lib/session";

type Ok = {
  ok: true;
  usuario: UsuarioSesion;
  id: number;
  incidencia: IncidenciaDetalle;
};
type Err = { ok: false; response: Response };

/**
 * Centraliza el prólogo común de los route handlers de incidencias:
 * - Sesión válida → 401
 * - id numérico → 400
 * - incidencia existente → 404
 * - puede acceder según rol/scope → 403
 */
export async function cargarIncidenciaAccesible(
  request: Request,
  paramsPromise: Promise<{ id: string }>,
): Promise<Ok | Err> {
  const usuario = await getUsuarioFromRequest(request);
  if (!usuario) {
    return {
      ok: false,
      response: Response.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  const { id: idRaw } = await paramsPromise;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) {
    return {
      ok: false,
      response: Response.json({ error: "ID inválido" }, { status: 400 }),
    };
  }

  const incidencia = await getIncidenciaById(id);
  if (!incidencia) {
    return {
      ok: false,
      response: Response.json({ error: "Incidencia no encontrada" }, { status: 404 }),
    };
  }

  if (!(await puedeAccederIncidencia(usuario, incidencia))) {
    return {
      ok: false,
      response: Response.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { ok: true, usuario, id, incidencia };
}
