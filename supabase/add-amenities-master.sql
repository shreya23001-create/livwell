-- ================================================================
-- Add 'amenity' (and other newer types) to master_data type check
-- Run in Supabase SQL Editor
-- ================================================================

-- Drop the old check constraint and recreate it to include all types
alter table public.master_data
  drop constraint if exists master_data_type_check;

alter table public.master_data
  add constraint master_data_type_check
  check (type in ('category','property_type','status','trending_tab','location','community','amenity'));

-- Seed a few starter amenities (icon key stored in color column)
insert into public.master_data (type, name, color, sort_order) values
  ('amenity', 'Swimming Pool',    'pool',      1),
  ('amenity', 'Gym',              'gym',       2),
  ('amenity', 'Parking',          'parking',   3),
  ('amenity', 'Security',         'security',  4),
  ('amenity', 'Concierge',        'concierge', 5),
  ('amenity', 'Spa & Wellness',   'spa',       6),
  ('amenity', 'Kids Play Area',   'kids',      7),
  ('amenity', 'Garden & BBQ',     'garden',    8),
  ('amenity', 'Balcony',          'balcony',   9),
  ('amenity', 'Central A/C',      'ac',        10)
on conflict do nothing;
