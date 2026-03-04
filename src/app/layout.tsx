import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Barbapp — Reserva tu turno",
    template: "%s | Barbapp",
  },
  description: "Reserva tu turno online de forma rapida y sencilla.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Barbapp",
  },
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
