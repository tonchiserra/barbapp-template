import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbapp",
  description: "Plataforma para barberos y peluqueros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
