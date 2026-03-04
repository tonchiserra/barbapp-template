import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui";
import type { MapSettings, MapLocation } from "@/types";

interface MapProps {
  settings: MapSettings;
  className?: string;
}

export function Map({ settings, className }: MapProps) {
  if (!settings.is_visible || settings.locations.length === 0) return null;

  return (
    <section id="Mapa" className={cn("w-full py-16", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}

        {settings.description && (
          <Text variant="muted" className="max-w-2xl text-center">
            {settings.description}
          </Text>
        )}

        <div
          className={cn(
            "grid w-full gap-6",
            settings.locations.length > 1 && "sm:grid-cols-2",
          )}
        >
          {settings.locations.map((location, index) => (
            <LocationCard key={index} location={location} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationCard({ location }: { location: MapLocation }) {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl">
        <iframe
          src={mapSrc}
          className="aspect-video w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          title={location.name || location.address}
        />
      </div>
      {(location.name || location.address) && (
        <div className="flex flex-col gap-0.5 px-1">
          {location.name && (
            <Heading as="h3" className="text-base">
              {location.name}
            </Heading>
          )}
          {location.address && (
            <Text size="sm" variant="muted">
              {location.address}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
