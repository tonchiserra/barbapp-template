import { createClient } from "@/lib/supabase/server";

export interface PublicRankingEntry {
  client_name: string;
  client_points: number;
}

export async function getPublicRanking(limit: number = 100): Promise<PublicRankingEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_ranking", { p_limit: limit });

  return (data ?? []) as PublicRankingEntry[];
}
