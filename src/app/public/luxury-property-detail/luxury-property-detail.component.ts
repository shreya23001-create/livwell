import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { toPropertySlug, idFromSlug } from '../../shared/utils/slug';
import { AMENITY_ICONS } from '../../shared/constants/amenity-icons';

export interface PropertyDetail {
  id: string;
  title: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  price: string;
  pricePerSqft: string;
  beds: string;
  baths: string;
  area: string;
  parking: string;
  furnished: boolean;
  listedDate: string;
  badge?: string;
  images: string[];
  about: string;
  amenities: string[];
  agent: { name: string; role: string; phone: string; email: string; avatar: string };
  mortgageRate: number;
  mapUrl: string;
  nearbySchools: { name: string; distance: string; rating: string }[];
  video_url?: string | null;
}

const AGENT_ANUJ = { name: 'Anuj Sharma', role: 'Luxury Property Specialist', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' };
const AGENT_NIKET = { name: 'Niket Mehta', role: 'Senior Property Consultant', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' };

const STANDARD_AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Concierge Service', 'Valet Parking', "Children's Play Area",
  'BBQ Area', 'Business Centre', 'Spa & Sauna', 'Jogging Track', 'Lobby with 24/7 Security',
  'High-Speed Elevators', 'Covered Parking', 'Smart Home System', 'Central A/C', 'Balcony',
  'Built-in Wardrobes', 'Maids Room', 'Laundry Room', 'Storage Room', 'Pet-Friendly',
];

const VILLA_AMENITIES = [
  'Private Swimming Pool', 'Private Garden', 'Home Cinema', 'Smart Home System', 'Maid\'s Room',
  'Driver\'s Room', 'BBQ Area', 'Outdoor Dining', 'Gym Room', 'Steam Room',
  'Jacuzzi', 'Central A/C', 'Covered Parking (4)', 'Landscaped Gardens', 'Security System',
  'Waterfront Access', 'Boat Dock', 'Sea View', 'Floor-to-Ceiling Glass', 'Infinity Pool',
];

const DOWNTOWN_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178474959773!2d55.27568!3d25.19489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1cbb7e2!2sDowntown%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000';
const BUSINESS_BAY_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.5!2d55.2644!3d25.1865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682b0d8b24f3%3A0x5f6a7f4d3e3b2f1a!2sBusiness%20Bay%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000';
const PALM_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.5!2d55.1287!3d25.1124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b5c59b8d25f%3A0xa2f8b6c8c17e9d40!2sPalm%20Jumeirah%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000';
const MBR_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.5!2d55.3055!3d25.2066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6966461bfa61%3A0x3a3c2a2e6b5f4d30!2sMohammed%20Bin%20Rashid%20City%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000';

const PROPERTIES: Record<string, PropertyDetail> = {
  'address-residences-dubai-opera': {
    id: 'address-residences-dubai-opera',
    title: 'Address Residences Dubai Opera',
    developer: 'Emaar', location: 'Downtown Dubai', community: 'Downtown Dubai',
    type: 'Apartment', status: 'Ready', price: 'AED 4,200,000', pricePerSqft: 'AED 3,800',
    beds: '2 BR', baths: '3', area: '1,105 sqft', parking: '1', furnished: true,
    listedDate: '2 months ago', badge: 'Furnished',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=85',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=85',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=85',
    ],
    about: 'Address Residences Dubai Opera is a premium luxury development by Emaar located in the heart of Downtown Dubai. It offers stunning views of the Burj Khalifa, Dubai Fountain, and the iconic Dubai Opera. The residences feature world-class finishes, smart home technology, and access to Address Hotel amenities. The project is connected to the Dubai Mall via a covered walkway and offers direct access to all of Downtown Dubai\'s attractions. Residents enjoy access to a state-of-the-art gymnasium, infinity pool, and personalised concierge services.',
    amenities: STANDARD_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 4.5, mapUrl: DOWNTOWN_MAP,
    nearbySchools: [
      { name: 'Dubai Mall International School', distance: '0.8 km', rating: '4.5' },
      { name: 'Jumeirah International Nursery', distance: '1.2 km', rating: '4.2' },
      { name: 'Emirates International School', distance: '2.1 km', rating: '4.7' },
    ],
  },
  'dorchester-collection-dubai': {
    id: 'dorchester-collection-dubai',
    title: 'Dorchester Collection Dubai',
    developer: 'OMNIYAT', location: 'Business Bay', community: 'Business Bay',
    type: 'Apartment', status: 'Ready', price: 'AED 9,800,000', pricePerSqft: 'AED 4,200',
    beds: '3 BR', baths: '4', area: '2,333 sqft', parking: '2', furnished: false,
    listedDate: '3 weeks ago',
    images: [
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=85',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=85',
      'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=800&q=85',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=85',
    ],
    about: 'Dorchester Collection Dubai by OMNIYAT is an ultra-luxury residential tower in Business Bay. The project brings together the legendary Dorchester Collection hospitality brand with OMNIYAT\'s architectural excellence. Residents enjoy bespoke hotel-style services, breathtaking views of the Dubai Canal, and an exclusive collection of amenities curated for the most discerning lifestyles. Private chef services, butler service, and access to a rooftop lounge are among the highlights of this extraordinary address.',
    amenities: ['Infinity Pool', '24-Hour Concierge', 'Butler Service', 'Private Chef', 'Spa & Wellness', 'Fine Dining Restaurant', 'Rooftop Lounge', 'Private Cinema', 'Wine Cellar', 'Cigar Lounge', 'Helipad', 'Valet Parking', 'Smart Home', 'Floor-to-Ceiling Glass', 'Canal Views', 'Private Terrace', 'Italian Marble Finishes', 'Bespoke Kitchen', 'Laundry Service', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 4.5, mapUrl: BUSINESS_BAY_MAP,
    nearbySchools: [
      { name: 'Hartland International School', distance: '1.5 km', rating: '4.6' },
      { name: 'Dubai International Academy', distance: '2.8 km', rating: '4.4' },
    ],
  },
  'six-senses-residences': {
    id: 'six-senses-residences',
    title: 'Six Senses Residences',
    developer: 'Select Group', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    type: 'Apartment', status: 'Off-Plan', price: 'AED 5,500,000', pricePerSqft: 'AED 3,200',
    beds: '2 BR', baths: '3', area: '1,718 sqft', parking: '2', furnished: false,
    listedDate: '1 month ago', badge: 'New Launch',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=85',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=85',
    ],
    about: 'Six Senses Residences on Palm Jumeirah by Select Group is the first Six Senses branded residence in the UAE. This landmark beachfront tower offers residents direct beach access, wellness-driven design, and the legendary Six Senses spa and hospitality philosophy integrated into everyday living. Residences feature floor-to-ceiling windows with stunning sea views, biophilic design elements, and sustainable building practices.',
    amenities: ['Private Beach Access', 'Six Senses Spa', 'Infinity Pool', 'Wellness Centre', 'Yoga Studio', 'Beachfront Restaurant', 'Concierge Service', 'Valet Parking', 'Smart Home', 'Sea View Terraces', 'Meditation Garden', 'Children\'s Club', 'Fitness Centre', 'Tennis Court', 'Bicycle Storage', 'EV Charging', 'Central A/C', 'Built-in Wardrobes', 'Maids Room', 'Pet-Friendly'],
    agent: AGENT_ANUJ, mortgageRate: 4.5, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Raffles International School', distance: '2.1 km', rating: '4.8' },
      { name: 'Dubai British School', distance: '3.5 km', rating: '4.5' },
    ],
  },
  'emaar-beachfront-grand-bleu': {
    id: 'emaar-beachfront-grand-bleu',
    title: 'Emaar Beachfront Grand Bleu',
    developer: 'Emaar', location: 'Dubai Harbour', community: 'Dubai Harbour',
    type: 'Apartment', status: 'Under Construction', price: 'AED 4,500,000', pricePerSqft: 'AED 3,100',
    beds: '1 BR', baths: '2', area: '1,451 sqft', parking: '1', furnished: false,
    listedDate: '6 weeks ago', badge: 'High ROI',
    images: [
      'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=1200&q=85',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=85',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85',
    ],
    about: 'Grand Bleu Tower at Emaar Beachfront is a fashion-inspired tower designed by fashion icon Elie Saab. Located in Dubai Harbour, it offers direct beach access, panoramic sea views, and premium waterfront living. The tower represents a unique fusion of fashion, architecture, and luxury real estate — each residence is a testament to refined taste and Elie Saab\'s signature aesthetic.',
    amenities: ['Private Beach', 'Infinity Pool', 'Gymnasium', 'Beachfront Promenade', 'Yacht Club Access', 'Concierge', 'Valet Parking', 'Smart Home', 'Sea View', 'Central A/C', 'Covered Parking', 'BBQ Area', 'Children\'s Pool', 'Jogging Track', 'Retail Boulevard', 'Marina Access', 'Built-in Wardrobes', 'Laundry Room', 'Maids Room', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 4.5,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.0!2d55.0986!3d25.0827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6c4a7f1b5c3d%3A0x2a4b5c6d7e8f9a0b!2sDubai%20Harbour!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'Dubai American Academy', distance: '3.2 km', rating: '4.6' },
      { name: 'Emirates International School', distance: '4.0 km', rating: '4.7' },
    ],
  },
  'bulgari-ocean-mansions': {
    id: 'bulgari-ocean-mansions',
    title: 'Bulgari Ocean Mansions',
    developer: 'Meraas', location: 'Jumeira Bay Island', community: 'Jumeira Bay Island',
    type: 'Villa', status: 'Off-Plan', price: 'AED 65,000,000', pricePerSqft: 'AED 12,500',
    beds: '6 BR', baths: '8', area: '12,000 sqft', parking: '4', furnished: false,
    listedDate: '2 weeks ago', badge: 'Ultra Luxury',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=85',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85',
    ],
    about: 'Bulgari Ocean Mansions on Jumeira Bay Island represent the absolute pinnacle of Dubai ultra-luxury living. Developed by Meraas in partnership with the iconic Italian luxury brand Bulgari, these limited oceanfront mansions offer unparalleled privacy, bespoke architecture, and direct access to the Bulgari Resort & Residences. Each mansion is a masterpiece of Italian craftsmanship with bespoke interior design, private infinity pool, and 360-degree sea views.',
    amenities: VILLA_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 4.0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Jumeirah English Speaking School', distance: '1.8 km', rating: '4.7' },
      { name: 'Kings\' School Dubai', distance: '2.4 km', rating: '4.8' },
    ],
  },
  'district-one-villas-phase-3': {
    id: 'district-one-villas-phase-3',
    title: 'District One Villas Phase 3',
    developer: 'Meydan', location: 'MBR City', community: 'Mohammed Bin Rashid City',
    type: 'Villa', status: 'Off-Plan', price: 'AED 8,900,000', pricePerSqft: 'AED 2,200',
    beds: '5 BR', baths: '6', area: '7,200 sqft', parking: '3', furnished: false,
    listedDate: '1 month ago', badge: 'Limited',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=85',
    ],
    about: 'District One Villas Phase 3 in Mohammed Bin Rashid City by Meydan Developers offers an exclusive collection of 5-bedroom crystal lagoon villas. Set around the world\'s largest man-made crystal lagoon, these villas provide a resort lifestyle within the city. Premium finishes, private pools, and direct lagoon access make this one of the most coveted addresses in Dubai.',
    amenities: ['Crystal Lagoon Access', 'Private Pool', 'Private Garden', 'Smart Home', 'Maid\'s Room', 'Driver\'s Room', 'Covered Parking (3)', 'Community Club', 'Cycling Tracks', 'Walking Paths', 'Gymnasium', 'Volleyball Court', 'Basketball Court', 'Children\'s Play Area', 'Retail Shops', 'Restaurants', 'Central A/C', 'BBQ Area', 'Security', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 4.5, mapUrl: MBR_MAP,
    nearbySchools: [
      { name: 'Hartland International School', distance: '0.9 km', rating: '4.6' },
      { name: 'North London Collegiate School', distance: '1.5 km', rating: '4.8' },
    ],
  },
  'jumeirah-islands-villa': {
    id: 'jumeirah-islands-villa',
    title: 'Jumeirah Islands Villa',
    developer: 'Nakheel', location: 'Jumeirah Islands', community: 'Jumeirah Islands',
    type: 'Villa', status: 'Ready', price: 'AED 12,500,000', pricePerSqft: 'AED 2,800',
    beds: '5 BR', baths: '6', area: '8,928 sqft', parking: '3', furnished: false,
    listedDate: '3 weeks ago',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'A stunning 5-bedroom lakefront villa in the prestigious Jumeirah Islands community. This beautifully upgraded residence features a spacious private garden, large private pool, and direct lake views. The villa boasts expansive living areas, a gourmet kitchen, and a dedicated home cinema room. Jumeirah Islands is a gated, master-planned community by Nakheel offering a tranquil and secure environment minutes from the city.',
    amenities: VILLA_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 4.5,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.0!2d55.1500!3d25.1200!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6c4a7f1b5c3d%3A0x2a4b5c6d7e8f9a0b!2sJumeirah%20Islands%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'Dubai British School', distance: '1.2 km', rating: '4.5' },
      { name: 'Jumeirah College', distance: '2.0 km', rating: '4.6' },
    ],
  },
  'lanai-islands-by-majid-al-futtaim': {
    id: 'lanai-islands-by-majid-al-futtaim',
    title: 'Lanai Islands by Majid Al Futtaim',
    developer: 'Majid Al Futtaim', location: 'Tilal Al Ghaf', community: 'Tilal Al Ghaf',
    type: 'Home', status: 'Off-Plan', price: 'AED 7,200,000', pricePerSqft: 'AED 1,950',
    beds: '4 BR', baths: '5', area: '5,500 sqft', parking: '2', furnished: false,
    listedDate: '5 weeks ago', badge: 'Golf View',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=85',
    ],
    about: 'Lanai Islands at Tilal Al Ghaf by Majid Al Futtaim offers exclusive island living within the heart of Dubai. These premium 4-bedroom homes sit on private island plots surrounded by the community\'s signature lagoon. Residents enjoy direct lagoon access, a private beach, and the full suite of Tilal Al Ghaf amenities including the Lagoon Al Ghaf — Dubai\'s largest recreational lagoon at 70,000 sqm.',
    amenities: ['Lagoon Access', 'Private Beach', 'Private Pool', 'Smart Home', 'Open-Plan Living', 'Roof Terrace', 'Gymnasium', 'Cycling Tracks', 'Jogging Paths', 'Community Club', 'Children\'s Play Area', 'Basketball Court', 'Paddle Tennis', 'Retail Outlets', 'Restaurants', 'Central A/C', 'BBQ Area', 'Covered Parking', 'Security', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 4.5,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.5!2d55.1800!3d25.1350!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6c4a7f1b5c3d%3A0x2a4b5c6d7e8f9a0b!2sTilal%20Al%20Ghaf%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'GEMS Metropole School', distance: '2.5 km', rating: '4.4' },
      { name: 'Sunmarke School', distance: '3.1 km', rating: '4.5' },
    ],
  },
  'sobha-hartland-forest-villas': {
    id: 'sobha-hartland-forest-villas',
    title: 'Sobha Hartland Forest Villas',
    developer: 'Sobha Realty', location: 'MBR City', community: 'Sobha Hartland',
    type: 'Home', status: 'Ready', price: 'AED 6,800,000', pricePerSqft: 'AED 2,100',
    beds: '4 BR', baths: '5', area: '4,800 sqft', parking: '2', furnished: false,
    listedDate: '2 months ago',
    images: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'Sobha Hartland Forest Villas is a lush, green residential development nestled within Sobha Hartland in MBR City. The villas are surrounded by a 2.4 million sq ft forest, offering a unique blend of nature and luxury. Built to Sobha\'s signature quality — concrete over concrete, no dry wall — these homes feature high ceilings, premium fittings, and private gardens backing directly onto the forest.',
    amenities: ['Forest View', 'Private Garden', 'Private Pool', 'Gymnasium', 'Community Club', 'Swimming Pool', 'Jogging Trails', 'Cycling Tracks', 'Children\'s Play Area', 'Basketball Court', 'Smart Home', 'Central A/C', 'Covered Parking (2)', 'Maid\'s Room', 'BBQ Area', 'High-Speed Lifts', 'Security', 'Retail Shops', 'Restaurants', 'Pet-Friendly'],
    agent: AGENT_ANUJ, mortgageRate: 4.5, mapUrl: MBR_MAP,
    nearbySchools: [
      { name: 'Hartland International School', distance: '0.4 km', rating: '4.6' },
      { name: 'North London Collegiate School', distance: '0.8 km', rating: '4.8' },
    ],
  },
  'one-za-abeel-sky-penthouse': {
    id: 'one-za-abeel-sky-penthouse',
    title: "One Za'abeel Sky Penthouse",
    developer: 'Ithra Dubai', location: "Za'abeel", community: "Za'abeel",
    type: 'Penthouse', status: 'Ready', price: 'AED 28,000,000', pricePerSqft: 'AED 7,200',
    beds: '4 BR', baths: '5', area: '6,500 sqft', parking: '3', furnished: false,
    listedDate: '1 month ago', badge: 'Iconic',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=85',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=85',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=85',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=85',
    ],
    about: "One Za'abeel is Dubai's most iconic new landmark — a split skyscraper connected by the world's longest inhabited cantilever, The Link, suspended 100 metres above the ground. This sky penthouse on the upper floors of the tower offers 360-degree panoramic views of the Burj Khalifa, the Gulf, and the entire Dubai skyline. The penthouse features expansive terraces, bespoke Italian finishes, and exclusive access to The Link's sky pool and restaurant.",
    amenities: ['Sky Pool', 'Private Terrace (3,000 sqft)', '360° City Views', 'Concierge & Butler', 'Private Lift Lobby', 'Smart Home', 'Private Gym', 'Sauna', 'Wine Cellar', 'Home Cinema', 'Bespoke Italian Kitchen', 'Floor-to-Ceiling Glass', 'Central A/C', 'Valet Parking (3)', 'Maid\'s Room', 'Driver\'s Room', 'Storage', '24/7 Security', 'Rooftop Restaurant Access', 'Helipad Access'],
    agent: AGENT_NIKET, mortgageRate: 4.0, mapUrl: DOWNTOWN_MAP,
    nearbySchools: [
      { name: 'GEMS Wellington Primary School', distance: '1.5 km', rating: '4.5' },
      { name: 'Dubai College', distance: '2.2 km', rating: '4.7' },
    ],
  },
  'nakheel-como-residences-penthouse': {
    id: 'nakheel-como-residences-penthouse',
    title: 'Nakheel Como Residences Penthouse',
    developer: 'Nakheel', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    type: 'Penthouse', status: 'Off-Plan', price: 'AED 37,000,000', pricePerSqft: 'AED 9,400',
    beds: '5 BR', baths: '6', area: '9,800 sqft', parking: '4', furnished: false,
    listedDate: '3 weeks ago', badge: 'Rare',
    images: [
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&q=85',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=85',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=85',
    ],
    about: 'Como Residences by Nakheel on Palm Jumeirah is an ultra-luxury supertall tower offering the most exclusive penthouse collection in Dubai. Standing 71 floors high, each penthouse floor plate is entire — offering residents a full-floor private sky estate with 360-degree views of the Palm, the Arabian Gulf, and the Dubai skyline. With only 71 units in the tower, exclusivity is guaranteed.',
    amenities: ['Full-Floor Private Estate', 'Private Pool Per Floor', 'Sky Terrace', 'Palm & Sea Views', 'Private Lift', 'Butler Service', 'Concierge', 'Helipad', 'Beach Club Access', 'Spa', 'Gymnasium', 'Wine Room', 'Cigar Lounge', 'Smart Home', 'Valet Parking (4)', 'EV Charging', 'Maid\'s Room (x2)', 'Driver\'s Room', 'Central A/C', 'Pet-Friendly'],
    agent: AGENT_ANUJ, mortgageRate: 4.0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Raffles International School', distance: '1.8 km', rating: '4.8' },
      { name: 'The International School of Choueifat', distance: '2.5 km', rating: '4.4' },
    ],
  },
  'jumeirah-living-business-bay': {
    id: 'jumeirah-living-business-bay',
    title: 'Jumeirah Living Business Bay',
    developer: 'Jumeirah Group', location: 'Business Bay', community: 'Business Bay',
    type: 'Penthouse', status: 'Ready', price: 'AED 11,000,000', pricePerSqft: 'AED 4,800',
    beds: '3 BR', baths: '4', area: '4,600 sqft', parking: '2', furnished: false,
    listedDate: '6 weeks ago',
    images: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=85',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=85',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=85',
    ],
    about: 'Jumeirah Living Business Bay combines the legendary Jumeirah Group hospitality with residential luxury. This penthouse residence offers sweeping views of the Dubai Canal and city skyline, impeccably designed interiors, and seamless access to all Jumeirah hotel services including room service, housekeeping, spa, and fine dining. A truly exceptional home for those who refuse to compromise.',
    amenities: STANDARD_AMENITIES,
    agent: AGENT_NIKET, mortgageRate: 4.5, mapUrl: BUSINESS_BAY_MAP,
    nearbySchools: [
      { name: 'Hartland International School', distance: '1.8 km', rating: '4.6' },
      { name: 'GEMS Wellington School', distance: '2.3 km', rating: '4.5' },
    ],
  },
  'cherrywoods-townhouses': {
    id: 'cherrywoods-townhouses',
    title: 'Cherrywoods Townhouses',
    developer: 'Meraas', location: 'Dubai Science Park', community: 'Cherrywoods',
    type: 'Townhouse', status: 'Ready', price: 'AED 3,200,000', pricePerSqft: 'AED 1,400',
    beds: '3 BR', baths: '4', area: '2,285 sqft', parking: '2', furnished: false,
    listedDate: '1 month ago', badge: 'Ready to Move',
    images: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=85',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'Cherrywoods by Meraas is a thoughtfully designed townhouse community in the heart of Dubai Science Park. These 3-bedroom townhouses offer a family-friendly environment with a blend of community living and private space. The development features cherry blossom-lined pathways, a central clubhouse, and easy connectivity to major Dubai landmarks.',
    amenities: ['Community Pool', 'Children\'s Play Area', 'Community Park', 'Jogging Track', 'Cycling Paths', 'Retail Outlets', 'Café', 'Central A/C', 'Private Garden', 'Covered Parking (2)', 'BBQ Area', 'Smart Home Ready', 'Security', 'Pet-Friendly', 'School Nearby', 'Mosque', 'Supermarket', 'Clinic', 'Nursery', 'Community Centre'],
    agent: AGENT_ANUJ, mortgageRate: 4.5,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.0!2d55.1900!3d25.1400!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f69c5f5b5c3d!2sDubai%20Science%20Park!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'GEMS Metropole School', distance: '1.0 km', rating: '4.4' },
      { name: 'Sunmarke School', distance: '1.8 km', rating: '4.5' },
    ],
  },
  'mudon-al-ranim-townhouses': {
    id: 'mudon-al-ranim-townhouses',
    title: 'Mudon Al Ranim Townhouses',
    developer: 'Dubai Properties', location: 'Mudon', community: 'Mudon',
    type: 'Townhouse', status: 'Off-Plan', price: 'AED 4,100,000', pricePerSqft: 'AED 1,650',
    beds: '4 BR', baths: '5', area: '2,486 sqft', parking: '2', furnished: false,
    listedDate: '3 weeks ago', badge: 'Golf Community',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'Mudon Al Ranim Phase 8 by Dubai Properties offers a new collection of 4-bedroom townhouses in the popular Mudon community. These homes are designed around a central park and feature the highest quality finishes, open-plan layouts, and private gardens. The Mudon community offers access to Mudon Views park, the Dubai Polo & Equestrian Club, and excellent schools.',
    amenities: ['Central Park', 'Community Pool', 'Gymnasium', 'Cycling Tracks', 'Jogging Paths', 'Children\'s Play Area', 'Paddle Courts', 'Outdoor Gym', 'Retail Shops', 'Restaurants', 'Private Garden', 'Covered Parking (2)', 'BBQ Area', 'Smart Home Ready', 'Central A/C', 'Security', 'School Nearby', 'Mosque', 'Supermarket', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 4.5,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.0!2d55.1600!3d25.0950!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6c4a7f1b5c3d!2sMudon%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'Ranches Primary School', distance: '1.1 km', rating: '4.3' },
      { name: 'GEMS Heritage Indian School', distance: '1.9 km', rating: '4.2' },
    ],
  },
  // ── Rent entries — point to full buy data where possible ──
  'burj-vista-luxury-apartment': {
    id: 'burj-vista-luxury-apartment',
    title: 'Burj Vista Luxury Apartment',
    developer: 'Emaar', location: 'Downtown Dubai', community: 'Downtown Dubai',
    type: 'Apartment', status: 'Ready', price: 'AED 280,000 / yr', pricePerSqft: 'AED 253',
    beds: '2 BR', baths: '3', area: '1,105 sqft', parking: '1', furnished: true,
    listedDate: '3 weeks ago', badge: 'Furnished',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=85',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=85',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=85',
    ],
    about: 'A beautifully furnished 2-bedroom apartment in Burj Vista, Downtown Dubai. This high-floor unit offers panoramic views of the Burj Khalifa and Dubai Fountain directly from the living room and master bedroom. The apartment has been fully refurbished with premium furniture, smart home systems, and high-end kitchen appliances. Available for annual lease with flexible payment terms.',
    amenities: STANDARD_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 0, mapUrl: DOWNTOWN_MAP,
    nearbySchools: [
      { name: 'Dubai Mall International School', distance: '0.8 km', rating: '4.5' },
      { name: 'Emirates International School', distance: '2.1 km', rating: '4.7' },
    ],
  },
  'six-senses-palm-residences': {
    id: 'six-senses-palm-residences',
    title: 'Six Senses Palm Residences',
    developer: 'Select Group', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    type: 'Apartment', status: 'Ready', price: 'AED 350,000 / yr', pricePerSqft: 'AED 204',
    beds: '2 BR', baths: '3', area: '1,718 sqft', parking: '2', furnished: false,
    listedDate: '2 weeks ago', badge: 'Beachfront',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=85',
    ],
    about: 'A spectacular beachfront 2-bedroom apartment for rent in the Six Senses Residences on Palm Jumeirah. Enjoy direct private beach access, stunning Arabian Gulf views, and access to the world-renowned Six Senses Spa. This high-quality unfurnished apartment is available for annual lease and includes access to all Six Senses amenities.',
    amenities: ['Private Beach Access', 'Six Senses Spa', 'Infinity Pool', 'Wellness Centre', 'Yoga Studio', 'Beachfront Restaurant', 'Concierge Service', 'Valet Parking', 'Smart Home', 'Sea View Terraces', 'Meditation Garden', 'Children\'s Club', 'Fitness Centre', 'Tennis Court', 'Bicycle Storage', 'EV Charging', 'Central A/C', 'Built-in Wardrobes', 'Maids Room', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Raffles International School', distance: '2.1 km', rating: '4.8' },
      { name: 'Dubai British School', distance: '3.5 km', rating: '4.5' },
    ],
  },
  'bulgari-ocean-mansion-villa': {
    id: 'bulgari-ocean-mansion-villa',
    title: 'Bulgari Ocean Mansion Villa',
    developer: 'Meraas', location: 'Jumeira Bay Island', community: 'Jumeira Bay Island',
    type: 'Villa', status: 'Ready', price: 'AED 2,800,000 / yr', pricePerSqft: 'AED 233',
    beds: '6 BR', baths: '8', area: '12,000 sqft', parking: '4', furnished: true,
    listedDate: '1 month ago', badge: 'Ultra Luxury',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=85',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=85',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85',
    ],
    about: 'One of the most exclusive rental properties in Dubai — a fully furnished Bulgari Ocean Mansion on Jumeira Bay Island. This rare 6-bedroom oceanfront villa is available for annual lease and comes furnished with bespoke Bulgari-designed pieces. Residents enjoy a private infinity pool, butler service, direct ocean access, and all Bulgari Resort facilities.',
    amenities: VILLA_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Jumeirah English Speaking School', distance: '1.8 km', rating: '4.7' },
      { name: 'Kings\' School Dubai', distance: '2.4 km', rating: '4.8' },
    ],
  },
  'palm-signature-villa': {
    id: 'palm-signature-villa',
    title: 'Palm Signature Villa',
    developer: 'Nakheel', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    type: 'Villa', status: 'Ready', price: 'AED 950,000 / yr', pricePerSqft: 'AED 106',
    beds: '5 BR', baths: '6', area: '8,928 sqft', parking: '3', furnished: false,
    listedDate: '3 weeks ago',
    images: [
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=85',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85',
    ],
    about: 'A magnificent 5-bedroom signature villa for rent on Palm Jumeirah with direct beach access and stunning sea views. This unfurnished villa has been freshly painted and is in excellent condition. The open-plan layout, large private pool, and beach access make it ideal for a premium family lifestyle. Available for 1-year lease with 4 cheques.',
    amenities: VILLA_AMENITIES,
    agent: AGENT_ANUJ, mortgageRate: 0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Raffles International School', distance: '2.1 km', rating: '4.8' },
      { name: 'Dubai British School', distance: '3.5 km', rating: '4.5' },
    ],
  },
  'sobha-hartland-forest-home': {
    id: 'sobha-hartland-forest-home',
    title: 'Sobha Hartland Forest Home',
    developer: 'Sobha Realty', location: 'MBR City', community: 'Sobha Hartland',
    type: 'Home', status: 'Ready', price: 'AED 480,000 / yr', pricePerSqft: 'AED 100',
    beds: '4 BR', baths: '5', area: '4,800 sqft', parking: '2', furnished: false,
    listedDate: '1 month ago',
    images: [
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=85',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'A premium 4-bedroom forest villa for rent in Sobha Hartland, MBR City. This beautifully maintained unfurnished home backs directly onto the 2.4 million sqft forest, offering incredible greenery and privacy. Features include high ceilings, a private garden, a private pool, and easy access to top schools within the Sobha Hartland community.',
    amenities: ['Forest View', 'Private Garden', 'Private Pool', 'Gymnasium', 'Community Club', 'Swimming Pool', 'Jogging Trails', 'Cycling Tracks', 'Children\'s Play Area', 'Basketball Court', 'Smart Home', 'Central A/C', 'Covered Parking (2)', 'Maid\'s Room', 'BBQ Area', 'Security', 'Retail Shops', 'Restaurants', 'School Nearby', 'Pet-Friendly'],
    agent: AGENT_ANUJ, mortgageRate: 0, mapUrl: MBR_MAP,
    nearbySchools: [
      { name: 'Hartland International School', distance: '0.4 km', rating: '4.6' },
      { name: 'North London Collegiate School', distance: '0.8 km', rating: '4.8' },
    ],
  },
  'tilal-al-ghaf-luxury-home': {
    id: 'tilal-al-ghaf-luxury-home',
    title: 'Tilal Al Ghaf Luxury Home',
    developer: 'Majid Al Futtaim', location: 'Tilal Al Ghaf', community: 'Tilal Al Ghaf',
    type: 'Home', status: 'Ready', price: 'AED 380,000 / yr', pricePerSqft: 'AED 80',
    beds: '4 BR', baths: '4', area: '4,750 sqft', parking: '2', furnished: false,
    listedDate: '5 weeks ago', badge: 'Lagoon View',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=85',
    ],
    about: 'A stunning 4-bedroom family home for rent in Tilal Al Ghaf with direct lagoon views. This unfurnished home features an open-plan ground floor, a private garden, and access to the community\'s 70,000 sqm recreational lagoon and private beach. Available for a 1-year lease.',
    amenities: ['Lagoon Access', 'Private Beach', 'Private Pool Option', 'Smart Home', 'Open-Plan Living', 'Community Park', 'Gymnasium', 'Cycling Tracks', 'Jogging Paths', 'Children\'s Play Area', 'Basketball Court', 'Paddle Tennis', 'Retail Outlets', 'Restaurants', 'Central A/C', 'BBQ Area', 'Covered Parking', 'Security', 'School Nearby', 'Pet-Friendly'],
    agent: AGENT_NIKET, mortgageRate: 0,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.5!2d55.1800!3d25.1350!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6c4a7f1b5c3d%3A0x2a4b5c6d7e8f9a0b!2sTilal%20Al%20Ghaf%2C%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'GEMS Metropole School', distance: '2.5 km', rating: '4.4' },
      { name: 'Sunmarke School', distance: '3.1 km', rating: '4.5' },
    ],
  },
  'como-residences-sky-penthouse': {
    id: 'como-residences-sky-penthouse',
    title: 'Como Residences Sky Penthouse',
    developer: 'Nakheel', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    type: 'Penthouse', status: 'Ready', price: 'AED 2,400,000 / yr', pricePerSqft: 'AED 245',
    beds: '5 BR', baths: '6', area: '9,800 sqft', parking: '4', furnished: true,
    listedDate: '2 weeks ago', badge: 'Sea View',
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=85',
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=85',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=85',
    ],
    about: 'An ultra-rare full-floor penthouse for rent at Como Residences, Palm Jumeirah. This furnished 5-bedroom sky estate occupies an entire floor of the iconic Como tower with 360-degree sea and skyline views from every room. Available for annual lease — one of the most exclusive rental opportunities in Dubai.',
    amenities: ['Full-Floor Private Estate', 'Private Pool', 'Sky Terrace', 'Palm & Sea Views', 'Private Lift', 'Butler Service', 'Concierge', 'Beach Club Access', 'Spa', 'Gymnasium', 'Smart Home', 'Valet Parking (4)', 'Maid\'s Room (x2)', 'Driver\'s Room', 'Central A/C', 'Fully Furnished', 'Wine Room', 'Home Cinema', 'Security', 'Pet-Friendly'],
    agent: AGENT_ANUJ, mortgageRate: 0, mapUrl: PALM_MAP,
    nearbySchools: [
      { name: 'Raffles International School', distance: '1.8 km', rating: '4.8' },
      { name: 'The International School of Choueifat', distance: '2.5 km', rating: '4.4' },
    ],
  },
  'cherrywoods-townhouse-rental': {
    id: 'cherrywoods-townhouse-rental',
    title: 'Cherrywoods Townhouse Rental',
    developer: 'Meraas', location: 'Dubai Science Park', community: 'Cherrywoods',
    type: 'Townhouse', status: 'Ready', price: 'AED 185,000 / yr', pricePerSqft: 'AED 81',
    beds: '3 BR', baths: '4', area: '2,285 sqft', parking: '2', furnished: false,
    listedDate: '1 month ago',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=85',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=85',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85',
    ],
    about: 'A well-maintained 3-bedroom townhouse for rent in Cherrywoods, Dubai Science Park. The home features an open-plan ground floor, a private backyard, and 2 covered parking spaces. The community is family-friendly with parks, cycling paths, and a communal pool. Available for annual lease with flexible payment terms.',
    amenities: ['Community Pool', 'Children\'s Play Area', 'Community Park', 'Jogging Track', 'Cycling Paths', 'Retail Outlets', 'Café', 'Central A/C', 'Private Garden', 'Covered Parking (2)', 'BBQ Area', 'Security', 'Pet-Friendly', 'School Nearby', 'Mosque', 'Supermarket', 'Clinic', 'Nursery', 'Community Centre', 'Smart Home Ready'],
    agent: AGENT_NIKET, mortgageRate: 0,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.0!2d55.1900!3d25.1400!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f69c5f5b5c3d!2sDubai%20Science%20Park!5e0!3m2!1sen!2sae!4v1700000000000',
    nearbySchools: [
      { name: 'GEMS Metropole School', distance: '1.0 km', rating: '4.4' },
      { name: 'Sunmarke School', distance: '1.8 km', rating: '4.5' },
    ],
  },
};

