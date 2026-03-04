import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMulticolumnSettings } from "@/lib/queries/site-settings";
import { MulticolumnSettingsForm } from "../sections/multicolumn-settings";

export default async function MulticolumnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const multicolumnSettings = await getMulticolumnSettings(user.id);

  return <MulticolumnSettingsForm userId={user.id} initialSettings={multicolumnSettings} />;
}
