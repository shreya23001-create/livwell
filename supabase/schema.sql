-- ================================================================
-- LIVWELL REAL ESTATE — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ================================================================

-- ── PROFILES (extends Supabase auth.users) ──────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  email       text not null,
  phone       text,
  role        text not null default 'customer' check (role in ('super_admin','admin','agent','customer')),
  status      text not null default 'active' check (status in ('active','inactive','suspended','pending_verification')),
  avatar_url  text,
  bio         text,
  designation text,
  languages   text[],
  whatsapp    text,
  areas       text[],
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── PROPERTIES ───────────────────────────────────────────────
create table if not exists public.properties (
  id              bigserial primary key,
  title           text not null,
  reference_no    text unique,
  type            text not null,
  listing_type    text not null check (listing_type in ('Sale','Rent','Off-Plan')),
  status          text not null default 'Draft' check (status in ('Draft','Pending Review','Published','Archived','Sold','Rented')),
  price           numeric not null,
  price_label     text,
  bedrooms        int,
  bathrooms       int,
  area_sqft       numeric,
  floor           int,
  furnishing      text,
  community       text,
  sub_community   text,
  building        text,
  address         text,
  city            text default 'Dubai',
  country         text default 'UAE',
  lat             numeric,
  lng             numeric,
  description     text,
  short_desc      text,
  amenities       text[],
  images          text[],
  video_url       text,
  floor_plan_url  text,
  permit_no       text,
  developer       text,
  completion_date text,
  is_featured     boolean default false,
  badge           text,
  agent_id        uuid references public.profiles(id),
  views           int default 0,
  meta_title      text,
  meta_desc       text,
  slug            text unique,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── LEADS ────────────────────────────────────────────────────
create table if not exists public.leads (
  id              bigserial primary key,
  name            text not null,
  email           text not null,
  phone           text,
  message         text,
  status          text not null default 'New' check (status in ('New','Contacted','Active','Viewing Scheduled','Viewing Done','Offer Made','Negotiation','Won','Lost')),
  source          text default 'Website',
  priority        text default 'Normal' check (priority in ('Hot','Warm','Cold','Normal')),
  property_id     bigint references public.properties(id),
  agent_id        uuid references public.profiles(id),
  loss_reason     text,
  expected_close  date,
  budget          text,
  requirements    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── LEAD ACTIVITIES (timeline) ───────────────────────────────
create table if not exists public.lead_activities (
  id          bigserial primary key,
  lead_id     bigint references public.leads(id) on delete cascade,
  actor_id    uuid references public.profiles(id),
  actor_name  text,
  type        text not null check (type in ('note','call','email','viewing','status_change','assignment','reminder')),
  content     text,
  old_value   text,
  new_value   text,
  created_at  timestamptz default now()
);

-- ── SAVED PROPERTIES (wishlist) ──────────────────────────────
create table if not exists public.saved_properties (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  property_id bigint references public.properties(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, property_id)
);

-- ── ENQUIRIES ────────────────────────────────────────────────
create table if not exists public.enquiries (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id),
  lead_id     bigint references public.leads(id),
  property_id bigint references public.properties(id),
  status      text default 'New',
  agent_name  text,
  created_at  timestamptz default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists public.notifications (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text not null,
  message     text,
  type        text default 'info',
  read        boolean default false,
  link        text,
  created_at  timestamptz default now()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table public.profiles         enable row level security;
alter table public.properties       enable row level security;
alter table public.leads            enable row level security;
alter table public.lead_activities  enable row level security;
alter table public.saved_properties enable row level security;
alter table public.enquiries        enable row level security;
alter table public.notifications    enable row level security;

-- Profiles: users can read own profile; admins can read all
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

-- Properties: published ones are public; agents/admins manage all
create policy "Anyone can view published properties"
  on public.properties for select using (status = 'Published');

create policy "Agents and admins can view all properties"
  on public.properties for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

create policy "Admins can insert properties"
  on public.properties for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

create policy "Admins can update properties"
  on public.properties for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

-- Leads: agents see own leads; admins see all
create policy "Agents see own leads"
  on public.leads for select
  using (agent_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

create policy "Anyone can create a lead"
  on public.leads for insert with check (true);

create policy "Agents and admins can update leads"
  on public.leads for update
  using (agent_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

-- Saved properties: users manage own
create policy "Users manage own saved properties"
  on public.saved_properties for all using (user_id = auth.uid());

-- Notifications: users see own
create policy "Users see own notifications"
  on public.notifications for all using (user_id = auth.uid());

-- Lead activities
create policy "Agents and admins view lead activities"
  on public.lead_activities for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

create policy "Agents and admins insert lead activities"
  on public.lead_activities for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent')));

-- ================================================================
-- TRIGGER: auto-create profile on signup
-- ================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
