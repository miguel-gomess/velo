import { Link } from "react-router-dom";
import { Columns3, LayoutDashboard, LogOut } from "lucide-react";
import { authClient } from "../../lib/authClient";
import { isAdminUsuario, puedeUsarWorkspaceKanban } from "../../lib/roles";
import type { Usuario } from "../../lib/api";
import { NotificacionesCampana } from "../notificaciones/NotificacionesCampana";
import { AppLogo } from "../layout/AppLogo";
import { UserAvatar } from "../UserAvatar";
import { saludoSegunHora } from "./portalUtils";

type Props = {
  nombreUsuario: string;
  me: Usuario;
  sessionName: string | null;
  deptLabel: string;
  onIrAIncidencia: (id: number) => void;
};

export function PortalHeader({
  nombreUsuario,
  me,
  sessionName,
  deptLabel,
  onIrAIncidencia,
}: Props) {
  return (
    <header className="portal-glass sticky top-0 z-50 border-b border-white/40">
      <div className="safe-area-pt flex w-full items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-4">
          <AppLogo size="sm" />
          <div className="hidden h-8 w-px bg-[var(--velo-border)] sm:block" />
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--velo-brand)]">
              Centro de solicitudes
            </p>
            <p className="text-sm font-semibold text-[var(--velo-text)]">
              {saludoSegunHora()}, {nombreUsuario}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAdminUsuario(me) && (
            <Link
              to="/dashboard/incidencias"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--velo-border)] bg-white/80 p-2 text-xs font-semibold text-[var(--velo-text)] transition hover:border-[var(--velo-brand)] hover:text-[var(--velo-brand)] sm:px-3 sm:py-2"
              aria-label="Panel de administración"
              title="Admin"
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {puedeUsarWorkspaceKanban(me) && (
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--velo-border)] bg-white/80 p-2 text-xs font-semibold text-[var(--velo-text)] transition hover:border-[var(--velo-brand)] hover:text-[var(--velo-brand)] sm:px-3 sm:py-2"
              aria-label="Tablero Kanban"
              title="Tablero"
            >
              <Columns3 size={15} />
              <span className="hidden sm:inline">Tablero</span>
            </Link>
          )}
          <NotificacionesCampana
            onIrAIncidencia={onIrAIncidencia}
            activo={!isAdminUsuario(me)}
          />
          <div className="hidden items-center gap-2 rounded-xl border border-[var(--velo-border)] bg-white/80 px-2 py-1.5 sm:flex">
            <UserAvatar nombre={sessionName ?? me.nombre} userId={me.id} size="sm" />
            <div className="pr-1">
              <p className="max-w-[120px] truncate text-xs font-semibold">{me.nombre}</p>
              {deptLabel && (
                <p className="text-[10px] text-[var(--velo-text-subtle)]">{deptLabel}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="rounded-xl border border-transparent p-2.5 text-[var(--velo-text-subtle)] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
