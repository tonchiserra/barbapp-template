"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendCompletionEmail } from "@/lib/email";
import { getEmailSettings } from "@/lib/queries/site-settings";
import type { AppointmentStatus } from "@/types";
import { DEFAULT_SCHEDULE } from "@/types";

export interface ActionState {
  error?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function createService(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const price = parseFloat((formData.get("price") as string) || "0") || 0;
  const durationMinutes = parseInt((formData.get("duration_minutes") as string) || "30", 10) || 30;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (durationMinutes < 5) return { error: "La duracion minima es 5 minutos" };

  const { error } = await supabase.from("services").insert({
    user_id: user.id,
    name,
    description,
    price,
    duration_minutes: durationMinutes,
    is_active: isActive,
  });

  if (error) {
    console.error("createService error:", error);
    return { error: "Error al crear el servicio" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateService(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de servicio faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const price = parseFloat((formData.get("price") as string) || "0") || 0;
  const durationMinutes = parseInt((formData.get("duration_minutes") as string) || "30", 10) || 30;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (durationMinutes < 5) return { error: "La duracion minima es 5 minutos" };

  const { error } = await supabase
    .from("services")
    .update({ name, description, price, duration_minutes: durationMinutes, is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateService error:", error);
    return { error: "Error al actualizar el servicio" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("user_id", user.id);

  if (error) {
    console.error("deleteService error:", error);
    return { error: "Error al eliminar el servicio" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export async function createStaff(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const name = ((formData.get("name") as string) || "").trim();
  const avatarUrl = ((formData.get("avatar_url") as string) || "").trim();
  const isOwner = formData.get("is_owner") === "on";
  const isActive = formData.get("is_active") !== "off";

  if (!name) return { error: "El nombre es obligatorio" };

  const { data: staffRow, error } = await supabase
    .from("staff")
    .insert({ user_id: user.id, name, avatar_url: avatarUrl, is_owner: isOwner, is_active: isActive })
    .select("id")
    .single();

  if (error || !staffRow) {
    console.error("createStaff error:", error);
    return { error: "Error al crear el empleado" };
  }

  // Insert default schedule (7 days)
  const scheduleRows = DEFAULT_SCHEDULE.map((s) => ({
    staff_id: staffRow.id,
    ...s,
  }));

  const { error: schedError } = await supabase.from("staff_schedules").insert(scheduleRows);
  if (schedError) {
    console.error("createStaff schedule error:", schedError);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateStaff(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de empleado faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const avatarUrl = ((formData.get("avatar_url") as string) || "").trim();
  const isOwner = formData.get("is_owner") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };

  const { error } = await supabase
    .from("staff")
    .update({ name, avatar_url: avatarUrl, is_owner: isOwner, is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateStaff error:", error);
    return { error: "Error al actualizar el empleado" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStaff(staffId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("user_id", user.id);

  if (error) {
    console.error("deleteStaff error:", error);
    return { error: "Error al eliminar el empleado" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff Services
// ---------------------------------------------------------------------------

export async function updateStaffServices(
  staffId: string,
  serviceIds: string[],
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify staff belongs to user
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("user_id", user.id)
    .single();

  if (!staff) return { error: "Empleado no encontrado" };

  // Delete existing assignments
  await supabase.from("staff_services").delete().eq("staff_id", staffId);

  // Insert new assignments
  if (serviceIds.length > 0) {
    const rows = serviceIds.map((serviceId) => ({
      staff_id: staffId,
      service_id: serviceId,
    }));

    const { error } = await supabase.from("staff_services").insert(rows);
    if (error) {
      console.error("updateStaffServices error:", error);
      return { error: "Error al actualizar los servicios del empleado" };
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff Schedule
// ---------------------------------------------------------------------------

export async function updateStaffSchedule(
  staffId: string,
  schedules: { day_of_week: number; start_time: string; end_time: string; is_working: boolean }[],
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify staff belongs to user
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("user_id", user.id)
    .single();

  if (!staff) return { error: "Empleado no encontrado" };

  const rows = schedules.map((s) => ({
    staff_id: staffId,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    is_working: s.is_working,
  }));

  const { error } = await supabase
    .from("staff_schedules")
    .upsert(rows, { onConflict: "staff_id,day_of_week" });

  if (error) {
    console.error("updateStaffSchedule error:", error);
    return { error: "Error al actualizar los horarios" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff Time Off
// ---------------------------------------------------------------------------

export async function addStaffTimeOff(
  staffId: string,
  date: string,
  reason: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("staff_time_off").insert({
    staff_id: staffId,
    date,
    reason,
  });

  if (error) {
    console.error("addStaffTimeOff error:", error);
    return { error: "Error al agregar el dia libre" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeStaffTimeOff(timeOffId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("staff_time_off").delete().eq("id", timeOffId);

  if (error) {
    console.error("removeStaffTimeOff error:", error);
    return { error: "Error al eliminar el dia libre" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff Blocked Times
// ---------------------------------------------------------------------------

export async function addStaffBlockedTime(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  if (startTime >= endTime) return { error: "La hora de inicio debe ser menor a la de fin" };

  const { error } = await supabase.from("staff_blocked_times").insert({
    staff_id: staffId,
    date,
    start_time: startTime,
    end_time: endTime,
    reason,
  });

  if (error) {
    console.error("addStaffBlockedTime error:", error);
    return { error: "Error al agregar el bloqueo" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeStaffBlockedTime(blockedTimeId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("staff_blocked_times").delete().eq("id", blockedTimeId);

  if (error) {
    console.error("removeStaffBlockedTime error:", error);
    return { error: "Error al eliminar el bloqueo" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Booking Settings
// ---------------------------------------------------------------------------

export async function saveBookingSettings(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const advanceDays = parseInt((formData.get("advance_days") as string) || "30", 10) || 30;
  const minAdvanceHours = parseInt((formData.get("min_advance_hours") as string) || "2", 10) || 2;
  const isVisible = formData.get("is_visible") === "on";

  const booking = { title, description, advance_days: advanceDays, min_advance_hours: minAdvanceHours, is_visible: isVisible };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, booking }, { onConflict: "user_id" });

  if (error) {
    console.error("saveBookingSettings error:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const validStatuses: AppointmentStatus[] = ["confirmed", "completed", "cancelled", "no_show"];
  if (!validStatuses.includes(status)) return { error: "Estado invalido" };

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateAppointmentStatus error:", error);
    return { error: "Error al actualizar el turno" };
  }

  // Send completion email (fire-and-forget)
  if (status === "completed") {
    const { data: apt } = await supabase
      .from("appointments")
      .select("client_email, client_name, date, start_time, service_id, staff_id")
      .eq("id", appointmentId)
      .single();

    if (apt?.client_email) {
      const [{ data: svc }, { data: staff }, emailSettings] = await Promise.all([
        supabase.from("services").select("name").eq("id", apt.service_id).single(),
        supabase.from("staff").select("name").eq("id", apt.staff_id).single(),
        getEmailSettings(user.id),
      ]);

      sendCompletionEmail({
        to: apt.client_email,
        clientName: apt.client_name,
        serviceName: svc?.name ?? "Servicio",
        staffName: staff?.name ?? "",
        date: apt.date,
        startTime: apt.start_time,
        emailSettings,
      }).catch((err) => console.error("Completion email error:", err));
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Public Booking Actions (no auth required)
// ---------------------------------------------------------------------------

export async function getStaffForServiceAction(
  serviceId: string,
): Promise<{ id: string; name: string; avatar_url: string }[]> {
  const { getStaffForService } = await import("@/lib/queries/staff");
  const staff = await getStaffForService(serviceId);
  return staff.map((s) => ({ id: s.id, name: s.name, avatar_url: s.avatar_url }));
}

export async function getAvailableSlotsAction(
  staffId: string,
  serviceId: string,
  date: string,
): Promise<{ slot_time: string }[]> {
  const { getAvailableSlots } = await import("@/lib/queries/appointments");
  return getAvailableSlots(staffId, serviceId, date);
}

export async function getStaffScheduleAction(
  staffId: string,
): Promise<{ day_of_week: number; is_working: boolean }[]> {
  const { getStaffSchedule } = await import("@/lib/queries/staff");
  const schedules = await getStaffSchedule(staffId);
  return schedules.map((s) => ({ day_of_week: s.day_of_week, is_working: s.is_working }));
}

export async function getStaffTimeOffDatesAction(
  staffId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("staff_time_off")
    .select("date")
    .eq("staff_id", staffId)
    .gte("date", today);

  return (data ?? []).map((row: { date: string }) => row.date);
}

export async function createAppointment(
  formData: FormData,
): Promise<ActionState & { appointmentId?: string }> {
  const supabase = await createClient();

  const staffId = formData.get("staff_id") as string;
  const serviceId = formData.get("service_id") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const clientName = ((formData.get("client_name") as string) || "").trim();
  const clientPhone = ((formData.get("client_phone") as string) || "").trim();
  const clientEmail = ((formData.get("client_email") as string) || "").trim();

  if (!staffId || !serviceId || !date || !startTime || !clientName || !clientPhone) {
    return { error: "Faltan datos obligatorios" };
  }

  // Get staff to derive user_id (never trust client)
  const { data: staffRow } = await supabase
    .from("staff")
    .select("user_id")
    .eq("id", staffId)
    .single();

  if (!staffRow) return { error: "Empleado no encontrado" };

  // Get service for duration and price (respect staff override)
  const { data: serviceRow } = await supabase
    .from("services")
    .select("price, duration_minutes")
    .eq("id", serviceId)
    .single();

  if (!serviceRow) return { error: "Servicio no encontrado" };

  const { data: overrideRow } = await supabase
    .from("staff_services")
    .select("price_override, duration_override")
    .eq("staff_id", staffId)
    .eq("service_id", serviceId)
    .maybeSingle();

  const price = overrideRow?.price_override ?? serviceRow.price;
  const duration = overrideRow?.duration_override ?? serviceRow.duration_minutes;

  // Calculate end_time
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}:00`;

  // Double-check slot is still available
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("staff_id", staffId)
    .eq("date", date)
    .in("status", ["confirmed", "completed"])
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    return { error: "Este horario ya no esta disponible. Por favor elegí otro." };
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      user_id: staffRow.user_id,
      staff_id: staffId,
      service_id: serviceId,
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail,
      date,
      start_time: startTime,
      end_time: endTime,
      price,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error || !appointment) {
    console.error("createAppointment error:", error);
    return { error: "Error al crear el turno. Intenta de nuevo." };
  }

  // Upsert client record (fire-and-forget, don't block the response)
  const dayOfWeek = new Date(date + "T00:00:00").getDay();
  supabase.rpc("upsert_client", {
    p_user_id: staffRow.user_id,
    p_name: clientName,
    p_phone: clientPhone,
    p_email: clientEmail,
    p_day_of_week: dayOfWeek,
  }).then(({ error: clientError }) => {
    if (clientError) console.error("upsert_client error:", clientError);
  });

  return { success: true, appointmentId: appointment.id };
}

// ---------------------------------------------------------------------------
// Clients (paginated)
// ---------------------------------------------------------------------------

export async function getClientsAction(
  page: number = 1,
  pageSize: number = 20,
): Promise<{ clients: import("@/types").Client[]; total: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { clients: [], total: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("total_appointments", { ascending: false })
    .range(from, to);

  return {
    clients: (data as import("@/types").Client[]) ?? [],
    total: count ?? 0,
  };
}

export async function getAllClientsAction(): Promise<import("@/types").Client[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("total_appointments", { ascending: false });

  return (data as import("@/types").Client[]) ?? [];
}
