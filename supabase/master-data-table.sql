-- ================================================================
-- Master Data table — categories, property types, statuses
-- Run in Supabase SQL Editor
-- ================================================================

create table if not exists public.master_data (
  id         bigserial primary key,
  type       text not null check (type in ('category','property_type','status')),
  name       text not null,
  color      text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (type, name)
);

alter table public.master_data enable row level security;

create policy "Authenticated manage master_data"
  on public.master_data for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed default values
insert into public.master_data (type, name, sort_order) values
  ('category', 'Sale',     1),
  ('category', 'Rent',     2),
  ('category', 'Off-Plan', 3)
on conflict do nothing;

insert into public.master_data (type, name, sort_order) values
  ('property_type', 'Apartment',  1),
  ('property_type', 'Villa',      2),
  ('property_type', 'Townhouse',  3),
  ('property_type', 'Penthouse',  4),
  ('property_type', 'Studio',     5),
  ('property_type', 'Office',     6)
on conflict do nothing;

insert into public.master_data (type, name, color, sort_order) values
  ('status', 'Draft',          '#6b7280', 1),
  ('status', 'Pending Review', '#f59e0b', 2),
  ('status', 'Published',      '#10b981', 3),
  ('status', 'Archived',       '#8b5cf6', 4),
  ('status', 'Sold',           '#3b82f6', 5),
  ('status', 'Rented',         '#6366f1', 6)
on conflict do nothing;
