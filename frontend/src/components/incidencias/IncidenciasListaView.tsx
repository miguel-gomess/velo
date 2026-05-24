import { useEffect, useMemo, useState } from "react";
import type { Incidencia } from "../../lib/api";
import { labelEquipo } from "../../lib/equipos";
import {
  KANBAN_COLUMNAS,
  normalizarEstado,
  prioridadTone,
  temaPorEstado,
} from "../../lib/incidencias";
import { BadgeEstado } from "./BadgeEstado";
import {
  OrdenListaSelector,
  type CampoOrdenLista,
  type DireccionOrden,
} from "./OrdenListaSelector";
import { Inbox, Loader2, MessageCircle } from "lucide-react";

const STORAGE_KEY = "velo-kanban-lista-orden";

type OrdenLista = { campo: CampoOrdenLista; direccion: DireccionOrden };

const ORDEN_ESTADO = Object.fromEntries(
  KANBAN_COLUMNAS.map((c, i) => [c.id, i]),
) as Record<string, number>;

const ORDEN_PRIORIDAD: Record<string, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  normal: 3,
  baja: 4,
};

function loadOrden(): OrdenLista {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as OrdenLista;
      if (p.campo && p.direccion) return p;
    }
  } catch {
    /* ignore */
  }
  return { campo: "original", direccion: "desc" };
}

function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoPlano(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function comparar(a: Incidencia, b: Incidencia, campo: CampoOrdenLista, dir: DireccionOrden): number {
  const mul = dir === "asc" ? 1 : -1;
  switch (campo) {
    case "id":
      return (a.id - b.id) * mul;
    case "titulo":
      return a.titulo.localeCompare(b.titulo, "es") * mul;
    case "fecha_creacion":
      return (
        (new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()) * mul
      );
    case "fecha_actualizacion":
      return (
        (new Date(a.fecha_actualizacion).getTime() -
          new Date(b.fecha_actualizacion).getTime()) *
        mul
      );
    case "estado": {
      const ea = ORDEN_ESTADO[normalizarEstado(a.estado)] ?? 99;
      const eb = ORDEN_ESTADO[normalizarEstado(b.estado)] ?? 99;
      return (ea - eb) * mul;
    }
    case "prioridad": {
      const pa = ORDEN_PRIORIDAD[(a.prioridad ?? "normal").toLowerCase()] ?? 3;
      const pb = ORDEN_PRIORIDAD[(b.prioridad ?? "normal").toLowerCase()] ?? 3;
      return (pa - pb) * mul;
    }
    default:
      return 0;
  }
}

type Props = {
  items: Incidencia[];
  loading?: boolean;
  sinLeerPorIncidencia?: Record<number, number>;
  onOpen: (inc: Incidencia) => void;
};

export function IncidenciasListaView({
  items,
  loading,
  sinLeerPorIncidencia = {},
  onOpen,
}: Props) {
  const [orden, setOrden] = useState<OrdenLista>(loadOrden);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orden));
  }, [orden]);

  const listado = useMemo(() => {
    if (orden.campo === "original") return items;
    return [...items].sort((a, b) => comparar(a, b, orden.campo, orden.direccion));
  }, [items, orden]);

  function toggleDireccion() {
    setOrden((o) => ({ ...o, direccion: o.direccion === "asc" ? "desc" : "asc" }));
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="animate-spin text-[var(--velo-brand)]" size={22} />
        <p className="text-xs text-[var(--velo-text-muted)]">Cargando…</p>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Listado de incidencias">
      <header className="lista-orden-header flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--velo-border)] bg-gradient-to-r from-slate-50 to-white px-3 py-2.5 sm:px-4">
        <p className="mr-auto text-xs text-[var(--velo-text-muted)]">
          <span className="font-bold tabular-nums text-[var(--velo-text)]">{listado.length}</span>{" "}
          incidencias
        </p>
        <OrdenListaSelector
          campo={orden.campo}
          direccion={orden.direccion}
          onCampoChange={(campo) => setOrden((o) => ({ ...o, campo }))}
          onDireccionToggle={toggleDireccion}
        />
      </header>

      {listado.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <Inbox className="text-slate-300" size={28} />
          <p className="mt-2 text-xs text-[var(--velo-text-muted)]">Sin incidencias</p>
        </div>
      ) : (
        <ul className="kanban-incidencias-list space-y-2.5 bg-slate-100/70 p-3 sm:p-4">
          {listado.map((inc) => {
            const norm = normalizarEstado(inc.estado);
            const tema = temaPorEstado(inc.estado);
            const sinLeer = sinLeerPorIncidencia[inc.id] ?? 0;
            const descripcion = textoPlano(inc.descripcion ?? "");
            const fueraPlazo =
              inc.fecha_limite &&
              norm !== "cerrada" &&
              new Date(inc.fecha_limite).getTime() < Date.now();

            const metaPartes: string[] = [];
            if (inc.solicitante_nombre) {
              metaPartes.push(
                inc.solicitante_departamento
                  ? `${inc.solicitante_nombre} (${inc.solicitante_departamento})`
                  : inc.solicitante_nombre,
              );
            }
            metaPartes.push(`→ ${inc.asignado_nombre ?? "sin asignar"}`);
            if (inc.equipo_codigo) metaPartes.push(labelEquipo(inc.equipo_codigo));
            if (inc.epica_nombre) metaPartes.push(inc.epica_nombre);
            metaPartes.push(formatFechaCorta(inc.fecha_actualizacion));

            return (
              <li key={inc.id}>
                <button
                  type="button"
                  onClick={() => onOpen(inc)}
                  className="group flex w-full gap-3 rounded-xl border border-slate-200/90 border-l-[5px] bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md sm:px-5"
                  style={{
                    borderLeftColor: tema.color,
                    boxShadow: `0 1px 3px rgba(9, 30, 66, 0.07), 0 0 0 1px ${tema.ring}`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: tema.color }}
                      >
                        VEL-{inc.id}
                      </span>
                      <BadgeEstado estado={inc.estado} compact />
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${prioridadTone(inc.prioridad)}`}
                      >
                        {inc.prioridad ?? "normal"}
                      </span>
                      {sinLeer > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          <MessageCircle size={10} />
                          {sinLeer}
                        </span>
                      )}
                      {fueraPlazo && (
                        <span className="text-[9px] font-bold uppercase text-amber-700">SLA</span>
                      )}
                      <time
                        className="ml-auto text-[10px] text-[var(--velo-text-subtle)]"
                        dateTime={inc.fecha_creacion}
                      >
                        {formatFechaCorta(inc.fecha_creacion)}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold leading-snug text-[var(--velo-text)] group-hover:text-[var(--velo-brand)]">
                      {inc.titulo}
                    </p>
                    {descripcion ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--velo-text-muted)]">
                        {descripcion}
                      </p>
                    ) : null}
                    <p className="mt-1 truncate text-[11px] text-[var(--velo-text-muted)]">
                      {metaPartes.join(" · ")}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
