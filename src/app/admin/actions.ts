"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  HeaderSettings,
  FooterSettings,
  CarouselSettings,
  CarouselSlide,
  VideoSettings,
  GallerySettings,
  MulticolumnSettings,
  MulticolumnBlock,
  ButtonVariant,
  HAlign,
  VAlign,
  MenuLink,
  SocialLinks,
} from "@/types";

export interface SaveHeaderState {
  error?: string;
  success?: boolean;
}

export async function saveHeaderSettings(
  _prev: SaveHeaderState | null,
  formData: FormData,
): Promise<SaveHeaderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const logoType = formData.get("logo_type") as "text" | "image";
  const logoText = (formData.get("logo_text") as string) || "";
  const logoImageUrl = (formData.get("logo_image_url") as string) || "";
  const isVisible = formData.get("is_visible") === "on";

  const menuLinks: MenuLink[] = [];
  for (let i = 0; i < 8; i++) {
    const label = formData.get(`menu_links[${i}].label`) as string | null;
    const url = formData.get(`menu_links[${i}].url`) as string | null;
    if (label?.trim() && url?.trim()) {
      menuLinks.push({ label: label.trim(), url: url.trim() });
    }
  }

  const socialKeys = [
    "instagram",
    "facebook",
    "tiktok",
    "whatsapp",
    "x",
    "youtube",
    "telegram",
  ] as const;

  const socialLinks: SocialLinks = {
    instagram: null,
    facebook: null,
    tiktok: null,
    whatsapp: null,
    x: null,
    youtube: null,
    telegram: null,
  };

  for (const key of socialKeys) {
    const value = formData.get(`social_${key}`) as string | null;
    socialLinks[key] = value?.trim() || null;
  }

  if (logoType === "text" && !logoText.trim()) {
    return { error: "El nombre del sitio es obligatorio cuando el logo es de texto" };
  }

  if (logoType === "image" && !logoImageUrl.trim()) {
    return { error: "La URL de la imagen es obligatoria cuando el logo es de imagen" };
  }

  const header: HeaderSettings = {
    logo_type: logoType,
    logo_text: logoText,
    logo_image_url: logoImageUrl,
    menu_links: menuLinks,
    social_links: socialLinks,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, header }, { onConflict: "user_id" });

  if (error) {
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}

// --- Footer ---

export interface SaveFooterState {
  error?: string;
  success?: boolean;
}

export async function saveFooterSettings(
  _prev: SaveFooterState | null,
  formData: FormData,
): Promise<SaveFooterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const isVisible = formData.get("is_visible") === "on";

  const menuLinks: MenuLink[] = [];
  for (let i = 0; i < 8; i++) {
    const label = formData.get(`menu_links[${i}].label`) as string | null;
    const url = formData.get(`menu_links[${i}].url`) as string | null;
    if (label?.trim() && url?.trim()) {
      menuLinks.push({ label: label.trim(), url: url.trim() });
    }
  }

  const socialKeys = [
    "instagram",
    "facebook",
    "tiktok",
    "whatsapp",
    "x",
    "youtube",
    "telegram",
  ] as const;

  const socialLinks: SocialLinks = {
    instagram: null,
    facebook: null,
    tiktok: null,
    whatsapp: null,
    x: null,
    youtube: null,
    telegram: null,
  };

  for (const key of socialKeys) {
    const value = formData.get(`social_${key}`) as string | null;
    socialLinks[key] = value?.trim() || null;
  }

  const footer: FooterSettings = {
    menu_links: menuLinks,
    social_links: socialLinks,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, footer }, { onConflict: "user_id" });

  if (error) {
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}

// --- Carousel ---

export interface SaveCarouselState {
  error?: string;
  success?: boolean;
}

const VALID_BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "destructive"];
const VALID_H_ALIGNS: HAlign[] = ["left", "center", "right"];
const VALID_V_ALIGNS: VAlign[] = ["top", "center", "bottom"];

export async function saveCarouselSettings(
  _prev: SaveCarouselState | null,
  formData: FormData,
): Promise<SaveCarouselState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const isVisible = formData.get("is_visible") === "on";
  const autoSlide = formData.get("auto_slide") === "on";

  const slides: CarouselSlide[] = [];
  for (let i = 0; i < 3; i++) {
    const imageDesktop = (formData.get(`slides[${i}].image_desktop`) as string) || "";
    if (!imageDesktop.trim()) continue;

    const imageMobile = (formData.get(`slides[${i}].image_mobile`) as string) || "";
    const title = (formData.get(`slides[${i}].title`) as string) || "";
    const subtitle = (formData.get(`slides[${i}].subtitle`) as string) || "";
    const ctaLabel = (formData.get(`slides[${i}].cta_label`) as string) || "";
    const ctaUrl = (formData.get(`slides[${i}].cta_url`) as string) || "";
    const ctaVariantRaw = (formData.get(`slides[${i}].cta_variant`) as string) || "primary";
    const textColor = (formData.get(`slides[${i}].text_color`) as string) || "#ffffff";
    const alignHRaw = (formData.get(`slides[${i}].align_h`) as string) || "center";
    const alignVRaw = (formData.get(`slides[${i}].align_v`) as string) || "center";

    const ctaVariant = VALID_BUTTON_VARIANTS.includes(ctaVariantRaw as ButtonVariant)
      ? (ctaVariantRaw as ButtonVariant)
      : "primary";
    const alignH = VALID_H_ALIGNS.includes(alignHRaw as HAlign)
      ? (alignHRaw as HAlign)
      : "center";
    const alignV = VALID_V_ALIGNS.includes(alignVRaw as VAlign)
      ? (alignVRaw as VAlign)
      : "center";

    slides.push({
      image_desktop: imageDesktop.trim(),
      image_mobile: imageMobile.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      cta_label: ctaLabel.trim(),
      cta_url: ctaUrl.trim(),
      cta_variant: ctaVariant,
      text_color: textColor.trim(),
      align_h: alignH,
      align_v: alignV,
    });
  }

  const carousel: CarouselSettings = {
    slides,
    auto_slide: autoSlide,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, carousel }, { onConflict: "user_id" });

  if (error) {
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}

