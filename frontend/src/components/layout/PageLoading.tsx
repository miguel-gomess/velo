import { Loader2 } from "lucide-react";

export function PageLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="animate-spin text-[var(--velo-brand)]" size={36} />
      <p className="text-sm font-medium text-[var(--velo-text-muted)]">{label}</p>
    </div>
  );
}
