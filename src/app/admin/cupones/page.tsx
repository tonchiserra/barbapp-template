import { requireScope } from "@/lib/auth";
import { getDiscountCodes } from "@/lib/queries/discount-codes";
import { DiscountCodesSettings } from "../sections/discount-codes-settings";

export default async function CuponesPage() {
  const session = await requireScope('turnero:cupones');

  const discountCodes = await getDiscountCodes();

  return <DiscountCodesSettings discountCodes={discountCodes} />;
}
