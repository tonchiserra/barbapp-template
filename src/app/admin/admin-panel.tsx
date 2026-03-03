"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { Heading, Text } from "@/components/ui";
import { HeaderSettingsForm } from "./sections/header-settings";
import { FooterSettingsForm } from "./sections/footer-settings";
import { CarouselSettingsForm } from "./sections/carousel-settings";
import { VideoSettingsForm } from "./sections/video-settings";
import { GallerySettingsForm } from "./sections/gallery-settings";
import { MulticolumnSettingsForm } from "./sections/multicolumn-settings";
import type { HeaderSettings, FooterSettings, CarouselSettings, VideoSettings, GallerySettings, MulticolumnSettings } from "@/types";

const SECTIONS = [
  {
    key: "header",
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
    key: "carousel",
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
    key: "video",
    label: "Video",
    description: "Video destacado de YouTube",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
  {
    key: "gallery",
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
    key: "multicolumn",
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
    key: "footer",
    label: "Footer",
    description: "Enlaces, redes sociales y copyright",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

interface AdminPanelProps {
  userId: string;
  headerSettings: HeaderSettings;
  footerSettings: FooterSettings;
  carouselSettings: CarouselSettings;
  videoSettings: VideoSettings;
  gallerySettings: GallerySettings;
  multicolumnSettings: MulticolumnSettings;
}

export function AdminPanel({ userId, headerSettings, footerSettings, carouselSettings, videoSettings, gallerySettings, multicolumnSettings }: AdminPanelProps) {
  const [activeSection, setActiveSection] = React.useState<SectionKey>("header");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSectionChange = (key: SectionKey) => {
    setActiveSection(key);
    setSidebarOpen(false);
  };

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
          {SECTIONS.find((s) => s.key === activeSection)?.label}
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

          <nav className="flex flex-col gap-1 p-3">
            <Text size="sm" variant="muted" className="px-3 py-2 font-medium uppercase tracking-wider">
              Secciones
            </Text>
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => handleSectionChange(section.key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  activeSection === section.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {section.icon}
                <div className="flex flex-col">
                  <span>{section.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {section.description}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Section title (desktop only) */}
            <div className="mb-8 hidden lg:block">
              <Heading as="h1" className="text-2xl">
                {SECTIONS.find((s) => s.key === activeSection)?.label}
              </Heading>
              <Text size="sm" variant="muted" className="mt-1">
                {SECTIONS.find((s) => s.key === activeSection)?.description}
              </Text>
            </div>

            {activeSection === "header" && (
              <HeaderSettingsForm userId={userId} initialSettings={headerSettings} />
            )}
            {activeSection === "carousel" && (
              <CarouselSettingsForm userId={userId} initialSettings={carouselSettings} />
            )}
            {activeSection === "video" && (
              <VideoSettingsForm initialSettings={videoSettings} />
            )}
            {activeSection === "gallery" && (
              <GallerySettingsForm userId={userId} initialSettings={gallerySettings} />
            )}
            {activeSection === "multicolumn" && (
              <MulticolumnSettingsForm userId={userId} initialSettings={multicolumnSettings} />
            )}
            {activeSection === "footer" && (
              <FooterSettingsForm initialSettings={footerSettings} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
