-- FINAL profiles RLS fix — safe to run multiple times
-- Drops every known policy variant before recreating

-- ── Drop ALL known update policies (all name variants ever used) ──────────
drop policy if exists "Users can update own profile"      on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users update own profile"          on public.profiles;
drop policy if exists "Admins update any profile"         on public.profiles;
drop policy if exists "Admins can update any profile"     on public.profiles;

-- ── Drop ALL known select policies ────────────────────────────────────────
drop policy if exists "Users can view own profile"        on public.profiles;
drop policy if exists "Admins can view all profiles"      on public.profiles;
drop policy if exists "Authenticated read profiles"       on public.profiles;
drop policy if exists "Allow profile read"                on public.profiles;

-- ── Drop ALL known insert policies ────────────────────────────────────────
drop policy if exists "Allow profile creation on signup"  on public.profiles;
drop policy if exists "Authenticated insert profiles"     on public.profiles;

-- ── Drop ALL known delete policies ────────────────────────────────────────
drop policy if exists "Authenticated delete profiles"     on public.profiles;
drop policy if exists "Service role can do everything"    on public.profiles;

-- ── Recreate clean policies ────────────────────────────────────────────────

-- Any authenticated user can read profiles
create policy "Authenticated read profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Any authenticated user can insert (needed for signup / admin creating users)
create policy "Authenticated insert profiles"
  on public.profiles for insert
  with check (auth.role() = 'authenticated');

-- Users can update their own profile row
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update any profile (used when admin edits another user's profile)
create policy "Admins update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
    )
  );

-- Any authenticated user can delete (admin panel user management)
create policy "Authenticated delete profiles"
  on public.profiles for delete
  using (auth.role() = 'authenticated');
