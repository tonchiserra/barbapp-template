import { requireScope } from "@/lib/auth";
import { getFooterSettings } from "@/lib/queries/site-settings";
import { FooterSettingsForm } from "../sections/footer-settings";

export default async function FooterPage() {
  const session = await requireScope('landing:footer');

  const footerSettings = await getFooterSettings();

  return <FooterSettingsForm initialSettings={footerSettings} />;
}
