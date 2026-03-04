import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVideoSettings } from "@/lib/queries/site-settings";
import { VideoSettingsForm } from "../sections/video-settings";

export default async function VideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const videoSettings = await getVideoSettings(user.id);

  return <VideoSettingsForm initialSettings={videoSettings} />;
}
