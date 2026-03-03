alter table site_settings
  add column if not exists carousel jsonb
  default '{"slides":[],"auto_slide":true,"is_visible":true}'::jsonb;
