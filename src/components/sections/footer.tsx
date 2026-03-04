import { cn } from "@/lib/utils";
import { SOCIAL_ICONS } from "@/components/icons/social";
import type { FooterSettings, SocialPlatform } from "@/types";

interface FooterProps {
  settings: FooterSettings;
  className?: string;
}

export function Footer({ settings, className }: FooterProps) {
  if (!settings.is_visible) return null;

  const activeSocialLinks = Object.entries(settings.social_links).filter(
    ([, url]) => url !== null && url !== "",
  ) as [SocialPlatform, string][];

  const getSocialHref = (platform: string, value: string) =>
    platform === "email" ? `mailto:${value}` : value;

  const hasLinks = settings.menu_links.length > 0;
  const hasSocials = activeSocialLinks.length > 0;

  return (
    <footer
      id="Footer"
      className={cn("w-full border-t bg-background", className)}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content: mobile column, desktop row */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
          {/* Copyright — desktop: left, mobile: bottom (order-last) */}
          <p className="order-last text-center text-sm text-muted-foreground md:order-first md:text-left">
            &copy; 2026 Built with 🤍 by{" "}
            <a
              href="https://gserra.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              Gonzalo Serra
            </a>
            .
          </p>

          {/* Links + socials — desktop: right, mobile: top */}
          {(hasLinks || hasSocials) && (
            <div className="flex flex-col items-center gap-4 md:items-end">
              {/* Nav links */}
              {hasLinks && (
                <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:justify-end">
                  {settings.menu_links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              )}

              {/* Social icons */}
              {hasSocials && (
                <div className="flex flex-wrap gap-1">
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
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
