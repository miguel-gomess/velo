const DEFAULT = "miguel@velo.com";

export function getSuperadminEmailsClient(): string[] {
  const raw = (import.meta.env.VITE_SUPERADMIN_EMAIL as string | undefined)?.trim();
  const source = raw || DEFAULT;
  return source
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmailClient(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmailsClient().includes(email.trim().toLowerCase());
}
