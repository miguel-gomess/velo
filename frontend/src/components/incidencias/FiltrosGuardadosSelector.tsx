import { Bookmark, Check, ChevronDown } from "lucide-react";
import type { PresetFiltrosIncidencias } from "../../lib/incidenciasFiltros";
import { contarFiltrosActivos } from "../../lib/incidenciasFiltros";
import { AnchoredListboxPanel, useAnchoredListbox } from "./selectors/useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectors/selectorUi";

type Props = {
  presets: PresetFiltrosIncidencias[];
  presetActivo: string;
  onSelect: (id: string) => void;
};

export function FiltrosGuardadosSelector({ presets, presetActivo, onSelect }: Props) {
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const activo = presets.find((p) => p.id === presetActivo);
  const label = activo?.nombre ?? "Guardados";

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full sm:min-w-[9.5rem] sm:max-w-[13rem]">
      <button
        type="button"
        onClick={toggle}
        className={selectorTriggerClass({ abierto, activo: !!activo })}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label="Filtros guardados"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <Bookmark
            size={14}
            className={`shrink-0 ${activo ? "text-[var(--velo-brand)]" : "text-slate-400"}`}
          />
          <span className="truncate">{label}</span>
        </span>
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
        {presets.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs text-[var(--velo-text-muted)]">
            No hay filtros guardados.
            <span className="mt-1 block text-[10px] text-[var(--velo-text-subtle)]">
              Aplica filtros y pulsa Guardar
            </span>
          </li>
        ) : (
          <>
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!presetActivo}
                onClick={() => {
                  onSelect("");
                  close();
                }}
                className={selectorOptionClass(!presetActivo)}
              >
                <span className="font-medium">Sin preset</span>
              </button>
            </li>
            {presets.map((p) => {
              const seleccionado = presetActivo === p.id;
              const n = contarFiltrosActivos(p.filtros);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={seleccionado}
                    onClick={() => {
                      onSelect(p.id);
                      close();
                    }}
                    className={selectorOptionClass(seleccionado)}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold leading-tight">{p.nombre}</span>
                      <span className="text-[10px] font-normal text-[var(--velo-text-subtle)]">
                        {n} filtro{n === 1 ? "" : "s"}
                      </span>
                    </span>
                    {seleccionado && (
                      <Check size={16} className="shrink-0 text-[var(--velo-brand)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </>
        )}
      </AnchoredListboxPanel>
    </div>
  );
}
