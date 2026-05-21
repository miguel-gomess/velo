import { labelEquipo } from "../../../lib/equipos";
import { ChevronDown, Users } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectorUi";

type Props = {
  value: string;
  onChange: (equipo: string) => void;
  equipos: string[];
  disabled?: boolean;
  className?: string;
  compact?: boolean;
};

export function EquipoIncidenciaSelector({
  value,
  onChange,
  equipos,
  disabled,
  className = "",
  compact = false,
}: Props) {
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const todos = value === "";
  const codigo = value || null;
  const etiqueta = codigo ? labelEquipo(codigo) : null;

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-[9.5rem]" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={selectorTriggerClass({ abierto, activo: !todos })}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        {todos ? (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
              <Users size={14} />
            </span>
            <span className="min-w-0 flex-1 truncate">Equipo</span>
          </>
        ) : (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
              {(codigo ?? "").slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{etiqueta}</span>
              {!compact && (
                <span className="block truncate text-[10px] font-normal uppercase text-[var(--velo-text-subtle)]">
                  {codigo}
                </span>
              )}
            </span>
          </>
        )}
        <ChevronDown size={14} className={selectorChevronClass(abierto)} />
      </button>

      <AnchoredListboxPanel
        abierto={abierto}
        anchor={anchor}
        panelRef={panelRef}
        className={SELECTOR_PANEL_CLASS}
        listClassName={SELECTOR_LIST_CLASS}
        minWidth={220}
      >
        <li>
          <button
            type="button"
            role="option"
            aria-selected={todos}
            onClick={() => {
              onChange("");
              close();
            }}
            className={selectorOptionClass(todos)}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
              <Users size={14} />
            </span>
            <span className="font-medium">Todos los equipos</span>
          </button>
        </li>
        {equipos.map((eq) => (
          <li key={eq}>
            <button
              type="button"
              role="option"
              aria-selected={value === eq}
              onClick={() => {
                onChange(eq);
                close();
              }}
              className={selectorOptionClass(value === eq)}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                {eq.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{labelEquipo(eq)}</span>
                <span className="block truncate text-[10px] uppercase text-[var(--velo-text-subtle)]">
                  {eq}
                </span>
              </span>
            </button>
          </li>
        ))}
      </AnchoredListboxPanel>
    </div>
  );
}
