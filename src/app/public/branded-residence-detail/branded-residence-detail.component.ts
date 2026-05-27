import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface BRAgent {
  name: string;
  title: string;
  avatar: string;
  phone: string;
}

export interface BRTransaction {
  date: string;
  type: string;
  size: string;
  price: string;
  pricePerSqft: string;
}

export interface BRProperty {
  slug: string;
  title: string;
  developer: string;
  brand: string;
  location: string;
  community: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  startingPrice: string;
  pricePerSqft: string;
  beds: string;
  completionDate: string;
  badge?: string;
  images: string[];
  lat: number;
  lng: number;
  highlights: { label: string; value: string }[];
  paymentPlan: { label: string; percent: number }[];
  agents: BRAgent[];
  overview: string;
  amenities: string[];
  transactions: BRTransaction[];
  faqs: { q: string; a: string }[];
}

const AGENT_SARA: BRAgent = {
  name: 'Sara Al Mansouri',
  title: 'Luxury Property Specialist',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  phone: '+971 50 123 4567',
};
const AGENT_KHALID: BRAgent = {
  name: 'Khalid Rehman',
  title: 'Senior Sales Consultant',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  phone: '+971 55 987 6543',
};
const AGENT_PRIYA: BRAgent = {
  name: 'Priya Nair',
  title: 'Investment Advisor',
  avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  phone: '+971 52 456 7890',
};

const STANDARD_AMENITIES = [
  'Swimming Pool', 'Concierge WiFi', 'CCTV Security', 'Central AC',
  'Covered Parking', 'Fitness Centre',
];

const STANDARD_TRANSACTIONS: BRTransaction[] = [
  { date: '15 May 2025', type: '1 BR', size: '1,050 sqft', price: 'AED 4,200,000', pricePerSqft: 'AED 4,000' },
  { date: '28 Apr 2025', type: '2 BR', size: '1,850 sqft', price: 'AED 7,500,000', pricePerSqft: 'AED 4,054' },
  { date: '10 Apr 2025', type: '3 BR', size: '2,600 sqft', price: 'AED 11,200,000', pricePerSqft: 'AED 4,307' },
  { date: '22 Mar 2025', type: '1 BR', size: '980 sqft', price: 'AED 3,900,000', pricePerSqft: 'AED 3,979' },
  { date: '05 Mar 2025', type: '2 BR', size: '1,920 sqft', price: 'AED 7,800,000', pricePerSqft: 'AED 4,062' },
];

const STANDARD_FAQS = [
  { q: 'What is the starting price?', a: 'Prices start from AED 3,200,000 for studio and one-bedroom units. Prices vary based on floor, view, and unit size.' },
  { q: 'Who is the developer / owner?', a: 'This branded residence is developed in partnership with a leading UAE developer and managed by its global brand operator.' },
  { q: 'What are the competitive sales of this project in Dubai?', a: 'Recent comparable sales show strong demand with price-per-sqft growth of 8–12% year-on-year in this community.' },
];

