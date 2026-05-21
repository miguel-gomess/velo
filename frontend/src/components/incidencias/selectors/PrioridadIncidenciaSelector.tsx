import { Check, ChevronDown, Flag } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectorUi";

const PRIORIDADES = [
  { id: "", label: "Prioridad", color: "#64748b", texto: "#334155", fondo: "#f1f5f9" },
  { id: "baja", label: "Baja", color: "#14b8a6", texto: "#fff", fondo: "#ccfbf1" },
  { id: "normal", label: "Normal", color: "#3b82f6", texto: "#fff", fondo: "#dbeafe" },
  { id: "media", label: "Media", color: "#8b5cf6", texto: "#fff", fondo: "#ede9fe" },
  { id: "alta", label: "Alta", color: "#f97316", texto: "#fff", fondo: "#ffedd5" },
  { id: "critica", label: "Crítica", color: "#dc2626", texto: "#fff", fondo: "#fee2e2" },
] as const;

type Props = {
  value: string;
  onChange: (prioridad: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Si false, no muestra «todas» y el valor no puede quedar vacío (formulario de creación). */
  permitirTodos?: boolean;
  size?: "default" | "sidebar";
};

export function PrioridadIncidenciaSelector({
  value,
  onChange,
  disabled,
  className = "",
  compact = false,
  permitirTodos = true,
  size = "default",
}: Props) {
  const triggerSize = compact ? "default" : size;
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const opciones = permitirTodos ? PRIORIDADES : PRIORIDADES.filter((p) => p.id !== "");
  const actual = opciones.find((p) => p.id === value) ?? opciones.find((p) => p.id === "media") ?? opciones[0];
  const todos = permitirTodos && value === "";

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-[9rem]" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={selectorTriggerClass({ abierto, activo: !todos, size: triggerSize })}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          {todos ? (
            <span className="truncate">Prioridad</span>
          ) : (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: actual.color, color: "#fff" }}
            >
              <Flag size={10} />
              {actual.label}
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
        minWidth={192}
      >
        {opciones.map((p) => {
          const seleccionado = value === p.id;
          return (
            <li key={p.id || "all"}>
              <button
                type="button"
                role="option"
                aria-selected={seleccionado}
                onClick={() => {
                  onChange(p.id);
                  close();
                }}
                className={selectorOptionClass(seleccionado)}
              >
                <span
                  className="inline-flex min-w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: p.id ? p.color : p.fondo,
                    color: p.texto,
                  }}
                >
                  {p.id ? <Flag size={10} /> : null}
                  {p.label}
                </span>
                {seleccionado && (
                  <Check size={16} className="ml-auto shrink-0 text-[var(--velo-brand)]" />
                )}
              </button>
            </li>
          );
        })}
      </AnchoredListboxPanel>
    </div>
  );
}
