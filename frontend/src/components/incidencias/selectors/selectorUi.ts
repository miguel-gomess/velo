/** Estilos compartidos para selectores de filtros y formularios. */

export const SELECTOR_PANEL_CLASS =
  "velo-selector-panel overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/10";

export const SELECTOR_LIST_CLASS = "velo-selector-list max-h-56 overflow-y-auto py-1";

export const SELECTOR_OPTION_BASE =
  "velo-selector-option flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition";

export function selectorOptionClass(active: boolean): string {
  return `${SELECTOR_OPTION_BASE} ${
    active
      ? "bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
      : "text-[var(--velo-text)] hover:bg-slate-50"
  }`;
}

export function selectorTriggerClass(opts: {
  abierto: boolean;
  activo?: boolean;
  extra?: string;
  /** Sidebar del modal: más alto para avatar + dos líneas */
  size?: "default" | "sidebar";
}): string {
  const { abierto, activo = false, extra = "", size = "default" } = opts;
  const sizeClass =
    size === "sidebar"
      ? "velo-selector-trigger--sidebar min-h-[3.35rem] gap-2.5 rounded-xl px-3 py-2.5 text-sm"
      : "h-9 gap-2 rounded-lg px-2.5 text-xs";

  return [
    "velo-selector-trigger flex w-full items-center text-left font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--velo-brand-muted)] disabled:opacity-50",
    sizeClass,
    abierto
      ? "border-[var(--velo-brand)] bg-white ring-2 ring-[var(--velo-brand-muted)]"
      : activo
        ? "border-[var(--velo-brand)]/40 bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80",
    extra,
  ].join(" ");
}

export function selectorChevronClass(abierto: boolean): string {
  return `shrink-0 text-slate-400 transition-transform ${abierto ? "rotate-180" : ""}`;
}
