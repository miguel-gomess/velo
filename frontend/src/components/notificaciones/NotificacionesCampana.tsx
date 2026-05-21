import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, MessageSquare, UserPlus } from "lucide-react";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { useAhoraReloj } from "../RelojProvider";
import { formatFechaRelativa } from "../../lib/fechas";
import type { NotificacionItem } from "../../lib/api";

type Props = {
  onIrAIncidencia: (incidenciaId: number) => void;
};

function estiloTipo(tipo: NotificacionItem["tipo"]) {
  if (tipo === "asignacion") {
    return {
      borde: "border-l-purple-600",
      fondo: "bg-purple-100",
      icono: "text-purple-700",
      badge: "bg-purple-200 text-purple-900",
      Icon: UserPlus,
      etiqueta: "Asignación",
    };
  }
  return {
    borde: "border-l-blue-600",
    fondo: "bg-blue-100",
    icono: "text-blue-700",
    badge: "bg-blue-200 text-blue-900",
    Icon: MessageSquare,
    etiqueta: "Chat",
  };
}

function tiempoRelativo(iso: string | null, ahora: number): string | null {
  if (!iso) return null;
  return formatFechaRelativa(iso, ahora);
}

export function NotificacionesCampana({ onIrAIncidencia }: Props) {
  const ahora = useAhoraReloj();
  const { total, items, refrescar } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [abierto]);

  function irA(id: number) {
    setAbierto(false);
    onIrAIncidencia(id);
  }

  const hayPendientes = total > 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setAbierto((v) => !v);
          void refrescar();
        }}
        className={`relative inline-flex size-10 items-center justify-center rounded-xl border bg-white shadow-sm transition hover:border-[var(--velo-brand)] hover:text-[var(--velo-brand)] ${
          hayPendientes
            ? "border-[var(--velo-brand)]/40 text-[var(--velo-brand)]"
            : "border-slate-200 text-slate-600"
        }`}
        aria-label={hayPendientes ? `${total} notificaciones sin leer` : "Notificaciones"}
        aria-expanded={abierto}
        aria-haspopup="true"
      >
        <Bell size={18} />
        {hayPendientes && (
          <span className="absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="absolute right-0 top-full z-50 mt-2.5 w-[min(100vw-2rem,26rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          role="menu"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-base font-semibold text-slate-900">Notificaciones</p>
            <p className="mt-0.5 text-sm text-slate-500">Asignaciones y mensajes nuevos</p>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <BellOff size={28} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Todo al día</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-2">
              {items.map((n) => {
                const s = estiloTipo(n.tipo);
                const rel = tiempoRelativo(n.fecha, ahora);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => irA(n.incidencia_id)}
                      className={`mx-2.5 mb-1.5 flex w-[calc(100%-1.25rem)] gap-3 rounded-xl border border-slate-100 border-l-[3px] ${s.borde} px-3.5 py-3 text-left transition hover:bg-slate-50`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${s.fondo}`}
                      >
                        <s.Icon size={18} className={s.icono} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[var(--velo-brand)]">
                            VEL-{n.incidencia_id}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${s.badge}`}
                          >
                            {s.etiqueta}
                          </span>
                          {rel && (
                            <span className="ml-auto text-[10px] text-slate-400">{rel}</span>
                          )}
                        </span>
                        <span className="line-clamp-1 text-sm font-semibold text-slate-800">
                          {n.titulo}
                        </span>
                        <span className="line-clamp-2 text-xs leading-snug text-slate-500">
                          {n.detalle}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
