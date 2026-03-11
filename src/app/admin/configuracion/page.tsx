import { requireScope } from "@/lib/auth";
import { getBookingSettings } from "@/lib/queries/site-settings";
import { BookingSettingsForm } from "../sections/booking-settings";

export default async function ConfiguracionPage() {
  const session = await requireScope('turnero:configuracion');

  const bookingSettings = await getBookingSettings();

  return <BookingSettingsForm initialSettings={bookingSettings} />;
}
