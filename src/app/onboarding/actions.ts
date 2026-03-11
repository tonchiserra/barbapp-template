"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDefaultRoute } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export async function onboardStaff(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const branchId = (formData.get("branch_id") as string) || null;

  if (!name) {
    return { error: "El nombre es obligatorio" };
  }

  const { data, error } = await supabase.rpc("onboard_staff", {
    p_name: name,
    p_branch_id: branchId,
  });

  if (error) {
    console.error("Onboarding error:", error);
    return { error: `Error: ${error.message}` };
  }

  redirect(getDefaultRoute(data.role as Role));
}
