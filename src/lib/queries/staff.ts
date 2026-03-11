import { createClient } from "@/lib/supabase/server";
import type { StaffMember, StaffSchedule, StaffTimeOff, StaffBlockedTime } from "@/types";

export async function getStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .neq("role", "admin")
    .order("sort_order");

  return (data as StaffMember[]) ?? [];
}

export async function getActiveStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .neq("role", "admin")
    .order("sort_order");

  return (data as StaffMember[]) ?? [];
}

export async function getStaffForBranch(branchId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("branch_id", branchId)
    .neq("role", "admin")
    .order("sort_order");

  return (data as StaffMember[]) ?? [];
}

export async function getStaffMember(staffId: string): Promise<StaffMember | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("id", staffId)
    .single();

  return (data as StaffMember) ?? null;
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

export async function getAllStaffSchedules(): Promise<StaffSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_schedules")
    .select("*")
    .order("day_of_week");

  return (data as StaffSchedule[]) ?? [];
}

export async function getAllStaffTimeOff(): Promise<StaffTimeOff[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("staff_time_off")
    .select("*")
    .gte("date", today)
    .order("date");

  return (data as StaffTimeOff[]) ?? [];
}

export async function getAllStaffBlockedTimes(): Promise<StaffBlockedTime[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("staff_blocked_times")
    .select("*")
    .gte("date", today)
    .order("date")
    .order("start_time");

  return (data as StaffBlockedTime[]) ?? [];
}
