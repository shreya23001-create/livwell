-- ================================================================
-- LIVWELL — Projects Table Migration
-- Run this in Supabase SQL Editor
-- ================================================================

create table if not exists public.projects (
  id              bigserial primary key,
  title           text not null,
  developer       text,
  location        text,
  community       text,
  type            text check (type in ('Apartment','Villa','Townhouse','Penthouse','Home','Mixed','Duplex')),
  status          text not null default 'Draft' check (status in ('Draft','Published','Archived')),
  price_from      numeric,
  price_label     text,
  price_per_sqft  text,
  beds            text,
  bathrooms       int,
  area_sqft       numeric,
  completion_date text,
  payment_plan    text,
  description     text,
  amenities       text[],
  images          text[],
  floor_plan_url  text,
  badge           text,
  is_featured     boolean default false,
  is_luxury       boolean default false,
  is_ultra_luxury boolean default false,
  agent_name      text,
  meta_title      text,
  meta_desc       text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RLS
alter table public.projects enable row level security;

-- Public can read published projects
create policy "Public read published projects"
  on public.projects for select
  using (status = 'Published');

-- Admins can do everything
create policy "Admins full access to projects"
  on public.projects for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin','super_admin')
    )
  );

-- Agents can read all + update their own
create policy "Agents read all projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'agent'
    )
  );

create policy "Agents update own projects"
  on public.projects for update
  using (
    agent_name = (
      select name from public.profiles where id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function public.handle_project_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_project_updated_at();
