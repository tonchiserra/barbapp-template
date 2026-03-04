import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getThemeSettings } from "@/lib/queries/site-settings";
import { ThemeSettingsForm } from "../sections/theme-settings";

export default async function EstilosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const themeSettings = await getThemeSettings(user.id);

  return <ThemeSettingsForm initialSettings={themeSettings} />;
}
