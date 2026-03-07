import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDiscountCodes } from "@/lib/queries/discount-codes";
import { DiscountCodesSettings } from "../sections/discount-codes-settings";

export default async function CuponesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const discountCodes = await getDiscountCodes(user.id);

  return <DiscountCodesSettings discountCodes={discountCodes} />;
}
