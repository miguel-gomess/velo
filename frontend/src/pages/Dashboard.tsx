import { NavLink, Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { useProfile } from "../hooks/useProfile";
import { ADMIN_DEPT } from "../lib/roles";
import { AdminShell } from "../components/layout/AdminShell";
import { PageLoading } from "../components/layout/PageLoading";
import { UserAvatar } from "../components/UserAvatar";
import {
  Users,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Kanban,
  ExternalLink,
  Settings,
} from "lucide-react";

const NAV = [
  { to: "/dashboard/incidencias", label: "Incidencias", icon: Kanban },
  { to: "/dashboard/directorio", label: "Directorio", icon: Users },
  { to: "/dashboard/analisis", label: "Análisis", icon: BarChart3 },
  { to: "/dashboard/config", label: "Configuración", icon: Settings },
] as const;

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]"
      : "text-[var(--velo-text-muted)] hover:bg-slate-100 hover:text-[var(--velo-text)]"
  }`;
}

export function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const email = session?.user?.email?.trim() ?? null;
  const profile = useProfile(email);

  if (isPending || (email && !profile.ready)) {
    return <PageLoading label="Cargando panel…" />;
  }

  if (!session?.user || !email) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-[var(--velo-text-muted)]">
          {profile.error ?? "No hay ficha en el directorio para tu usuario."}
        </p>
        <button
          type="button"
          onClick={() => authClient.signOut()}
          className="rounded-md bg-[var(--velo-text)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  const me = profile.user;
  const dept = (me.departamento ?? "").trim().toUpperCase();
  if (dept !== ADMIN_DEPT) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return (
    <AdminShell
      panelLabel="Panel administración"
      nav={
        <>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive)}>
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-[var(--velo-border)]" />
          <NavLink
            to="/portal"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--velo-text-muted)] hover:bg-slate-100"
          >
            <LayoutDashboard size={18} />
            Portal empleado
            <ExternalLink size={14} className="ml-auto opacity-50" />
          </NavLink>
        </>
      }
      footer={
        <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
          <UserAvatar
            nombre={session.user.name ?? "Usuario"}
            userId={profile.user?.id}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{session.user.name}</p>
            <p className="truncate text-xs text-[var(--velo-text-subtle)]">{dept}</p>
          </div>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="shrink-0 text-[var(--velo-text-subtle)] hover:text-rose-600"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      }
    >
      <Outlet />
    </AdminShell>
  );
}
