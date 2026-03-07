import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/types";

export async function getServicesForStaff(staffId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("staff_id", staffId)
    .eq("is_active", true)
    .order("sort_order");

  return (data as Service[]) ?? [];
}

export async function getAllServicesForStaff(staffId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("staff_id", staffId)
    .order("sort_order");

  return (data as Service[]) ?? [];
}
