import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServices } from "@/lib/queries/services";
import { ServicesSettings } from "../sections/services-settings";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const services = await getServices(user.id);

  return <ServicesSettings services={services} />;
}
