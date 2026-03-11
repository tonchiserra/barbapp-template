import { requireScope } from "@/lib/auth";
import { getStaff, getStaffForBranch, getStaffMember, getAllStaffSchedules, getAllStaffTimeOff, getAllStaffBlockedTimes } from "@/lib/queries/staff";
import { getBranches } from "@/lib/queries/branches";
import { StaffSettings } from "../sections/staff-settings";
import type { StaffMember, Branch } from "@/types";

export default async function EquipoPage() {
  const session = await requireScope("turnero:equipo");

  let staff: StaffMember[];
  let branches: Branch[];

  if (session.role === "manager" && session.branchId) {
    [staff, branches] = await Promise.all([
      getStaffForBranch(session.branchId),
      getBranches(),
    ]);
  } else {
    [staff, branches] = await Promise.all([
      getStaff(),
      getBranches(),
    ]);
  }

  const staffIds = staff.map((s) => s.id);

  const [allSchedules, allTimeOff, allBlockedTimes] = await Promise.all([
    getAllStaffSchedules(),
    getAllStaffTimeOff(),
    getAllStaffBlockedTimes(),
  ]);

  // Filter schedules/timeoff/blocked to only visible staff
  const staffSchedules = allSchedules.filter((s) => staffIds.includes(s.staff_id));
  const staffTimeOff = allTimeOff.filter((s) => staffIds.includes(s.staff_id));
  const staffBlockedTimes = allBlockedTimes.filter((s) => staffIds.includes(s.staff_id));

  return (
    <StaffSettings
      staff={staff}
      staffSchedules={staffSchedules}
      staffTimeOff={staffTimeOff}
      staffBlockedTimes={staffBlockedTimes}
      branches={branches}
      session={session}
    />
  );
}
