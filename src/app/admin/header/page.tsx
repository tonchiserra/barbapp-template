import { requireScope } from "@/lib/auth";
import { getHeaderSettings } from "@/lib/queries/site-settings";
import { HeaderSettingsForm } from "../sections/header-settings";

export default async function HeaderPage() {
  const session = await requireScope('landing:header');

  const headerSettings = await getHeaderSettings();

  return <HeaderSettingsForm userId={session.userId} initialSettings={headerSettings} />;
}
