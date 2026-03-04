import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCarouselSettings } from "@/lib/queries/site-settings";
import { CarouselSettingsForm } from "../sections/carousel-settings";

export default async function CarouselPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const carouselSettings = await getCarouselSettings(user.id);

  return <CarouselSettingsForm userId={user.id} initialSettings={carouselSettings} />;
}
