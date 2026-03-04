export type Size = "sm" | "md" | "lg";

export type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost";

// --- Site Settings ---

export type LogoType = "text" | "image";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "whatsapp"
  | "x"
  | "youtube"
  | "telegram"
  | "email";

export interface MenuLink {
  label: string;
  url: string;
}

export interface SocialLinks {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  x: string | null;
  youtube: string | null;
  telegram: string | null;
  email: string | null;
}

export interface HeaderSettings {
  logo_type: LogoType;
  logo_text: string;
  logo_image_url: string;
  menu_links: MenuLink[];
  social_links: SocialLinks;
  is_visible: boolean;
}

export interface FooterSettings {
  menu_links: MenuLink[];
  social_links: SocialLinks;
  is_visible: boolean;
}

// --- Carousel ---

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "center" | "bottom";

export interface CarouselSlide {
  image_desktop: string;
  image_mobile: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  cta_variant: ButtonVariant;
  text_color: string;
  align_h: HAlign;
  align_v: VAlign;
}

export interface CarouselSettings {
  slides: CarouselSlide[];
  auto_slide: boolean;
  is_visible: boolean;
}

// --- Gallery ---

export interface GallerySettings {
  title: string;
  description: string;
  images: string[];
  cta_label: string;
  cta_url: string;
  cta_variant: ButtonVariant;
  is_visible: boolean;
}

// --- Multicolumn ---

export interface MulticolumnBlock {
  image_url: string;
  title: string;
  subtitle: string;
  link_url: string;
}

export interface MulticolumnSettings {
  title: string;
  blocks: MulticolumnBlock[];
  cta_label: string;
  cta_url: string;
  cta_variant: ButtonVariant;
  is_visible: boolean;
}

// --- Map ---

export interface MapLocation {
  name: string;
  address: string;
}

export interface MapSettings {
  title: string;
  description: string;
  locations: MapLocation[];
  is_visible: boolean;
}

// --- Video ---

export interface VideoSettings {
  title: string;
  youtube_url: string;
  description: string;
  cta_label: string;
  cta_url: string;
  cta_variant: ButtonVariant;
  is_visible: boolean;
}

// --- Booking ---

export interface BookingSettings {
  title: string;
  description: string;
  advance_days: number;
  min_advance_hours: number;
  is_visible: boolean;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  is_owner: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffService {
  id: string;
  staff_id: string;
  service_id: string;
  price_override: number | null;
  duration_override: number | null;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface StaffTimeOff {
  id: string;
  staff_id: string;
  date: string;
  reason: string;
}

export interface StaffBlockedTime {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
}

export type AppointmentStatus = "confirmed" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  user_id: string;
  staff_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  staff_name: string;
  service_name: string;
}

export interface AvailableSlot {
  slot_time: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  total_appointments: number;
  dow_0: number;
  dow_1: number;
  dow_2: number;
  dow_3: number;
  dow_4: number;
  dow_5: number;
  dow_6: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  user_id: string;
  header: HeaderSettings;
  footer: FooterSettings;
  carousel: CarouselSettings;
  video: VideoSettings;
  gallery: GallerySettings;
  multicolumn: MulticolumnSettings;
  map: MapSettings;
  booking: BookingSettings;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  logo_type: "text",
  logo_text: "Mi Barberia",
  logo_image_url: "",
  menu_links: [],
  social_links: {
    instagram: null,
    facebook: null,
    tiktok: null,
    whatsapp: null,
    x: null,
    youtube: null,
    telegram: null,
    email: null,
  },
  is_visible: true,
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  menu_links: [],
  social_links: {
    instagram: null,
    facebook: null,
    tiktok: null,
    whatsapp: null,
    x: null,
    youtube: null,
    telegram: null,
    email: null,
  },
  is_visible: true,
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  title: "",
  youtube_url: "",
  description: "",
  cta_label: "",
  cta_url: "",
  cta_variant: "primary",
  is_visible: true,
};

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  title: "",
  description: "",
  images: [],
  cta_label: "",
  cta_url: "",
  cta_variant: "primary",
  is_visible: true,
};

export const DEFAULT_MULTICOLUMN_BLOCK: MulticolumnBlock = {
  image_url: "",
  title: "",
  subtitle: "",
  link_url: "",
};

export const DEFAULT_MULTICOLUMN_SETTINGS: MulticolumnSettings = {
  title: "",
  blocks: [],
  cta_label: "",
  cta_url: "",
  cta_variant: "primary",
  is_visible: true,
};

export const DEFAULT_MAP_LOCATION: MapLocation = {
  name: "",
  address: "",
};

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  title: "",
  description: "",
  locations: [],
  is_visible: true,
};

export const DEFAULT_CAROUSEL_SLIDE: CarouselSlide = {
  image_desktop: "",
  image_mobile: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_url: "",
  cta_variant: "primary",
  text_color: "#ffffff",
  align_h: "center",
  align_v: "center",
};

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  title: "Reserva tu turno",
  description: "",
  advance_days: 30,
  min_advance_hours: 2,
  is_visible: true,
};

export const DEFAULT_SCHEDULE: Omit<StaffSchedule, "id" | "staff_id">[] = [
  { day_of_week: 0, start_time: "09:00:00", end_time: "18:00:00", is_working: false },
  { day_of_week: 1, start_time: "09:00:00", end_time: "18:00:00", is_working: true },
  { day_of_week: 2, start_time: "09:00:00", end_time: "18:00:00", is_working: true },
  { day_of_week: 3, start_time: "09:00:00", end_time: "18:00:00", is_working: true },
  { day_of_week: 4, start_time: "09:00:00", end_time: "18:00:00", is_working: true },
  { day_of_week: 5, start_time: "09:00:00", end_time: "18:00:00", is_working: true },
  { day_of_week: 6, start_time: "09:00:00", end_time: "14:00:00", is_working: true },
];

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export const DEFAULT_CAROUSEL_SETTINGS: CarouselSettings = {
  slides: [],
  auto_slide: true,
  is_visible: true,
};

export const SOCIAL_PLATFORMS: {
  key: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu_barberia" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu_barberia" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@tu_barberia" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/5491100000000" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/tu_barberia" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@tu_barberia" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/tu_barberia" },
  { key: "email", label: "Email", placeholder: "tu@barberia.com" },
];
