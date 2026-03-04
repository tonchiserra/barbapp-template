import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getAppointmentsByDate, getAppointmentsForRange, getNextAppointment } from "@/lib/queries/appointments";
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
  const activeStatuses = ["confirmed", "completed"];

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
    getAppointmentsByDate(user.id, todayStr),
    getAppointmentsForRange(user.id, weekStart, weekEnd),
    getAppointmentsForRange(user.id, monthStart, monthEnd),
    getNextAppointment(user.id),
    getAppointmentsForRange(user.id, prevWeekStart, prevWeekEnd),
    getAppointmentsForRange(user.id, prevMonthStart, prevMonthEnd),
  ];

  if (historicalMonthStr) {
    const [hYear, hMonth] = historicalMonthStr.split("-").map(Number);
    const hDate = new Date(hYear, hMonth - 1, 1); // local date, no UTC shift
    const hStart = format(startOfMonth(hDate), "yyyy-MM-dd");
    const hEnd = format(endOfMonth(hDate), "yyyy-MM-dd");
    fetches.push(getAppointmentsForRange(user.id, hStart, hEnd));
  }

  const results = await Promise.all(fetches);

  const todayAppointments = results[0] as Awaited<ReturnType<typeof getAppointmentsByDate>>;
  const weekAppointments = results[1] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const monthAppointments = results[2] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const nextAppointment = results[3] as Awaited<ReturnType<typeof getNextAppointment>>;
  const prevWeekAppointments = results[4] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
  const prevMonthAppointments = results[5] as Awaited<ReturnType<typeof getAppointmentsForRange>>;

  // Current metrics
  const weekActive = weekAppointments.filter((a) => activeStatuses.includes(a.status));
  const weekCount = weekActive.length;
  const weekRevenue = weekActive.reduce((sum, a) => sum + Number(a.price), 0);

  const monthActive = monthAppointments.filter((a) => activeStatuses.includes(a.status));
  const monthCount = monthActive.length;
  const monthRevenue = monthActive.reduce((sum, a) => sum + Number(a.price), 0);

  // Previous metrics
  const prevWeekRevenue = prevWeekAppointments
    .filter((a) => activeStatuses.includes(a.status))
    .reduce((sum, a) => sum + Number(a.price), 0);
  const prevMonthRevenue = prevMonthAppointments
    .filter((a) => activeStatuses.includes(a.status))
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Historical metrics
  let historicalLabel: string | null = null;
  let historicalRevenue: number | null = null;
  let historicalCount: number | null = null;
  let historicalCompletedCount: number | null = null;

  if (historicalMonthStr) {
    const hAppointments = results[6] as Awaited<ReturnType<typeof getAppointmentsForRange>>;
    const hActive = hAppointments.filter((a) => activeStatuses.includes(a.status));
    historicalRevenue = hActive.reduce((sum, a) => sum + Number(a.price), 0);
    historicalCount = hActive.length;
    historicalCompletedCount = hAppointments.filter((a) => a.status === "completed").length;
    const [lYear, lMonth] = historicalMonthStr.split("-").map(Number);
    historicalLabel = format(new Date(lYear, lMonth - 1, 1), "MMMM yyyy", { locale: es });
  }

  return (
    <BookingDashboard
      todayAppointments={todayAppointments}
      nextAppointment={nextAppointment}
      weekCount={weekCount}
      monthCount={monthCount}
      monthRevenue={monthRevenue}
      weekRevenue={weekRevenue}
      prevWeekRevenue={prevWeekRevenue}
      prevMonthRevenue={prevMonthRevenue}
      historicalMonth={historicalMonthStr}
      historicalLabel={historicalLabel}
      historicalRevenue={historicalRevenue}
      historicalCount={historicalCount}
      historicalCompletedCount={historicalCompletedCount}
    />
  );
}
