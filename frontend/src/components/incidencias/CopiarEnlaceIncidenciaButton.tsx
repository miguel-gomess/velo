import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Usuario } from "../../lib/api";
import { buildEnlaceIncidencia } from "../../lib/incidenciaEnlace";

type Props = {
  incidenciaId: number;
  me: Usuario;
  variant?: "default" | "icon";
  /** En tablero Kanban: icono siempre visible (no solo al pasar el ratón). */
  alwaysVisible?: boolean;
  className?: string;
};

const COPIADO_MS = 2200;

export function CopiarEnlaceIncidenciaButton({
  incidenciaId,
  me,
  variant = "default",
  alwaysVisible = false,
  className = "",
}: Props) {
  const [copiado, setCopiado] = useState(false);

  function copiar(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    void navigator.clipboard.writeText(buildEnlaceIncidencia(incidenciaId, me)).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), COPIADO_MS);
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copiar}
        title={copiado ? "Enlace copiado" : "Copiar enlace a la incidencia"}
        aria-label={copiado ? "Enlace copiado" : "Copiar enlace"}
        data-copiado={copiado ? "true" : undefined}
        className={[
          "copiar-enlace-icon-btn inline-flex shrink-0 items-center overflow-hidden rounded-md border border-transparent transition-all duration-200",
          copiado ? "gap-1.5 px-1.5 py-0.5" : "gap-0.5 p-1",
          "hover:border-[var(--velo-border)] hover:bg-white hover:text-[var(--velo-brand)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--velo-brand-muted)]",
          alwaysVisible || copiado
            ? "text-[var(--velo-text-subtle)] opacity-70 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
            : "text-[var(--velo-text-subtle)] opacity-0 group-hover:opacity-100 focus:opacity-100",
          copiado
            ? "copiar-enlace-icon-btn--ok !border-emerald-200 !bg-emerald-50 !text-emerald-700 !opacity-100"
            : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {copiado ? (
          <Check size={13} strokeWidth={2.5} className="copiar-enlace-icon-btn__icon shrink-0" />
        ) : (
          <Copy size={13} className="copiar-enlace-icon-btn__icon shrink-0" />
        )}
        <span
          className={[
            "pr-0.5 text-[9px] font-bold uppercase tracking-wide transition-all duration-200",
            copiado ? "w-auto translate-x-0 opacity-100" : "w-0 -translate-x-0.5 opacity-0",
          ].join(" ")}
          aria-hidden={!copiado}
        >
          Copiado
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copiar}
      data-copiado={copiado ? "true" : undefined}
      className={[
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors duration-200",
        copiado
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[var(--velo-border)] bg-white text-[var(--velo-brand)] hover:bg-[var(--velo-brand-muted)]",
        className,
      ].join(" ")}
    >
      {copiado ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
      {copiado ? "Copiado" : "Copiar enlace"}
    </button>
  );
}
