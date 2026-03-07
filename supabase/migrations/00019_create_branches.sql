-- Branches (sucursales) for multi-location businesses

-- 1. Create table and add staff FK first (before RLS policies to avoid deadlock)
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

alter table public.staff
  add column branch_id uuid references public.branches(id) on delete set null;

-- 2. Enable RLS and add policies after all DDL is done
alter table public.branches enable row level security;

create policy "Owner full access on branches"
  on public.branches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public read active branches"
  on public.branches for select
  using (is_active = true);
