import { createClient } from "@/lib/supabase/server";
import type { StaffMember, StaffSchedule, StaffTimeOff, StaffBlockedTime } from "@/types";

export async function getStaff(userId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  return (data as StaffMember[]) ?? [];
}

export async function getActiveStaff(userId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");

  return (data as StaffMember[]) ?? [];
}

export async function getStaffSchedule(staffId: string): Promise<StaffSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_schedules")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week");

  return (data as StaffSchedule[]) ?? [];
}

export async function getAllStaffSchedules(userId: string): Promise<StaffSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_schedules")
    .select("*, staff!inner(user_id)")
    .eq("staff.user_id", userId)
    .order("day_of_week");

  if (!data) return [];

  return data.map(({ staff: _staff, ...rest }) => rest as StaffSchedule);
}

export async function getAllStaffTimeOff(userId: string): Promise<StaffTimeOff[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("staff_time_off")
    .select("*, staff!inner(user_id)")
    .eq("staff.user_id", userId)
    .gte("date", today)
    .order("date");

  if (!data) return [];

  return data.map(({ staff: _staff, ...rest }) => rest as StaffTimeOff);
}

export async function getAllStaffBlockedTimes(userId: string): Promise<StaffBlockedTime[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("staff_blocked_times")
    .select("*, staff!inner(user_id)")
    .eq("staff.user_id", userId)
    .gte("date", today)
    .order("date")
    .order("start_time");

  if (!data) return [];

  return data.map(({ staff: _staff, ...rest }) => rest as StaffBlockedTime);
}

