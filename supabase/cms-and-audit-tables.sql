-- ================================================================
-- CMS Tables + Audit Logs — run in Supabase SQL Editor
-- ================================================================

-- ── CMS BANNERS ──────────────────────────────────────────────
create table if not exists public.cms_banners (
  id         bigserial primary key,
  title      text not null,
  subtitle   text,
  cta_text   text,
  cta_link   text,
  status     text not null default 'active' check (status in ('active','inactive')),
  sort_order int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cms_banners enable row level security;
create policy "Authenticated manage cms_banners" on public.cms_banners
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed default banners
insert into public.cms_banners (title, subtitle, cta_text, cta_link, status, sort_order) values
  ('Find Your Dream Home in Dubai',   'Browse 500+ exclusive properties across prime locations', 'Browse Properties', '/properties', 'active',   1),
  ('Exclusive Off-Plan Launches',     'Be the first to access new development projects in Dubai', 'View Off-Plan',   '/off-plan',   'active',   2),
  ('Work With Top Agents',            'Connect with certified real estate experts across the UAE', 'Meet Our Agents', '/agents',     'inactive', 3)
on conflict do nothing;

-- ── CMS ANNOUNCEMENTS ────────────────────────────────────────
create table if not exists public.cms_announcements (
  id          bigserial primary key,
  title       text not null,
  body        text not null,
  type        text not null default 'info' check (type in ('info','success','warning')),
  active      boolean default true,
  expires_on  date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.cms_announcements enable row level security;
create policy "Authenticated manage cms_announcements" on public.cms_announcements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed default announcements
insert into public.cms_announcements (title, body, type, active, expires_on) values
  ('New Off-Plan Projects Available', 'We have just added 12 new off-plan projects from top developers.', 'info',    true,  '2026-12-31'),
  ('Livwell App Now Available',       'Download our mobile app on iOS and Android.',                        'success', true,  '2026-12-31'),
  ('Ramadan Office Hours',            'Offices operate 9am–3pm during Ramadan.',                           'warning', false, '2026-04-10')
on conflict do nothing;

-- ── CMS PAGES ────────────────────────────────────────────────
create table if not exists public.cms_pages (
  id          text primary key,
  label       text not null,
  heading     text,
  subheading  text,
  body        text,
  updated_at  timestamptz default now()
);

alter table public.cms_pages enable row level security;
create policy "Authenticated manage cms_pages" on public.cms_pages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed default pages
insert into public.cms_pages (id, label, heading, subheading, body) values
  ('home-hero',    'Home — Hero Section',    'Find Your Dream Home in Dubai',          'Browse 500+ exclusive properties across prime locations in the UAE', ''),
  ('about-hero',   'About Us — Hero',        'Dubai''s Premier Real Estate Platform',  'Connecting buyers, sellers and investors with verified properties since 2018', 'Livwell Real Estate is a leading property platform in the UAE...'),
  ('contact-info', 'Contact — Office Info',  'Get In Touch',                           'Our team is available 7 days a week', E'Office: Al-Barsha Business Centre, 3rd Floor, Office 311-B, Dubai\nPhone: +971 52 520 9703\nEmail: contact@livwelldubai.com')
on conflict do nothing;

-- ── AUDIT LOGS ───────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          bigserial primary key,
  actor       text not null,
  actor_role  text not null default 'admin' check (actor_role in ('admin','agent','customer','system')),
  action      text not null,
  module      text not null check (module in ('auth','property','lead','user','cms','config','report')),
  detail      text,
  ip          text default '—',
  status      text not null default 'success' check (status in ('success','warning','error')),
  created_at  timestamptz default now()
);

alter table public.audit_logs enable row level security;
create policy "Authenticated read audit_logs" on public.audit_logs
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert audit_logs" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');
