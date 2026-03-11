import { requireScope } from "@/lib/auth";
import { getCarouselSettings } from "@/lib/queries/site-settings";
import { CarouselSettingsForm } from "../sections/carousel-settings";

export default async function CarouselPage() {
  const session = await requireScope('landing:carousel');

  const carouselSettings = await getCarouselSettings();

  return <CarouselSettingsForm userId={session.userId} initialSettings={carouselSettings} />;
}
