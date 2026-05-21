import { useState } from "react";
import { apiUpdateIncidencia } from "../../lib/api";
import { Check, Loader2, X } from "lucide-react";

const MOTIVOS = [
  { id: "resuelta", label: "Resuelta" },
  { id: "rechazada", label: "Rechazada" },
  { id: "duplicada", label: "Duplicada" },
] as const;

type Props = {
  incidenciaId: number;
  onClose: () => void;
  onCerrada: () => void;
};

export function CerrarIncidenciaModal({ incidenciaId, onClose, onCerrada }: Props) {
  const [motivo, setMotivo] = useState<(typeof MOTIVOS)[number]["id"]>("resuelta");
  const [resolucion, setResolucion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (resolucion.trim().length < 10) {
      setError("El comentario de cierre debe tener al menos 10 caracteres.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await apiUpdateIncidencia(incidenciaId, {
        estado: "cerrada",
        motivo_cierre: motivo,
        resolucion: resolucion.trim(),
      });
      onCerrada();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#091e42]/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl border border-[var(--velo-border)] bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--velo-text)]">Cerrar incidencia</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-[var(--velo-bg)]">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--velo-text-muted)]">
          Indica el motivo y un resumen para el solicitante.
        </p>

        <fieldset className="mt-4">
          <legend className="text-xs font-semibold uppercase text-[var(--velo-text-subtle)]">
            Motivo
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMotivo(m.id)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  motivo === m.id
                    ? "border-[var(--velo-brand)] bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
                    : "border-[var(--velo-border)] text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase text-[var(--velo-text-subtle)]">
            Comentario de cierre
          </span>
          <textarea
            value={resolucion}
            onChange={(e) => setResolucion(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-[var(--velo-border)] px-3 py-2 text-sm"
            placeholder="Describe cómo se resolvió o por qué se cierra…"
          />
        </label>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-md border border-[var(--velo-border)] px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={guardando}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--velo-brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            {guardando ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
            Cerrar incidencia
          </button>
        </div>
      </div>
    </div>
  );
}
