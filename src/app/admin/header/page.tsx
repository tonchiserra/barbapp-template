import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHeaderSettings } from "@/lib/queries/site-settings";
import { HeaderSettingsForm } from "../sections/header-settings";

export default async function HeaderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const headerSettings = await getHeaderSettings(user.id);

  return <HeaderSettingsForm userId={user.id} initialSettings={headerSettings} />;
}
