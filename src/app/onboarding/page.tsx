import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBranches } from "@/lib/queries/branches";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If staff already exists, skip onboarding
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", user.id)
    .single();

  if (staff) redirect("/admin");

  const branches = await getActiveBranches();

  return <OnboardingForm branches={branches} />;
}
