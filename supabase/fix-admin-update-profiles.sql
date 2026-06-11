-- Run this in Supabase SQL Editor

-- Drop restrictive existing update policies
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

-- Users can update their own profile
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update any profile (checks role in profiles table)
create policy "Admins update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );
