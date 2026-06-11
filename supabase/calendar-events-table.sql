-- Run this in Supabase SQL Editor

create table if not exists public.calendar_events (
  id          bigserial primary key,
  agent_id    uuid not null references auth.users(id) on delete cascade,
  agent_email text not null,
  title       text not null,
  type        text not null default 'viewing',
  date        date not null,
  time        text not null default '10:00',  -- HH:MM
  duration    integer not null default 60,    -- minutes
  client      text not null,
  property    text,
  notes       text,
  notified    boolean not null default false, -- tracks if 1-hour email was sent
  created_at  timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

create policy "Agent read own events"
  on public.calendar_events for select
  using (agent_id = auth.uid());

create policy "Agent insert own events"
  on public.calendar_events for insert
  with check (agent_id = auth.uid());

create policy "Agent update own events"
  on public.calendar_events for update
  using (agent_id = auth.uid());

create policy "Agent delete own events"
  on public.calendar_events for delete
  using (agent_id = auth.uid());

-- Service role can update notified flag (used by Edge Function)
create policy "Service role full access"
  on public.calendar_events for all
  using (auth.role() = 'service_role');
