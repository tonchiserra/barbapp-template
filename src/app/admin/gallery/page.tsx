import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGallerySettings } from "@/lib/queries/site-settings";
import { GallerySettingsForm } from "../sections/gallery-settings";

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const gallerySettings = await getGallerySettings(user.id);

  return <GallerySettingsForm userId={user.id} initialSettings={gallerySettings} />;
}
