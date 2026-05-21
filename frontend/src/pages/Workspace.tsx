import { NavLink, Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { useProfile } from "../hooks/useProfile";
import { isAdminUsuario, puedeUsarWorkspaceKanban } from "../lib/roles";
import { labelEquipo } from "../lib/equipos";
import { AppLogo } from "../components/layout/AppLogo";
import { UserAvatar } from "../components/UserAvatar";
import { ExternalLink, Kanban, LayoutDashboard, LogOut } from "lucide-react";

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
      : "text-[var(--velo-text-muted)] hover:bg-slate-100 hover:text-[var(--velo-text)]"
  }`;
}

export function Workspace() {
  const { data: session, isPending } = authClient.useSession();
  const email = session?.user?.email?.trim() ?? null;
  const profile = useProfile(email);

  if (isPending || (email && !profile.ready)) {
    return null;
  }

  if (!session?.user || !email) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.user) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const me = profile.user;

  if (isAdminUsuario(me)) {
    return <Navigate to="/dashboard/incidencias" replace />;
  }

  if (!puedeUsarWorkspaceKanban(me)) {
    return <Navigate to="/portal" replace />;
  }

  const equiposLabel =
    me.equipos?.map((c) => labelEquipo(c)).join(", ") || "Sin equipos asignados";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--velo-bg)]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--velo-border)] bg-white">
        <div className="border-b border-[var(--velo-border)] px-5 py-5">
          <AppLogo size="sm" />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--velo-text-subtle)]">
            Espacio de equipos
          </p>
          <p className="mt-2 text-xs leading-snug text-[var(--velo-text-muted)]">{equiposLabel}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          <NavLink to="/workspace" end className={({ isActive }) => navClass(isActive)}>
            <Kanban size={18} strokeWidth={2} />
            Tablero
          </NavLink>
          <div className="my-3 border-t border-[var(--velo-border)]" />
          <NavLink
            to="/portal"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--velo-text-muted)] hover:bg-slate-100"
          >
            <LayoutDashboard size={18} />
            Portal solicitudes
            <ExternalLink size={14} className="ml-auto opacity-50" />
          </NavLink>
        </nav>

        <div className="border-t border-[var(--velo-border)] p-4">
          <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
            <UserAvatar nombre={session.user.name ?? "Usuario"} userId={me.id} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{session.user.name}</p>
              <p className="truncate text-xs text-[var(--velo-text-subtle)]">
                {(me.departamento ?? "").trim() || "Equipo"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="text-[var(--velo-text-subtle)] hover:text-rose-600"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
