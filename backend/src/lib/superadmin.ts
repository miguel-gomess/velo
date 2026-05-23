/** Emails con permiso de impersonación (variable SUPERADMIN_EMAIL, separada por comas). */
export function getSuperadminEmails(): string[] {
  const raw = process.env.SUPERADMIN_EMAIL?.trim();
  const source = raw || "miguel@velo.com";
  return source
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmails().includes(email.trim().toLowerCase());
}
