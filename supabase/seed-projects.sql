-- ============================================================
-- Sample Projects — 10 real Dubai locations
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO public.projects
  (title, developer, location, community, type, status, price_from, price_label, price_per_sqft, beds, bathrooms, area_sqft, completion_date, payment_plan, description, amenities, images, badge, is_featured, is_luxury, is_ultra_luxury)
VALUES

-- 1. Downtown Dubai
(
  'Sky Residences Downtown',
  'Emaar Properties',
  'Mohammed Bin Rashid Boulevard, Downtown Dubai',
  'Downtown Dubai',
  'Apartment', 'Published',
  1850000, 'AED 1.85M', 'AED 2,100',
  '1 – 3 Beds', 2, 880,
  'Q4 2026', '20/80 Post Handover',
  'Iconic high-rise residences steps from Burj Khalifa and Dubai Fountain. Floor-to-ceiling glass frames panoramic views of the city skyline and fountain.',
  ARRAY['Infinity Pool','Rooftop Lounge','Gym','Concierge','Valet Parking','Smart Home'],
  ARRAY['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80'],
  'Featured', true, false, false
),

-- 2. Palm Jumeirah
(
  'Atlantis The Royal Garden Villas',
  'Kerzner International',
  'Crescent Road, Palm Jumeirah, Dubai',
  'Palm Jumeirah',
  'Villa', 'Published',
  28000000, 'AED 28M', 'AED 8,500',
  '4 – 6 Beds', 5, 3300,
  'Q2 2025', '10/90 On Handover',
  'Ultra-exclusive beachfront villas on the iconic Palm Jumeirah crescent. Each villa offers a private pool, direct beach access, and Atlantis hotel amenities.',
  ARRAY['Private Pool','Private Beach','Butler Service','Home Theatre','Spa','Concierge'],
  ARRAY['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80'],
  'Ultra Luxury', true, true, true
),

-- 3. Dubai Marina
(
  'Marina Gate Phase III',
  'Select Group',
  'Marina Walk, Dubai Marina, Dubai',
  'Dubai Marina',
  'Apartment', 'Published',
  1350000, 'AED 1.35M', 'AED 1,950',
  '1 – 3 Beds', 2, 690,
  'Q3 2026', '40/60',
  'Premium waterfront residences at the heart of Dubai Marina. Walk to JBR Beach, Dubai Marina Mall, and the vibrant promenade.',
  ARRAY['Marina View','Infinity Pool','Gym','Yoga Studio','Kids Club','Retail Podium'],
  ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80'],
  'New Launch', true, false, false
),

-- 4. Business Bay
(
  'Canal Heights Business Bay',
  'DAMAC Properties',
  'Business Bay Canal, Business Bay, Dubai',
  'Business Bay',
  'Apartment', 'Published',
  1100000, 'AED 1.1M', 'AED 1,750',
  'Studio – 2 Beds', 1, 630,
  'Q1 2027', '1% Monthly',
  'Contemporary canal-facing apartments in the thriving Business Bay district. Seamless connectivity to DIFC, Downtown and Sheikh Zayed Road.',
  ARRAY['Canal View','Pool','Gym','Co-Working Space','Cafes','Metro Access'],
  ARRAY['https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=900&q=80'],
  'Hot', false, false, false
),

-- 5. Dubai Hills Estate
(
  'Elvira at Dubai Hills',
  'Emaar Properties',
  'Dubai Hills Park Road, Dubai Hills Estate, Dubai',
  'Dubai Hills Estate',
  'Apartment', 'Published',
  1620000, 'AED 1.62M', 'AED 1,900',
  '1 – 3 Beds', 2, 850,
  'Q4 2027', '20/80',
  'Nestled within the lush greenery of Dubai Hills Estate, Elvira offers parkside living with golf course views and a vibrant community retail boulevard.',
  ARRAY['Park View','Golf Course Access','Pool','Kids Play Area','Cycling Track','Community Mall'],
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80'],
  'Featured', true, false, false
),

-- 6. Jumeirah Village Circle (JVC)
(
  'Binghatti Orchid JVC',
  'Binghatti Developers',
  'District 15, Jumeirah Village Circle, Dubai',
  'Jumeirah Village Circle',
  'Apartment', 'Published',
  680000, 'AED 680K', 'AED 1,250',
  'Studio – 2 Beds', 1, 545,
  'Q2 2026', '50/50',
  'Architecturally distinctive residences in the heart of JVC. Smart home features, premium finishes, and excellent ROI for investors.',
  ARRAY['Pool','Gym','Smart Home','Kids Pool','BBQ Area','24hr Security'],
  ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80'],
  'Trending', false, false, false
),

-- 7. Dubai Creek Harbour
(
  'Creek Horizon Tower 2',
  'Emaar Properties',
  'Dubai Creek Harbour Island, Ras Al Khor, Dubai',
  'Dubai Creek Harbour',
  'Apartment', 'Published',
  1080000, 'AED 1.08M', 'AED 1,800',
  '1 – 3 Beds', 2, 600,
  'Q3 2026', '30/70',
  'Waterfront living with stunning views of Creek Tower — the world''s tallest observation tower. Direct access to the vibrant Creek Island promenade.',
  ARRAY['Creek Tower View','Pool','Gym','Creek Walk Access','Retail','Kids Club'],
  ARRAY['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=80'],
  NULL, false, false, false
),

-- 8. MBR City (Sobha Hartland)
(
  'Sobha Hartland II Villas',
  'Sobha Realty',
  'Sobha Hartland 2, Mohammed Bin Rashid City, Dubai',
  'Mohammed Bin Rashid City',
  'Villa', 'Published',
  6500000, 'AED 6.5M', 'AED 2,400',
  '3 – 5 Beds', 4, 2700,
  'Q2 2027', '60/40',
  'Luxury independent villas in the fully master-planned Sobha Hartland 2 community. Lush green surroundings, top schools, and minutes from Downtown.',
  ARRAY['Private Garden','Private Pool','Maids Room','Smart Home','Community Club','School Access'],
  ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80'],
  'Luxury', true, true, false
),

-- 9. Emaar Beachfront
(
  'Grand Bleu Tower II',
  'Emaar Properties',
  'Dubai Harbour, Emaar Beachfront, Dubai',
  'Emaar Beachfront',
  'Apartment', 'Published',
  3200000, 'AED 3.2M', 'AED 3,100',
  '1 – 3 Beds', 2, 1030,
  'Q1 2027', '20/80',
  'Designed by Elie Saab, Grand Bleu Tower II offers beachfront residences with private beach access at Dubai Harbour. The ultimate sea-to-sky lifestyle.',
  ARRAY['Private Beach','Sea View','Infinity Pool','Concierge','Gym','Yacht Marina Nearby'],
  ARRAY['https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=900&q=80'],
  'Exclusive', true, true, false
),

-- 10. Al Furjan
(
  'Azizi Amber Al Furjan',
  'Azizi Developments',
  'Al Asayel Street, Al Furjan, Dubai',
  'Al Furjan',
  'Apartment', 'Published',
  750000, 'AED 750K', 'AED 1,100',
  '1 – 3 Beds', 1, 680,
  'Q4 2026', '40/60',
  'Family-friendly residences in the well-connected Al Furjan community. Close to Ibn Battuta Mall, Discovery Gardens Metro and Sheikh Zayed Road.',
  ARRAY['Pool','Gym','Landscaped Gardens','Community Centre','Jogging Track','Kids Play Area'],
  ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80'],
  NULL, false, false, false
);
