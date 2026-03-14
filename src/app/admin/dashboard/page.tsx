import { requireScope } from "@/lib/auth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getAppointmentsForRange } from "@/lib/queries/appointments";
import { getActiveStaff, getStaffForBranch } from "@/lib/queries/staff";
import { getBranches } from "@/lib/queries/branches";
import { BookingDashboard } from "../sections/booking-dashboard";
import type { HistoricalAppointment, MonthLabel } from "../sections/booking-dashboard";
import type { Appointment, StaffMember } from "@/types";

export default async function DashboardPage() {
  const session = await requireScope("turnero:dashboard");

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Current week & month
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  // Previous week & month
  const prevWeekRef = subWeeks(today, 1);
  const prevWeekStart = format(startOfWeek(prevWeekRef, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const prevWeekEnd = format(endOfWeek(prevWeekRef, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const prevMonthRef = subMonths(today, 1);
  const prevMonthStart = format(startOfMonth(prevMonthRef), "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(prevMonthRef), "yyyy-MM-dd");

  // Build 12 historical month ranges
  const monthRanges = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(today, i);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");
    const key = format(date, "yyyy-MM");
    const label = format(date, "MMMM yyyy", { locale: es });
    return { start, end, key, label };
  });

  // Fetch all in parallel
  const [
    todayAppointments,
    weekAppointments,
    monthAppointments,
    prevWeekAppointments,
    prevMonthAppointments,
    staffRaw,
    branches,
    ...historicalResults
  ] = await Promise.all([
    getAppointmentsForRange(todayStr, todayStr),
    getAppointmentsForRange(weekStart, weekEnd),
    getAppointmentsForRange(monthStart, monthEnd),
    getAppointmentsForRange(prevWeekStart, prevWeekEnd),
    getAppointmentsForRange(prevMonthStart, prevMonthEnd),
    getActiveStaff(),
    getBranches(),
    ...monthRanges.map((r) => getAppointmentsForRange(r.start, r.end)),
  ]);

  let staff: StaffMember[] = staffRaw;

  // Role-based filtering helper
  let staffFilter: ((a: { staff_id: string }) => boolean) | null = null;

  if (session.role === "employee") {
    const myId = session.staffId;
    staffFilter = (a) => a.staff_id === myId;
    staff = staff.filter((s) => s.id === myId);
  } else if (session.role === "manager" && session.branchId) {
    const branchStaff = await getStaffForBranch(session.branchId);
    const branchStaffIds = new Set(branchStaff.map((s) => s.id));
    staffFilter = (a) => branchStaffIds.has(a.staff_id);
    staff = staff.filter((s) => branchStaffIds.has(s.id));
  }

  const applyFilter = <T extends { staff_id: string }>(arr: T[]): T[] =>
    staffFilter ? arr.filter(staffFilter) : arr;

  // Flatten historical appointments (slim shape for serialization)
  const historicalAppointments: HistoricalAppointment[] = historicalResults.flatMap(
    (result) => applyFilter(result as Appointment[]).map((a) => ({
      staff_id: a.staff_id,
      date: a.date,
      price: Number(a.price),
      status: a.status,
    })),
  );

  const monthLabelsArr: MonthLabel[] = monthRanges.map((r) => ({ key: r.key, label: r.label }));

  return (
    <BookingDashboard
      todayAppointments={applyFilter(todayAppointments)}
      weekAppointments={applyFilter(weekAppointments)}
      monthAppointments={applyFilter(monthAppointments)}
      prevWeekAppointments={applyFilter(prevWeekAppointments)}
      prevMonthAppointments={applyFilter(prevMonthAppointments)}
      historicalAppointments={historicalAppointments}
      monthLabels={monthLabelsArr}
      staff={staff}
      branches={branches}
      showBranchFilter={session.role === "owner" || session.role === "admin"}
      todayStr={todayStr}
    />
  );
}
