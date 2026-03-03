alter table site_settings
  add column if not exists video jsonb
  default '{"title":"","youtube_url":"","description":"","cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb;
