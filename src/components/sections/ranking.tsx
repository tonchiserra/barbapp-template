import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui";
import { getRankingSettings } from "@/lib/queries/site-settings";
import { getPublicRanking } from "@/lib/queries/ranking";

interface RankingProps {
  className?: string;
}

export async function Ranking({ className }: RankingProps) {
  const settings = await getRankingSettings();
  if (!settings.is_visible) return null;

  const entries = await getPublicRanking(100);
  if (entries.length === 0) return null;

  const maxPoints = entries[0].client_points;

  return (
    <section id="Ranking" className={cn("w-full py-16", className)}>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}

        {settings.description && (
          <Text variant="muted" size="lg" className="max-w-2xl text-center">
            {settings.description}
          </Text>
        )}

        <div className="mt-6 flex w-full flex-col gap-2">
          {entries.map((entry, index) => {
            const percent = maxPoints > 0 ? (entry.client_points / maxPoints) * 100 : 0;

            return (
              <div key={index} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-right text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{entry.client_name}</span>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {entry.client_points} pts
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
