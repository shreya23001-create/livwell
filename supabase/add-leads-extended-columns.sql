-- Add extended columns to admin_leads for property/project linkage
-- Run in Supabase SQL Editor

alter table public.admin_leads
  add column if not exists property_id    bigint,
  add column if not exists property_title text,
  add column if not exists project_id     bigint,
  add column if not exists project_title  text,
  add column if not exists customer_id    uuid,
  add column if not exists agent_email    text,
  add column if not exists agent_reply    text,
  add column if not exists closed         text not null default 'open'
    check (closed in ('open','closed'));

-- Allow customers to read their own leads
create policy if not exists "Customers read own leads"
  on public.admin_leads for select
  using (email = (select email from public.profiles where id = auth.uid()));

-- Allow customers to insert leads (enquiry forms)
create policy if not exists "Customers insert own leads"
  on public.admin_leads for insert
  with check (true);
