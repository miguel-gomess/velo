import { authClient } from "../lib/authClient";

type SessionRecord = { impersonatedBy?: string };

/** Sesión activa de impersonación (solo el superadmin puede impersonar). */
export function useImpersonation() {
  const { data } = authClient.useSession();
  const record = data?.session as SessionRecord | undefined;
  const impersonatedBy = record?.impersonatedBy;
  const isImpersonating =
    typeof impersonatedBy === "string" && impersonatedBy.length > 0;

  return {
    isImpersonating,
    usuarioActivo: data?.user?.name ?? data?.user?.email ?? null,
  };
}
