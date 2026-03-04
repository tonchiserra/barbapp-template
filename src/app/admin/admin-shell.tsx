"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui";

const LANDING_SECTIONS = [
  {
    href: "/admin/header",
    label: "Header",
    description: "Logo, navegacion y redes sociales",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    href: "/admin/carousel",
    label: "Carrusel",
    description: "Imagenes destacadas con texto y CTA",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="12" x="3" y="6" rx="2" />
        <circle cx="12" cy="20" r="1" />
        <circle cx="8" cy="20" r="1" />
        <circle cx="16" cy="20" r="1" />
      </svg>
    ),
  },
  {
    href: "/admin/video",
    label: "Video",
    description: "Video destacado de YouTube",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
  {
    href: "/admin/gallery",
    label: "Galeria",
    description: "Galeria de imagenes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
  },
  {
    href: "/admin/multicolumn",
    label: "Multicolumna",
    description: "Grilla de bloques con imagen y texto",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/mapa",
    label: "Mapa",
    description: "Ubicacion de sucursales",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    href: "/admin/footer",
    label: "Footer",
    description: "Enlaces, redes sociales y copyright",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
];

const TURNERO_SECTIONS = [
  {
    href: "/admin/configuracion",
    label: "Configuracion",
    description: "Ajustes de la seccion publica del turnero",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Metricas y agenda del dia",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-6" />
      </svg>
    ),
  },
  {
    href: "/admin/servicios",
    label: "Servicios",
    description: "Servicios que ofreces",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
        <path d="M6 9.01V9" />
        <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
      </svg>
    ),
  },
  {
    href: "/admin/equipo",
    label: "Equipo",
    description: "Barberos y horarios",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    description: "Base de datos de clientes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const ALL_SECTIONS = [...LANDING_SECTIONS, ...TURNERO_SECTIONS];

function NavItem({ href, label, description, icon, active, onClick }: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <NextLink
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      <div className="flex flex-col">
        <span>{label}</span>
        <span className="text-xs font-normal text-muted-foreground">{description}</span>
      </div>
    </NextLink>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const currentSection = ALL_SECTIONS.find((s) => pathname === s.href);

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Abrir menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <Heading as="h1" className="text-lg">
          {currentSection?.label ?? "Admin"}
        </Heading>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <NextLink
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Volver a la web
            </NextLink>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Cerrar menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto p-3">
            <Text size="sm" variant="muted" className="px-3 py-2 font-medium uppercase tracking-wider">
              Landing Page
            </Text>
            {LANDING_SECTIONS.map((section) => (
              <NavItem
                key={section.href}
                {...section}
                active={pathname === section.href}
                onClick={() => setSidebarOpen(false)}
              />
            ))}

            <Text size="sm" variant="muted" className="mt-4 px-3 py-2 font-medium uppercase tracking-wider">
              Turnero
            </Text>
            {TURNERO_SECTIONS.map((section) => (
              <NavItem
                key={section.href}
                {...section}
                active={pathname === section.href}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[750px] px-4 py-8 sm:px-6 lg:px-8">
            {/* Section title (desktop only) */}
            {currentSection && (
              <div className="mb-8 hidden lg:block">
                <Heading as="h1" className="text-2xl">
                  {currentSection.label}
                </Heading>
                <Text size="sm" variant="muted" className="mt-1">
                  {currentSection.description}
                </Text>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
