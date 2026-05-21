import type { Usuario } from "./api";

export const ADMIN_DEPT = "ADMIN";

export function isAdminDept(departamento: string | null | undefined): boolean {
  return (departamento ?? "").trim().toUpperCase() === ADMIN_DEPT;
}

export function isAdminUsuario(me: Usuario | null | undefined): boolean {
  if (!me) return false;
  return me.es_admin_panel === true || isAdminDept(me.departamento);
}

/** Usuarios sin departamento solo usan el portal de solicitudes. */
export function esUsuarioSoloPortal(me: Usuario | null | undefined): boolean {
  if (!me) return true;
  if (isAdminUsuario(me)) return false;
  return !(me.departamento ?? "").trim();
}

export function puedeUsarWorkspaceKanban(me: Usuario | null | undefined): boolean {
  if (!me) return false;
  if (isAdminUsuario(me)) return false;
  if (esUsuarioSoloPortal(me)) return false;
  return me.puede_usar_kanban === true;
}
