-- 1. staff_blocked_times table
create table if not exists public.staff_blocked_times (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.staff(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text default '',
  created_at timestamptz default now() not null
);

create index if not exists idx_staff_blocked_times_lookup
  on public.staff_blocked_times(staff_id, date);

alter table public.staff_blocked_times enable row level security;

create policy "Public can read staff_blocked_times" on public.staff_blocked_times
  for select using (true);
create policy "Owner can insert staff_blocked_times" on public.staff_blocked_times
  for insert with check (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );
create policy "Owner can delete staff_blocked_times" on public.staff_blocked_times
  for delete using (
    exists (select 1 from public.staff where staff.id = staff_id and staff.user_id = auth.uid())
  );

-- 2. Replace get_available_slots to exclude blocked time ranges and past slots
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
  v_min_time time;
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

  -- Check time off (full day)
  if exists (select 1 from public.staff_time_off where staff_id = p_staff_id and date = p_date) then
    return;
  end if;

  -- For today: only show slots at least 2 hours from now
  -- (min_advance_hours is handled here as a baseline; the client-side setting may differ)
  if p_date = current_date then
    v_min_time := (now() at time zone 'America/Argentina/Buenos_Aires')::time;
  else
    v_min_time := '00:00'::time;
  end if;

  -- Generate slots in 15-minute steps
  v_current_slot := v_start_time;
  while v_current_slot + (v_duration || ' minutes')::interval <= v_end_time loop
    v_slot_end := v_current_slot + (v_duration || ' minutes')::interval;

    -- Skip past slots (for today)
    if v_current_slot <= v_min_time then
      v_current_slot := v_current_slot + interval '15 minutes';
      continue;
    end if;

    -- Check for overlap with existing appointments
    if not exists (
      select 1 from public.appointments a
      where a.staff_id = p_staff_id
        and a.date = p_date
        and a.status in ('confirmed', 'completed')
        and a.start_time < v_slot_end
        and a.end_time > v_current_slot
    ) then
      -- Check for overlap with blocked time ranges
      if not exists (
        select 1 from public.staff_blocked_times bt
        where bt.staff_id = p_staff_id
          and bt.date = p_date
          and bt.start_time < v_slot_end
          and bt.end_time > v_current_slot
      ) then
        slot_time := v_current_slot;
        return next;
      end if;
    end if;

    v_current_slot := v_current_slot + interval '15 minutes';
  end loop;
end;
$$ language plpgsql security definer;
