import { requireScope } from "@/lib/auth";
import { getEmailSettings } from "@/lib/queries/site-settings";
import { EmailSettingsForm } from "../sections/email-settings";

export default async function EmailPage() {
  const session = await requireScope('turnero:email');

  const emailSettings = await getEmailSettings();

  return <EmailSettingsForm initialSettings={emailSettings} />;
}
