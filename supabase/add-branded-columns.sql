-- ================================================================
-- Add is_branded + brand columns to projects table
-- Run this in Supabase SQL Editor
-- ================================================================

alter table public.projects
  add column if not exists is_branded boolean default false,
  add column if not exists brand      text;
