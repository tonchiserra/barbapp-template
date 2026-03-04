import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookingSettings } from "@/lib/queries/site-settings";
import { BookingSettingsForm } from "../sections/booking-settings";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const bookingSettings = await getBookingSettings(user.id);

  return <BookingSettingsForm initialSettings={bookingSettings} />;
}
