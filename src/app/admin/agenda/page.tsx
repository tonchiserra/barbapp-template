import { requireScope } from "@/lib/auth";
import { format, addDays } from "date-fns";
import { getAppointmentsForRangeWithDetails } from "@/lib/queries/appointments";
import { getActiveStaff, getStaffForBranch } from "@/lib/queries/staff";
import { getBranches } from "@/lib/queries/branches";
import { AgendaView } from "../sections/agenda-view";
import type { AppointmentWithDetails, StaffMember } from "@/types";

export default async function AgendaPage() {
  const session = await requireScope("turnero:agenda");

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekAheadStr = format(addDays(today, 6), "yyyy-MM-dd");

  const [upcomingRaw, staffRaw, branches] = await Promise.all([
    getAppointmentsForRangeWithDetails(todayStr, weekAheadStr),
    getActiveStaff(),
    getBranches(),
  ]);

  let appointments: AppointmentWithDetails[] = upcomingRaw;
  let staff: StaffMember[] = staffRaw;

  // Role-based filtering
  if (session.role === "employee") {
    const myId = session.staffId;
    appointments = appointments.filter((a) => a.staff_id === myId);
    staff = staff.filter((s) => s.id === myId);
  } else if (session.role === "manager" && session.branchId) {
    const branchStaff = await getStaffForBranch(session.branchId);
    const branchStaffIds = new Set(branchStaff.map((s) => s.id));
    appointments = appointments.filter((a) => branchStaffIds.has(a.staff_id));
    staff = staff.filter((s) => branchStaffIds.has(s.id));
  }

  return (
    <AgendaView
      appointments={appointments}
      staff={staff}
      branches={branches}
      showBranchFilter={session.role === "owner" || session.role === "admin"}
      todayStr={todayStr}
    />
  );
}
