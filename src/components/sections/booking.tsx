import { getPublicSiteSettings } from "@/lib/queries/site-settings";
import { getActiveStaff } from "@/lib/queries/staff";
import { DEFAULT_BOOKING_SETTINGS } from "@/types";
import type { BookingSettings, StaffMember } from "@/types";
import { BookingWidget } from "./booking-widget";

export async function Booking() {
  const siteSettings = await getPublicSiteSettings();
  const bookingSettings = siteSettings?.booking ?? DEFAULT_BOOKING_SETTINGS;

  if (!bookingSettings.is_visible) return null;

  const userId = siteSettings?.user_id;
  if (!userId) return null;

  const staff = await getActiveStaff(userId);

  if (staff.length === 0) return null;

  return (
    <BookingWidget
      settings={bookingSettings}
      staff={staff}
      userId={userId}
    />
  );
}
