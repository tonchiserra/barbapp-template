import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

export async function getClients(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{ clients: Client[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("total_appointments", { ascending: false })
    .range(from, to);

  return {
    clients: (data as Client[]) ?? [],
    total: count ?? 0,
  };
}