const ALL_PROPERTIES: BRProperty[] = [
  {
    slug: 'address-grand-downtown',
    title: 'Address Grand Downtown',
    developer: 'Emaar', brand: 'Address Hotels',
    location: 'Downtown Dubai', community: 'Downtown Dubai',
    status: 'Off-Plan', startingPrice: 'AED 10,860,000', pricePerSqft: 'AED 4,100',
    beds: '1 – 4 BR', completionDate: 'Q4 2027', badge: 'Off Plan',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=80',
    ],
    lat: 25.1972, lng: 55.2744,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '860 – 3,200 sqft' },
      { label: 'Handover', value: 'Q4 2027' },
      { label: 'Payment', value: '60/40' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 50 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_SARA, AGENT_KHALID, AGENT_PRIYA],
    overview: 'Address Grand Downtown is the crown jewel of Emaar\'s hotel-branded residence collection, rising majestically in the heart of Downtown Dubai. Residents enjoy seamless access to the Address Hotels & Resorts\'s world-class hospitality services including dedicated concierge, valet, spa, pool, and fine dining — all within their own home. Set against the iconic backdrop of the Burj Khalifa and Dubai Fountain, every unit is finished to the highest specification with floor-to-ceiling glazing and panoramic views. An exceptional investment with strong rental demand and capital appreciation in one of Dubai\'s most sought-after addresses.',
    amenities: [...STANDARD_AMENITIES, 'Hotel Services', 'Rooftop Infinity Pool', 'Business Lounge', 'Valet Parking'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'bulgari-residences',
    title: 'Bulgari Residences',
    developer: 'Meraas', brand: 'Bulgari',
    location: 'Jumeira Bay Island', community: 'Jumeira Bay',
    status: 'Ready', startingPrice: 'AED 22,000,000', pricePerSqft: 'AED 9,800',
    beds: '2 – 6 BR', completionDate: 'Ready', badge: 'Ultra Luxury',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    lat: 25.2048, lng: 55.2347,
    highlights: [
      { label: 'Type', value: 'Apartment / Mansion' },
      { label: 'Area', value: '3,100 – 18,000 sqft' },
      { label: 'Status', value: 'Ready' },
      { label: 'Island', value: 'Jumeira Bay' },
    ],
    paymentPlan: [
      { label: 'On Purchase', percent: 100 },
      { label: 'Mortgage Available', percent: 0 },
      { label: 'Flexible Terms', percent: 0 },
    ],
    agents: [AGENT_KHALID, AGENT_SARA, AGENT_PRIYA],
    overview: 'Bulgari Residences on Jumeira Bay Island represents the pinnacle of branded luxury living in Dubai. Developed by Meraas in partnership with the iconic Italian fashion house Bulgari, this exclusive island enclave features just 173 residences, 15 mansions, and a 101-key Bulgari Hotel. Residents enjoy a private marina, beach club, helipad, and the full suite of Bulgari hospitality services. Each residence is a masterpiece of Italian craftsmanship — bespoke cabinetry, natural stone surfaces, and interiors conceived by Antonio Citterio Patricia Viel. One of the rarest addresses in the world.',
    amenities: [...STANDARD_AMENITIES, 'Private Marina', 'Beach Club', 'Helipad', 'Bespoke Concierge', 'Fine Dining'],
    transactions: [
      { date: '10 May 2025', type: '3 BR', size: '4,200 sqft', price: 'AED 38,000,000', pricePerSqft: 'AED 9,047' },
      { date: '15 Apr 2025', type: 'Mansion', size: '12,000 sqft', price: 'AED 120,000,000', pricePerSqft: 'AED 10,000' },
      { date: '20 Mar 2025', type: '2 BR', size: '3,100 sqft', price: 'AED 28,500,000', pricePerSqft: 'AED 9,193' },
      { date: '01 Mar 2025', type: '4 BR', size: '6,800 sqft', price: 'AED 65,000,000', pricePerSqft: 'AED 9,558' },
    ],
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'dorchester-collection-dubai',
    title: 'Dorchester Collection Dubai',
    developer: 'OMNIYAT', brand: 'Dorchester Collection',
    location: 'Business Bay', community: 'Business Bay',
    status: 'Ready', startingPrice: 'AED 9,800,000', pricePerSqft: 'AED 4,200',
    beds: '1 – 4 BR', completionDate: 'Ready',
    images: [
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    ],
    lat: 25.1865, lng: 55.2644,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '980 – 4,100 sqft' },
      { label: 'Status', value: 'Ready' },
      { label: 'Views', value: 'Canal & Skyline' },
    ],
    paymentPlan: [
      { label: 'On Purchase', percent: 100 },
      { label: 'Bank Finance', percent: 0 },
      { label: 'Flexible Terms', percent: 0 },
    ],
    agents: [AGENT_PRIYA, AGENT_SARA, AGENT_KHALID],
    overview: 'The Dorchester Collection Dubai is OMNIYAT\'s landmark collaboration with one of the world\'s most celebrated luxury hotel brands. Rising above the Dubai Canal in Business Bay, this 39-storey tower offers hotel-branded residences managed and serviced by the Dorchester Collection. Residents benefit from personalised concierge, housekeeping, in-residence dining, and exclusive access to the hotel\'s spa and pool facilities. The interiors, designed by Gilles & Boissier, blend timeless elegance with contemporary Dubai living.',
    amenities: [...STANDARD_AMENITIES, 'Canal Views', 'Spa Access', 'In-Residence Dining', 'Private Lounge'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'six-senses-residences',
    title: 'Six Senses Residences',
    developer: 'Select Group', brand: 'Six Senses',
    location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    status: 'Off-Plan', startingPrice: 'AED 5,500,000', pricePerSqft: 'AED 3,200',
    beds: '1 – 5 BR', completionDate: 'Q2 2026', badge: 'Beachfront',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    ],
    lat: 25.1124, lng: 55.1287,
    highlights: [
      { label: 'Type', value: 'Residence' },
      { label: 'Area', value: '1,100 – 8,000 sqft' },
      { label: 'Handover', value: 'Q2 2026' },
      { label: 'Beach', value: 'Private' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 50 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_SARA, AGENT_KHALID, AGENT_PRIYA],
    overview: 'Six Senses Residences on Palm Jumeirah brings the globally acclaimed wellness brand\'s philosophy of conscious luxury to Dubai\'s most iconic address. The development features biophilic design principles, private beach access, a Six Senses Spa, and a dedicated wellness concierge for each residence. Units are designed to maximize natural light and sea breezes, with sustainable materials and smart home technology integrated throughout. An ideal choice for those seeking a health-conscious luxury lifestyle.',
    amenities: [...STANDARD_AMENITIES, 'Wellness Spa', 'Private Beach', 'Yoga Studio', 'Organic Garden', 'EV Charging'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'armani-beach-residences',
    title: 'Armani Beach Residences',
    developer: 'Arada', brand: 'Giorgio Armani',
    location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    status: 'Off-Plan', startingPrice: 'AED 15,000,000', pricePerSqft: 'AED 6,500',
    beds: '2 – 5 BR', completionDate: 'Q1 2027', badge: 'Iconic',
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    ],
    lat: 25.1200, lng: 55.1380,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '2,100 – 10,000 sqft' },
      { label: 'Handover', value: 'Q1 2027' },
      { label: 'Design', value: 'Giorgio Armani' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 50 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_KHALID, AGENT_PRIYA, AGENT_SARA],
    overview: 'Armani Beach Residences on Palm Jumeirah is a landmark collaboration between Arada and the legendary Giorgio Armani brand, marking the fashion icon\'s debut in UAE residential design. Each residence reflects Armani\'s signature aesthetic — clean lines, neutral palettes, and the finest Italian materials. Located on the Palm\'s west crescent with sweeping views of the Arabian Gulf and Dubai skyline, residents enjoy a private beach, infinity pool, and exclusive Armani Casa interiors. A rare opportunity to own a piece of fashion history.',
    amenities: [...STANDARD_AMENITIES, 'Armani Casa Interiors', 'Private Beach', 'Infinity Pool', 'Curated Art Collection'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'jumeirah-living-marina-gate',
    title: 'Jumeirah Living Marina Gate',
    developer: 'Select Group', brand: 'Jumeirah',
    location: 'Dubai Marina', community: 'Dubai Marina',
    status: 'Ready', startingPrice: 'AED 3,200,000', pricePerSqft: 'AED 2,800',
    beds: '1 – 4 BR', completionDate: 'Ready',
    images: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=80',
    ],
    lat: 25.0800, lng: 55.1400,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '780 – 3,500 sqft' },
      { label: 'Status', value: 'Ready' },
      { label: 'Marina', value: 'Waterfront' },
    ],
    paymentPlan: [
      { label: 'On Purchase', percent: 100 },
      { label: 'Bank Finance', percent: 0 },
      { label: 'Post Handover', percent: 0 },
    ],
    agents: [AGENT_PRIYA, AGENT_KHALID, AGENT_SARA],
    overview: 'Jumeirah Living Marina Gate is a hotel-branded residence tower in the heart of Dubai Marina, offering residents the full complement of Jumeirah Hotel services within their own home. The tower features panoramic marina and sea views, a signature restaurant, spa, and dedicated Jumeirah Living concierge. Ideal for professionals and families who want luxury hotel amenities combined with the energy of Dubai Marina\'s waterfront lifestyle.',
    amenities: [...STANDARD_AMENITIES, 'Marina Views', 'Hotel Concierge', 'Rooftop Pool', 'Fine Dining', 'Kids Club'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'chelsea-residences-by-damac',
    title: 'Chelsea Residences by DAMAC',
    developer: 'DAMAC', brand: 'Chelsea FC',
    location: 'Business Bay', community: 'Business Bay',
    status: 'Off-Plan', startingPrice: 'AED 3,138,000', pricePerSqft: 'AED 2,100',
    beds: '1 – 3 BR', completionDate: 'Q3 2027', badge: 'Off Plan',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    ],
    lat: 25.1880, lng: 55.2600,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '650 – 2,200 sqft' },
      { label: 'Handover', value: 'Q3 2027' },
      { label: 'Brand', value: 'Chelsea FC' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 50 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_SARA, AGENT_PRIYA, AGENT_KHALID],
    overview: 'Chelsea Residences by DAMAC brings the legacy of Chelsea Football Club to Dubai\'s skyline in a bold collaboration between DAMAC Properties and the iconic Premier League club. Interiors are inspired by Stamford Bridge\'s blue palette, featuring Chelsea FC memorabilia, a football-themed leisure deck, and exclusive fan experiences. Located in Business Bay, the development offers excellent connectivity and investment potential. A unique lifestyle residence for football enthusiasts and luxury seekers alike.',
    amenities: [...STANDARD_AMENITIES, 'Football-Themed Amenities', 'Sports Lounge', 'Rooftop Terrace', 'Kids Play Area'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'como-residences',
    title: 'Como Residences',
    developer: 'Nakheel', brand: 'COMO Hotels',
    location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    status: 'Off-Plan', startingPrice: 'AED 37,000,000', pricePerSqft: 'AED 9,400',
    beds: '4 – 7 BR', completionDate: 'Q4 2027', badge: 'Rare',
    images: [
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    ],
    lat: 25.1050, lng: 55.1250,
    highlights: [
      { label: 'Type', value: 'Super-Premium Apartment' },
      { label: 'Area', value: '7,200 – 21,000 sqft' },
      { label: 'Handover', value: 'Q4 2027' },
      { label: 'Units', value: 'Only 76' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 20 },
      { label: 'During Construction', percent: 40 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_KHALID, AGENT_SARA, AGENT_PRIYA],
    overview: 'COMO Residences at Palm Jumeirah is Nakheel\'s most exclusive development — a shimmering swirling tower offering just 76 super-premium residences with unobstructed 360-degree views of the Palm, Arabian Gulf, and Dubai skyline. Each residence spans an entire floor, featuring private sky pools, bespoke interiors by COMO Hotels & Resorts design team, and access to the COMO wellness and hospitality ecosystem. This is one of Dubai\'s rarest investment opportunities.',
    amenities: [...STANDARD_AMENITIES, 'Private Sky Pool', 'COMO Wellness', 'Full-Floor Units', 'Butler Service', 'Helipad'],
    transactions: [
      { date: '12 May 2025', type: '4 BR', size: '7,200 sqft', price: 'AED 72,000,000', pricePerSqft: 'AED 10,000' },
      { date: '03 Apr 2025', type: '5 BR', size: '10,500 sqft', price: 'AED 105,000,000', pricePerSqft: 'AED 10,000' },
    ],
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'w-residences-downtown',
    title: 'W Residences Downtown',
    developer: 'DAR Global', brand: 'W Hotels',
    location: 'Downtown Dubai', community: 'Downtown Dubai',
    status: 'Off-Plan', startingPrice: 'AED 4,500,000', pricePerSqft: 'AED 3,500',
    beds: '1 – 3 BR', completionDate: 'Q2 2026',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=80',
    ],
    lat: 25.1930, lng: 55.2780,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '780 – 2,800 sqft' },
      { label: 'Handover', value: 'Q2 2026' },
      { label: 'Brand', value: 'W Hotels' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 60 },
      { label: 'On Handover', percent: 30 },
    ],
    agents: [AGENT_PRIYA, AGENT_SARA, AGENT_KHALID],
    overview: 'W Residences Downtown brings the bold, energetic W Hotels brand to the most coveted postcode in Dubai. Developed by DAR Global, the tower offers a curated selection of residences with direct access to W Hotel amenities including the AWAY Spa, WET deck, and the globally celebrated Whatever/Whenever concierge service. With Burj Khalifa and Dubai Fountain views and an address in the heart of Downtown Dubai, this is urban luxury living at its most dynamic.',
    amenities: [...STANDARD_AMENITIES, 'AWAY Spa', 'WET Deck', 'Music Studio', 'Pet Friendly', 'EV Charging'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'rosewood-residences',
    title: 'Rosewood Residences',
    developer: 'IRTH Development', brand: 'Rosewood Hotels',
    location: 'Emaar Beachfront', community: 'Dubai Harbour',
    status: 'Off-Plan', startingPrice: 'AED 8,200,000', pricePerSqft: 'AED 5,100',
    beds: '2 – 4 BR', completionDate: 'Q3 2027', badge: 'Waterfront',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    ],
    lat: 25.0860, lng: 55.1320,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '1,400 – 4,800 sqft' },
      { label: 'Handover', value: 'Q3 2027' },
      { label: 'Views', value: 'Sea & Marina' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 50 },
      { label: 'On Handover', percent: 40 },
    ],
    agents: [AGENT_SARA, AGENT_PRIYA, AGENT_KHALID],
    overview: 'Rosewood Residences at Emaar Beachfront is the first Rosewood-branded residential offering in Dubai, combining the brand\'s signature A Sense of Place philosophy with a spectacular beachfront location in the newly developed Dubai Harbour. Residents enjoy a 1.5km private beach, direct marina access, and the full Rosewood living experience — from personalised concierge to in-residence spa treatments and curated cultural programming.',
    amenities: [...STANDARD_AMENITIES, 'Private Beach', 'Marina Access', 'In-Residence Spa', 'Beach Club', 'Water Sports'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'baccarat-hotel-residences',
    title: 'Baccarat Hotel & Residences',
    developer: 'SH Hotels', brand: 'Baccarat',
    location: 'Downtown Dubai', community: 'Downtown Dubai',
    status: 'Off-Plan', startingPrice: 'AED 12,000,000', pricePerSqft: 'AED 7,200',
    beds: '1 – 4 BR', completionDate: 'Q1 2028', badge: 'Ultra Luxury',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=85',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=80',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    lat: 25.1945, lng: 55.2760,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '1,050 – 6,200 sqft' },
      { label: 'Handover', value: 'Q1 2028' },
      { label: 'Crystal', value: 'Baccarat' },
    ],
    paymentPlan: [
      { label: 'On Booking', percent: 10 },
      { label: 'During Construction', percent: 55 },
      { label: 'On Handover', percent: 35 },
    ],
    agents: [AGENT_KHALID, AGENT_PRIYA, AGENT_SARA],
    overview: 'Baccarat Hotel & Residences Downtown Dubai is the Middle East debut of the iconic French crystal brand, in a tower that redefines opulence on the Dubai skyline. Each residence features Baccarat crystal installations, handcrafted chandeliers, and interiors inspired by the brand\'s 250-year heritage of artisanal excellence. Residents enjoy access to the Baccarat Hotel\'s spa, restaurant, and exclusive crystal lounge — a truly unique sensory living experience.',
    amenities: [...STANDARD_AMENITIES, 'Crystal Lounge', 'Baccarat Spa', 'Private Chef', 'Curated Art', 'Sommelier Service'],
    transactions: STANDARD_TRANSACTIONS,
    faqs: STANDARD_FAQS,
  },
  {
    slug: 'four-seasons-private-residences',
    title: 'Four Seasons Private Residences',
    developer: 'Four Seasons', brand: 'Four Seasons',
    location: 'DIFC', community: 'DIFC',
    status: 'Ready', startingPrice: 'AED 14,500,000', pricePerSqft: 'AED 6,800',
    beds: '2 – 5 BR', completionDate: 'Ready',
    images: [
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=1200&q=85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    ],
    lat: 25.2141, lng: 55.2810,
    highlights: [
      { label: 'Type', value: 'Apartment' },
      { label: 'Area', value: '2,200 – 9,500 sqft' },
      { label: 'Status', value: 'Ready' },
      { label: 'Location', value: 'DIFC' },
    ],
    paymentPlan: [
      { label: 'On Purchase', percent: 100 },
      { label: 'Bank Finance', percent: 0 },
      { label: 'Post Handover', percent: 0 },
    ],
    agents: [AGENT_SARA, AGENT_KHALID, AGENT_PRIYA],
    overview: 'Four Seasons Private Residences at DIFC is the ultimate expression of the Four Seasons philosophy — a home that delivers the legendary service of the world\'s most respected luxury hotel brand within the privacy of your own residence. Situated in Dubai\'s financial heart, DIFC, the residences offer unparalleled views of the Dubai skyline and direct access to the Four Seasons Hotel DIFC\'s Michelin-starred restaurants, spa, and world-class amenities. A trophy asset and a lifetime of extraordinary living.',
    amenities: [...STANDARD_AMENITIES, 'Michelin Restaurant Access', 'Four Seasons Spa', 'Private Wine Cellar', 'Library Lounge'],
    transactions: [
      { date: '08 May 2025', type: '3 BR', size: '4,800 sqft', price: 'AED 42,000,000', pricePerSqft: 'AED 8,750' },
      { date: '20 Apr 2025', type: '2 BR', size: '2,200 sqft', price: 'AED 18,500,000', pricePerSqft: 'AED 8,409' },
      { date: '15 Mar 2025', type: '4 BR', size: '7,200 sqft', price: 'AED 62,000,000', pricePerSqft: 'AED 8,611' },
      { date: '28 Feb 2025', type: '5 BR', size: '9,500 sqft', price: 'AED 85,000,000', pricePerSqft: 'AED 8,947' },
    ],
    faqs: STANDARD_FAQS,
  },
];

@Component({
  selector: 'app-branded-residence-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './branded-residence-detail.component.html',
  styleUrl: './branded-residence-detail.component.scss',
})
export class BrandedResidenceDetailComponent implements OnInit {
  property = signal<BRProperty | null>(null);
  activeImage = signal(0);
  openFaqIndex = signal<number | null>(null);
  overviewExpanded = signal(false);
  activeMapTab = signal<'location' | 'community'>('location');

  mapSrc = computed((): SafeResourceUrl => {
    const p = this.property();
    const lat = p?.lat ?? 25.2048;
    const lng = p?.lng ?? 55.2347;
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const found = ALL_PROPERTIES.find(p => p.slug === slug);
    this.property.set(found ?? null);
  }

  toggleFaq(i: number) {
    this.openFaqIndex.set(this.openFaqIndex() === i ? null : i);
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }
}
