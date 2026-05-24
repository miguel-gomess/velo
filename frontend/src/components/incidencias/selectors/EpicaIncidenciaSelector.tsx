import type { Epica } from "../../../lib/api";
import { labelEpica } from "../../../lib/epicas";
import { ChevronDown, Layers } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectorUi";

type Props = {
  value: number | null;
  onChange: (epicaId: number | null) => void;
  epicas: Epica[];
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  size?: "default" | "sidebar";
  /** Filtros: null = «todas». Formulario: null = «sin épica». */
  permitirTodos?: boolean;
  /** Estilo compacto para la miga de pan del modal. */
  variant?: "default" | "breadcrumb";
};

function EpicaDot({ color, clave }: { color: string; clave: string }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold uppercase text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {clave.slice(0, 2)}
    </span>
  );
}

export function EpicaIncidenciaSelector({
  value,
  onChange,
  epicas,
  disabled,
  className = "",
  compact = false,
  size = "default",
  permitirTodos = false,
  variant = "default",
}: Props) {
  const esBreadcrumb = variant === "breadcrumb";
  const triggerSize = esBreadcrumb ? "default" : compact ? "default" : size;
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const actual = epicas.find((e) => e.id === value) ?? null;
  const vacio = value == null;
  const etiquetaVacio = permitirTodos ? "Épica" : "Sin épica";
  const colorEpica = actual?.color?.trim() || "#6366f1";

  const triggerClass = esBreadcrumb
    ? [
        "inline-flex max-w-[11rem] items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold transition sm:max-w-[14rem]",
        abierto
          ? "border-[var(--velo-brand)] bg-white text-[var(--velo-brand)] ring-2 ring-[var(--velo-brand-muted)]"
          : vacio
            ? "border-dashed border-[var(--velo-border)] bg-[var(--velo-bg)] text-[var(--velo-text-muted)] hover:border-[var(--velo-brand)]/40 hover:text-[var(--velo-brand)]"
            : "border-transparent hover:bg-[var(--velo-bg)]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")
    : selectorTriggerClass({ abierto, activo: !vacio, size: triggerSize });

  return (
    <div
      ref={rootRef}
      className={`relative ${esBreadcrumb ? "shrink-0" : compact ? "w-[10rem]" : "w-full"} ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={triggerClass}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label="Épica"
      >
        {esBreadcrumb ? (
          vacio ? (
            <>
              <Layers size={13} className="shrink-0 text-[var(--velo-text-subtle)]" />
              <span className="truncate">{etiquetaVacio}</span>
            </>
          ) : actual ? (
            <>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorEpica }}
                aria-hidden
              />
              <span className="truncate" style={{ color: colorEpica }}>
                {actual.nombre}
              </span>
            </>
          ) : (
            <span className="truncate">Épica</span>
          )
        ) : vacio ? (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
              <Layers size={14} />
            </span>
            <span className="min-w-0 flex-1 truncate">{etiquetaVacio}</span>
          </>
        ) : actual ? (
          <>
            <EpicaDot color={actual.color} clave={actual.clave} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{actual.nombre}</span>
              {!compact && (
                <span className="block truncate text-[10px] font-normal uppercase text-[var(--velo-text-subtle)]">
                  {actual.clave}
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="truncate">Épica</span>
        )}
        <ChevronDown size={esBreadcrumb ? 12 : 14} className={selectorChevronClass(abierto)} />
      </button>

      <AnchoredListboxPanel
        abierto={abierto}
        anchor={anchor}
        panelRef={panelRef}
        className={SELECTOR_PANEL_CLASS}
        listClassName={SELECTOR_LIST_CLASS}
        minWidth={240}
      >
        <li>
          <button
            type="button"
            role="option"
            aria-selected={vacio}
            onClick={() => {
              onChange(null);
              close();
            }}
            className={selectorOptionClass(vacio)}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
              <Layers size={14} />
            </span>
            <span className="font-medium">{permitirTodos ? "Todas las épicas" : "Sin épica"}</span>
          </button>
        </li>
        {epicas.map((ep) => (
          <li key={ep.id}>
            <button
              type="button"
              role="option"
              aria-selected={value === ep.id}
              onClick={() => {
                onChange(ep.id);
                close();
              }}
              className={selectorOptionClass(value === ep.id)}
            >
              <EpicaDot color={ep.color} clave={ep.clave} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{ep.nombre}</span>
                <span className="block truncate text-[10px] uppercase text-[var(--velo-text-subtle)]">
                  {ep.clave}
                </span>
              </span>
            </button>
          </li>
        ))}
      </AnchoredListboxPanel>
    </div>
  );
}

export function EpicaBadge({
  nombre,
  clave,
  color,
}: {
  nombre: string;
  clave?: string | null;
  color?: string | null;
}) {
  const c = color?.trim() || "#6366f1";
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight"
      style={{
        backgroundColor: `color-mix(in srgb, ${c} 12%, white)`,
        borderColor: `color-mix(in srgb, ${c} 32%, transparent)`,
        color: c,
      }}
      title={labelEpica({ nombre, clave: clave ?? "" })}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: c }} aria-hidden />
      <span className="truncate">{nombre}</span>
    </span>
  );
}
