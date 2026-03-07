import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types";

export async function getBranches(userId: string): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  return (data as Branch[]) ?? [];
}

export async function getActiveBranches(userId: string): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");

  return (data as Branch[]) ?? [];
}
