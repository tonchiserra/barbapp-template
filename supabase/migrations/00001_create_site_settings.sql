create table if not exists public.site_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  header jsonb default '{
    "logo_type": "text",
    "logo_text": "Mi Barberia",
    "logo_image_url": "",
    "menu_links": [],
    "social_links": {
      "instagram": null,
      "facebook": null,
      "tiktok": null,
      "whatsapp": null,
      "x": null,
      "youtube": null,
      "telegram": null
    },
    "is_visible": true
  }'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_site_settings_user_id on public.site_settings(user_id);

alter table public.site_settings enable row level security;

create policy "Public can read site_settings"
  on public.site_settings for select using (true);

create policy "Users can insert own site_settings"
  on public.site_settings for insert with check (auth.uid() = user_id);

create policy "Users can update own site_settings"
  on public.site_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own site_settings"
  on public.site_settings for delete using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_site_settings_updated
  before update on public.site_settings
  for each row
  execute function public.handle_updated_at();
