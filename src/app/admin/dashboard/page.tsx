import { requireScope } from "@/lib/auth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { getAppointmentsForRangeWithDetails, getAppointmentsForRange } from "@/lib/queries/appointments";
import { getActiveStaff, getStaffForBranch } from "@/lib/queries/staff";
import { getBranches } from "@/lib/queries/branches";
import { BookingDashboard } from "../sections/booking-dashboard";
import type { Appointment, AppointmentWithDetails, StaffMember } from "@/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await requireScope("turnero:dashboard");

  const params = await searchParams;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // 7-day agenda range
  const weekAheadStr = format(addDays(today, 6), "yyyy-MM-dd");

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

  // Historical month
  const historicalMonthStr = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : null;

  // Fetch all in parallel
  const fetches: Promise<unknown>[] = [
    getAppointmentsForRangeWithDetails(todayStr, weekAheadStr),
    getAppointmentsForRange(weekStart, weekEnd),
    getAppointmentsForRange(monthStart, monthEnd),
    getAppointmentsForRange(prevWeekStart, prevWeekEnd),
    getAppointmentsForRange(prevMonthStart, prevMonthEnd),
    getActiveStaff(),
    getBranches(),
  ];

  if (historicalMonthStr) {
    const [hYear, hMonth] = historicalMonthStr.split("-").map(Number);
    const hDate = new Date(hYear, hMonth - 1, 1);
    const hStart = format(startOfMonth(hDate), "yyyy-MM-dd");
    const hEnd = format(endOfMonth(hDate), "yyyy-MM-dd");
    fetches.push(getAppointmentsForRange(hStart, hEnd));
  }

  const results = await Promise.all(fetches);

  let upcomingAppointments = results[0] as AppointmentWithDetails[];
  let weekAppointments = results[1] as Appointment[];
  let monthAppointments = results[2] as Appointment[];
  let prevWeekAppointments = results[3] as Appointment[];
  let prevMonthAppointments = results[4] as Appointment[];
  let staff = results[5] as StaffMember[];
  const branches = results[6] as import("@/types").Branch[];

  let historicalAppointments = historicalMonthStr
    ? (results[results.length - 1] as Appointment[])
    : null;

  // Role-based filtering
  if (session.role === "employee") {
    const myId = session.staffId;
    upcomingAppointments = upcomingAppointments.filter((a) => a.staff_id === myId);
    weekAppointments = weekAppointments.filter((a) => a.staff_id === myId);
    monthAppointments = monthAppointments.filter((a) => a.staff_id === myId);
    prevWeekAppointments = prevWeekAppointments.filter((a) => a.staff_id === myId);
    prevMonthAppointments = prevMonthAppointments.filter((a) => a.staff_id === myId);
    if (historicalAppointments) historicalAppointments = historicalAppointments.filter((a) => a.staff_id === myId);
    staff = staff.filter((s) => s.id === myId);
  } else if (session.role === "manager" && session.branchId) {
    const branchStaff = await getStaffForBranch(session.branchId);
    const branchStaffIds = new Set(branchStaff.map((s) => s.id));
    upcomingAppointments = upcomingAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    weekAppointments = weekAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    monthAppointments = monthAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    prevWeekAppointments = prevWeekAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    prevMonthAppointments = prevMonthAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    if (historicalAppointments) historicalAppointments = historicalAppointments.filter((a) => branchStaffIds.has(a.staff_id));
    staff = staff.filter((s) => branchStaffIds.has(s.id));
  }

  let historicalLabel: string | null = null;
  if (historicalMonthStr) {
    const [lYear, lMonth] = historicalMonthStr.split("-").map(Number);
    historicalLabel = format(new Date(lYear, lMonth - 1, 1), "MMMM yyyy", { locale: es });
  }

  return (
    <BookingDashboard
      upcomingAppointments={upcomingAppointments}
      weekAppointments={weekAppointments}
      monthAppointments={monthAppointments}
      prevWeekAppointments={prevWeekAppointments}
      prevMonthAppointments={prevMonthAppointments}
      historicalAppointments={historicalAppointments}
      staff={staff}
      branches={branches}
      showBranchFilter={session.role === "owner" || session.role === "admin"}
      todayStr={todayStr}
      historicalMonth={historicalMonthStr}
      historicalLabel={historicalLabel}
    />
  );
}
