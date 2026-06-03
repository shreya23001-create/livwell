-- ================================================================
-- FIX: Storage RLS policies for imagesFolder bucket
-- Run this in the Supabase SQL editor
-- ================================================================

-- Drop any existing policies for this bucket to avoid conflicts
drop policy if exists "Public read imagesFolder" on storage.objects;
drop policy if exists "Authenticated upload imagesFolder" on storage.objects;
drop policy if exists "Authenticated delete imagesFolder" on storage.objects;
drop policy if exists "Authenticated update imagesFolder" on storage.objects;

-- Anyone can view images (public bucket)
create policy "Public read imagesFolder"
  on storage.objects for select
  using (bucket_id = 'imagesFolder');

-- Authenticated users can upload
create policy "Authenticated upload imagesFolder"
  on storage.objects for insert
  with check (
    bucket_id = 'imagesFolder'
    and auth.role() = 'authenticated'
  );

-- Authenticated users can update (needed for upsert)
create policy "Authenticated update imagesFolder"
  on storage.objects for update
  using (
    bucket_id = 'imagesFolder'
    and auth.role() = 'authenticated'
  );

-- Authenticated users can delete
create policy "Authenticated delete imagesFolder"
  on storage.objects for delete
  using (
    bucket_id = 'imagesFolder'
    and auth.role() = 'authenticated'
  );
