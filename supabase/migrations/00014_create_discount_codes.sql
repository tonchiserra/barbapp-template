-- Discount codes table
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

create policy "Public can read discount_codes" on public.discount_codes
  for select using (true);
create policy "Owner can insert discount_codes" on public.discount_codes
  for insert with check (auth.uid() = user_id);
create policy "Owner can update discount_codes" on public.discount_codes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner can delete discount_codes" on public.discount_codes
  for delete using (auth.uid() = user_id);

create trigger on_discount_codes_updated before update on public.discount_codes
  for each row execute function public.handle_updated_at();

-- Add discount tracking columns to appointments
alter table public.appointments
  add column if not exists discount_code_id uuid references public.discount_codes(id) on delete set null,
  add column if not exists discount_percent integer default 0,
  add column if not exists original_price numeric(10,2);

-- Atomic function to validate and consume a discount code
create or replace function public.use_discount_code(
  p_code text,
  p_user_id uuid
)
returns table(
  discount_code_id uuid,
  discount_percent integer
) as $$
declare
  v_row public.discount_codes%rowtype;
begin
  select * into v_row
    from public.discount_codes
    where user_id = p_user_id
      and upper(code) = upper(p_code)
      and is_active = true
    for update;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if v_row.used_count >= v_row.max_uses then
    raise exception 'CODE_EXHAUSTED';
  end if;

  update public.discount_codes
    set used_count = used_count + 1
    where id = v_row.id;

  discount_code_id := v_row.id;
  discount_percent := v_row.discount_percent;
  return next;
end;
$$ language plpgsql security definer;
