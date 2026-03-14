import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types";

export const getBranches = cache(async (): Promise<Branch[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .order("sort_order");

  return (data as Branch[]) ?? [];
});

export const getActiveBranches = cache(async (): Promise<Branch[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (data as Branch[]) ?? [];
});
