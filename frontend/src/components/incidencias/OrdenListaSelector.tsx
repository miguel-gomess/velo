import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./selectors/useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectors/selectorUi";

export type CampoOrdenLista =
  | "original"
  | "id"
  | "titulo"
  | "fecha_creacion"
  | "fecha_actualizacion"
  | "estado"
  | "prioridad";

export type DireccionOrden = "asc" | "desc";

const OPCIONES: { id: CampoOrdenLista; label: string; hint?: string }[] = [
  { id: "original", label: "Sin ordenar", hint: "Orden del tablero" },
  { id: "id", label: "ID" },
  { id: "titulo", label: "Título" },
  { id: "fecha_creacion", label: "Creación" },
  { id: "fecha_actualizacion", label: "Actualización" },
  { id: "estado", label: "Estado" },
  { id: "prioridad", label: "Prioridad" },
];

type Props = {
  campo: CampoOrdenLista;
  direccion: DireccionOrden;
  onCampoChange: (campo: CampoOrdenLista) => void;
  onDireccionToggle: () => void;
};

export function OrdenListaSelector({
  campo,
  direccion,
  onCampoChange,
  onDireccionToggle,
}: Props) {
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const actual = OPCIONES.find((o) => o.id === campo) ?? OPCIONES[0];
  const sinOrden = campo === "original";

  return (
    <div className="lista-orden-toolbar flex flex-wrap items-center gap-2">
      <span className="lista-orden-label text-[10px] font-bold uppercase tracking-wide text-[var(--velo-text-subtle)]">
        Ordenar
      </span>

      <div ref={rootRef} className="relative min-w-[9.5rem]">
        <button
          type="button"
          onClick={toggle}
          className={selectorTriggerClass({ abierto, activo: !sinOrden })}
          aria-expanded={abierto}
          aria-haspopup="listbox"
          aria-label="Campo de ordenación"
        >
          <span className="flex min-w-0 items-center gap-2 truncate text-[var(--velo-text)]">
            <ArrowUpDown size={14} className="shrink-0 text-[var(--velo-brand)]" />
            {actual.label}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[var(--velo-text-subtle)] transition-transform ${abierto ? "rotate-180" : ""}`}
          />
        </button>

        <AnchoredListboxPanel
          abierto={abierto}
          anchor={anchor}
          panelRef={panelRef}
          className={SELECTOR_PANEL_CLASS}
          listClassName={`${SELECTOR_LIST_CLASS} max-h-64`}
          minWidth={200}
        >
          {OPCIONES.map((op) => {
            const seleccionado = campo === op.id;
            return (
              <li key={op.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={seleccionado}
                  onClick={() => {
                    onCampoChange(op.id);
                    close();
                  }}
                  className={selectorOptionClass(seleccionado)}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold leading-tight">{op.label}</span>
                    {op.hint && (
                      <span className="text-[10px] font-normal text-[var(--velo-text-subtle)]">
                        {op.hint}
                      </span>
                    )}
                  </span>
                  {seleccionado && <Check size={16} className="shrink-0 text-[var(--velo-brand)]" />}
                </button>
              </li>
            );
          })}
        </AnchoredListboxPanel>
      </div>

      <button
        type="button"
        onClick={onDireccionToggle}
        disabled={sinOrden}
        title={direccion === "asc" ? "Ascendente" : "Descendente"}
        className={`lista-orden-dir inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[var(--velo-brand-muted)] disabled:cursor-not-allowed disabled:opacity-40 ${
          sinOrden
            ? "border-[var(--velo-border)] bg-slate-50 text-[var(--velo-text-subtle)]"
            : direccion === "asc"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
        }`}
        aria-label={direccion === "asc" ? "Orden ascendente" : "Orden descendente"}
      >
        {direccion === "asc" ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />}
        {direccion === "asc" ? "Asc" : "Desc"}
      </button>
    </div>
  );
}
