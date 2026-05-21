import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velo",
  description: "Gestión de incidencias internas",
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
