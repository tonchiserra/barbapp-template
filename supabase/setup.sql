-- =============================================================================
-- Barbapp: Setup completo de base de datos
-- Ejecutar en Supabase SQL Editor en un proyecto nuevo
-- =============================================================================

-- =============================================================================
-- 1. FUNCIONES UTILITARIAS
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- 2. STORAGE
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Authenticated users can update own images"
  on storage.objects for update
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');

-- =============================================================================
-- 3. SITE SETTINGS (landing page config, 1 row por usuario, JSONB por seccion)
-- =============================================================================

create table if not exists public.site_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  header jsonb default '{
    "logo_type": "text",
    "logo_text": "Mi Barberia",
    "logo_image_url": "",
    "menu_links": [],
    "social_links": {
      "instagram": null, "facebook": null, "tiktok": null,
      "whatsapp": null, "x": null, "youtube": null, "telegram": null
    },
    "is_visible": true
  }'::jsonb,
  footer jsonb default '{"menu_links":[],"social_links":{"instagram":null,"facebook":null,"tiktok":null,"whatsapp":null,"x":null,"youtube":null,"telegram":null},"is_visible":true}'::jsonb,
  carousel jsonb default '{"slides":[],"auto_slide":true,"is_visible":true}'::jsonb,
  video jsonb default '{"title":"","youtube_url":"","description":"","cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb,
  gallery jsonb default '{"title":"","description":"","images":[],"cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb,
  multicolumn jsonb default '{"title":"","blocks":[],"cta_label":"","cta_url":"","cta_variant":"primary","is_visible":true}'::jsonb,
  booking jsonb default '{"title":"Reserva tu turno","description":"","advance_days":30,"min_advance_hours":2,"is_visible":true}'::jsonb,
  map jsonb default '{"title":"","description":"","locations":[],"is_visible":true}'::jsonb,
  theme jsonb default '{"background":"#ffffff","foreground":"#121212","primary":"#007AFF","secondary":"#f5f5f6"}'::jsonb,
  email jsonb default '{"subject":"Gracias por tu visita, {nombre}!","greeting":"Gracias por tu visita, {nombre}!","body":"Tu turno fue completado con exito. Aca tenes el resumen:","farewell":"Te esperamos de nuevo!"}'::jsonb,
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
  on public.site_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own site_settings"
  on public.site_settings for delete using (auth.uid() = user_id);

create trigger on_site_settings_updated before update on public.site_settings
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 4. BRANCHES (sucursales)
-- =============================================================================

create table if not exists public.branches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null default '',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.branches enable row level security;

create policy "Owner full access on branches"
  on public.branches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public read active branches"
  on public.branches for select using (is_active = true);

-- =============================================================================
-- 5. STAFF (profesionales)
-- =============================================================================

create table if not exists public.staff (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  avatar_url text default '',
  branch_id uuid references public.branches(id) on delete set null,
  is_owner boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_staff_user_id on public.staff(user_id);

alter table public.staff enable row level security;

create policy "Public can read staff" on public.staff for select using (true);
create policy "Owner can insert staff" on public.staff
  for insert with check (auth.uid() = user_id);
create policy "Owner can update staff" on public.staff
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete staff" on public.staff
  for delete using (auth.uid() = user_id);

create trigger on_staff_updated before update on public.staff
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 6. SERVICES (servicios, pertenecen a un staff)
-- =============================================================================

create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  name text not null,
  description text default '',
  price_transfer numeric(10,2),
  price_cash numeric(10,2),
  duration_minutes integer not null default 30,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_services_user_id on public.services(user_id);
create index if not exists idx_services_staff_id on public.services(staff_id);

alter table public.services enable row level security;

create policy "Public can read services" on public.services for select using (true);
create policy "Owner can insert services" on public.services
  for insert with check (auth.uid() = user_id);
create policy "Owner can update services" on public.services
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete services" on public.services
  for delete using (auth.uid() = user_id);

create trigger on_services_updated before update on public.services
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 7. STAFF SCHEDULES (horarios, multiples rangos por dia)
-- =============================================================================

create table if not exists public.staff_schedules (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  is_working boolean default true
);

alter table public.staff_schedules enable row level security;

create policy "Public can read staff_schedules" on public.staff_schedules for select using (true);
create policy "Owner can insert staff_schedules" on public.staff_schedules
  for insert with check (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));
