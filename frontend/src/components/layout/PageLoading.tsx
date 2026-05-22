import { Loader2 } from "lucide-react";

type Props = {
  label?: string;
  /** Ocupa la ventana y centra el contenido (pantallas de carga a pantalla completa). */
  pantallaCompleta?: boolean;
};

export function PageLoading({ label = "Cargando…", pantallaCompleta = true }: Props) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 ${
        pantallaCompleta ? "min-h-svh" : "min-h-[40vh]"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="animate-spin text-[var(--velo-brand)]" size={36} />
      <p className="text-sm font-medium text-[var(--velo-text-muted)]">{label}</p>
    </div>
  );
}
