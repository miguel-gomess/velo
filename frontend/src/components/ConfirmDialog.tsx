import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Diálogo de confirmación (sustituye window.confirm). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#091e42]/60 p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => !loading && onCancel()}
        aria-label="Cerrar"
        tabIndex={-1}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-md rounded-xl border border-[var(--velo-border)] bg-white p-6 shadow-[var(--velo-shadow-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--velo-text)]">
          {title}
        </h3>
        <div
          id="confirm-dialog-desc"
          className="mt-2 text-sm text-[var(--velo-text-muted)]"
        >
          {description}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-md border border-[var(--velo-border)] px-4 py-2 text-sm font-medium text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
