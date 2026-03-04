alter table site_settings
  add column if not exists theme jsonb
  default '{"background":"#ffffff","foreground":"#121212","primary":"#007AFF","secondary":"#f5f5f6"}'::jsonb;
