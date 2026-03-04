import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heading, Text, LinkButton } from "@/components/ui";
import type { GallerySettings } from "@/types";

interface GalleryProps {
  settings: GallerySettings;
  className?: string;
}

export function Gallery({ settings, className }: GalleryProps) {
  if (!settings.is_visible || settings.images.length === 0) return null;

  return (
    <section id="Galeria" className={cn("w-full py-16", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settings.images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl"
            >
              <Image
                src={url}
                alt={settings.title ? `${settings.title} ${index + 1}` : `Imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))}
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
