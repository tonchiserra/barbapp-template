import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heading, Text, LinkButton } from "@/components/ui";
import type { MulticolumnSettings, MulticolumnBlock } from "@/types";

interface MulticolumnProps {
  settings: MulticolumnSettings;
  className?: string;
}

export function Multicolumn({ settings, className }: MulticolumnProps) {
  if (!settings.is_visible || settings.blocks.length === 0) return null;

  return (
    <section id="Multicolumna" className={cn("w-full py-16", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}

        <div className="grid w-full grid-cols-2 gap-4">
          {settings.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>

        {settings.cta_label && settings.cta_url && (
          <LinkButton href={settings.cta_url} variant={settings.cta_variant} size="lg">
            {settings.cta_label}
          </LinkButton>
        )}
      </div>
    </section>
  );
}

function Block({ block }: { block: MulticolumnBlock }) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      {block.image_url && (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <Image
            src={block.image_url}
            alt={block.title || ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      )}
      {block.title && (
        <Heading as="h3" className="text-base">
          {block.title}
        </Heading>
      )}
      {block.subtitle && (
        <Text size="sm" variant="muted">
          {block.subtitle}
        </Text>
      )}
    </div>
  );

  if (block.link_url) {
    return (
      <a
        href={block.link_url}
        className="rounded-2xl transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return content;
}
