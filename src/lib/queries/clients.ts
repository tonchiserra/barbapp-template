import { createClient } from "@/lib/supabase/server";
import type { ClientWithDetails } from "@/types";

const CLIENT_SELECT = `*, top_service:top_service_id(name), top_staff:top_staff_id(name), top_branch:top_branch_id(name)`;

export async function getClients(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{ clients: ClientWithDetails[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("clients")
    .select(CLIENT_SELECT, { count: "exact" })
    .eq("user_id", userId)
    .order("total_appointments", { ascending: false })
    .range(from, to);

  return {
    clients: (data ?? []).map((row) => ({
      ...row,
      top_service_name: (row.top_service as { name: string } | null)?.name ?? null,
      top_staff_name: (row.top_staff as { name: string } | null)?.name ?? null,
      top_branch_name: (row.top_branch as { name: string } | null)?.name ?? null,
    })) as ClientWithDetails[],
    total: count ?? 0,
  };
}
