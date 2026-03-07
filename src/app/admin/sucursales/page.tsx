import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBranches } from "@/lib/queries/branches";
import { BranchesSettings } from "../sections/branches-settings";

export default async function SucursalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const branches = await getBranches(user.id);

  return <BranchesSettings branches={branches} />;
}
