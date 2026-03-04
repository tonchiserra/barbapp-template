import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMapSettings } from "@/lib/queries/site-settings";
import { MapSettingsForm } from "../sections/map-settings";

export default async function MapaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const mapSettings = await getMapSettings(user.id);

  return <MapSettingsForm initialSettings={mapSettings} />;
}
