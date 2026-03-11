import { createClient } from "@/lib/supabase/server";
import type { DiscountCode } from "@/types";

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as DiscountCode[]) ?? [];
}
