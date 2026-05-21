import type { LucideIcon } from "lucide-react";
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
    <aside className="portal-animate-in hidden w-56 shrink-0 lg:block">
      <nav className="portal-card space-y-1 p-2">
        {items.map((item) => (
          <PortalNavButton key={item.id} item={item} active={tab === item.id} onClick={() => onTab(item.id)} />
        ))}
      </nav>

      {stats && stats.total > 0 && (
        <div className="portal-card mt-4 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--velo-text-subtle)]">
            Resumen
          </p>
          <ul className="mt-3 space-y-2 text-xs">
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

      <div className="portal-card mt-4 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--velo-text-subtle)]">
          ¿Qué es el plazo?
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--velo-text-muted)]">
          Cada solicitud puede tener una <strong className="font-semibold text-[var(--velo-text)]">fecha límite</strong> según su prioridad. Si ves «Fuera de plazo», el equipo ya superó el objetivo de respuesta.
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
        <Icon size={16} />
        <span className="hidden min-[400px]:inline">{item.label}</span>
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
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${
        active ? "portal-nav-active" : "text-[var(--velo-text-muted)] hover:bg-slate-50"
      }`}
    >
      <Icon size={18} className={active ? "text-white" : ""} />
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
