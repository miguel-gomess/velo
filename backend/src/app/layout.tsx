import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velo — Gestión de incidencias",
  description: "Gestión de incidencias internas",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
    apple: "/apple-touch-icon.png",
  },
};

/** Layout mínimo: la UI es la SPA de Vite en public/index.html */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
