import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmailSettings } from "@/lib/queries/site-settings";
import { EmailSettingsForm } from "../sections/email-settings";

export default async function EmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const emailSettings = await getEmailSettings(user.id);

  return <EmailSettingsForm initialSettings={emailSettings} />;
}
