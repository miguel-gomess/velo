import type { Incidencia } from "./api";
import { normalizarEstado, type EstadoKanban } from "./incidencias";

export type FiltrosIncidencias = {
  q: string;
  estado: "" | EstadoKanban;
  prioridad: string;
  asignado_a: string;
  equipo_codigo: string;
  epica_id: string;
  solicitante_id: string;
  solo_fuera_sla: boolean;
};

export type PresetFiltrosIncidencias = {
  id: string;
  nombre: string;
  filtros: FiltrosIncidencias;
};

export const FILTROS_VACIOS: FiltrosIncidencias = {
  q: "",
  estado: "",
  prioridad: "",
  asignado_a: "",
  equipo_codigo: "",
  epica_id: "",
  solicitante_id: "",
  solo_fuera_sla: false,
};

function storageKey(scope: string) {
  return `velo-filtros-presets-${scope}`;
}

export function cargarPresetsFiltros(scope: string): PresetFiltrosIncidencias[] {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresetFiltrosIncidencias[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function guardarPresetsFiltros(scope: string, presets: PresetFiltrosIncidencias[]) {
  localStorage.setItem(storageKey(scope), JSON.stringify(presets));
}

export function contarFiltrosActivos(f: FiltrosIncidencias): number {
  let n = 0;
  if (f.q.trim()) n++;
  if (f.estado) n++;
  if (f.prioridad) n++;
  if (f.asignado_a) n++;
  if (f.equipo_codigo) n++;
  if (f.epica_id) n++;
  if (f.solicitante_id) n++;
  if (f.solo_fuera_sla) n++;
  return n;
}

export function aplicarFiltrosIncidencias(
  items: Incidencia[],
  filtros: FiltrosIncidencias,
): Incidencia[] {
  const q = filtros.q.trim().toLowerCase();

  return items.filter((i) => {
    if (filtros.estado && normalizarEstado(i.estado) !== filtros.estado) return false;
    if (filtros.prioridad && (i.prioridad ?? "").toLowerCase() !== filtros.prioridad) {
      return false;
    }
    if (filtros.asignado_a === "sin_asignar") {
      if (i.asignado_a != null) return false;
    } else if (filtros.asignado_a) {
      if (String(i.asignado_a) !== filtros.asignado_a) return false;
    }
    if (filtros.equipo_codigo && (i.equipo_codigo ?? "") !== filtros.equipo_codigo) {
      return false;
    }
    if (filtros.epica_id === "sin_epica") {
      if (i.epica_id != null) return false;
    } else if (filtros.epica_id && String(i.epica_id ?? "") !== filtros.epica_id) {
      return false;
    }
    if (filtros.solicitante_id && String(i.usuario_id) !== filtros.solicitante_id) {
      return false;
    }
    if (filtros.solo_fuera_sla) {
      if (
        !i.fecha_limite ||
        normalizarEstado(i.estado) === "cerrada" ||
        new Date(i.fecha_limite).getTime() >= Date.now()
      ) {
        return false;
      }
    }
    if (!q) return true;
    return (
      i.titulo?.toLowerCase().includes(q) ||
      i.descripcion?.toLowerCase().includes(q) ||
      String(i.id).includes(q) ||
      `vel-${i.id}`.includes(q) ||
      (i.solicitante_nombre?.toLowerCase().includes(q) ?? false) ||
      (i.solicitante_departamento?.toLowerCase().includes(q) ?? false) ||
      (i.asignado_nombre?.toLowerCase().includes(q) ?? false) ||
      (i.equipo_codigo?.toLowerCase().includes(q) ?? false) ||
      (i.epica_nombre?.toLowerCase().includes(q) ?? false) ||
      (i.epica_clave?.toLowerCase().includes(q) ?? false)
    );
  });
}

export type OpcionPersona = { id: number; nombre: string };

export function opcionesFiltroDesdeIncidencias(items: Incidencia[]): {
  asignados: OpcionPersona[];
  solicitantes: OpcionPersona[];
  equipos: string[];
} {
  const asignados = new Map<number, string>();
  const solicitantes = new Map<number, string>();
  const equipos = new Set<string>();

  for (const i of items) {
    if (i.asignado_a != null && i.asignado_nombre) {
      asignados.set(i.asignado_a, i.asignado_nombre);
    }
    if (i.usuario_id && i.solicitante_nombre) {
      solicitantes.set(i.usuario_id, i.solicitante_nombre);
    }
    if (i.equipo_codigo) equipos.add(i.equipo_codigo);
  }

  const sortNombre = (a: OpcionPersona, b: OpcionPersona) =>
    a.nombre.localeCompare(b.nombre, "es");

  return {
    asignados: [...asignados.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort(sortNombre),
    solicitantes: [...solicitantes.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort(sortNombre),
    equipos: [...equipos].sort((a, b) => a.localeCompare(b, "es")),
  };
}
