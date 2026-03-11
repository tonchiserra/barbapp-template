import { requireScope } from "@/lib/auth";
import { getMapSettings } from "@/lib/queries/site-settings";
import { MapSettingsForm } from "../sections/map-settings";

export default async function MapaPage() {
  const session = await requireScope('landing:mapa');

  const mapSettings = await getMapSettings();

  return <MapSettingsForm initialSettings={mapSettings} />;
}
