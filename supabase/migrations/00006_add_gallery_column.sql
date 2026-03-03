alter table site_settings
  add column if not exists gallery jsonb
  default '{"title":"","description":"","images":[],"cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb;
