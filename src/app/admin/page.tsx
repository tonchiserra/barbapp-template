import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHeaderSettings, getFooterSettings, getCarouselSettings, getVideoSettings, getGallerySettings, getMulticolumnSettings } from "@/lib/queries/site-settings";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [headerSettings, footerSettings, carouselSettings, videoSettings, gallerySettings, multicolumnSettings] = await Promise.all([
    getHeaderSettings(user.id),
    getFooterSettings(user.id),
    getCarouselSettings(user.id),
    getVideoSettings(user.id),
    getGallerySettings(user.id),
    getMulticolumnSettings(user.id),
  ]);

  return <AdminPanel userId={user.id} headerSettings={headerSettings} footerSettings={footerSettings} carouselSettings={carouselSettings} videoSettings={videoSettings} gallerySettings={gallerySettings} multicolumnSettings={multicolumnSettings} />;
}
