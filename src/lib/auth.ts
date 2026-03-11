import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasScope, getDefaultRoute } from "./permissions";
import type { Role, Scope } from "./permissions";

export interface AuthSession {
  userId: string;
  role: Role;
  staffId: string;
  branchId: string | null;
  name: string;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role, branch_id, name")
    .eq("id", user.id)
    .single();

  if (!staff) return null;

  return {
    userId: user.id,
    role: staff.role as Role,
    staffId: staff.id,
    branchId: staff.branch_id,
    name: staff.name,
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role, branch_id, name")
    .eq("id", user.id)
    .single();

  if (!staff) {
    redirect("/onboarding");
  }

  return {
    userId: user.id,
    role: staff.role as Role,
    staffId: staff.id,
    branchId: staff.branch_id,
    name: staff.name,
  };
}

export async function requireScope(scope: Scope): Promise<AuthSession> {
  const session = await requireAuth();
  if (!hasScope(session.role, scope)) {
    redirect(getDefaultRoute(session.role));
  }
  return session;
}

export async function canAccessStaff(
  session: AuthSession,
  targetStaffId: string,
): Promise<boolean> {
  if (session.role === "admin" || session.role === "owner") return true;
  if (session.role === "employee") return targetStaffId === session.staffId;

  // Manager: check if target staff is in the same branch
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("branch_id")
    .eq("id", targetStaffId)
    .single();

  return data?.branch_id === session.branchId;
}