create policy "Owner can update staff_schedules" on public.staff_schedules
  for update using (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));
create policy "Owner can delete staff_schedules" on public.staff_schedules
  for delete using (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));

-- =============================================================================
-- 8. STAFF TIME OFF (dias libres)
-- =============================================================================

create table if not exists public.staff_time_off (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  date date not null,
  reason text default '',
  unique(staff_id, date)
);

alter table public.staff_time_off enable row level security;

create policy "Public can read staff_time_off" on public.staff_time_off for select using (true);
create policy "Owner can insert staff_time_off" on public.staff_time_off
  for insert with check (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));
create policy "Owner can update staff_time_off" on public.staff_time_off
  for update using (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));
create policy "Owner can delete staff_time_off" on public.staff_time_off
  for delete using (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));

-- =============================================================================
-- 9. STAFF BLOCKED TIMES (bloqueos parciales)
-- =============================================================================

create table if not exists public.staff_blocked_times (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text default '',
  created_at timestamptz default now() not null
);

create index if not exists idx_staff_blocked_times_lookup on public.staff_blocked_times(staff_id, date);

alter table public.staff_blocked_times enable row level security;

create policy "Public can read staff_blocked_times" on public.staff_blocked_times for select using (true);
create policy "Owner can insert staff_blocked_times" on public.staff_blocked_times
  for insert with check (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));
create policy "Owner can delete staff_blocked_times" on public.staff_blocked_times
  for delete using (exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid()));

-- =============================================================================
-- 10. DISCOUNT CODES (codigos de descuento)
-- =============================================================================

create table if not exists public.discount_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  max_uses integer not null check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, code)
);

create index if not exists idx_discount_codes_user_id on public.discount_codes(user_id);

alter table public.discount_codes enable row level security;

create policy "Public can read discount_codes" on public.discount_codes for select using (true);
create policy "Owner can insert discount_codes" on public.discount_codes
  for insert with check (auth.uid() = user_id);
create policy "Owner can update discount_codes" on public.discount_codes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete discount_codes" on public.discount_codes
  for delete using (auth.uid() = user_id);

create trigger on_discount_codes_updated before update on public.discount_codes
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 11. APPOINTMENTS (turnos)
-- =============================================================================

create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  client_name text not null,
  client_phone text not null,
  client_email text default '',
  date date not null,
  start_time time not null,
  end_time time not null,
  price numeric(10,2) not null default 0,
  discount_code_id uuid references public.discount_codes(id) on delete set null,
  discount_percent integer default 0,
  original_price numeric(10,2),
  payment_method text check (payment_method in ('cash', 'transfer')),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_staff_date on public.appointments(staff_id, date);
create index if not exists idx_appointments_date on public.appointments(date);

alter table public.appointments enable row level security;

create policy "Owner can read appointments" on public.appointments
  for select using (auth.uid() = user_id);
create policy "Anyone can book appointments" on public.appointments
  for insert with check (true);
create policy "Owner can update appointments" on public.appointments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete appointments" on public.appointments
  for delete using (auth.uid() = user_id);

create trigger on_appointments_updated before update on public.appointments
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 12. CLIENTS (auto-generados desde reservas)
-- =============================================================================

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text not null default '',
  email text not null default '',
  total_appointments integer not null default 0,
  dow_0 integer not null default 0,
  dow_1 integer not null default 0,
  dow_2 integer not null default 0,
  dow_3 integer not null default 0,
  dow_4 integer not null default 0,
  dow_5 integer not null default 0,
  dow_6 integer not null default 0,
  top_service_id uuid references public.services(id) on delete set null,
  top_staff_id uuid references public.staff(id) on delete set null,
  top_payment_method text,
  top_branch_id uuid references public.branches(id) on delete set null,
  last_visit_date date,
  no_show_count integer not null default 0,
  cancellation_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_clients_user_id on public.clients(user_id);
create unique index if not exists idx_clients_user_phone
  on public.clients(user_id, phone) where phone <> '';
create unique index if not exists idx_clients_user_email
  on public.clients(user_id, email) where email <> '';

