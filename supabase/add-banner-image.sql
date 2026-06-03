-- Add image_url column to cms_banners if not exists
alter table public.cms_banners add column if not exists image_url text;
alter table public.cms_banners add column if not exists starting_price text;
alter table public.cms_banners add column if not exists payment_plan text;
alter table public.cms_banners add column if not exists location_tag text;

-- Update existing seed banners with the hardcoded home page data
update public.cms_banners set
  image_url     = 'images/img1.jpeg',
  location_tag  = 'Dubai Creek Harbour',
  starting_price = 'AED 1.8M',
  payment_plan   = '20 / 60 / 20 %'
where sort_order = 1;

update public.cms_banners set
  image_url     = 'images/img2.jpeg',
  location_tag  = 'Downtown Dubai',
  starting_price = 'AED 2.4M',
  payment_plan   = '10 / 65 / 25 %'
where sort_order = 2;

update public.cms_banners set
  image_url     = 'images/img3.jpeg',
  location_tag  = 'Dubai Marina',
  starting_price = 'AED 950K',
  payment_plan   = '20 / 55 / 25 %'
where sort_order = 3;

-- Insert remaining slides that were hardcoded in home component
insert into public.cms_banners (title, subtitle, cta_text, cta_link, status, sort_order, image_url, location_tag, starting_price, payment_plan) values
  ('Business Bay Towers',    'Premium high-rise residences at the centre of Dubai''s dynamic business and lifestyle district.', 'Browse Properties', '/properties', 'active', 4, 'images/img4.jpeg', 'Business Bay',              'AED 1.2M',  '10 / 60 / 30 %'),
  ('Jumeirah Living',        'Beachfront residences with sweeping sea views and direct access to the finest dining and leisure.', 'Browse Properties', '/properties', 'active', 5, 'images/img5.jpeg', 'Jumeirah Beach Residence',  'AED 3.1M',  '20 / 55 / 25 %'),
  ('Emerald Hills Villa',    'Sprawling private villa with lush gardens, infinity pool and panoramic city views.',              'Browse Properties', '/properties', 'active', 6, 'images/img6.jpeg', 'Emirates Hills',            'AED 8.9M',  '20 / 50 / 30 %'),
  ('Palm Vista Villas',      'Exclusive beachfront villas on the iconic Palm — the pinnacle of Dubai luxury.',                  'Browse Properties', '/properties', 'active', 7, 'images/img7.jpeg', 'Palm Jumeirah',             'AED 12.5M', '15 / 55 / 30 %'),
  ('Sobha Hartland Estates', 'Ultra-luxury villas and mansions set within a lush green master community.',                     'Browse Properties', '/properties', 'active', 8, 'images/img8.jpeg', 'Mohammed Bin Rashid City',  'AED 5.2M',  '10 / 60 / 30 %')
on conflict do nothing;
