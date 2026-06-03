-- ================================================================
-- Admin users table — standalone, no auth.users dependency
-- Run in Supabase SQL Editor
-- ================================================================

create table if not exists public.admin_users (
  id           bigserial primary key,
  name         text not null,
  email        text not null unique,
  phone        text,
  role         text not null default 'customer'
                 check (role in ('super_admin','admin','agent','customer')),
  status       text not null default 'active'
                 check (status in ('active','pending_verification','suspended','locked')),
  joined_date  date default current_date,
  last_active  date default current_date,
  properties_count int default 0,
  leads_count      int default 0,
  created_at   timestamptz default now()
);

alter table public.admin_users enable row level security;

create policy "Authenticated users manage admin_users"
  on public.admin_users for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
