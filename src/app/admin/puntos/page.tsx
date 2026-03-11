import { requireScope } from "@/lib/auth";
import { getRewards } from "@/lib/queries/rewards";
import { RewardsSettings } from "../sections/rewards-settings";

export default async function PuntosPage() {
  await requireScope("turnero:puntos");

  const rewards = await getRewards();

  return <RewardsSettings rewards={rewards} />;
}
