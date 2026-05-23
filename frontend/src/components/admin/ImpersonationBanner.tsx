import { useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
import { volverDeImpersonacion } from "../../lib/impersonate";
import { useImpersonation } from "../../hooks/useImpersonation";

type Props = {
  variant?: "banner" | "compact";
};

/** Solo visible durante impersonación (solo el superadmin puede impersonar). */
export function VolverMiCuentaButton({ variant = "banner" }: Props) {
  const { isImpersonating, usuarioActivo } = useImpersonation();
  const [loading, setLoading] = useState(false);

  if (!isImpersonating) return null;

  function onVolver() {
    setLoading(true);
    try {
      volverDeImpersonacion();
    } catch {
      setLoading(false);
    }
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onVolver}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-60 sm:px-3"
        title="Volver a tu cuenta de superadmin"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
        <span className="hidden sm:inline">Mi cuenta</span>
      </button>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
      role="status"
    >
      <Undo2 size={16} className="shrink-0 text-amber-700" aria-hidden />
      <span>
        Viendo Velo como <strong>{usuarioActivo ?? "usuario"}</strong>
      </span>
      <button
        type="button"
        onClick={onVolver}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-950 disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
        Volver a mi cuenta
      </button>
    </div>
  );
}

export function ImpersonationBanner() {
  return <VolverMiCuentaButton variant="banner" />;
}
