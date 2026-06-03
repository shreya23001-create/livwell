-- ================================================================
-- Admin leads table — matches the admin UI shape exactly
-- Run in Supabase SQL Editor
-- ================================================================

create table if not exists public.admin_leads (
  id             bigserial primary key,
  name           text not null,
  email          text not null,
  phone          text,
  status         text not null default 'new'
                   check (status in ('new','contacted','qualified','negotiating','won','lost')),
  source         text not null default 'website'
                   check (source in ('website','referral','walk_in','social_media','portal','cold_call')),
  category       text not null default 'buy'
                   check (category in ('buy','rent','invest')),
  budget         text,
  location       text,
  property_type  text,
  assigned_agent text,
  notes          text,
  last_contact   date,
  created_at     timestamptz default now()
);

alter table public.admin_leads enable row level security;

-- Admins and agents can do everything
create policy "Admins and agents manage admin_leads"
  on public.admin_leads for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin','super_admin','agent')
    )
  );
