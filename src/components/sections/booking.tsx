import { getSiteSettings } from "@/lib/queries/site-settings";
import { getActiveStaff } from "@/lib/queries/staff";
import { getActiveBranches } from "@/lib/queries/branches";
import { DEFAULT_BOOKING_SETTINGS } from "@/types";
import { BookingWidget } from "./booking-widget";

export async function Booking() {
  const siteSettings = await getSiteSettings();
  const bookingSettings = siteSettings?.booking ?? DEFAULT_BOOKING_SETTINGS;

  if (!bookingSettings.is_visible) return null;

  const [staff, branches] = await Promise.all([
    getActiveStaff(),
    getActiveBranches(),
  ]);

  if (staff.length === 0) return null;

  return (
    <BookingWidget
      settings={bookingSettings}
      staff={staff}
      branches={branches}
    />
  );
}
