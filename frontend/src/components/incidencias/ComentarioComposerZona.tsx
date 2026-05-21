import type { ReactNode } from "react";
import { Globe, Lock } from "lucide-react";

type Props = {
  puedeInternos: boolean;
  esInterno: boolean;
  onEsInternoChange: (value: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
};

export function ComentarioComposerZona({
  puedeInternos,
  esInterno,
  onEsInternoChange,
  disabled,
  children,
}: Props) {
  if (!puedeInternos) {
    return <div className="issue-composer-panel">{children}</div>;
  }

  return (
    <div
      className={`issue-composer-panel transition-colors ${
        esInterno ? "issue-composer-panel--internal" : "issue-composer-panel--public"
      }`}
    >
      <div className="issue-composer-panel__mode" role="group" aria-label="Visibilidad del comentario">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onEsInternoChange(false)}
          aria-pressed={!esInterno}
          className={`issue-composer-mode-btn ${!esInterno ? "is-active" : ""}`}
        >
          <Globe size={13} />
          Público
          <span className="issue-composer-mode-hint">Lo ve el solicitante</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onEsInternoChange(true)}
          aria-pressed={esInterno}
          className={`issue-composer-mode-btn issue-composer-mode-btn--internal ${esInterno ? "is-active" : ""}`}
        >
          <Lock size={13} />
          Interno
          <span className="issue-composer-mode-hint">Solo equipo</span>
        </button>
      </div>
      <div className="issue-composer-panel__editor">{children}</div>
    </div>
  );
}
