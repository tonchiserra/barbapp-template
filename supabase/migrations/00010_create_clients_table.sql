-- clients table: tracks unique customers by phone or email
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text not null default '',
  email text not null default '',
  total_appointments integer not null default 0,
  -- appointments per day of week (0=Sunday .. 6=Saturday)
  dow_0 integer not null default 0,
  dow_1 integer not null default 0,
  dow_2 integer not null default 0,
  dow_3 integer not null default 0,
  dow_4 integer not null default 0,
  dow_5 integer not null default 0,
  dow_6 integer not null default 0,
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

-- Function: upsert client on appointment creation
-- Matches by phone or email within the same user_id
-- Increments total_appointments and the corresponding dow counter
create or replace function public.upsert_client(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_day_of_week integer
)
returns uuid as $$
declare
  v_client_id uuid;
  v_dow_col text;
begin
  v_dow_col := 'dow_' || p_day_of_week;

  -- Try to find existing client by phone (if provided)
  if p_phone <> '' then
    select id into v_client_id
      from public.clients
      where user_id = p_user_id and phone = p_phone
      limit 1;
  end if;

  -- If not found by phone, try by email (if provided)
  if v_client_id is null and p_email <> '' then
    select id into v_client_id
      from public.clients
      where user_id = p_user_id and email = p_email
      limit 1;
  end if;

  if v_client_id is not null then
    -- Update existing client: increment counters, update name/email if provided
    execute format(
      'update public.clients set total_appointments = total_appointments + 1, %I = %I + 1, name = $1, email = case when $2 <> '''' then $2 else email end, phone = case when $3 <> '''' then $3 else phone end where id = $4',
      v_dow_col, v_dow_col
    ) using p_name, p_email, p_phone, v_client_id;
  else
    -- Insert new client
    execute format(
      'insert into public.clients (user_id, name, phone, email, total_appointments, %I) values ($1, $2, $3, $4, 1, 1) returning id',
      v_dow_col
    ) into v_client_id using p_user_id, p_name, p_phone, p_email;
  end if;

  return v_client_id;
end;
$$ language plpgsql security definer;
