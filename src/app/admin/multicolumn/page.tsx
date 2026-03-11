import { requireScope } from "@/lib/auth";
import { getMulticolumnSettings } from "@/lib/queries/site-settings";
import { MulticolumnSettingsForm } from "../sections/multicolumn-settings";

export default async function MulticolumnPage() {
  const session = await requireScope('landing:multicolumn');

  const multicolumnSettings = await getMulticolumnSettings();

  return <MulticolumnSettingsForm userId={session.userId} initialSettings={multicolumnSettings} />;
}
