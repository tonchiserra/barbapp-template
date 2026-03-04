import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { getBookingSettings } from "@/lib/queries/site-settings";
import { getAppointmentsByDate, getAppointmentsForRange, getNextAppointment } from "@/lib/queries/appointments";
import { BookingDashboard } from "../sections/booking-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const [bookingSettings, todayAppointments, weekAppointments, monthAppointments, nextAppointment] = await Promise.all([
    getBookingSettings(user.id),
    getAppointmentsByDate(user.id, todayStr),
    getAppointmentsForRange(user.id, weekStart, weekEnd),
    getAppointmentsForRange(user.id, monthStart, monthEnd),
    getNextAppointment(user.id),
  ]);

  const activeStatuses = ["confirmed", "completed"];
  const weekCount = weekAppointments.filter((a) => activeStatuses.includes(a.status)).length;
  const monthActive = monthAppointments.filter((a) => activeStatuses.includes(a.status));
  const monthCount = monthActive.length;
  const monthRevenue = monthActive.reduce((sum, a) => sum + Number(a.price), 0);

  return (
    <BookingDashboard
      bookingSettings={bookingSettings}
      todayAppointments={todayAppointments}
      nextAppointment={nextAppointment}
      weekCount={weekCount}
      monthCount={monthCount}
      monthRevenue={monthRevenue}
    />
  );
}