@Component({
  selector: 'app-luxury-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-property-detail.component.html',
  styleUrl: './luxury-property-detail.component.scss',
})
export class LuxuryPropertyDetailComponent implements OnInit {
  property = signal<PropertyDetail | null>(null);
  notFound = signal(false);
  activeImage = signal(0);
  message = signal('');
  aboutExpanded = signal(false);

  mortgageAmount = signal(0);
  mortgageYears = signal(25);
  mortgageDown = signal(20);

  hasData = computed(() => {
    const p = this.property();
    return p !== null && p.about.length > 0;
  });

  monthlyPayment = computed(() => {
    const p = this.property();
    if (!p) return 0;
    const priceNum = parseInt(p.price.replace(/[^0-9]/g, '')) || 0;
    const principal = priceNum * (1 - this.mortgageDown() / 100);
    const r = (p.mortgageRate / 100) / 12;
    const n = this.mortgageYears() * 12;
    if (r === 0 || n === 0) return principal / (n || 1);
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  totalPayment = computed(() => this.monthlyPayment() * this.mortgageYears() * 12);

  safeMapUrl = signal<SafeResourceUrl>('');

  loading    = signal(false);
  isFaved    = signal(false);
  favLoading = signal(false);
  shareToast = signal(false);
  private sb   = inject(SupabaseService).client;
  private auth = inject(AuthService);

  isLoggedIn = this.auth.isLoggedIn;

  videoEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.property()?.video_url;
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${ytMatch[1]}`);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
    if (/\.(mp4|mov|avi|webm)(\?|$)/i.test(url)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  videoDirectUrl = computed<string | null>(() => {
    const url = this.property()?.video_url;
    if (!url) return null;
    return /\.(mp4|mov|avi|webm)(\?|$)/i.test(url) ? url : null;
  });

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private router: Router) {}

  private async geocodeAndSetMap(community: string, location: string): Promise<void> {
    const raw   = community?.trim() || location?.trim() || 'Dubai';
    const query = raw.toLowerCase().includes('dubai') ? raw : raw + ', Dubai, UAE';
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      let url: string;
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&ll=${lat},${lon}&t=m&z=15&output=embed`;
      } else {
        url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      }
      this.safeMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      this.safeMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const rawParam = params.get('id') ?? '';
      this.activeImage.set(0);
      this.aboutExpanded.set(false);
      this.notFound.set(false);

      // Pure numeric → DB property
      if (/^\d+$/.test(rawParam)) {
        this.loadFromDb(Number(rawParam), rawParam);
        return;
      }

      // title-slug-id format → extract numeric id from tail
      const parsedId = idFromSlug(rawParam);
      if (parsedId !== null) {
        this.loadFromDb(parsedId, rawParam);
        return;
      }

      // Static legacy slug fallback
      const found = PROPERTIES[rawParam];
      if (found) {
        this.property.set(found);
        this.mortgageAmount.set(parseInt(found.price.replace(/[^0-9]/g, '')) || 0);
        if (found.mapUrl) {
          this.safeMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(found.mapUrl));
        } else {
          this.geocodeAndSetMap(found.community, found.location);
        }
      } else {
        this.notFound.set(true);
      }
    });
  }

  private async loadFromDb(id: number, rawParam = ''): Promise<void> {
    this.loading.set(true);
    this.property.set(null);

    const { data, error } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, listing_type, type, area_sqft, bedrooms, bathrooms, images, furnishing, agent_name, description, created_at, status, video_url, views')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const p = data as any;
    const priceNum  = typeof p.price === 'number' ? p.price : parseFloat(String(p.price ?? '0').replace(/[^0-9.]/g, ''));
    const areaNum   = typeof p.area_sqft === 'number' ? p.area_sqft : parseFloat(String(p.area_sqft ?? '0'));
    const ppsf      = areaNum > 0 ? Math.round(priceNum / areaNum) : 0;
    const isRent    = (p.listing_type ?? '').toLowerCase() === 'rent';
    const imgs: string[] = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
    const bedsNum   = Number(p.bedrooms) || 0;
    const bathsNum  = Number(p.bathrooms) || 0;

    // Fetch agent profile
    const cleanAgentName = (n: string) => (n ?? '').trim().replace(/^[-–—]+$/, '');
    let agentObj = { name: cleanAgentName(p.agent_name) || 'LivWell Agent', role: 'Property Consultant', phone: '', email: '', avatar: '' };
    if (cleanAgentName(p.agent_name)) {
      const { data: prof } = await this.sb
        .from('profiles')
        .select('name, phone, email, avatar_url, designation')
        .eq('name', p.agent_name)
        .maybeSingle();
      if (prof) {
        const av = prof.avatar_url ?? '';
        agentObj = {
          name:   cleanAgentName(prof.name) || cleanAgentName(p.agent_name) || 'LivWell Agent',
          role:   prof.designation ?? 'Property Consultant',
          phone:  prof.phone ?? '',
          email:  prof.email ?? '',
          avatar: (av && !av.startsWith('data:')) ? av : '',
        };
      }
    }

    const detail: PropertyDetail = {
      id:           String(p.id),
      title:        p.title ?? '',
      developer:    p.community ?? '',
      location:     p.location ?? '',
      community:    p.community ?? '',
      type:         p.type ?? '',
      status:       (['Ready', 'Off-Plan', 'Under Construction'].includes(p.status ?? '') ? p.status : 'Ready') as any,
      price:        priceNum > 0
                      ? (isRent ? `AED ${priceNum.toLocaleString()} / yr` : `AED ${priceNum.toLocaleString()}`)
                      : 'Price on Request',
      pricePerSqft: ppsf > 0 ? `AED ${ppsf.toLocaleString()}` : '',
      beds:         bedsNum === 0 ? 'Studio' : `${bedsNum} BR`,
      baths:        String(bathsNum),
      area:         areaNum > 0 ? `${areaNum.toLocaleString()} sqft` : '',
      parking:      '1',
      furnished:    (p.furnishing ?? '').toLowerCase() === 'furnished',
      listedDate:   'Recently listed',
      images:       imgs.length ? imgs : ['/images/dummy-image.png'],
      about:        p.description ?? '',
      amenities:    p.type === 'Villa' || p.type === 'Home' ? VILLA_AMENITIES : STANDARD_AMENITIES,
      agent:        agentObj,
      mortgageRate: 4.5,
      mapUrl:       '',
      nearbySchools: [],
      video_url:    p.video_url ?? null,
    };

    this.property.set(detail);
    this.mortgageAmount.set(priceNum);
    this.geocodeAndSetMap(p.community ?? '', p.location ?? '');
    if (/^\d+$/.test(rawParam)) {
      this.router.navigate(['/luxury-property', toPropertySlug(p.title, p.id)], { replaceUrl: true });
    }
    this.loading.set(false);
    this.auth.waitForSession().then(() => this.checkFavStatus(p.id));
    this.sb.from('properties').update({ views: (p.views || 0) + 1 }).eq('id', p.id).then(() => {});
  }

  private async checkFavStatus(propId: number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb.from('saved_properties').select('id').eq('user_id', userId).eq('property_id', propId).maybeSingle();
    this.isFaved.set(!!data);
  }

  async toggleFav(): Promise<void> {
    const p = this.property();
    const userId = this.auth.currentUser()?.id;
    const numId = p ? Number(p.id) : 0;
    if (!userId || !numId || this.favLoading()) return;
    this.favLoading.set(true);
    if (this.isFaved()) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', numId);
      this.isFaved.set(false);
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: numId });
      this.isFaved.set(true);
    }
    this.favLoading.set(false);
  }

  async shareProperty(): Promise<void> {
    const p = this.property();
    if (!p) return;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text: p.title, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
    this.shareToast.set(true);
    setTimeout(() => this.shareToast.set(false), 2500);
    const numId = Number(p.id);
    if (numId) await this.incrementShareCount(numId);
  }

  private async incrementShareCount(propId: number): Promise<void> {
    const { data, error } = await this.sb.from('properties').select('share_count').eq('id', propId).single();
    if (error) return;
    const next = ((data as any)?.share_count ?? 0) + 1;
    await this.sb.from('properties').update({ share_count: next }).eq('id', propId);
  }

  nextImage() {
    const p = this.property();
    if (!p) return;
    this.activeImage.set((this.activeImage() + 1) % p.images.length);
  }

  prevImage() {
    const p = this.property();
    if (!p) return;
    this.activeImage.set((this.activeImage() - 1 + p.images.length) % p.images.length);
  }

  openLightbox() {
    // placeholder — can be wired to a lightbox modal later
  }

  formatCurrency(n: number): string {
    return 'AED ' + Math.round(n).toLocaleString();
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  getAmenityIcon(name: string): SafeHtml {
    const label = name.toLowerCase();
    const match = AMENITY_ICONS.find(i => i.label.toLowerCase() === label)
               ?? AMENITY_ICONS.find(i => label.includes(i.key) || i.label.toLowerCase().split(' ').some(w => w.length > 3 && label.includes(w)));
    const svg = match?.svg ?? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
