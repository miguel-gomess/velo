import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { pool } from "@/lib/db";
import { getAllowedOriginsList } from "@/lib/cors";
import { resolveAuthBaseUrl } from "@/lib/authBaseUrl";
import { superadminAuthUserIds } from "@/lib/superadminAuth";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: pool,
  appName: "velo",
  baseURL: resolveAuthBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    ...getAllowedOriginsList(),
    "https://*.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      adminUserIds: superadminAuthUserIds,
      allowImpersonatingAdmins: true,
      impersonationSessionDuration: 60 * 60 * 8,
    }),
  ],
  advanced: {
    useSecureCookies: isProd,
  },
});
