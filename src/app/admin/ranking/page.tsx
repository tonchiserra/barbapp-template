import { requireScope } from "@/lib/auth";
import { getRankingSettings } from "@/lib/queries/site-settings";
import { RankingSettingsForm } from "../sections/ranking-settings";

export default async function RankingPage() {
  await requireScope("landing:ranking");

  const settings = await getRankingSettings();

  return <RankingSettingsForm settings={settings} />;
}
