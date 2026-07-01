-- Add cover_image column to developers table
alter table public.developers
  add column if not exists cover_image text;
