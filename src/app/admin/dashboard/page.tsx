import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { getAppointmentsForRangeWithDetails, getAppointmentsForRange } from "@/lib/queries/appointments";
import { getActiveStaff } from "@/lib/queries/staff";
import { BookingDashboard } from "../sections/booking-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
    getAppointmentsForRangeWithDetails(user.id, todayStr, weekAheadStr),
    getAppointmentsForRange(user.id, weekStart, weekEnd),
    getAppointmentsForRange(user.id, monthStart, monthEnd),
    getAppointmentsForRange(user.id, prevWeekStart, prevWeekEnd),
    getAppointmentsForRange(user.id, prevMonthStart, prevMonthEnd),
    getActiveStaff(user.id),
  ];

  if (historicalMonthStr) {
    const [hYear, hMonth] = historicalMonthStr.split("-").map(Number);
    const hDate = new Date(hYear, hMonth - 1, 1); // local date, no UTC shift
    const hStart = format(startOfMonth(hDate), "yyyy-MM-dd");
    const hEnd = format(endOfMonth(hDate), "yyyy-MM-dd");
    fetches.push(getAppointmentsForRange(user.id, hStart, hEnd));
  }

  const results = await Promise.all(fetches);

  const upcomingAppointments = results[0] as Awaited<ReturnType<typeof getAppointmentsForRangeWithDetails>>;
  const weekAppointments = results[1] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const monthAppointments = results[2] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const prevWeekAppointments = results[3] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const prevMonthAppointments = results[4] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const staff = results[5] as Awaited<ReturnType<typeof getActiveStaff>>;

  const historicalAppointments = historicalMonthStr
    ? (results[results.length - 1] as Awaited<ReturnType<typeof getAppointmentsForRange>>)
    : null;

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
      todayStr={todayStr}
      historicalMonth={historicalMonthStr}
      historicalLabel={historicalLabel}
    />
  );
}
