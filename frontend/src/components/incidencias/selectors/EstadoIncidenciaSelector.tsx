import { KANBAN_COLUMNAS, type EstadoKanban } from "../../../lib/incidencias";
import { Check, ChevronDown } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectorUi";

type Props = {
  value: "" | EstadoKanban;
  onChange: (estado: "" | EstadoKanban) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  permitirTodos?: boolean;
  size?: "default" | "sidebar";
};

export function EstadoIncidenciaSelector({
  value,
  onChange,
  disabled,
  className = "",
  compact = false,
  permitirTodos = false,
  size = "default",
}: Props) {
  const triggerSize = compact ? "default" : size;
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const todos = permitirTodos && value === "";
  const columna =
    value === "" ? null : (KANBAN_COLUMNAS.find((c) => c.id === value) ?? KANBAN_COLUMNAS[0]);

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-[9.5rem]" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={selectorTriggerClass({ abierto, activo: !todos, size: triggerSize })}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          {todos || !columna ? (
            <span className="truncate">Estado</span>
          ) : (
            <span
              className="inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: columna.color }}
            >
              {columna.label}
            </span>
          )}
        </span>
        <ChevronDown size={14} className={selectorChevronClass(abierto)} />
      </button>

      <AnchoredListboxPanel
        abierto={abierto}
        anchor={anchor}
        panelRef={panelRef}
        className={SELECTOR_PANEL_CLASS}
        listClassName={SELECTOR_LIST_CLASS}
        minWidth={224}
      >
        {permitirTodos && (
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
              <span className="font-medium">Todos los estados</span>
            </button>
          </li>
        )}
        {KANBAN_COLUMNAS.map((col) => {
          const seleccionado = value === col.id;
          return (
            <li key={col.id}>
              <button
                type="button"
                role="option"
                aria-selected={seleccionado}
                onClick={() => {
                  onChange(col.id);
                  close();
                }}
                className={selectorOptionClass(seleccionado)}
              >
                <span
                  className="inline-flex min-w-[5.5rem] shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: col.color }}
                >
                  {col.label}
                </span>
                {!compact && (
                  <span className="min-w-0 flex-1 text-xs text-[var(--velo-text-muted)]">
                    {col.id === "abierta" && "Pendiente de atención"}
                    {col.id === "en_curso" && "En trabajo activo"}
                    {col.id === "en_revision" && "Pendiente de revisión"}
                    {col.id === "cerrada" && "Incidencia resuelta"}
                  </span>
                )}
                {seleccionado && (
                  <Check size={16} className="ml-auto shrink-0 text-[var(--velo-brand)]" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </AnchoredListboxPanel>
    </div>
  );
}
