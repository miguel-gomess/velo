import type { Usuario } from "./api";
import { apiUrl } from "./api";
import { isAdminUsuario, RUTA_PANEL_ADMIN } from "./roles";

/** Ruta tras impersonar según ficha del directorio (sin llamar a /api/me). */
export function rutaTrasImpersonar(usuario: Pick<Usuario, "departamento" | "es_admin">): string {
  if (isAdminUsuario(usuario as Usuario)) return RUTA_PANEL_ADMIN;
  return "/";
}

export function urlImpersonarUsuario(email: string, redirect: string): string {
  const url = new URL(apiUrl("/api/admin/impersonate"));
  url.searchParams.set("email", email.trim().toLowerCase());
  url.searchParams.set("redirect", redirect);
  return url.href;
}

/** Navegación completa para que el navegador aplique las cookies de sesión. */
export function entrarComoUsuario(
  email: string,
  usuario?: Pick<Usuario, "departamento" | "es_admin">,
): void {
  const target = email.trim().toLowerCase();
  if (!target) throw new Error("Indica el email del usuario");
  const redirect = usuario ? rutaTrasImpersonar(usuario) : "/";
  window.location.assign(urlImpersonarUsuario(target, redirect));
}

export function urlVolverMiCuenta(redirect = "/dashboard/directorio"): string {
  const url = new URL(apiUrl("/api/admin/stop-impersonating"));
  url.searchParams.set("redirect", redirect);
  return url.href;
}

export function volverDeImpersonacion(redirect = "/dashboard/directorio"): void {
  window.location.assign(urlVolverMiCuenta(redirect));
}