// --- Video ---

export interface SaveVideoState {
  error?: string;
  success?: boolean;
}

export async function saveVideoSettings(
  _prev: SaveVideoState | null,
  formData: FormData,
): Promise<SaveVideoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const isVisible = formData.get("is_visible") === "on";
  const title = ((formData.get("title") as string) || "").trim();
  const youtubeUrl = ((formData.get("youtube_url") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const ctaLabel = ((formData.get("cta_label") as string) || "").trim();
  const ctaUrl = ((formData.get("cta_url") as string) || "").trim();
  const ctaVariantRaw = ((formData.get("cta_variant") as string) || "primary");
  const ctaVariant = VALID_BUTTON_VARIANTS.includes(ctaVariantRaw as ButtonVariant)
    ? (ctaVariantRaw as ButtonVariant)
    : "primary";

  const video: VideoSettings = {
    title,
    youtube_url: youtubeUrl,
    description,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    cta_variant: ctaVariant,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, video }, { onConflict: "user_id" });

  if (error) {
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}

// --- Gallery ---

export interface SaveGalleryState {
  error?: string;
  success?: boolean;
}

export async function saveGallerySettings(
  _prev: SaveGalleryState | null,
  formData: FormData,
): Promise<SaveGalleryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const isVisible = formData.get("is_visible") === "on";
  const title = ((formData.get("title") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const ctaLabel = ((formData.get("cta_label") as string) || "").trim();
  const ctaUrl = ((formData.get("cta_url") as string) || "").trim();
  const ctaVariantRaw = ((formData.get("cta_variant") as string) || "primary");
  const ctaVariant = VALID_BUTTON_VARIANTS.includes(ctaVariantRaw as ButtonVariant)
    ? (ctaVariantRaw as ButtonVariant)
    : "primary";

  const images: string[] = [];
  for (let i = 0; i < 9; i++) {
    const url = ((formData.get(`images[${i}]`) as string) || "").trim();
    if (url) {
      images.push(url);
    }
  }

  const gallery: GallerySettings = {
    title,
    description,
    images,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    cta_variant: ctaVariant,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, gallery }, { onConflict: "user_id" });

  if (error) {
    console.error("saveGallerySettings error:", error);
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}

// --- Multicolumn ---

export interface SaveMulticolumnState {
  error?: string;
  success?: boolean;
}

export async function saveMulticolumnSettings(
  _prev: SaveMulticolumnState | null,
  formData: FormData,
): Promise<SaveMulticolumnState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const isVisible = formData.get("is_visible") === "on";
  const title = ((formData.get("title") as string) || "").trim();
  const ctaLabel = ((formData.get("cta_label") as string) || "").trim();
  const ctaUrl = ((formData.get("cta_url") as string) || "").trim();
  const ctaVariantRaw = ((formData.get("cta_variant") as string) || "primary");
  const ctaVariant = VALID_BUTTON_VARIANTS.includes(ctaVariantRaw as ButtonVariant)
    ? (ctaVariantRaw as ButtonVariant)
    : "primary";

  const blocks: MulticolumnBlock[] = [];
  for (let i = 0; i < 8; i++) {
    const imageUrl = ((formData.get(`blocks[${i}].image_url`) as string) || "").trim();
    if (!imageUrl) continue;

    const blockTitle = ((formData.get(`blocks[${i}].title`) as string) || "").trim();
    const subtitle = ((formData.get(`blocks[${i}].subtitle`) as string) || "").trim();
    const linkUrl = ((formData.get(`blocks[${i}].link_url`) as string) || "").trim();

    blocks.push({
      image_url: imageUrl,
      title: blockTitle,
      subtitle,
      link_url: linkUrl,
    });
  }

  const multicolumn: MulticolumnSettings = {
    title,
    blocks,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    cta_variant: ctaVariant,
    is_visible: isVisible,
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({ user_id: user.id, multicolumn }, { onConflict: "user_id" });

  if (error) {
    console.error("saveMulticolumnSettings error:", error);
    return { error: "Error al guardar la configuracion. Intenta de nuevo." };
  }

  return { success: true };
}
