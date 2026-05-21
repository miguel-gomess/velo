import bcrypt from "bcryptjs";

/** Coste bcrypt centralizado. 12 ronda en ~250ms en hardware actual. */
export const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? 12);

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  return bcrypt.hash(plain, BCRYPT_COST);
}