alter table public.clients enable row level security;

create policy "Owner can read clients" on public.clients
  for select using (auth.uid() = user_id);
create policy "Anyone can insert clients" on public.clients
  for insert with check (true);
create policy "Anyone can update clients" on public.clients
  for update using (true);

create trigger on_clients_updated before update on public.clients
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 13. FUNCIONES DE NEGOCIO
-- =============================================================================

-- Generacion inteligente de slots disponibles
-- Ancla slots a limites de turnos existentes, avanza por duracion del servicio
create or replace function public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
returns table(slot_time time) as $$
declare
  v_duration integer;
  v_day_of_week integer;
  v_min_time time;
  v_sched record;
  v_occupied record;
  v_window_start time;
  v_window_end time;
  v_current_slot time;
begin
  select s.duration_minutes into v_duration
    from public.services s
    where s.id = p_service_id and s.staff_id = p_staff_id;

  if v_duration is null then return; end if;

  v_day_of_week := extract(dow from p_date)::integer;

  if not exists (
    select 1 from public.staff_schedules sch
    where sch.staff_id = p_staff_id and sch.day_of_week = v_day_of_week and sch.is_working = true
  ) then return; end if;

  if exists (select 1 from public.staff_time_off where staff_id = p_staff_id and date = p_date) then
    return;
  end if;

  if p_date = current_date then
    v_min_time := (now() at time zone 'America/Argentina/Buenos_Aires')::time;
  else
    v_min_time := '00:00'::time;
  end if;

  for v_sched in
    select sch.start_time, sch.end_time
    from public.staff_schedules sch
    where sch.staff_id = p_staff_id and sch.day_of_week = v_day_of_week and sch.is_working = true
    order by sch.start_time
  loop
    v_window_start := v_sched.start_time;

    for v_occupied in
      select occ.start_time, occ.end_time from (
        select a.start_time, a.end_time
        from public.appointments a
        where a.staff_id = p_staff_id and a.date = p_date
          and a.status in ('confirmed', 'completed')
          and a.start_time < v_sched.end_time and a.end_time > v_sched.start_time
        union all
        select bt.start_time, bt.end_time
        from public.staff_blocked_times bt
        where bt.staff_id = p_staff_id and bt.date = p_date
          and bt.start_time < v_sched.end_time and bt.end_time > v_sched.start_time
      ) occ
      order by occ.start_time
    loop
      v_window_end := least(v_occupied.start_time, v_sched.end_time);
      v_current_slot := v_window_start;
      while v_current_slot + (v_duration || ' minutes')::interval <= v_window_end loop
        if v_current_slot > v_min_time then
          slot_time := v_current_slot;
          return next;
        end if;
        v_current_slot := v_current_slot + (v_duration || ' minutes')::interval;
      end loop;
      v_window_start := greatest(v_window_start, v_occupied.end_time);
    end loop;

    v_current_slot := v_window_start;
    while v_current_slot + (v_duration || ' minutes')::interval <= v_sched.end_time loop
      if v_current_slot > v_min_time then
        slot_time := v_current_slot;
        return next;
      end if;
      v_current_slot := v_current_slot + (v_duration || ' minutes')::interval;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;

-- Validar y consumir codigo de descuento (atomico)
create or replace function public.use_discount_code(
  p_code text,
  p_user_id uuid
)
returns table(discount_code_id uuid, discount_percent integer) as $$
declare
  v_row public.discount_codes%rowtype;
begin
  select * into v_row
    from public.discount_codes
    where user_id = p_user_id and upper(code) = upper(p_code) and is_active = true
    for update;

  if not found then raise exception 'INVALID_CODE'; end if;
  if v_row.used_count >= v_row.max_uses then raise exception 'CODE_EXHAUSTED'; end if;

  update public.discount_codes set used_count = used_count + 1 where id = v_row.id;

  discount_code_id := v_row.id;
  discount_percent := v_row.discount_percent;
  return next;
end;
$$ language plpgsql security definer;

-- Upsert cliente al crear turno (con recomputo de preferencias)
create or replace function public.upsert_client(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_day_of_week integer,
  p_service_id uuid default null,
  p_staff_id uuid default null
)
returns uuid as $$
declare
  v_client_id uuid;
  v_dow_col text;
  v_match_phone text;
  v_match_email text;
