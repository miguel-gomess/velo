import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { getAllowedOriginsList } from "@/lib/cors";
import { resolveAuthBaseUrl } from "@/lib/authBaseUrl";

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
  advanced: {
    useSecureCookies: isProd,
  },
});
