import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "../../UserAvatar";
import { ChevronDown, Search } from "lucide-react";
import { AnchoredListboxPanel, useAnchoredListbox } from "./useAnchoredListbox";
import {
  SELECTOR_LIST_CLASS,
  SELECTOR_PANEL_CLASS,
  selectorChevronClass,
  selectorOptionClass,
  selectorTriggerClass,
} from "./selectorUi";

export type PersonaOpcion = {
  id: number;
  nombre: string;
  departamento?: string | null;
};

type BaseProps = {
  usuarios: PersonaOpcion[];
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Trigger más alto para sidebar del modal de incidencia */
  size?: "default" | "sidebar";
};

type AsignacionProps = BaseProps & {
  modo?: "asignacion";
  value: number | null;
  onChange: (id: number | null) => void;
};

type FiltroProps = BaseProps & {
  modo: "filtro";
  value: string;
  onChange: (value: string) => void;
  etiquetaCualquiera?: string;
};

export type PersonaAsignadaSelectorProps = AsignacionProps | FiltroProps;

function isFiltro(props: PersonaAsignadaSelectorProps): props is FiltroProps {
  return props.modo === "filtro";
}

function coincidePersona(u: PersonaOpcion, q: string): boolean {
  const nombre = u.nombre.toLowerCase();
  const dept = (u.departamento ?? "").toLowerCase();
  return nombre.includes(q) || dept.includes(q);
}

export function PersonaAsignadaSelector(props: PersonaAsignadaSelectorProps) {
  const { usuarios, disabled, className = "", compact = false, size = "default" } = props;
  const triggerSize = compact ? "default" : size;
  const { rootRef, panelRef, abierto, anchor, toggle, close } = useAnchoredListbox();
  const [busqueda, setBusqueda] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtro = isFiltro(props);
  const etiquetaCualquiera = filtro ? (props.etiquetaCualquiera ?? "Cualquiera") : "";

  const seleccionado = filtro
    ? props.value === "sin_asignar"
      ? null
      : props.value
        ? usuarios.find((u) => String(u.id) === props.value)
        : undefined
    : props.value != null
      ? usuarios.find((u) => u.id === props.value)
      : null;

  const esCualquiera = filtro && props.value === "";
  const esSinAsignar = filtro && props.value === "sin_asignar";
  const tieneValor = filtro ? props.value !== "" : props.value != null;

  const q = busqueda.trim().toLowerCase();
  const usuariosVisibles = useMemo(
    () => (q ? usuarios.filter((u) => coincidePersona(u, q)) : usuarios),
    [usuarios, q],
  );

  useEffect(() => {
    if (!abierto) {
      setBusqueda("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [abierto]);

  function elegir(id: number | null) {
    if (filtro) {
      if (id == null) props.onChange("sin_asignar");
      else props.onChange(String(id));
    } else {
      props.onChange(id);
    }
    close();
  }

  function elegirCualquiera() {
    if (filtro) props.onChange("");
    close();
  }

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-[11rem]" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={selectorTriggerClass({ abierto, activo: tieneValor, size: triggerSize })}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        {esCualquiera ? (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[10px] font-bold text-[var(--velo-brand)]">
              ∅
            </span>
            <span className="min-w-0 flex-1 truncate">{etiquetaCualquiera}</span>
          </>
        ) : esSinAsignar || !seleccionado ? (
          <>
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--velo-border)] bg-[var(--velo-bg)] text-[10px] font-semibold text-[var(--velo-text-subtle)]"
              aria-hidden
            >
              —
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[var(--velo-text-muted)]">Sin asignar</span>
              {!compact && (
                <span className="block truncate text-xs text-[var(--velo-text-subtle)]">
                  Pendiente de asignación
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <UserAvatar nombre={seleccionado.nombre} userId={seleccionado.id} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{seleccionado.nombre}</span>
              {!compact && (
                <span className="block truncate text-xs text-[var(--velo-text-muted)]">
                  {seleccionado.departamento ?? "Sin departamento"}
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
        className={`${SELECTOR_PANEL_CLASS} flex flex-col`}
        listClassName={`${SELECTOR_LIST_CLASS} max-h-52`}
        minWidth={260}
        header={
          <div className="border-b border-[var(--velo-border)] p-2">
            <label className="relative block">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--velo-text-subtle)]"
              />
              <input
                ref={inputRef}
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Buscar por nombre…"
                className="h-8 w-full rounded-md border border-[var(--velo-border)] bg-[var(--velo-bg)] py-1 pl-8 pr-2 text-sm outline-none focus:border-[var(--velo-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--velo-brand-muted)]"
                aria-label="Buscar persona"
              />
            </label>
          </div>
        }
      >
        {filtro && !q && (
          <li>
            <button
              type="button"
              role="option"
              aria-selected={esCualquiera}
              onClick={elegirCualquiera}
              className={selectorOptionClass(esCualquiera)}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand-muted)] text-[10px] font-bold text-[var(--velo-brand)]">
                ∅
              </span>
              <span className="text-sm font-medium text-[var(--velo-text)]">{etiquetaCualquiera}</span>
            </button>
          </li>
        )}
        {!q && (
          <li>
            <button
              type="button"
              role="option"
              aria-selected={filtro ? esSinAsignar : props.value == null}
              onClick={() => elegir(null)}
              className={selectorOptionClass(filtro ? esSinAsignar : props.value == null)}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--velo-border)] bg-[var(--velo-bg)] text-[10px] font-semibold text-[var(--velo-text-subtle)]">
                —
              </span>
              <span className="text-sm text-[var(--velo-text)]">Sin asignar</span>
            </button>
          </li>
        )}
        {usuariosVisibles.map((u) => {
          const activo = filtro ? props.value === String(u.id) : props.value === u.id;
          return (
            <li key={u.id}>
              <button
                type="button"
                role="option"
                aria-selected={activo}
                onClick={() => elegir(u.id)}
                className={selectorOptionClass(!!activo)}
              >
                <UserAvatar nombre={u.nombre} userId={u.id} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--velo-text)]">
                    {u.nombre}
                  </span>
                  <span className="block truncate text-xs text-[var(--velo-text-muted)]">
                    {u.departamento ?? "Sin departamento"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {usuariosVisibles.length === 0 && (
          <li className="px-3 py-4 text-center text-xs text-[var(--velo-text-muted)]">
            {q ? "Ninguna persona coincide" : "No hay personas disponibles"}
          </li>
        )}
      </AnchoredListboxPanel>
    </div>
  );
}
