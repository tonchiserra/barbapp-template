import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFooterSettings } from "@/lib/queries/site-settings";
import { FooterSettingsForm } from "../sections/footer-settings";

export default async function FooterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const footerSettings = await getFooterSettings(user.id);

  return <FooterSettingsForm initialSettings={footerSettings} />;
}
