import { useEffect, useRef, useState } from "react";
import { datetimeLocalToIso, isoToDatetimeLocal } from "../../../lib/fechas";

type Props = {
  value: string | null | undefined;
  onChange: (iso: string | null) => void | Promise<void>;
  disabled?: boolean;
};

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function esDatetimeLocalCompleto(v: string): boolean {
  return DATETIME_LOCAL_RE.test(v);
}

export function FechaLimiteIncidenciaInput({ value, onChange, disabled }: Props) {
  const [local, setLocal] = useState(() => isoToDatetimeLocal(value));
  const editandoRef = useRef(false);

  useEffect(() => {
    if (!editandoRef.current) {
      setLocal(isoToDatetimeLocal(value));
    }
  }, [value]);

  function revertir() {
    setLocal(isoToDatetimeLocal(value));
  }

  function commit(localVal: string) {
    if (!localVal.trim()) {
      if (value) void onChange(null);
      return;
    }

    if (!esDatetimeLocalCompleto(localVal)) {
      revertir();
      return;
    }

    const iso = datetimeLocalToIso(localVal);
    if (!iso) {
      revertir();
      return;
    }

    if (isoToDatetimeLocal(value) === localVal) return;
    void onChange(iso);
  }

  return (
    <div className="space-y-2">
      <input
        type="datetime-local"
        value={local}
        disabled={disabled}
        onFocus={() => {
          editandoRef.current = true;
        }}
        onChange={(e) => {
          setLocal(e.target.value);
        }}
        onBlur={(e) => {
          editandoRef.current = false;
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            editandoRef.current = false;
            revertir();
            e.currentTarget.blur();
          }
        }}
        className="issue-sidebar-datetime"
        aria-label="Fecha límite"
      />
      {value && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            editandoRef.current = false;
            setLocal("");
            void onChange(null);
          }}
          className="text-[11px] font-semibold text-[var(--velo-text-subtle)] underline-offset-2 hover:text-[var(--velo-brand)] hover:underline disabled:opacity-50"
        >
          Quitar plazo
        </button>
      )}
    </div>
  );
}
