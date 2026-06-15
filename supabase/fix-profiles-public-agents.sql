-- Allow unauthenticated (public) reads of agent profiles
-- This is needed for the public property listing page to show agent avatars/phone
-- Only exposes: name, avatar_url, phone for agents — no sensitive data

drop policy if exists "Public read agent profiles" on public.profiles;

create policy "Public read agent profiles"
  on public.profiles for select
  using (role = 'agent');
