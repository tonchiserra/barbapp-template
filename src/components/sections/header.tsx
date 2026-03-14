"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
  Link,
} from "@/components/ui";
import { SOCIAL_ICONS } from "@/components/icons/social";
import type { HeaderSettings, SocialPlatform } from "@/types";

interface HeaderProps {
  settings: HeaderSettings;
  className?: string;
}

export function Header({ settings, className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!settings.is_visible) return null;

  const activeSocialLinks = Object.entries(settings.social_links).filter(
    ([, url]) => url !== null && url !== "",
  ) as [SocialPlatform, string][];

  const getSocialHref = (platform: string, value: string) =>
    platform === "email" ? `mailto:${value}` : value;

  return (
    <header
      id="Header"
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex shrink-0 items-center">
          {settings.logo_type === "image" && settings.logo_image_url ? (
            <Image
              src={settings.logo_image_url}
              alt={settings.logo_text || "Logo"}
              width={120}
              height={40}
              className="h-12 w-auto object-contain"
              priority
            />
          ) : (
            <span className="text-xl font-bold tracking-tight text-foreground">
              {settings.logo_text || "Mi negocio"}
            </span>
          )}
        </div>

        {/* Desktop Nav */}
        {settings.menu_links.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {settings.menu_links.map((link, i) => (
              <Link
                key={i}
                href={link.url}
                variant={link.url === "#turnero" ? "default" : "muted"}
                className="px-3"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Desktop Social Icons */}
        <div className="hidden items-center gap-1 md:flex">
          {activeSocialLinks.map(([platform, url]) => {
            const Icon = SOCIAL_ICONS[platform];
            if (!Icon) return null;
            return (
              <a
                key={platform}
                href={getSocialHref(platform, url)}
                {...(platform !== "email" && { target: "_blank", rel: "noopener noreferrer" })}
                className="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
                aria-label={platform}
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>

        {/* Mobile Hamburger */}
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label="Abrir menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </DialogTrigger>

          <DialogContent
            hideClose
            className="fixed inset-y-0 right-0 left-auto top-0 z-50 flex h-full w-3/4 max-w-sm translate-x-0 translate-y-0 flex-col gap-6 rounded-none rounded-l-2xl border-l p-6 data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right"
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">
              Menu de navegacion
            </DialogTitle>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                {settings.logo_text || "Menu"}
              </span>
              <DialogClose className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6 18 18" />
                </svg>
                <span className="sr-only">Cerrar</span>
              </DialogClose>
            </div>

              {/* Mobile Nav Links */}
              {settings.menu_links.length > 0 && (
                <nav className="flex flex-col gap-1">
                  {settings.menu_links.map((link, i) => (
                    <Link
                      key={i}
                      href={link.url}
                      variant={link.url === "#Turnero" ? "default" : "muted"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              )}

              {/* Mobile Social Icons */}
              {activeSocialLinks.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-2 border-t pt-6">
                  {activeSocialLinks.map(([platform, url]) => {
                    const Icon = SOCIAL_ICONS[platform];
                    if (!Icon) return null;
                    return (
                      <a
                        key={platform}
                        href={getSocialHref(platform, url)}
                        {...(platform !== "email" && { target: "_blank", rel: "noopener noreferrer" })}
                        className="rounded-xl p-3 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
                        aria-label={platform}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              )}
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
