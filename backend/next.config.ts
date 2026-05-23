import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: backendRoot,
  },
  /** Rutas del React Router (Vite) → index.html de public/ */
  async rewrites() {
    return {
      fallback: [
        {
          source:
            "/:path((?!api|_next|assets|favicon\\.ico|favicon-32\\.png|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|site\\.webmanifest|.*\\..*).*)",
          destination: "/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
