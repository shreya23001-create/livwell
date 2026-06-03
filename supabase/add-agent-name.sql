-- Add agent_name text column to properties to decouple from profiles FK
alter table public.properties add column if not exists agent_name text;
