import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types";

export async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .order("sort_order");

  return (data as Branch[]) ?? [];
}

export async function getActiveBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data as Branch[]) ?? [];
}
