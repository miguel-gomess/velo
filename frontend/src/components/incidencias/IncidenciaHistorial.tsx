import { useEffect, useState } from "react";
import { apiGetIncidenciaEventos, type IncidenciaEvento } from "../../lib/api";
import { UserAvatar } from "../UserAvatar";
import {
  ArrowRightLeft,
  CheckCircle2,
  Flag,
  History,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  PlusCircle,
  Timer,
  UserPlus,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TiempoRelativo } from "../TiempoRelativo";
import { formatFechaLimiteSla } from "../../lib/fechas";

type EventoEstilo = {
  label: string;
  Icon: LucideIcon;
  dotClass: string;
  cardClass: string;
  iconClass: string;
};

function estiloEvento(evento: IncidenciaEvento): EventoEstilo {
  const interno =
    evento.tipo === "comentario" && (evento.detalle?.startsWith("[Interno]") ?? false);

  if (interno) {
    return {
      label: "Comentario interno",
      Icon: MessageSquare,
      dotClass: "issue-historial-dot--internal",
      cardClass: "issue-historial-card--internal",
      iconClass: "issue-historial-icon--internal",
    };
  }

  const map: Record<string, EventoEstilo> = {
    creada: {
      label: "Incidencia creada",
      Icon: PlusCircle,
      dotClass: "issue-historial-dot--create",
      cardClass: "issue-historial-card--create",
      iconClass: "issue-historial-icon--create",
    },
    estado: {
      label: "Cambio de estado",
      Icon: ArrowRightLeft,
      dotClass: "issue-historial-dot--state",
      cardClass: "issue-historial-card--state",
      iconClass: "issue-historial-icon--state",
    },
    prioridad: {
      label: "Prioridad",
      Icon: Flag,
      dotClass: "issue-historial-dot--priority",
      cardClass: "issue-historial-card--priority",
      iconClass: "issue-historial-icon--priority",
    },
    plazo: {
      label: "Fecha límite",
      Icon: Timer,
      dotClass: "issue-historial-dot--priority",
      cardClass: "issue-historial-card--priority",
      iconClass: "issue-historial-icon--priority",
    },
    epica: {
      label: "Épica",
      Icon: Layers,
      dotClass: "issue-historial-dot--state",
      cardClass: "issue-historial-card--state",
      iconClass: "issue-historial-icon--state",
    },
    asignacion: {
      label: "Asignación",
      Icon: UserPlus,
      dotClass: "issue-historial-dot--assign",
      cardClass: "issue-historial-card--assign",
      iconClass: "issue-historial-icon--assign",
    },
    descripcion: {
      label: "Descripción",
      Icon: Pencil,
      dotClass: "issue-historial-dot--edit",
      cardClass: "issue-historial-card--edit",
      iconClass: "issue-historial-icon--edit",
    },
    comentario: {
      label: "Comentario",
      Icon: MessageSquare,
      dotClass: "issue-historial-dot--comment",
      cardClass: "issue-historial-card--comment",
      iconClass: "issue-historial-icon--comment",
    },
    adjunto: {
      label: "Adjunto",
      Icon: Paperclip,
      dotClass: "issue-historial-dot--attach",
      cardClass: "issue-historial-card--attach",
      iconClass: "issue-historial-icon--attach",
    },
    cerrada: {
      label: "Incidencia cerrada",
      Icon: CheckCircle2,
      dotClass: "issue-historial-dot--close",
      cardClass: "issue-historial-card--close",
      iconClass: "issue-historial-icon--close",
    },
  };

  return (
    map[evento.tipo] ?? {
      label: evento.tipo,
      Icon: History,
      dotClass: "issue-historial-dot--default",
      cardClass: "issue-historial-card--default",
      iconClass: "issue-historial-icon--default",
    }
  );
}

