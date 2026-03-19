"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendCompletionEmail } from "@/lib/email";
import { getEmailSettings } from "@/lib/queries/site-settings";
import { getAuthSession, canAccessStaff } from "@/lib/auth";
import { getAllServicesForStaff, getServicesForStaff } from "@/lib/queries/services";
import { getAvailableSlots, getFullyBookedDates } from "@/lib/queries/appointments";
import { getStaffSchedule } from "@/lib/queries/staff";
import { getActiveBranches } from "@/lib/queries/branches";
import type { AppointmentStatus, PaymentMethod, ServiceSpecialPrice, Reward, PointRedemption, Product, ProductSaleWithDetails, Service, Branch } from "@/types";

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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const staffId = formData.get("staff_id") as string;
  if (!staffId) return { error: "Empleado faltante" };

  if (!(await canAccessStaff(session, staffId))) return { error: "Sin permisos" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const priceTransfer = parseFloat((formData.get("price_transfer") as string) || "0") || 0;
  const priceCash = parseFloat((formData.get("price_cash") as string) || "0") || 0;
  const durationMinutes = parseInt((formData.get("duration_minutes") as string) || "30", 10) || 30;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (durationMinutes < 5) return { error: "La duracion minima es 5 minutos" };

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    staff_id: staffId,
    name,
    description,
    price_transfer: priceTransfer,
    price_cash: priceCash,
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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de servicio faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const priceTransfer = parseFloat((formData.get("price_transfer") as string) || "0") || 0;
  const priceCash = parseFloat((formData.get("price_cash") as string) || "0") || 0;
  const durationMinutes = parseInt((formData.get("duration_minutes") as string) || "30", 10) || 30;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (durationMinutes < 5) return { error: "La duracion minima es 5 minutos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ name, description, price_transfer: priceTransfer, price_cash: priceCash, duration_minutes: durationMinutes, is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("updateService error:", error);
    return { error: "Error al actualizar el servicio" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    console.error("deleteService error:", error);
    return { error: "Error al eliminar el servicio" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff (no create/delete — managed directly in Supabase)
// ---------------------------------------------------------------------------

export async function updateStaff(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de empleado faltante" };

  if (!(await canAccessStaff(session, id))) return { error: "Sin permisos" };

  const name = ((formData.get("name") as string) || "").trim();
  const avatarUrl = ((formData.get("avatar_url") as string) || "").trim();
  const branchId = ((formData.get("branch_id") as string) || "").trim() || null;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };

  const supabase = await createClient();

  const commissionRaw = parseInt(formData.get("commission_percent") as string);
  const commissionPercent = Number.isNaN(commissionRaw) ? undefined : Math.min(100, Math.max(0, commissionRaw));

  // Agenda fields (all roles can set their own)
  const agendaStart = ((formData.get("agenda_start_date") as string) || "").trim() || null;
  const agendaEnd = ((formData.get("agenda_end_date") as string) || "").trim() || null;
  const minAdvanceRaw = parseInt(formData.get("min_advance_hours") as string);
  const minAdvanceHours = Number.isNaN(minAdvanceRaw) ? 2 : Math.min(72, Math.max(0, minAdvanceRaw));

  const agendaFields = {
    agenda_start_date: agendaStart,
    agenda_end_date: agendaEnd,
    min_advance_hours: minAdvanceHours,
  };

  // Employees can only update name, avatar, and agenda
  const updateData: Record<string, unknown> = session.role === "employee"
    ? { name, avatar_url: avatarUrl, ...agendaFields }
    : { name, avatar_url: avatarUrl, branch_id: branchId, is_active: isActive, ...(commissionPercent !== undefined && { commission_percent: commissionPercent }), ...agendaFields };

  const { error } = await supabase
    .from("staff")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("updateStaff error:", error);
    return { error: `Error: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Staff Earnings
// ---------------------------------------------------------------------------

export interface StaffEarningsPeriod {
  count: number;
  revenue: number;
}

export async function getStaffEarnings(
  staffId: string,
): Promise<{ today: StaffEarningsPeriod; week: StaffEarningsPeriod; month: StaffEarningsPeriod } | null> {
  const session = await getAuthSession();
  if (!session) return null;
  if (!(await canAccessStaff(session, staffId))) return null;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Month start
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Week start (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const weekStart = monday.toISOString().split("T")[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("date, price")
    .eq("staff_id", staffId)
    .eq("status", "completed")
    .gte("date", monthStart)
    .lte("date", todayStr);

  const rows = data ?? [];

  const aggregate = (filtered: typeof rows) => ({
    count: filtered.length,
    revenue: filtered.reduce((sum, r) => sum + Number(r.price), 0),
  });

  return {
    today: aggregate(rows.filter((r) => r.date === todayStr)),
    week: aggregate(rows.filter((r) => r.date >= weekStart)),
    month: aggregate(rows),
  };
}

// ---------------------------------------------------------------------------
// Staff Schedule
// ---------------------------------------------------------------------------

export async function updateStaffSchedule(
  staffId: string,
  schedules: { day_of_week: number; start_time: string; end_time: string; is_working: boolean }[],
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (!(await canAccessStaff(session, staffId))) return { error: "Sin permisos" };

  const supabase = await createClient();

  // Delete all existing schedules and re-insert (supports multiple ranges per day)
  const { error: delError } = await supabase
    .from("staff_schedules")
    .delete()
    .eq("staff_id", staffId);

  if (delError) {
    console.error("updateStaffSchedule delete error:", delError);
    return { error: "Error al actualizar los horarios" };
  }

  const rows = schedules.map((s) => ({
    staff_id: staffId,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    is_working: s.is_working,
  }));

  const { error } = await supabase
    .from("staff_schedules")
    .insert(rows);

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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (!(await canAccessStaff(session, staffId))) return { error: "Sin permisos" };

  const supabase = await createClient();
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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();
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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (!(await canAccessStaff(session, staffId))) return { error: "Sin permisos" };

  if (startTime >= endTime) return { error: "La hora de inicio debe ser menor a la de fin" };

  const supabase = await createClient();
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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();
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
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const isVisible = formData.get("is_visible") === "on";

  const booking = { title, description, is_visible: isVisible };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("site_settings").select("id").limit(1).single();
  const { error } = existing
    ? await supabase.from("site_settings").update({ booking }).eq("id", existing.id)
    : await supabase.from("site_settings").insert({ booking });

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
  paymentMethod?: PaymentMethod,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const validStatuses: AppointmentStatus[] = ["confirmed", "completed", "cancelled", "no_show"];
  if (!validStatuses.includes(status)) return { error: "Estado invalido" };

  const supabase = await createClient();

  // Employees can only manage their own appointments
  if (session.role === "employee") {
    const { data: apt } = await supabase
      .from("appointments")
      .select("staff_id")
      .eq("id", appointmentId)
      .single();
    if (!apt || apt.staff_id !== session.userId) return { error: "Sin permisos" };
  }

  // Build update payload
  const updateData: Record<string, unknown> = { status };

  // When completing with a payment method, recalculate price if transfer
  if (status === "completed" && paymentMethod) {
    updateData.payment_method = paymentMethod;

    if (paymentMethod === "transfer") {
      const { data: apt } = await supabase
        .from("appointments")
        .select("service_id, staff_id, date, discount_percent")
        .eq("id", appointmentId)
        .single();

      if (apt) {
        const { data: svc } = await supabase
          .from("services")
          .select("price_transfer, price_cash")
          .eq("id", apt.service_id)
          .eq("staff_id", apt.staff_id)
          .single();

        if (svc) {
          // Check for special price on appointment date
          const { data: specialRow } = await supabase
            .from("service_special_prices")
            .select("price_transfer")
            .eq("service_id", apt.service_id)
            .eq("date", apt.date)
            .maybeSingle();

          const transferPrice = specialRow?.price_transfer ?? svc.price_transfer;
          const discountMult = apt.discount_percent > 0 ? (1 - apt.discount_percent / 100) : 1;
          updateData.price = Math.round(transferPrice * discountMult * 100) / 100;
          updateData.original_price = apt.discount_percent > 0 ? transferPrice : null;
        }
      }
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId);

  if (error) {
    console.error("updateAppointmentStatus error:", error);
    return { error: "Error al actualizar el turno" };
  }

  // Fetch appointment data for client update + completion email
  const { data: apt } = await supabase
    .from("appointments")
    .select("client_name, client_phone, client_email, date, start_time, service_id, staff_id")
    .eq("id", appointmentId)
    .single();

  // Update client counters on status change (fire-and-forget)
  if (apt && (status === "completed" || status === "cancelled" || status === "no_show")) {
    supabase.rpc("update_client_on_status_change", {
      p_phone: apt.client_phone ?? "",
      p_email: apt.client_email ?? "",
    }).then(({ error: clientError }) => {
      if (clientError) console.error("update_client_on_status_change error:", clientError);
    });
  }

  // Add loyalty points on completion (fire-and-forget)
  if (status === "completed" && apt) {
    // Get the final price from the updated appointment
    const { data: finalApt } = await supabase
      .from("appointments")
      .select("price")
      .eq("id", appointmentId)
      .single();

    if (finalApt) {
      supabase.rpc("add_client_points", {
        p_phone: apt.client_phone ?? "",
        p_email: apt.client_email ?? "",
        p_price: finalApt.price,
      }).then(({ error: pointsError }) => {
        if (pointsError) console.error("add_client_points error:", pointsError);
      });
    }
  }

  // Send completion email (fire-and-forget)
  if (status === "completed" && apt?.client_email) {
    const [{ data: svc }, { data: staff }, emailSettings] = await Promise.all([
      supabase.from("services").select("name").eq("id", apt.service_id).single(),
      supabase.from("staff").select("name").eq("id", apt.staff_id).single(),
      getEmailSettings(),
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

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reschedule appointment (change service, date, time)
// ---------------------------------------------------------------------------

export async function rescheduleAppointment(
  appointmentId: string,
  serviceId: string,
  date: string,
  startTime: string,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();

  // Fetch existing appointment
  const { data: existing } = await supabase
    .from("appointments")
    .select("staff_id, status, discount_percent, discount_code_id")
    .eq("id", appointmentId)
    .single();

  if (!existing) return { error: "Turno no encontrado" };
  if (existing.status !== "confirmed") return { error: "Solo se pueden modificar turnos confirmados" };

  // Permission: employee can only edit own appointments
  if (session.role === "employee" && existing.staff_id !== session.userId) {
    return { error: "Sin permisos" };
  }

  // Get service for duration and price
  const { data: serviceRow } = await supabase
    .from("services")
    .select("price_cash, duration_minutes")
    .eq("id", serviceId)
    .eq("staff_id", existing.staff_id)
    .single();

  if (!serviceRow) return { error: "Servicio no encontrado" };

  // Check special price
  const { data: specialRow } = await supabase
    .from("service_special_prices")
    .select("price_cash")
    .eq("service_id", serviceId)
    .eq("date", date)
    .maybeSingle();

  let price = specialRow?.price_cash ?? serviceRow.price_cash;

  // Re-apply existing discount if any
  let originalPrice: number | null = null;
  if (existing.discount_percent > 0) {
    originalPrice = price;
    price = Math.round(price * (1 - existing.discount_percent / 100) * 100) / 100;
  }

  // Calculate end_time
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + serviceRow.duration_minutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}:00`;

  // Check for conflicts (exclude current appointment)
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("staff_id", existing.staff_id)
    .eq("date", date)
    .in("status", ["confirmed", "completed"])
    .neq("id", appointmentId)
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    return { error: "Este horario ya no esta disponible" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      service_id: serviceId,
      date,
      start_time: startTime,
      end_time: endTime,
      price,
      original_price: originalPrice,
    })
    .eq("id", appointmentId);

  if (error) {
    console.error("rescheduleAppointment error:", error);
    return { error: "Error al modificar el turno" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin: fetch all services for a staff member (includes inactive)
// ---------------------------------------------------------------------------

export async function getAllServicesForStaffAction(
  staffId: string,
): Promise<Service[]> {
  return getAllServicesForStaff(staffId);
}

// ---------------------------------------------------------------------------
// Public Booking Actions (no auth required)
// ---------------------------------------------------------------------------

export async function getServicesForStaffAction(
  staffId: string,
): Promise<{ id: string; name: string; description: string; duration_minutes: number; price_transfer: number; price_cash: number }[]> {
  const services = await getServicesForStaff(staffId);
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration_minutes: s.duration_minutes,
    price_transfer: s.price_transfer,
    price_cash: s.price_cash,
  }));
}

export async function getAvailableSlotsAction(
  staffId: string,
  serviceId: string,
  date: string,
): Promise<{ slot_time: string }[]> {
  return getAvailableSlots(staffId, serviceId, date);
}

export async function getFullyBookedDatesAction(
  staffId: string,
  serviceId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  return getFullyBookedDates(staffId, serviceId, startDate, endDate);
}

export async function getStaffScheduleAction(
  staffId: string,
): Promise<{ day_of_week: number; is_working: boolean }[]> {
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

  // Verify staff exists
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .single();

  if (!staffRow) return { error: "Empleado no encontrado" };

  // Get service for duration and price
  const { data: serviceRow } = await supabase
    .from("services")
    .select("price_cash, duration_minutes")
    .eq("id", serviceId)
    .eq("staff_id", staffId)
    .single();

  if (!serviceRow) return { error: "Servicio no encontrado" };

  // Check for special price on this date
  const { data: specialRow } = await supabase
    .from("service_special_prices")
    .select("price_cash, price_transfer")
    .eq("service_id", serviceId)
    .eq("date", date)
    .maybeSingle();

  let price = specialRow?.price_cash ?? serviceRow.price_cash;
  const duration = serviceRow.duration_minutes;

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

  // Discount code handling
  const discountCodeRaw = ((formData.get("discount_code") as string) || "").trim();
  let discountCodeId: string | null = null;
  let discountPercent = 0;
  let originalPrice: number | null = null;

  if (discountCodeRaw) {
    const { data: dcData, error: dcError } = await supabase.rpc(
      "use_discount_code",
      { p_code: discountCodeRaw },
    );

    if (dcError) {
      const msg = dcError.message.includes("INVALID_CODE")
        ? "Cupon invalido"
        : dcError.message.includes("CODE_EXHAUSTED")
          ? "Este cupon ya alcanzo su limite de usos"
          : "Error al aplicar el cupon";
      return { error: msg };
    }

    if (dcData && dcData.length > 0) {
      discountCodeId = dcData[0].discount_code_id;
      discountPercent = dcData[0].discount_percent;
      originalPrice = price;
      price = Math.round(price * (1 - discountPercent / 100) * 100) / 100;
    }
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      staff_id: staffId,
      service_id: serviceId,
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail,
      date,
      start_time: startTime,
      end_time: endTime,
      price,
      original_price: originalPrice,
      discount_code_id: discountCodeId,
      discount_percent: discountPercent,
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
    p_name: clientName,
    p_phone: clientPhone,
    p_email: clientEmail,
    p_day_of_week: dayOfWeek,
    p_service_id: serviceId,
    p_staff_id: staffId,
  }).then(({ error: clientError }) => {
    if (clientError) console.error("upsert_client error:", clientError);
  });

  return { success: true, appointmentId: appointment.id };
}

// ---------------------------------------------------------------------------
// Clients (paginated)
// ---------------------------------------------------------------------------

function mapClientDetails(row: Record<string, unknown>): import("@/types").ClientWithDetails {
  return {
    ...row,
    top_service_name: (row.top_service as { name: string } | null)?.name ?? null,
    top_staff_name: (row.top_staff as { name: string } | null)?.name ?? null,
    top_branch_name: (row.top_branch as { name: string } | null)?.name ?? null,
  } as import("@/types").ClientWithDetails;
}

const CLIENT_SELECT = `*, top_service:top_service_id(name), top_staff:top_staff_id(name), top_branch:top_branch_id(name)`;

export async function getClientsAction(
  page: number = 1,
  pageSize: number = 20,
): Promise<{ clients: import("@/types").ClientWithDetails[]; total: number }> {
  const session = await getAuthSession();
  if (!session) return { clients: [], total: 0 };

  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("clients")
    .select(CLIENT_SELECT, { count: "exact" })
    .order("total_appointments", { ascending: false })
    .range(from, to);

  return {
    clients: (data ?? []).map(mapClientDetails),
    total: count ?? 0,
  };
}

export async function getAllClientsAction(): Promise<import("@/types").ClientWithDetails[]> {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .order("total_appointments", { ascending: false });

  return (data ?? []).map(mapClientDetails);
}

// ---------------------------------------------------------------------------
// Discount Codes
// ---------------------------------------------------------------------------

export async function createDiscountCode(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  // admin/owner/manager can manage discount codes
  if (session.role === "employee") return { error: "Sin permisos" };

  const code = ((formData.get("code") as string) || "").trim().toUpperCase();
  const discountPercent =
    parseInt((formData.get("discount_percent") as string) || "0", 10);
  const maxUses =
    parseInt((formData.get("max_uses") as string) || "1", 10);
  const isActive = formData.get("is_active") === "on";

  if (!code) return { error: "El codigo es obligatorio" };
  if (discountPercent < 1 || discountPercent > 100)
    return { error: "El porcentaje debe ser entre 1 y 100" };
  if (maxUses < 1) return { error: "La cantidad minima es 1" };

  const supabase = await createClient();
  const { error } = await supabase.from("discount_codes").insert({
    code,
    discount_percent: discountPercent,
    max_uses: maxUses,
    is_active: isActive,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un cupon con ese codigo" };
    console.error("createDiscountCode error:", error);
    return { error: "Error al crear el cupon" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateDiscountCode(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (session.role === "employee") return { error: "Sin permisos" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de cupon faltante" };

  const code = ((formData.get("code") as string) || "").trim().toUpperCase();
  const discountPercent =
    parseInt((formData.get("discount_percent") as string) || "0", 10);
  const maxUses =
    parseInt((formData.get("max_uses") as string) || "1", 10);
  const isActive = formData.get("is_active") === "on";

  if (!code) return { error: "El codigo es obligatorio" };
  if (discountPercent < 1 || discountPercent > 100)
    return { error: "El porcentaje debe ser entre 1 y 100" };
  if (maxUses < 1) return { error: "La cantidad minima es 1" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({
      code,
      discount_percent: discountPercent,
      max_uses: maxUses,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un cupon con ese codigo" };
    console.error("updateDiscountCode error:", error);
    return { error: "Error al actualizar el cupon" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteDiscountCode(
  discountCodeId: string,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (session.role === "employee") return { error: "Sin permisos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discount_codes")
    .delete()
    .eq("id", discountCodeId);

  if (error) {
    console.error("deleteDiscountCode error:", error);
    return { error: "Error al eliminar el cupon" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function validateDiscountCodeAction(
  code: string,
): Promise<{
  valid: boolean;
  discount_code_id?: string;
  discount_percent?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("id, discount_percent")
    .ilike("code", code)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!data) {
    return { valid: false, error: "Cupon invalido o agotado" };
  }

  const { data: full } = await supabase
    .from("discount_codes")
    .select("used_count, max_uses")
    .eq("id", data.id)
    .single();

  if (full && full.used_count >= full.max_uses) {
    return { valid: false, error: "Este cupon ya alcanzo su limite de usos" };
  }

  return {
    valid: true,
    discount_code_id: data.id,
    discount_percent: data.discount_percent,
  };
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export async function createBranch(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (session.role !== "admin" && session.role !== "owner") return { error: "Sin permisos" };

  const name = ((formData.get("name") as string) || "").trim();
  const address = ((formData.get("address") as string) || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    name,
    address,
    is_active: isActive,
  });

  if (error) {
    console.error("createBranch error:", error);
    return { error: "Error al crear la sucursal" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateBranch(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (session.role !== "admin" && session.role !== "owner") return { error: "Sin permisos" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de sucursal faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const address = ((formData.get("address") as string) || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ name, address, is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("updateBranch error:", error);
    return { error: "Error al actualizar la sucursal" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBranch(branchId: string): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (session.role !== "admin" && session.role !== "owner") return { error: "Sin permisos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("id", branchId);

  if (error) {
    console.error("deleteBranch error:", error);
    return { error: "Error al eliminar la sucursal" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// Public: get active branches
export async function getActiveBranchesAction(): Promise<Branch[]> {
  return getActiveBranches();
}

// ---------------------------------------------------------------------------
// Service Special Prices
// ---------------------------------------------------------------------------

export async function getSpecialPricesForService(
  serviceId: string,
): Promise<ServiceSpecialPrice[]> {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("service_special_prices")
    .select("*")
    .eq("service_id", serviceId)
    .order("date", { ascending: true });

  return (data ?? []) as ServiceSpecialPrice[];
}

export async function addServiceSpecialPrice(
  serviceId: string,
  date: string,
  priceCash: number,
  priceTransfer: number,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (!serviceId || !date || priceCash < 0 || priceTransfer < 0) {
    return { error: "Datos invalidos" };
  }

  const supabase = await createClient();

  // Delete existing entry for this date first
  const { error: delError } = await supabase
    .from("service_special_prices")
    .delete()
    .eq("service_id", serviceId)
    .eq("date", date);

  if (delError) {
    console.error("deleteBeforeInsert error:", delError);
  }

  const { error } = await supabase
    .from("service_special_prices")
    .insert({
      service_id: serviceId,
      date,
      price_cash: priceCash,
      price_transfer: priceTransfer,
    });

  if (error) {
    console.error("addServiceSpecialPrice error:", error);
    return { error: `Error: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeServiceSpecialPrice(
  specialPriceId: string,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("service_special_prices")
    .delete()
    .eq("id", specialPriceId);

  if (error) {
    console.error("removeServiceSpecialPrice error:", error);
    return { error: "Error al eliminar el precio especial" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Rewards CRUD
// ---------------------------------------------------------------------------

export async function createReward(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };
  if (session.role === "employee") return { error: "Sin permisos" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const pointsCost = parseInt((formData.get("points_cost") as string) || "0", 10);
  const type = (formData.get("type") as string) || "product";
  const discountPercentRaw = parseInt((formData.get("discount_percent") as string) || "0", 10);
  const discountPercent = type === "discount" ? discountPercentRaw : null;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (pointsCost < 1) return { error: "El costo en puntos debe ser mayor a 0" };
  if (type === "discount" && (!discountPercent || discountPercent < 1 || discountPercent > 100)) {
    return { error: "El porcentaje de descuento debe ser entre 1 y 100" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rewards").insert({
    name,
    description,
    points_cost: pointsCost,
    type,
    discount_percent: discountPercent,
    is_active: isActive,
  });

  if (error) {
    console.error("createReward error:", error);
    return { error: "Error al crear la recompensa" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateReward(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };
  if (session.role === "employee") return { error: "Sin permisos" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de recompensa faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const pointsCost = parseInt((formData.get("points_cost") as string) || "0", 10);
  const type = (formData.get("type") as string) || "product";
  const discountPercentRaw = parseInt((formData.get("discount_percent") as string) || "0", 10);
  const discountPercent = type === "discount" ? discountPercentRaw : null;
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (pointsCost < 1) return { error: "El costo en puntos debe ser mayor a 0" };
  if (type === "discount" && (!discountPercent || discountPercent < 1 || discountPercent > 100)) {
    return { error: "El porcentaje de descuento debe ser entre 1 y 100" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rewards")
    .update({ name, description, points_cost: pointsCost, type, discount_percent: discountPercent, is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("updateReward error:", error);
    return { error: "Error al actualizar la recompensa" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteReward(rewardId: string): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };
  if (session.role === "employee") return { error: "Sin permisos" };

  const supabase = await createClient();
  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);

  if (error) {
    console.error("deleteReward error:", error);
    return { error: "Error al eliminar la recompensa" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Redeem Points
// ---------------------------------------------------------------------------

export async function redeemPoints(
  clientId: string,
  rewardId: string,
): Promise<ActionState & { redemptionId?: string }> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_points", {
    p_client_id: clientId,
    p_reward_id: rewardId,
    p_staff_id: session.userId,
  });

  if (error) {
    const msg = error.message.includes("INSUFFICIENT_POINTS")
      ? "El cliente no tiene suficientes puntos"
      : error.message.includes("REWARD_NOT_FOUND")
        ? "Recompensa no encontrada"
        : `Error: ${error.message}`;
    return { error: msg };
  }

  revalidatePath("/admin");
  return { success: true, redemptionId: data as string };
}

export async function getClientRedemptions(
  clientId: string,
): Promise<PointRedemption[]> {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("point_redemptions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as PointRedemption[];
}

// ---------------------------------------------------------------------------
// Ranking Settings
// ---------------------------------------------------------------------------

export async function saveRankingSettings(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const isVisible = formData.get("is_visible") === "on";

  const ranking = { title, description, is_visible: isVisible };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("site_settings").select("id").limit(1).single();
  const { error } = existing
    ? await supabase.from("site_settings").update({ ranking }).eq("id", existing.id)
    : await supabase.from("site_settings").insert({ ranking });

  if (error) {
    console.error("saveRankingSettings error:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

// Public: get special price for a service on a specific date
export async function getSpecialPriceAction(
  serviceId: string,
  date: string,
): Promise<{ price_cash: number; price_transfer: number } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_special_prices")
    .select("price_cash, price_transfer")
    .eq("service_id", serviceId)
    .eq("date", date)
    .maybeSingle();

  return data as { price_cash: number; price_transfer: number } | null;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  const session = await getAuthSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []) as Product[];
}

export async function createProduct(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const name = ((formData.get("name") as string) || "").trim();
  const price = parseFloat((formData.get("price") as string) || "0") || 0;
  const imageUrl = ((formData.get("image_url") as string) || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (price < 0) return { error: "El precio no puede ser negativo" };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name,
    price,
    image_url: imageUrl,
    is_active: isActive,
  });

  if (error) {
    console.error("createProduct error:", error);
    return { error: "Error al crear el producto" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateProduct(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID de producto faltante" };

  const name = ((formData.get("name") as string) || "").trim();
  const price = parseFloat((formData.get("price") as string) || "0") || 0;
  const imageUrl = ((formData.get("image_url") as string) || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio" };
  if (price < 0) return { error: "El precio no puede ser negativo" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ name, price, image_url: imageUrl, is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("updateProduct error:", error);
    return { error: "Error al actualizar el producto" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  // Only admin/owner/manager can delete products
  if (session.role === "employee") return { error: "Sin permisos" };

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    console.error("deleteProduct error:", error);
    return { error: "Error al eliminar el producto" };
  }

  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Product Sales
// ---------------------------------------------------------------------------

export async function recordProductSale(
  productId: string,
  quantity: number,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  if (quantity < 1) return { error: "La cantidad debe ser al menos 1" };

  const supabase = await createClient();

  // Get product price
  const { data: product } = await supabase
    .from("products")
    .select("price, is_active")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Producto no encontrado" };
  if (!product.is_active) return { error: "Este producto esta inactivo" };

  const { error } = await supabase.from("product_sales").insert({
    product_id: productId,
    staff_id: session.userId,
    price: product.price,
    quantity,
  });

  if (error) {
    console.error("recordProductSale error:", error);
    return { error: "Error al registrar la venta" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function getProductSales(
  page: number = 1,
  pageSize: number = 20,
): Promise<{ sales: ProductSaleWithDetails[]; total: number }> {
  const session = await getAuthSession();
  if (!session) return { sales: [], total: 0 };

  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("product_sales")
    .select("*, product:product_id(name), staff:staff_id(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const sales = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    product_name: (row.product as { name: string } | null)?.name ?? "Producto eliminado",
    staff_name: (row.staff as { name: string } | null)?.name ?? "Empleado",
  })) as ProductSaleWithDetails[];

  return { sales, total: count ?? 0 };
}

export async function deleteProductSale(saleId: string): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) return { error: "No autenticado" };

  const supabase = await createClient();

  // Employees can only delete their own sales
  if (session.role === "employee") {
    const { data: sale } = await supabase
      .from("product_sales")
      .select("staff_id")
      .eq("id", saleId)
      .single();
    if (!sale || sale.staff_id !== session.userId) return { error: "Sin permisos" };
  }

  const { error } = await supabase.from("product_sales").delete().eq("id", saleId);

  if (error) {
    console.error("deleteProductSale error:", error);
    return { error: "Error al eliminar la venta" };
  }

  revalidatePath("/admin");
  return { success: true };
}

