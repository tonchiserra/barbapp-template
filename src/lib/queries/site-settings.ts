import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, HeaderSettings, FooterSettings, CarouselSettings, VideoSettings, GallerySettings, MulticolumnSettings, MapSettings, BookingSettings, ThemeSettings } from "@/types";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_CAROUSEL_SETTINGS, DEFAULT_VIDEO_SETTINGS, DEFAULT_GALLERY_SETTINGS, DEFAULT_MULTICOLUMN_SETTINGS, DEFAULT_MAP_SETTINGS, DEFAULT_BOOKING_SETTINGS, DEFAULT_THEME_SETTINGS } from "@/types";

export async function getSiteSettings(
  userId: string,
): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  return (data as SiteSettings) ?? null;
}

export async function getHeaderSettings(
  userId: string,
): Promise<HeaderSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_HEADER_SETTINGS;
  return settings.header;
}

export async function getFooterSettings(
  userId: string,
): Promise<FooterSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_FOOTER_SETTINGS;
  return settings.footer ?? DEFAULT_FOOTER_SETTINGS;
}

export async function getCarouselSettings(
  userId: string,
): Promise<CarouselSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_CAROUSEL_SETTINGS;
  return settings.carousel ?? DEFAULT_CAROUSEL_SETTINGS;
}

export async function getVideoSettings(
  userId: string,
): Promise<VideoSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_VIDEO_SETTINGS;
  return settings.video ?? DEFAULT_VIDEO_SETTINGS;
}

export async function getGallerySettings(
  userId: string,
): Promise<GallerySettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_GALLERY_SETTINGS;
  return settings.gallery ?? DEFAULT_GALLERY_SETTINGS;
}

export async function getMulticolumnSettings(
  userId: string,
): Promise<MulticolumnSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_MULTICOLUMN_SETTINGS;
  return settings.multicolumn ?? DEFAULT_MULTICOLUMN_SETTINGS;
}

export async function getMapSettings(
  userId: string,
): Promise<MapSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_MAP_SETTINGS;
  return settings.map ?? DEFAULT_MAP_SETTINGS;
}

export async function getBookingSettings(
  userId: string,
): Promise<BookingSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_BOOKING_SETTINGS;
  return settings.booking ?? DEFAULT_BOOKING_SETTINGS;
}

export async function getThemeSettings(
  userId: string,
): Promise<ThemeSettings> {
  const settings = await getSiteSettings(userId);
  if (!settings) return DEFAULT_THEME_SETTINGS;
  return settings.theme ?? DEFAULT_THEME_SETTINGS;
}

/** MVP: primera row. Luego se reemplaza por slug/subdominio. */
export async function getPublicSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  return (data as SiteSettings) ?? null;
}
