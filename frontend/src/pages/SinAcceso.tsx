import { Link, Navigate } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { ShieldOff, LogOut } from "lucide-react";

export function SinAcceso() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-lg border border-[var(--velo-border)] bg-white p-5 text-center shadow-md sm:p-8">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldOff size={28} />
        </div>
        <h1 className="text-xl font-bold text-[var(--velo-text)]">Acceso restringido</h1>
        <p className="mt-3 text-sm text-[var(--velo-text-muted)]">
          El panel de administración solo está disponible para usuarios con departamento{" "}
          <strong>ADMIN</strong>. Puedes seguir usando el portal de incidencias.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/portal"
            className="rounded-md bg-[var(--velo-brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--velo-brand-hover)]"
          >
            Ir al portal
          </Link>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--velo-border)] py-2.5 text-sm font-medium"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
