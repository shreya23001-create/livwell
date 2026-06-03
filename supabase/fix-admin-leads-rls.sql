-- ================================================================
-- FIX: Open RLS on admin_leads and profiles for admin panel
-- Run in Supabase SQL Editor
-- ================================================================

-- ── admin_leads: drop old policy, add simple authenticated access ──
drop policy if exists "Admins and agents manage admin_leads" on public.admin_leads;

create policy "Authenticated users can manage admin_leads"
  on public.admin_leads for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── profiles: drop all existing, add clean non-recursive policies ──
drop policy if exists "Users can view own profile"          on public.profiles;
drop policy if exists "Users can update own profile"        on public.profiles;
drop policy if exists "Admins can view all profiles"        on public.profiles;
drop policy if exists "Allow profile creation on signup"    on public.profiles;
drop policy if exists "Service role can do everything"      on public.profiles;
drop policy if exists "Admins and agents manage admin_leads" on public.profiles;

-- Any authenticated user can read all profiles (needed for admin panel)
create policy "Authenticated read profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can update their own profile
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Authenticated users can insert profiles (admin creating users)
create policy "Authenticated insert profiles"
  on public.profiles for insert
  with check (auth.role() = 'authenticated');

-- Authenticated users can delete profiles
create policy "Authenticated delete profiles"
  on public.profiles for delete
  using (auth.role() = 'authenticated');
