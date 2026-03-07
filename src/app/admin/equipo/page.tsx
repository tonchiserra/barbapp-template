import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaff, getAllStaffSchedules, getAllStaffTimeOff, getAllStaffBlockedTimes } from "@/lib/queries/staff";
import { StaffSettings } from "../sections/staff-settings";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [staff, staffSchedules, staffTimeOff, staffBlockedTimes] = await Promise.all([
    getStaff(user.id),
    getAllStaffSchedules(user.id),
    getAllStaffTimeOff(user.id),
    getAllStaffBlockedTimes(user.id),
  ]);

  return (
    <StaffSettings
      staff={staff}
      staffSchedules={staffSchedules}
      staffTimeOff={staffTimeOff}
      staffBlockedTimes={staffBlockedTimes}
    />
  );
}
