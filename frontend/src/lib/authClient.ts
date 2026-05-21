import { createAuthClient } from "better-auth/react";

/** En dev con Vite, deja vacío para usar el mismo origen y el proxy `/api` → Next (puerto 3000). */
const baseURL =
  (import.meta.env.VITE_AUTH_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});

