-- ================================================================
-- FIX: Drop recursive RLS policies on profiles
-- ================================================================

-- Drop all existing policies on profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Simple non-recursive policies
-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow insert for the trigger (needed for auto-create on signup)
create policy "Allow profile creation on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins/agents use JWT role claim instead of querying profiles (avoids recursion)
create policy "Service role can do everything"
  on public.profiles for all
  using (auth.role() = 'service_role');
