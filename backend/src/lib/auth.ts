import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { getAllowedOriginsList } from "@/lib/cors";

export const auth = betterAuth({
  database: pool,
  appName: "velo",
  trustedOrigins: getAllowedOriginsList(),
  emailAndPassword: {
    enabled: true,
  },
});
