/** Misma base que Better Auth (cookies de sesión en el mismo origen). */
export const API_BASE =
  (import.meta.env.VITE_AUTH_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Ruta relativa del API para servir un fichero de incidencia (sin host). */
export function rutaArchivoIncidencia(rutaRelativa: string): string {
  const rel = rutaRelativa.replace(/^\/+/, "").replace(/\.\./g, "");
  const encoded = rel.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `/api/incidencias/archivo/${encoded}`;
}

/**
 * Convierte `url`/`ruta` devueltos por el upload a la ruta API correcta.
 * Corrige URLs antiguas guardadas como `http://host/1/inline/...` sin `/api/incidencias/archivo/`.
 */
export function normalizarRutaMedio(pathOrUrl: string, rutaFallback?: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed && rutaFallback) return rutaArchivoIncidencia(rutaFallback);
  if (trimmed.startsWith("/api/incidencias/archivo/")) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      const p = u.pathname.replace(/^\/+/, "");
      if (p.startsWith("api/incidencias/archivo/")) return `/${p}`;
      if (/^\d+\//.test(p)) return rutaArchivoIncidencia(p);
    } catch {
      /* ignorar */
    }
    return trimmed;
  }

  const rel = trimmed.replace(/^\/+/, "");
  if (rel.startsWith("api/incidencias/archivo/")) return `/${rel}`;
  if (/^\d+\//.test(rel)) return rutaArchivoIncidencia(rel);
  if (rutaFallback) return rutaArchivoIncidencia(rutaFallback);
  return trimmed;
}

/** Rutas de archivos del API (`/api/incidencias/archivo/...`) con origen del backend. */
export function apiAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("blob:")) return path;
  const normalized = normalizarRutaMedio(path);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return apiUrl(normalized);
}

export type IncidenciaScope = "all" | "kanban" | "portal";

export type Incidencia = {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  equipo_codigo?: string | null;
  asignado_a: number | null;
  asignado_por: number | null;
  fecha_asignacion: string | null;
  fecha_cierre: string | null;
  fecha_limite?: string | null;
  motivo_cierre?: string | null;
  resolucion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  solicitante_nombre?: string;
  solicitante_departamento?: string | null;
  asignado_nombre?: string | null;
};

export type IncidenciaDetalle = Incidencia & {
  solicitante_nombre: string;
  solicitante_departamento: string | null;
  asignado_nombre: string | null;
};

export type IncidenciaMensaje = {
  id: number;
  incidencia_id: number;
  autor_id: number;
  contenido: string;
  imagen_url: string | null;
  es_interno: boolean;
  fecha_creacion: string;
  autor_nombre: string;
  autor_departamento: string | null;
  es_propio: boolean;
};

export type IncidenciaAdjunto = {
  id: number;
  incidencia_id: number;
  autor_id: number;
  ruta: string;
  nombre_original: string;
  mime_type: string;
  tamano_bytes: number;
  fecha_creacion: string;
  autor_nombre: string;
  imagen_url: string;
};

