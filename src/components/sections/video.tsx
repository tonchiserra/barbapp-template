import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { Heading, Text, LinkButton } from "@/components/ui";
import type { VideoSettings } from "@/types";

interface VideoProps {
  settings: VideoSettings;
  className?: string;
}

export function Video({ settings, className }: VideoProps) {
  const embedUrl = getYouTubeEmbedUrl(settings.youtube_url);

  if (!settings.is_visible || !embedUrl) return null;

  return (
    <section className={cn("w-full py-16", className)}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}

        <div className="relative w-full overflow-hidden rounded-2xl">
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={settings.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>

        {settings.description && (
          <Text variant="muted" size="lg" className="max-w-2xl text-center">
            {settings.description}
          </Text>
        )}

        {settings.cta_label && settings.cta_url && (
          <LinkButton href={settings.cta_url} variant={settings.cta_variant} size="lg">
            {settings.cta_label}
          </LinkButton>
        )}
      </div>
    </section>
  );
}
