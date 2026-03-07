import { createClient } from "@/lib/supabase/server";
import type { DiscountCode } from "@/types";

export async function getDiscountCodes(userId: string): Promise<DiscountCode[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data as DiscountCode[]) ?? [];
}
