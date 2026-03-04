-- 1. Add booking JSONB column to site_settings
alter table public.site_settings
  add column if not exists booking jsonb
  default '{"title":"Reserva tu turno","description":"","advance_days":30,"min_advance_hours":2,"is_visible":true}'::jsonb;

-- 2. services table
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  price numeric(10,2) default 0,
  duration_minutes integer not null default 30,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_services_user_id on public.services(user_id);

alter table public.services enable row level security;

create policy "Public can read services" on public.services
  for select using (true);
create policy "Owner can insert services" on public.services
  for insert with check (auth.uid() = user_id);
create policy "Owner can update services" on public.services
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete services" on public.services
  for delete using (auth.uid() = user_id);

create trigger on_services_updated before update on public.services
  for each row execute function public.handle_updated_at();

-- 3. staff table
create table if not exists public.staff (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  avatar_url text default '',
  is_owner boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_staff_user_id on public.staff(user_id);

alter table public.staff enable row level security;

create policy "Public can read staff" on public.staff
  for select using (true);
create policy "Owner can insert staff" on public.staff
  for insert with check (auth.uid() = user_id);
create policy "Owner can update staff" on public.staff
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete staff" on public.staff
  for delete using (auth.uid() = user_id);

create trigger on_staff_updated before update on public.staff
  for each row execute function public.handle_updated_at();

-- 4. staff_services (many-to-many)
create table if not exists public.staff_services (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  price_override numeric(10,2),
  duration_override integer,
  unique(staff_id, service_id)
);

alter table public.staff_services enable row level security;

create policy "Public can read staff_services" on public.staff_services
  for select using (true);
create policy "Owner can insert staff_services" on public.staff_services
  for insert with check (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can update staff_services" on public.staff_services
  for update using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can delete staff_services" on public.staff_services
  for delete using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );

-- 5. staff_schedules
create table if not exists public.staff_schedules (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  is_working boolean default true,
  unique(staff_id, day_of_week)
);

alter table public.staff_schedules enable row level security;

create policy "Public can read staff_schedules" on public.staff_schedules
  for select using (true);
create policy "Owner can insert staff_schedules" on public.staff_schedules
  for insert with check (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can update staff_schedules" on public.staff_schedules
  for update using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can delete staff_schedules" on public.staff_schedules
  for delete using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );

-- 6. staff_time_off
create table if not exists public.staff_time_off (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  date date not null,
  reason text default '',
  unique(staff_id, date)
);

alter table public.staff_time_off enable row level security;

create policy "Public can read staff_time_off" on public.staff_time_off
  for select using (true);
create policy "Owner can insert staff_time_off" on public.staff_time_off
  for insert with check (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can update staff_time_off" on public.staff_time_off
  for update using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can delete staff_time_off" on public.staff_time_off
  for delete using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );

-- 7. appointments
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

-- 8. Slot availability function (SECURITY DEFINER to bypass RLS for guest queries)
create or replace function public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
returns table(slot_time time) as $$
declare
  v_duration integer;
  v_day_of_week integer;
  v_start_time time;
  v_end_time time;
  v_is_working boolean;
  v_current_slot time;
  v_slot_end time;
begin
  -- Get service duration (respect staff override)
  select coalesce(ss.duration_override, s.duration_minutes)
    into v_duration
    from public.services s
    left join public.staff_services ss on ss.service_id = s.id and ss.staff_id = p_staff_id
    where s.id = p_service_id;

  if v_duration is null then
    return;
  end if;

  -- Get day of week (0=Sunday, matches JS getDay())
  v_day_of_week := extract(dow from p_date)::integer;

  -- Get schedule for that day
  select sch.start_time, sch.end_time, sch.is_working
    into v_start_time, v_end_time, v_is_working
    from public.staff_schedules sch
    where sch.staff_id = p_staff_id and sch.day_of_week = v_day_of_week;

  -- No schedule or not working
  if not found or not v_is_working then
    return;
  end if;

  -- Check time off
  if exists (select 1 from public.staff_time_off where staff_id = p_staff_id and date = p_date) then
    return;
  end if;

  -- Generate slots in 15-minute steps
  v_current_slot := v_start_time;
  while v_current_slot + (v_duration || ' minutes')::interval <= v_end_time loop
    v_slot_end := v_current_slot + (v_duration || ' minutes')::interval;

    -- Check for overlap with existing non-cancelled appointments
    if not exists (
      select 1 from public.appointments a
      where a.staff_id = p_staff_id
        and a.date = p_date
        and a.status in ('confirmed', 'completed')
        and a.start_time < v_slot_end
        and a.end_time > v_current_slot
    ) then
      slot_time := v_current_slot;
      return next;
    end if;

    v_current_slot := v_current_slot + interval '15 minutes';
  end loop;
end;
$$ language plpgsql security definer;
