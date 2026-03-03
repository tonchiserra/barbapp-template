"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Las contrasenas no coinciden" };
  }

  if (password.length < 6) {
    return { error: "La contrasena debe tener al menos 6 caracteres" };
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Revisa tu email para confirmar tu cuenta");
}
