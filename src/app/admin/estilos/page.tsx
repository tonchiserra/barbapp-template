import { requireScope } from "@/lib/auth";
import { getThemeSettings } from "@/lib/queries/site-settings";
import { ThemeSettingsForm } from "../sections/theme-settings";

export default async function EstilosPage() {
  const session = await requireScope('landing:estilos');

  const themeSettings = await getThemeSettings();

  return <ThemeSettingsForm initialSettings={themeSettings} />;
}
