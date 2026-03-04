alter table site_settings
  add column if not exists map jsonb
  default '{"title":"","description":"","locations":[],"is_visible":true}'::jsonb;
