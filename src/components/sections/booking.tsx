import { getPublicSiteSettings } from "@/lib/queries/site-settings";
import { getActiveServices } from "@/lib/queries/services";
import { getActiveStaff } from "@/lib/queries/staff";
import { DEFAULT_BOOKING_SETTINGS } from "@/types";
import type { BookingSettings, Service, StaffMember } from "@/types";
import { BookingWidget } from "./booking-widget";

export async function Booking() {
  const siteSettings = await getPublicSiteSettings();
  const bookingSettings = siteSettings?.booking ?? DEFAULT_BOOKING_SETTINGS;

  if (!bookingSettings.is_visible) return null;

  const userId = siteSettings?.user_id;
  if (!userId) return null;

  const [services, staff] = await Promise.all([
    getActiveServices(userId),
    getActiveStaff(userId),
  ]);

  if (services.length === 0) return null;

  return (
    <BookingWidget
      settings={bookingSettings}
      services={services}
      staff={staff}
      userId={userId}
    />
  );
}
