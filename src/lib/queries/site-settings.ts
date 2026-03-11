import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, HeaderSettings, FooterSettings, CarouselSettings, VideoSettings, GallerySettings, MulticolumnSettings, MapSettings, BookingSettings, ThemeSettings, EmailSettings, RankingSettings } from "@/types";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_CAROUSEL_SETTINGS, DEFAULT_VIDEO_SETTINGS, DEFAULT_GALLERY_SETTINGS, DEFAULT_MULTICOLUMN_SETTINGS, DEFAULT_MAP_SETTINGS, DEFAULT_BOOKING_SETTINGS, DEFAULT_THEME_SETTINGS, DEFAULT_EMAIL_SETTINGS, DEFAULT_RANKING_SETTINGS } from "@/types";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  return (data as SiteSettings) ?? null;
}

export async function getHeaderSettings(): Promise<HeaderSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_HEADER_SETTINGS;
  return settings.header;
}

export async function getFooterSettings(): Promise<FooterSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_FOOTER_SETTINGS;
  return settings.footer ?? DEFAULT_FOOTER_SETTINGS;
}

export async function getCarouselSettings(): Promise<CarouselSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_CAROUSEL_SETTINGS;
  return settings.carousel ?? DEFAULT_CAROUSEL_SETTINGS;
}

export async function getVideoSettings(): Promise<VideoSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_VIDEO_SETTINGS;
  return settings.video ?? DEFAULT_VIDEO_SETTINGS;
}

export async function getGallerySettings(): Promise<GallerySettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_GALLERY_SETTINGS;
  return settings.gallery ?? DEFAULT_GALLERY_SETTINGS;
}

export async function getMulticolumnSettings(): Promise<MulticolumnSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_MULTICOLUMN_SETTINGS;
  return settings.multicolumn ?? DEFAULT_MULTICOLUMN_SETTINGS;
}

export async function getMapSettings(): Promise<MapSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_MAP_SETTINGS;
  return settings.map ?? DEFAULT_MAP_SETTINGS;
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_BOOKING_SETTINGS;
  return settings.booking ?? DEFAULT_BOOKING_SETTINGS;
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_THEME_SETTINGS;
  return settings.theme ?? DEFAULT_THEME_SETTINGS;
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_EMAIL_SETTINGS;
  return settings.email ?? DEFAULT_EMAIL_SETTINGS;
}

export async function getRankingSettings(): Promise<RankingSettings> {
  const settings = await getSiteSettings();
  if (!settings) return DEFAULT_RANKING_SETTINGS;
  return settings.ranking ?? DEFAULT_RANKING_SETTINGS;
}