begin
  v_dow_col := 'dow_' || p_day_of_week;

  if p_phone <> '' then
    select id into v_client_id from public.clients
      where user_id = p_user_id and phone = p_phone limit 1;
  end if;

  if v_client_id is null and p_email <> '' then
    select id into v_client_id from public.clients
      where user_id = p_user_id and email = p_email limit 1;
  end if;

  if v_client_id is not null then
    execute format(
      'update public.clients set total_appointments = total_appointments + 1, %I = %I + 1, name = $1, email = case when $2 <> '''' then $2 else email end, phone = case when $3 <> '''' then $3 else phone end where id = $4',
      v_dow_col, v_dow_col
    ) using p_name, p_email, p_phone, v_client_id;
  else
    execute format(
      'insert into public.clients (user_id, name, phone, email, total_appointments, %I) values ($1, $2, $3, $4, 1, 1) returning id',
      v_dow_col
    ) into v_client_id using p_user_id, p_name, p_phone, p_email;
  end if;

  select phone, email into v_match_phone, v_match_email
    from public.clients where id = v_client_id;

  update public.clients set
    top_service_id = (
      select a.service_id from public.appointments a
      where a.user_id = p_user_id and a.status in ('confirmed', 'completed')
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
      group by a.service_id order by count(*) desc limit 1
    ),
    top_staff_id = (
      select a.staff_id from public.appointments a
      where a.user_id = p_user_id and a.status in ('confirmed', 'completed')
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
      group by a.staff_id order by count(*) desc limit 1
    ),
    top_payment_method = (
      select a.payment_method from public.appointments a
      where a.user_id = p_user_id and a.status = 'completed' and a.payment_method is not null
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
      group by a.payment_method order by count(*) desc limit 1
    ),
    top_branch_id = (
      select s.branch_id from public.appointments a
      join public.staff s on s.id = a.staff_id
      where a.user_id = p_user_id and a.status in ('confirmed', 'completed') and s.branch_id is not null
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
      group by s.branch_id order by count(*) desc limit 1
    ),
    last_visit_date = (
      select max(a.date) from public.appointments a
      where a.user_id = p_user_id and a.status = 'completed'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    ),
    no_show_count = (
      select count(*) from public.appointments a
      where a.user_id = p_user_id and a.status = 'no_show'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    ),
    cancellation_count = (
      select count(*) from public.appointments a
      where a.user_id = p_user_id and a.status = 'cancelled'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    )
  where id = v_client_id;

  return v_client_id;
end;
$$ language plpgsql security definer;

-- Actualizar contadores del cliente al cambiar estado de turno
create or replace function public.update_client_on_status_change(
  p_user_id uuid,
  p_phone text,
  p_email text
)
returns void as $$
declare
  v_client_id uuid;
  v_match_phone text;
  v_match_email text;
begin
  if p_phone <> '' then
    select id, phone, email into v_client_id, v_match_phone, v_match_email
      from public.clients where user_id = p_user_id and phone = p_phone limit 1;
  end if;

  if v_client_id is null and p_email <> '' then
    select id, phone, email into v_client_id, v_match_phone, v_match_email
      from public.clients where user_id = p_user_id and email = p_email limit 1;
  end if;

  if v_client_id is null then return; end if;

  update public.clients set
    top_payment_method = (
      select a.payment_method from public.appointments a
      where a.user_id = p_user_id and a.status = 'completed' and a.payment_method is not null
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
      group by a.payment_method order by count(*) desc limit 1
    ),
    last_visit_date = (
      select max(a.date) from public.appointments a
      where a.user_id = p_user_id and a.status = 'completed'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    ),
    no_show_count = (
      select count(*) from public.appointments a
      where a.user_id = p_user_id and a.status = 'no_show'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    ),
    cancellation_count = (
      select count(*) from public.appointments a
      where a.user_id = p_user_id and a.status = 'cancelled'
        and ((v_match_phone <> '' and a.client_phone = v_match_phone)
          or (v_match_phone = '' and v_match_email <> '' and a.client_email = v_match_email))
    )
  where id = v_client_id;
end;
$$ language plpgsql security definer;