function textoDetalle(detalle: string | null, interno: boolean): string | null {
  if (!detalle) return null;
  const t = detalle.trim();
  if (!t) return null;
  if (interno && t.startsWith("[Interno]")) {
    return t.replace(/^\[Interno\]\s*/i, "").trim() || null;
  }
  return t;
}

function formatearValorHistorial(tipo: string, valor: string | null): string {
  if (valor == null || valor === "") {
    if (tipo === "plazo") return "Sin plazo";
    if (tipo === "epica") return "Sin épica";
    return "—";
  }
  if (tipo === "plazo") return formatFechaLimiteSla(valor);
  return valor;
}

function HistorialEventoItem({ evento }: { evento: IncidenciaEvento }) {
  const estilo = estiloEvento(evento);
  const interno =
    evento.tipo === "comentario" && (evento.detalle?.startsWith("[Interno]") ?? false);
  const detalle = textoDetalle(evento.detalle, interno);
  const tieneCambio = evento.valor_anterior != null && evento.valor_nuevo != null;

  return (
    <li className="issue-historial-item">
      <span className={`issue-historial-dot ${estilo.dotClass}`} aria-hidden />
      <article className={`issue-historial-card ${estilo.cardClass}`}>
        <div className="issue-historial-card__head">
          <span className={`issue-historial-icon ${estilo.iconClass}`}>
            <estilo.Icon size={14} strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--velo-text)]">{estilo.label}</h4>
              <TiempoRelativo
                iso={evento.fecha_creacion}
                className="shrink-0 text-[11px] tabular-nums text-[var(--velo-text-subtle)]"
              />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <UserAvatar nombre={evento.usuario_nombre} userId={evento.usuario_id} size="xs" />
              <span className="truncate text-xs text-[var(--velo-text-muted)]">
                {evento.usuario_nombre}
              </span>
            </div>
          </div>
        </div>

        {tieneCambio && (
          <div className="issue-historial-change mt-2.5">
            <span className="issue-historial-pill issue-historial-pill--old">
              {formatearValorHistorial(evento.tipo, evento.valor_anterior)}
            </span>
            <ArrowRightLeft size={12} className="shrink-0 text-[var(--velo-text-subtle)]" />
            <span className="issue-historial-pill issue-historial-pill--new">
              {formatearValorHistorial(evento.tipo, evento.valor_nuevo)}
            </span>
          </div>
        )}

        {detalle && !tieneCambio && (
          <p className="issue-historial-detail mt-2.5">{detalle}</p>
        )}
      </article>
    </li>
  );
}

type Props = {
  incidenciaId: number;
  className?: string;
  embedded?: boolean;
  /** Incrementar para forzar recarga (p. ej. tras comentario o polling del modal). */
  refreshToken?: number;
};

export function IncidenciaHistorial({
  incidenciaId,
  className = "",
  embedded = false,
  refreshToken = 0,
}: Props) {
  const [items, setItems] = useState<IncidenciaEvento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (refreshToken === 0) setLoading(true);
    void apiGetIncidenciaEventos(incidenciaId)
      .then((r) => !cancelled && setItems(r.items))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [incidenciaId, refreshToken]);

  return (
    <section
      className={
        embedded ? `issue-historial-embedded ${className}`.trim() : className
      }
    >
      {!embedded && (
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
          <History size={13} />
          Historial
        </h3>
      )}

      {loading ? (
        <div className="issue-historial-loading">
          <Loader2 className="animate-spin text-[var(--velo-brand)]" size={24} />
        </div>
      ) : items.length === 0 ? (
        <div className="issue-chat-empty">
          <History size={28} className="text-slate-300" />
          <p className="issue-chat-empty__title">Sin eventos registrados</p>
          <p className="issue-chat-empty__hint">
            Los cambios de estado, asignaciones y comentarios aparecerán aquí.
          </p>
        </div>
      ) : (
        <ol className="issue-historial-timeline">
          {items.map((e) => (
            <HistorialEventoItem key={e.id} evento={e} />
          ))}
        </ol>
      )}
    </section>
  );
}