export async function apiGetIncidencia(id: number): Promise<{ item: IncidenciaDetalle }> {
  const res = await fetch(apiUrl(`/api/incidencias/${id}`), { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo cargar la incidencia");
  return data as { item: IncidenciaDetalle };
}

export async function apiGetIncidenciaMensajes(
  incidenciaId: number,
): Promise<{ items: IncidenciaMensaje[]; puede_comentarios_internos: boolean }> {
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/mensajes`), {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar los mensajes");
  return data as { items: IncidenciaMensaje[]; puede_comentarios_internos: boolean };
}

export async function apiEnviarIncidenciaMensaje(
  incidenciaId: number,
  contenido: string,
  imagen?: File | null,
  esInterno = false,
): Promise<{ item: IncidenciaMensaje }> {
  let body: BodyInit;
  const headers: HeadersInit = {};

  if (imagen) {
    const form = new FormData();
    form.append("contenido", contenido);
    form.append("imagen", imagen);
    if (esInterno) form.append("es_interno", "true");
    body = form;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ contenido, es_interno: esInterno });
  }

  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/mensajes`), {
    method: "POST",
    headers,
    body,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje");
  return data as { item: IncidenciaMensaje };
}

export async function apiGetIncidenciaAdjuntos(
  incidenciaId: number,
): Promise<{ items: IncidenciaAdjunto[] }> {
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/adjuntos`), {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar los adjuntos");
  return data as { items: IncidenciaAdjunto[] };
}

export async function apiSubirIncidenciaAdjunto(
  incidenciaId: number,
  imagen: File,
): Promise<{ item: IncidenciaAdjunto }> {
  const form = new FormData();
  form.append("imagen", imagen);
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/adjuntos`), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
  return data as { item: IncidenciaAdjunto };
}

export async function apiGetIncidencias(
  scope: IncidenciaScope = "portal",
  opts?: { q?: string; estado?: string; prioridad?: string },
): Promise<{ items: Incidencia[] }> {
  const url = new URL(apiUrl("/api/incidencias"));
  url.searchParams.set("scope", scope);
  if (opts?.q) url.searchParams.set("q", opts.q);
  if (opts?.estado) url.searchParams.set("estado", opts.estado);
  if (opts?.prioridad) url.searchParams.set("prioridad", opts.prioridad);
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar incidencias");
  return data as { items: Incidencia[] };
}

export type IncidenciasStats = {
  porDepartamento: Array<{
    departamento: string;
    total: number;
    abiertas: number;
    en_curso: number;
    cerradas: number;
    otras: number;
  }>;
  porEstado: Array<{ estado: string; total: number }>;
  totalIncidencias: number;
  tiempoMedioResolucionHoras: number | null;
  cargaPorAgente: Array<{
    agente_id: number;
    agente_nombre: string;
    abiertas: number;
    total: number;
  }>;
  sla?: {
    con_limite: number;
    en_plazo: number;
    fuera_plazo: number;
    porcentaje_en_plazo: number | null;
  };
  tendenciaSemanal?: Array<{ semana: string; creadas: number; cerradas: number }>;
};

export type IncidenciaEvento = {
  id: number;
  incidencia_id: number;
  usuario_id: number;
  tipo: string;
  detalle: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  fecha_creacion: string;
  usuario_nombre: string;
};

export type NotificacionItem = {
  id: string;
  incidencia_id: number;
  titulo: string;
  tipo: "mensaje" | "asignacion";
  cantidad: number;
  detalle: string;
  fecha: string | null;
};

export type NotificacionesResumen = {
  total: number;
  por_incidencia: Record<number, number>;
  items: NotificacionItem[];
};

export async function apiSubirIncidenciaMedio(
  incidenciaId: number,
  imagen: File,
): Promise<{ url: string; ruta: string }> {
  const form = new FormData();
  form.append("imagen", imagen);
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/medios`), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
  return data as { url: string; ruta: string };
}

export async function apiGetIncidenciaEventos(
  incidenciaId: number,
): Promise<{ items: IncidenciaEvento[] }> {
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/eventos`), {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo cargar el historial");
  return data as { items: IncidenciaEvento[] };
}

export async function apiMarcarIncidenciaLeida(
  incidenciaId: number,
  ultimoMensajeId?: number | null,
): Promise<{ ok: true }> {
  const res = await fetch(apiUrl(`/api/incidencias/${incidenciaId}/marcar-leida`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ultimo_mensaje_id: ultimoMensajeId ?? null }),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo marcar como leída");
  return { ok: true };
}

export async function apiGetNotificacionesResumen(): Promise<NotificacionesResumen> {
  const res = await fetch(apiUrl("/api/notificaciones/resumen"), {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar notificaciones");
  return data as NotificacionesResumen;
}

export async function apiGetIncidenciasStats(opts?: {
  desde?: string;
  hasta?: string;
}): Promise<IncidenciasStats> {
  const url = new URL(apiUrl("/api/incidencias/stats"));
  if (opts?.desde) url.searchParams.set("desde", opts.desde);
  if (opts?.hasta) url.searchParams.set("hasta", opts.hasta);
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar las estadísticas");
  return data as IncidenciasStats;
}

export async function apiUpdateIncidencia(
  id: number,
  input: {
    estado?: string;
    prioridad?: string;
    asignado_a?: number | null;
    descripcion?: string;
    motivo_cierre?: string;
    resolucion?: string;
  },
): Promise<{ item: Incidencia }> {
  const res = await fetch(apiUrl(`/api/incidencias/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo actualizar la incidencia");
  return data as { item: Incidencia };
}

export async function apiDeleteIncidencia(id: number): Promise<{ ok: true }> {
  const res = await fetch(apiUrl(`/api/incidencias/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo eliminar la incidencia");
  return { ok: true };
}

export async function apiCreateIncidencia(input: {
  titulo: string;
  descripcion: string;
  equipo_codigo?: string | null;
  prioridad?: string;
}): Promise<{ item: Incidencia }> {
  const res = await fetch(apiUrl("/api/incidencias"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo crear la incidencia");
  return data as { item: Incidencia };
}

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  departamento: string | null;
  es_admin: boolean;
  fecha_creacion: string;
  equipos?: string[];
  puede_usar_kanban?: boolean;
  es_admin_panel?: boolean;
};

export async function apiGetMe(): Promise<Usuario> {
  const res = await fetch(apiUrl("/api/me"), { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo cargar tu perfil");
  }
  return data as Usuario;
}

export async function apiGetUsuarios(q: string): Promise<{ items: Usuario[] }> {
  const url = new URL(apiUrl("/api/users"));
  if (q.trim()) url.searchParams.set("q", q.trim());
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("No se pudieron cargar usuarios");
  return res.json();
}

export async function apiCreateUsuario(input: {
  nombre: string;
  email: string;
  password: string;
  departamento?: string;
  es_admin?: boolean;
}): Promise<{ item: Usuario }> {
  const res = await fetch(apiUrl("/api/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Error al crear usuario");
  return data;
}

export async function apiUpdateUsuario(
  id: number,
  input: { 
    nombre?: string; 
    departamento?: string; 
    es_admin?: boolean; 
    password?: string; 
  },
): Promise<{ item: Usuario }> {
  const res = await fetch(apiUrl(`/api/users/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input), 
    credentials: "include",
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
  return data;
}

export async function apiDeleteUsuario(id: number): Promise<{ ok: true }> {
  const res = await fetch(apiUrl(`/api/users/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
  return { ok: true };
}