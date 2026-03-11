import { createClient } from "@/lib/supabase/server";
import type { Reward } from "@/types";

export async function getRewards(): Promise<Reward[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []) as Reward[];
}

export async function getActiveRewards(): Promise<Reward[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []) as Reward[];
}
