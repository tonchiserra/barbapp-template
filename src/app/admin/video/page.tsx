import { requireScope } from "@/lib/auth";
import { getVideoSettings } from "@/lib/queries/site-settings";
import { VideoSettingsForm } from "../sections/video-settings";

export default async function VideoPage() {
  const session = await requireScope('landing:video');

  const videoSettings = await getVideoSettings();

  return <VideoSettingsForm initialSettings={videoSettings} />;
}
