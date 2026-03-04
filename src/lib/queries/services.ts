import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/types";

export async function getServices(userId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  return (data as Service[]) ?? [];
}

export async function getActiveServices(userId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");

  return (data as Service[]) ?? [];
}
