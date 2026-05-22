import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";
import { SLA_PRIORIDADES, formatoPlazoSla } from "../../lib/sla";
import type { PortalTabId } from "./portalUtils";

export type PortalNavItem = {
  id: PortalTabId;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type Props = {
  items: PortalNavItem[];
  tab: PortalTabId;
  onTab: (id: PortalTabId) => void;
  stats?: { pendientes: number; activas: number; resueltas: number; total: number };
};

export function PortalNavSidebar({ items, tab, onTab, stats }: Props) {
  return (
    <aside className="portal-animate-in hidden w-52 shrink-0 lg:flex lg:flex-col lg:self-stretch">
      <nav className="portal-card shrink-0 space-y-0.5 p-1.5">
        {items.map((item) => (
          <PortalNavButton key={item.id} item={item} active={tab === item.id} onClick={() => onTab(item.id)} />
        ))}
      </nav>

      {stats && stats.total > 0 && (
        <div className="portal-card mt-2 shrink-0 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--velo-text-subtle)]">
            Resumen
          </p>
          <ul className="mt-2 space-y-1 text-[11px]">
            <li className="flex justify-between">
              <span className="text-[var(--velo-text-muted)]">En cola</span>
              <span className="font-bold text-slate-600">{stats.pendientes}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--velo-text-muted)]">En curso</span>
              <span className="font-bold text-amber-600">{stats.activas}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--velo-text-muted)]">Resueltas</span>
              <span className="font-bold text-emerald-600">{stats.resueltas}</span>
            </li>
          </ul>
        </div>
      )}

      <div className="portal-card mt-2 flex min-h-0 flex-1 flex-col p-3 lg:mt-3">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--velo-text-subtle)]">
          <Clock size={12} className="text-[var(--velo-brand)]" />
          Plazos SLA
        </p>
        <p className="mt-1.5 text-[10px] leading-snug text-[var(--velo-text-muted)]">
          La <strong className="font-semibold text-[var(--velo-text)]">fecha límite</strong> se calcula al
          crear la solicitud según la prioridad.
        </p>
        <ul className="mt-2.5 space-y-1.5 border-t border-[var(--velo-border)] pt-2.5">
          {SLA_PRIORIDADES.map((s) => (
            <li key={s.clave} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-[var(--velo-text-muted)]">{s.etiqueta}</span>
              <span className="shrink-0 font-bold tabular-nums text-[var(--velo-brand)]">
                {formatoPlazoSla(s.horas)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-2.5 text-[9px] leading-snug text-[var(--velo-text-subtle)]">
          <span className="font-semibold text-amber-800">Plazo próximo</span>: menos de 24 h.{" "}
          <span className="font-semibold text-rose-800">Fuera de plazo</span>: fecha límite superada.
        </p>
      </div>
    </aside>
  );
}

export function PortalNavMobile({ items, tab, onTab }: Omit<Props, "stats">) {
  return (
    <nav className="portal-card flex gap-1 p-1 lg:hidden" aria-label="Secciones">
      {items.map((item) => (
        <PortalNavButton
          key={item.id}
          item={item}
          active={tab === item.id}
          onClick={() => onTab(item.id)}
          compact
        />
      ))}
    </nav>
  );
}

function PortalNavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: PortalNavItem;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all sm:text-sm ${
          active ? "portal-nav-active" : "text-[var(--velo-text-muted)]"
        }`}
      >
        <Icon size={16} className="shrink-0" />
        <span className="truncate text-[10px] sm:text-sm">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/30" : "bg-slate-200"}`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all ${
        active ? "portal-nav-active" : "text-[var(--velo-text-muted)] hover:bg-slate-50"
      }`}
    >
      <Icon size={16} className={active ? "text-white" : ""} />
      <span className="flex-1">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}
