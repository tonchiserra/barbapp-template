alter table site_settings
  add column if not exists multicolumn jsonb
  default '{"title":"","blocks":[],"cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb;
