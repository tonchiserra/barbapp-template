import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServices } from "@/lib/queries/services";
import { getStaff, getAllStaffServices, getAllStaffSchedules, getAllStaffTimeOff, getAllStaffBlockedTimes } from "@/lib/queries/staff";
import { StaffSettings } from "../sections/staff-settings";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [staff, services, staffServices, staffSchedules, staffTimeOff, staffBlockedTimes] = await Promise.all([
    getStaff(user.id),
    getServices(user.id),
    getAllStaffServices(user.id),
    getAllStaffSchedules(user.id),
    getAllStaffTimeOff(user.id),
    getAllStaffBlockedTimes(user.id),
  ]);

  return (
    <StaffSettings
      staff={staff}
      services={services}
      staffServices={staffServices}
      staffSchedules={staffSchedules}
      staffTimeOff={staffTimeOff}
      staffBlockedTimes={staffBlockedTimes}
    />
  );
}
