import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentWithDetails, AvailableSlot } from "@/types";

export async function getAppointmentsByDate(
  userId: string,
  date: string,
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, staff:staff_id(name), service:service_id(name, price_transfer)")
    .eq("user_id", userId)
    .eq("date", date)
    .order("start_time");

  if (!data) return [];

  return data.map((row) => {
    const svc = row.service as unknown as { name: string; price_transfer: number };
    return {
      ...row,
      staff_name: (row.staff as unknown as { name: string }).name,
      service_name: svc.name,
      service_price_transfer: svc.price_transfer,
    };
  }) as AppointmentWithDetails[];
}

export async function getAppointmentsForRangeWithDetails(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, staff:staff_id(name), service:service_id(name, price_transfer)")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("start_time");

  if (!data) return [];

  return data.map((row) => {
    const svc = row.service as unknown as { name: string; price_transfer: number };
    return {
      ...row,
      staff_name: (row.staff as unknown as { name: string }).name,
      service_name: svc.name,
      service_price_transfer: svc.price_transfer,
    };
  }) as AppointmentWithDetails[];
}

export async function getAppointmentsForRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  return (data as Appointment[]) ?? [];
}

export async function getNextAppointment(
  userId: string,
): Promise<AppointmentWithDetails | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("appointments")
    .select("*, staff:staff_id(name), service:service_id(name, price_transfer)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date")
    .order("start_time")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const svc = data.service as unknown as { name: string; price_transfer: number };
  return {
    ...data,
    staff_name: (data.staff as unknown as { name: string }).name,
    service_name: svc.name,
    service_price_transfer: svc.price_transfer,
  } as AppointmentWithDetails;
}

export async function getAvailableSlots(
  staffId: string,
  serviceId: string,
  date: string,
): Promise<AvailableSlot[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_available_slots", {
    p_staff_id: staffId,
    p_service_id: serviceId,
    p_date: date,
  });

  return (data as AvailableSlot[]) ?? [];
}
