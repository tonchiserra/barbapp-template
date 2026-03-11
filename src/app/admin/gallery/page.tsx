import { requireScope } from "@/lib/auth";
import { getGallerySettings } from "@/lib/queries/site-settings";
import { GallerySettingsForm } from "../sections/gallery-settings";

export default async function GalleryPage() {
  const session = await requireScope('landing:gallery');

  const gallerySettings = await getGallerySettings();

  return <GallerySettingsForm userId={session.userId} initialSettings={gallerySettings} />;
}
