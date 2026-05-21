import type { ReactNode, ElementType } from "react";
import { UserAvatar } from "../UserAvatar";

export function IssueSidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="issue-sidebar">
      <div className="issue-sidebar__scroll">{children}</div>
    </aside>
  );
}

export function IssueSidebarHeading() {
  return <h3 className="issue-sidebar__heading">Detalles</h3>;
}

export function IssueSidebarField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: ElementType;
  children: ReactNode;
}) {
  return (
    <div className="issue-sidebar-field">
      <div className="issue-sidebar-field__head">
        {Icon ? <Icon size={14} strokeWidth={2.25} aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className="issue-sidebar-field__body">{children}</div>
    </div>
  );
}

export function IssueSidebarPerson({
  nombre,
  userId,
  subtitulo,
  vacio,
}: {
  nombre: string;
  userId: number | null;
  subtitulo?: string | null;
  vacio?: boolean;
}) {
  if (vacio) {
    return (
      <div className="issue-sidebar-person issue-sidebar-person--empty">
        <span className="issue-sidebar-person__placeholder" aria-hidden>
          —
        </span>
        <div>
          <p className="issue-sidebar-person__name">Sin asignar</p>
          <p className="issue-sidebar-person__meta">Pendiente de asignación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-sidebar-person">
      <UserAvatar nombre={nombre} userId={userId} size="sm" />
      <div className="min-w-0">
        <p className="issue-sidebar-person__name">{nombre}</p>
        <p className="issue-sidebar-person__meta">{subtitulo ?? "Sin departamento"}</p>
      </div>
    </div>
  );
}

export function IssueSidebarMeta({
  icon: Icon,
  children,
}: {
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <span className="issue-sidebar-meta">
      <Icon size={14} strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

export function IssueSidebarBadge({ children }: { children: ReactNode }) {
  return <span className="issue-sidebar-badge">{children}</span>;
}

export function IssueSidebarDeadline({ children }: { children: ReactNode }) {
  return <p className="issue-sidebar-deadline">{children}</p>;
}
