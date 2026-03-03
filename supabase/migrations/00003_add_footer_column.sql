alter table site_settings
  add column if not exists footer jsonb
  default '{"menu_links":[],"social_links":{"instagram":null,"facebook":null,"tiktok":null,"whatsapp":null,"x":null,"youtube":null,"telegram":null},"is_visible":true}'::jsonb;
