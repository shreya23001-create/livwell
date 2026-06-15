import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OffPlanProject } from '../off-plan/off-plan.component';

const ALL_PROJECTS: OffPlanProject[] = [
  {
    id: 1, slug: 'binghatti-zenith', title: 'Binghatti Zenith', developer: 'Binghatti Developers', location: 'Al Jaddaf, Dubai', community: 'Al Jaddaf',
    priceFrom: 750000, priceFromLabel: 'AED 750K', completionDate: 'Q4 2026',
    type: 'Apartment', badge: 'New Launch', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90',
    beds: 'Studio – 3 Beds', description: 'Iconic architecture meets smart living in this striking development at Al Jaddaf. Binghatti Zenith redefines urban living with its bold geometric facade and premium interiors. Each residence is crafted to maximise natural light and offer sweeping city views.\n\nResidents enjoy a curated collection of amenities including rooftop pools, state-of-the-art fitness centres, and 24/7 concierge service. Located minutes from the Dubai Metro, Ras Al Khor Wildlife Sanctuary, and Downtown Dubai, Zenith offers both urban connectivity and natural serenity.',
    amenities: ['Rooftop Pool', 'Gym', 'Concierge', 'Smart Home', 'Parking', 'Kids Play Area', 'BBQ Area', 'Security'],
    isNew: true, isFeatured: true,
  },
  {
    id: 2, slug: 'emaar-skyrise', title: 'Emaar Skyrise', developer: 'Emaar Properties', location: 'Business Bay, Dubai', community: 'Business Bay',
    priceFrom: 1200000, priceFromLabel: 'AED 1.2M', completionDate: 'Q2 2027',
    type: 'Apartment', badge: 'Featured', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
    beds: '1 – 4 Beds', description: 'Luxury high-rise residences with panoramic Burj Khalifa and canal views.\n\nEmaar Skyrise sets a new benchmark for residential living in Business Bay. With floor-to-ceiling windows and open-plan layouts, each apartment is a sanctuary above the city. The Sky Lounge on level 42 offers residents an exclusive social space with unmatched views.',
    amenities: ['Infinity Pool', 'Sky Lounge', 'Gym', 'Valet', 'Concierge', 'Retail Podium', 'Parking', 'Security'],
    isFeatured: true,
  },
  {
    id: 3, slug: 'nakheel-gardens', title: 'Nakheel Gardens', developer: 'Nakheel', location: 'Palm Jumeirah, Dubai', community: 'Palm Jumeirah',
    priceFrom: 3500000, priceFromLabel: 'AED 3.5M', completionDate: 'Q1 2027',
    type: 'Villa', badge: 'Hot', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=90',
    beds: '3 – 6 Beds', description: 'Exclusive beachfront villas on one of the world\'s most iconic islands.\n\nNakheel Gardens brings together private beach living with lush tropical landscaping across the iconic Palm Jumeirah. Each villa features a private pool, expansive garden, and direct beach access. With Nakheel\'s world-class quality assurance, these residences represent the pinnacle of Dubai luxury.',
    amenities: ['Private Beach', 'Private Pool', 'Garden', 'Security', 'Maid Room', 'Garage', 'Kids Club', 'Retail'],
    isFeatured: true,
  },
  {
    id: 4, slug: 'creek-horizon', title: 'Creek Horizon', developer: 'Emaar Properties', location: 'Dubai Creek Harbour', community: 'Dubai Creek Harbour',
    priceFrom: 950000, priceFromLabel: 'AED 950K', completionDate: 'Q3 2026',
    type: 'Apartment', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=90',
    beds: '1 – 3 Beds', description: 'Waterfront living with stunning Creek Tower views and vibrant retail promenade.\n\nCreek Horizon places you at the heart of Dubai\'s newest waterfront destination. Enjoy morning walks along the creek promenade and evenings at world-class dining destinations, all within your community.',
    amenities: ['Pool', 'Gym', 'Creek View', 'Kids Club', 'Cycling Track', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 5, slug: 'damac-hills-vistas', title: 'Damac Hills Vistas', developer: 'Damac Properties', location: 'Dubai Hills Estate', community: 'Dubai Hills Estate',
    priceFrom: 2200000, priceFromLabel: 'AED 2.2M', completionDate: 'Q4 2027',
    type: 'Townhouse', badge: 'Limited Units', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=90',
    beds: '3 – 5 Beds', description: 'Contemporary townhomes surrounded by lush parks and championship golf course.\n\nDamac Hills Vistas offers a family lifestyle set against rolling green fairways. The community blends thoughtful architecture with generous outdoor spaces, creating a sanctuary that balances privacy with community living.',
    amenities: ['Golf Course', 'Pool', 'Park', 'Kids Play Area', 'BBQ Area', 'Cycling Track', 'Retail', 'Security'],
  },
  {
    id: 6, slug: 'sobha-seahaven', title: 'Sobha Seahaven', developer: 'Sobha Realty', location: 'Dubai Harbour', community: 'Dubai Harbour',
    priceFrom: 4800000, priceFromLabel: 'AED 4.8M', completionDate: 'Q2 2026',
    type: 'Penthouse', badge: 'Exclusive', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
    beds: '3 – 5 Beds', description: 'Ultra-luxury penthouses with private pools and uninterrupted sea views.\n\nSobha Seahaven redefines ultra-luxury with bespoke penthouses that command the full panorama of the Arabian Gulf and Dubai skyline. Private pools, helipad access, and dedicated concierge make this the most exclusive address in Dubai Harbour.',
    amenities: ['Private Pool', 'Concierge', 'Helipad', 'Marina Access', 'Spa', 'Gym', 'Valet', 'Security'],
  },
  {
    id: 7, slug: 'meraas-elara', title: 'Meraas Elara', developer: 'Meraas', location: 'MBR City, Dubai', community: 'MBR City',
    priceFrom: 1100000, priceFromLabel: 'AED 1.1M', completionDate: 'Q1 2028',
    type: 'Apartment', badge: 'New Launch', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
    beds: '1 – 4 Beds', description: 'Elegant living in the heart of Mohammed Bin Rashid City, next to Meydan.\n\nMeraas Elara is a landmark development in the rapidly evolving MBR City corridor. Inspired by European elegance, the residences feature high ceilings, premium finishes, and expansive terraces overlooking Meydan Racecourse.',
    amenities: ['Pool', 'Gym', 'Retail', 'BBQ Area', 'Kids Club', 'Concierge', 'Parking', 'Security'],
    isNew: true,
  },
  {
    id: 8, slug: 'azizi-riviera-phase-5', title: 'Azizi Riviera Phase 5', developer: 'Azizi Developments', location: 'Meydan, Dubai', community: 'Meydan',
    priceFrom: 680000, priceFromLabel: 'AED 680K', completionDate: 'Q2 2026',
    type: 'Apartment', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90',
    beds: 'Studio – 2 Beds', description: 'French Riviera-inspired canal community with retail and dining at your doorstep.\n\nAzizi Riviera brings the charm of the Mediterranean to the heart of Dubai. Phase 5 continues the award-winning development with stunning canal-facing apartments and an ever-expanding boulevard of shops, cafes, and leisure venues.',
    amenities: ['Canal View', 'Pool', 'Gym', 'Promenade', 'Retail', 'Cycling Track', 'Parking', 'Security'],
  },
  {
    id: 9, slug: 'aldar-yas-residences', title: 'Aldar Yas Residences', developer: 'Aldar Properties', location: 'Dubai South', community: 'Dubai South',
    priceFrom: 890000, priceFromLabel: 'AED 890K', completionDate: 'Q3 2027',
    type: 'Villa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=90',
    beds: '3 – 4 Beds', description: 'Spacious family villas near Al Maktoum International Airport in a green community.\n\nAldar Yas Residences offers generous family homes in the fast-growing Dubai South district. With Al Maktoum International Airport set to become the world\'s largest, this location is primed for exceptional capital appreciation.',
    amenities: ['Pool', 'Garden', 'Kids Club', 'Security', 'Gym', 'Retail', 'Cycling Track', 'Parking'],
  },
  {
    id: 10, slug: 'select-group-marina-gate-iii', title: 'Select Group Marina Gate III', developer: 'Select Group', location: 'Dubai Marina', community: 'Dubai Marina',
    priceFrom: 1350000, priceFromLabel: 'AED 1.35M', completionDate: 'Q4 2026',
    type: 'Apartment', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
    beds: '1 – 3 Beds', description: 'Premium marina-front residences steps away from JBR Walk and Dubai Marina Mall.\n\nMarina Gate III completes Select Group\'s iconic trilogy of towers at the gateway to Dubai Marina. The podium level features resort-style amenities and direct connectivity to the Marina Walk promenade.',
    amenities: ['Marina View', 'Pool', 'Gym', 'Concierge', 'Valet', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 11, slug: 'danube-oceanz', title: 'Danube Oceanz', developer: 'Danube Properties', location: 'Dubai Maritime City', community: 'Maritime City',
    priceFrom: 790000, priceFromLabel: 'AED 790K', completionDate: 'Q1 2027',
    type: 'Apartment', badge: 'Trending', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
    beds: 'Studio – 3 Beds', description: 'Waterfront residences in Dubai\'s premier maritime hub with sea-facing amenities.\n\nDanube Oceanz is the jewel of Dubai Maritime City, offering sea-facing apartments with Danube\'s signature value proposition. From kayaking to paddleboarding, residents enjoy direct access to a curated range of water sports.',
    amenities: ['Sea View', 'Pool', 'Water Sports', 'Gym', 'Retail', 'Kids Club', 'Parking', 'Security'],
  },
  {
    id: 12, slug: 'omniyat-the-lana', title: 'Omniyat The Lana', developer: 'Omniyat', location: 'Business Bay, Dubai', community: 'Business Bay',
    priceFrom: 6500000, priceFromLabel: 'AED 6.5M', completionDate: 'Q2 2026',
    type: 'Penthouse', badge: 'Ultra Luxury', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=90',
    beds: '2 – 5 Beds', description: 'Dorchester Collection-branded residences redefining ultra-luxury in Business Bay.\n\nThe Lana by Omniyat is a collaboration with the world-renowned Dorchester Collection, bringing five-star hotel services to private residences for the first time in Business Bay. Each home is a masterpiece of design with bespoke finishes curated by internationally acclaimed designers.',
    amenities: ['Hotel Services', 'Private Pool', 'Spa', 'Concierge', 'Valet', 'Private Dining', 'Helipad', 'Security'],
  },

  // ── Emaar developer page projects ──────────────────────────
  {
    id: 13, slug: 'address-residences-dubai-opera', title: 'Address Residences Dubai Opera', developer: 'Emaar Properties', location: 'Downtown Dubai', community: 'Downtown Dubai',
    priceFrom: 2100000, priceFromLabel: 'from AED 2.1M', completionDate: 'Ready',
    type: 'Apartment', badge: 'Ready', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=90',
    beds: '1–4 Beds', description: 'Address Residences Dubai Opera is a landmark residential tower in the heart of Downtown Dubai, directly opposite the iconic Dubai Opera.\n\nResidents enjoy the prestige of the Address Hotels brand with access to world-class services, a rooftop pool overlooking Burj Khalifa, and direct connectivity to the Dubai Mall and Dubai Fountain.',
    amenities: ['Rooftop Pool', 'Gym', 'Concierge', 'Valet', 'Spa', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 14, slug: 'emaar-beachfront-grand-bleu-tower', title: 'Emaar Beachfront Grand Bleu Tower', developer: 'Emaar Properties', location: 'Dubai Harbour', community: 'Dubai Harbour',
    priceFrom: 2800000, priceFromLabel: 'from AED 2.8M', completionDate: 'Q4 2026',
    type: 'Apartment', badge: 'Under Construction', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
    beds: '1–3 Beds', description: 'Grand Bleu Tower at Emaar Beachfront is an exclusive waterfront development designed by fashion icon Elie Saab. Set on a private beach island between Palm Jumeirah and Dubai Marina, every residence commands unobstructed sea and skyline views.\n\nResidents enjoy private beach access, resort-style amenities, and the refined aesthetic of Elie Saab interiors — making this one of the most sought-after addresses in Dubai.',
    amenities: ['Private Beach', 'Infinity Pool', 'Gym', 'Concierge', 'Marina Access', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 15, slug: 'dubai-hills-estate-villas', title: 'Dubai Hills Estate Villas', developer: 'Emaar Properties', location: 'Dubai Hills', community: 'Dubai Hills Estate',
    priceFrom: 4500000, priceFromLabel: 'from AED 4.5M', completionDate: 'Q2 2027',
    type: 'Villa', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=90',
    beds: '3–6 Beds', description: 'Dubai Hills Estate Villas offer expansive family living within Emaar\'s flagship master community. Surrounded by an 18-hole championship golf course, lush parks, and tree-lined boulevards, these villas combine prestige with a genuine neighbourhood lifestyle.\n\nWith easy access to Dubai Hills Mall, top schools, and major highways, this is one of Dubai\'s most family-friendly communities.',
    amenities: ['Golf Course', 'Pool', 'Garden', 'Kids Club', 'Cycling Track', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 16, slug: 'creek-waters-2', title: 'Creek Waters 2', developer: 'Emaar Properties', location: 'Dubai Creek Harbour', community: 'Dubai Creek Harbour',
    priceFrom: 1500000, priceFromLabel: 'from AED 1.5M', completionDate: 'Q3 2027',
    type: 'Apartment', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=90',
    beds: 'Studio–3 Beds', description: 'Creek Waters 2 is a striking residential tower at Dubai Creek Harbour, offering panoramic views of the creek, the upcoming Creek Tower, and the Dubai skyline.\n\nPart of Emaar\'s visionary waterfront city, residents benefit from a vibrant promenade, cultural destinations, and seamless connectivity to Downtown Dubai.',
    amenities: ['Creek View', 'Pool', 'Gym', 'Promenade', 'Kids Club', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 17, slug: 'golf-links-emaar-south', title: 'Golf Links — Emaar South', developer: 'Emaar Properties', location: 'Dubai South', community: 'Dubai South',
    priceFrom: 1800000, priceFromLabel: 'from AED 1.8M', completionDate: 'Q1 2028',
    type: 'Townhouse', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=90',
    beds: '3–4 Beds', description: 'Golf Links at Emaar South is a collection of elegant townhouses overlooking a world-class 18-hole golf course near Al Maktoum International Airport.\n\nDesigned for families who appreciate green space and tranquility, Golf Links offers generous layouts, private gardens, and a complete community lifestyle with parks, retail, and leisure facilities.',
    amenities: ['Golf Course', 'Pool', 'Garden', 'Kids Play Area', 'Cycling Track', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 18, slug: 'savanna-dubai-hills', title: 'Savanna — Dubai Hills', developer: 'Emaar Properties', location: 'Dubai Hills Estate', community: 'Dubai Hills Estate',
    priceFrom: 1200000, priceFromLabel: 'from AED 1.2M', completionDate: 'Q2 2027',
    type: 'Apartment', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=1200&q=90',
    beds: '1–3 Beds', description: 'Savanna at Dubai Hills Estate is a contemporary residential development offering modern apartments set amid lush parks and green pathways.\n\nWith easy access to Dubai Hills Mall, the golf course, and top schools, Savanna is the ideal choice for professionals and families seeking a balanced urban lifestyle within one of Dubai\'s most prestigious communities.',
    amenities: ['Pool', 'Gym', 'Park', 'Kids Club', 'BBQ Area', 'Retail', 'Parking', 'Security'],
  },

  // ── DAMAC developer page projects ──────────────────────────
  {
    id: 19, slug: 'damac-hills-2-townhouses', title: 'DAMAC Hills 2 Townhouses', developer: 'DAMAC Properties', location: 'DAMAC Hills 2', community: 'DAMAC Hills 2',
    priceFrom: 850000, priceFromLabel: 'from AED 850K', completionDate: 'Q4 2026',
    type: 'Townhouse', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
    beds: '3–5 Beds', description: 'DAMAC Hills 2 Townhouses offer spacious family living in a self-contained community with its own water park, sports facilities, and retail.\n\nLocated in Dubailand, this community is ideal for families looking for space and value. With DAMAC\'s flexible payment plans and a vibrant community lifestyle, Hills 2 is one of Dubai\'s fastest-selling communities.',
    amenities: ['Water Park', 'Pool', 'Sports Courts', 'Kids Club', 'Cycling Track', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 20, slug: 'cavalli-tower', title: 'Cavalli Tower', developer: 'DAMAC Properties', location: 'Dubai Marina', community: 'Dubai Marina',
    priceFrom: 2200000, priceFromLabel: 'from AED 2.2M', completionDate: 'Q2 2027',
    type: 'Apartment', badge: 'Under Construction', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200&q=90',
    beds: '1–4 Beds', description: 'Cavalli Tower is a landmark ultra-luxury skyscraper rising above Dubai Marina, designed in collaboration with the iconic Roberto Cavalli fashion house.\n\nEvery detail reflects the Cavalli signature — bold design, rich textures, and unapologetic glamour. Residents enjoy an exclusive beach club, private marina access, and a lifestyle that is truly one-of-a-kind.',
    amenities: ['Beach Club', 'Marina Access', 'Infinity Pool', 'Spa', 'Gym', 'Concierge', 'Valet', 'Security'],
  },
  {
    id: 21, slug: 'damac-lagoons-morocco', title: 'DAMAC Lagoons Morocco', developer: 'DAMAC Properties', location: 'DAMAC Lagoons', community: 'DAMAC Lagoons',
    priceFrom: 1900000, priceFromLabel: 'from AED 1.9M', completionDate: 'Q3 2027',
    type: 'Villa', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=90',
    beds: '4–7 Beds', description: 'DAMAC Lagoons Morocco is a Moroccan-inspired cluster within the acclaimed DAMAC Lagoons community, featuring crystal lagoons, sandy beaches, and vibrant waterfront living.\n\nEach villa is designed to evoke the charm of Marrakech, with earthy tones, intricate details, and lush landscaping. Residents enjoy exclusive beach access, floating pods, and a truly resort-like lifestyle.',
    amenities: ['Crystal Lagoon', 'Private Beach', 'Pool', 'Floating Pods', 'Kids Club', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 22, slug: 'safa-one', title: 'Safa One', developer: 'DAMAC Properties', location: 'Business Bay', community: 'Business Bay',
    priceFrom: 1600000, priceFromLabel: 'from AED 1.6M', completionDate: 'Q4 2026',
    type: 'Apartment', badge: 'Under Construction', image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=90',
    beds: '1–3 Beds', description: 'Safa One is a stunning twin-tower development by DAMAC on Sheikh Zayed Road, featuring a sky rainforest, a tropical beach on the 49th floor, and unrivalled views of Safa Park and the Dubai skyline.\n\nA collaboration with de Grisogono, the world-renowned Swiss jewellery house, Safa One elevates residential living to an art form.',
    amenities: ['Sky Rainforest', 'Tropical Beach', 'Infinity Pool', 'Gym', 'Concierge', 'Retail', 'Parking', 'Security'],
  },

  // ── Nakheel developer page projects ────────────────────────
  {
    id: 23, slug: 'como-residences-palm-jumeirah', title: 'Como Residences Palm Jumeirah', developer: 'Nakheel', location: 'Palm Jumeirah', community: 'Palm Jumeirah',
    priceFrom: 21000000, priceFromLabel: 'from AED 21M', completionDate: 'Q4 2027',
    type: 'Penthouse', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=90',
    beds: '2–5 Beds', description: 'Como Residences is an extraordinary ultra-luxury residential tower on Palm Jumeirah, offering just 76 residences with sweeping panoramic views of the Arabian Gulf, Dubai Marina, and the iconic Palm.\n\nEach residence features private pools, expansive terraces, and interiors by world-renowned designers — setting a new standard for ultra-luxury living in Dubai.',
    amenities: ['Private Pool', 'Private Beach', 'Concierge', 'Spa', 'Gym', 'Valet', 'Helipad', 'Security'],
  },
  {
    id: 24, slug: 'palm-jebel-ali-villas', title: 'Palm Jebel Ali Villas', developer: 'Nakheel', location: 'Palm Jebel Ali', community: 'Palm Jebel Ali',
    priceFrom: 9500000, priceFromLabel: 'from AED 9.5M', completionDate: 'Q2 2028',
    type: 'Villa', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=90',
    beds: '4–7 Beds', description: 'Palm Jebel Ali Villas mark the revival of Dubai\'s second palm island — a project bigger than Palm Jumeirah. These exclusive beachfront villas offer private beaches, direct sea access, and an extraordinary island lifestyle.\n\nWith Dubai\'s expanding south corridor and proximity to Al Maktoum International Airport, Palm Jebel Ali represents a once-in-a-generation investment opportunity.',
    amenities: ['Private Beach', 'Private Pool', 'Garden', 'Boat Dock', 'Kids Club', 'Retail', 'Parking', 'Security'],
  },
  {
    id: 25, slug: 'deira-islands-beach-residences', title: 'Deira Islands Beach Residences', developer: 'Nakheel', location: 'Deira Islands', community: 'Deira Islands',
    priceFrom: 950000, priceFromLabel: 'from AED 950K', completionDate: 'Q1 2027',
    type: 'Apartment', badge: 'Off-Plan', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
    beds: '1–3 Beds', description: 'Deira Islands Beach Residences offer waterfront apartments on Nakheel\'s newest island development in Deira, combining the charm of old Dubai with modern beachfront living.\n\nResidents enjoy direct beach access, a vibrant retail promenade, and easy connectivity to the historic Deira district and Dubai International Airport.',
    amenities: ['Beach Access', 'Pool', 'Gym', 'Promenade', 'Retail', 'Kids Club', 'Parking', 'Security'],
  },
];

export interface FaqItem { question: string; answer: string; open: boolean; }

@Component({
  selector: 'app-off-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './off-plan-detail.component.html',
  styleUrl: './off-plan-detail.component.scss',
})
export class OffPlanDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private sanitizer  = inject(DomSanitizer);

  project = signal<OffPlanProject | null>(null);
  mapUrl  = signal<SafeResourceUrl>('');
  activeImageIndex = signal(0);
  isFaved = signal(false);
  inquiryName = signal('');
  inquiryPhone = signal('');
  inquiryEmail = signal('');
  inquiryMessage = signal('');
  inquirySent = signal(false);
  newsletterEmail = signal('');
  newsletterDone = signal(false);

  readonly galleryImages = computed(() => {
    const p = this.project();
    if (!p) return [];
    return [
      p.image,
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    ];
  });

  readonly experts = [
    { name: 'Sarah Al-Mansouri', role: 'Senior Property Consultant', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', phone: '+971501234567', whatsapp: '971501234567' },
    { name: 'Ahmed Hassan', role: 'Off-Plan Specialist', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', phone: '+971502345678', whatsapp: '971502345678' },
    { name: 'Priya Sharma', role: 'Investment Advisor', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', phone: '+971503456789', whatsapp: '971503456789' },
  ];

  readonly paymentPlan = [
    { label: 'On Booking', pct: 10, color: '#c8a84b' },
    { label: 'During Construction', pct: 50, color: '#1a5c3a' },
    { label: 'On Handover', pct: 40, color: '#0a0e1a' },
  ];

  readonly nearbyProperties = [
    { type: 'Apartment for Sale', area: '1,200 sqft', beds: '2 Bed', furnished: 'Furnished', price: 'AED 1,800,000', agent: 'Sarah Al-Mansouri', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', isNew: true },
    { type: 'Apartment for Sale', area: '850 sqft', beds: '1 Bed', furnished: 'Unfurnished', price: 'AED 1,100,000', agent: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', isNew: false },
    { type: 'Apartment for Sale', area: '2,100 sqft', beds: '3 Bed', furnished: 'Furnished', price: 'AED 3,200,000', agent: 'Priya Sharma', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', isNew: true },
  ];

  readonly seoLinks: Record<string, string[]> = {
    dubaiProperties: ['Apartments for Sale', 'Villas for Sale', 'Townhouses for Sale', 'Penthouses for Sale', 'Studio Apartments', '1 Bedroom Apartments', '2 Bedroom Apartments', '3 Bedroom Apartments', '4 Bedroom Apartments', '5 Bedroom Villas'],
    offPlanProperties: ['Off-Plan Apartments', 'Off-Plan Villas', 'Off-Plan Townhouses', 'Luxury Off-Plan', 'Branded Residences', 'Waterfront Projects', 'Golf Community Projects', 'Affordable Off-Plan', 'Payment Plan Projects', 'Handover 2026'],
    luxuryProjects: ['Emaar Projects', 'Nakheel Projects', 'Damac Projects', 'Sobha Projects', 'Binghatti Projects', 'Meraas Projects', 'Aldar Projects', 'Omniyat Projects', 'Select Group', 'Danube Projects'],
    areas: ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'DIFC', 'JBR', 'Jumeirah', 'Al Barsha', 'Arabian Ranches', 'Dubai South'],
  };

  readonly offices = [
    { name: 'HQ – Business Bay', address: 'Bay Square Building 1, Business Bay' },
    { name: 'Br – Palm Jumeirah', address: 'Shoreline Apartments, Palm Jumeirah' },
    { name: 'Br – Dubai Marina', address: 'Marina Walk, Dubai Marina' },
    { name: 'Br – JVC', address: 'Circle Mall, Jumeirah Village Circle' },
    { name: 'Br – Downtown', address: 'Burj Views Podium, Downtown Dubai' },
    { name: 'Br – Dubai Hills', address: 'Hills Business Park, Dubai Hills' },
    { name: 'Br – Deira', address: 'Al Rigga Road, Deira' },
    { name: 'Br – Al Barsha', address: 'Al Barsha 1, Sheikh Zayed Road' },
    { name: 'Br – DIFC', address: 'Gate Village, DIFC' },
    { name: 'Br – Mirdif', address: 'Mirdif City Centre, Mirdif' },
  ];

  faqs: FaqItem[] = [
    { question: 'What is the payment plan for this project?', answer: 'The standard plan is 10% on booking, 50% during construction in instalments, and 40% on handover. Flexible post-handover plans may also be available — contact our team for details.', open: false },
    { question: 'Is this project registered with RERA?', answer: 'Yes. All projects listed on Livwell are RERA-registered. Escrow accounts protect buyer funds in accordance with Dubai Law No. 8 of 2007.', open: false },
    { question: 'Can I get a mortgage for an off-plan property?', answer: 'Yes. UAE banks offer mortgages up to 50% LTV during construction. The full mortgage transfers to your name at completion. We partner with leading UAE banks to help you secure the best rates.', open: false },
    { question: 'What are the service charges after handover?', answer: 'Service charges vary by development, typically AED 12–25 per sqft per annum. The exact rate is registered with RERA and disclosed before signing the SPA.', open: false },
    { question: 'Can overseas investors purchase this property?', answer: 'Yes. Dubai allows 100% foreign ownership in freehold areas. Remote purchases are facilitated via digital signing and power of attorney. Our team assists throughout the process.', open: false },
  ];

  similarProjects = computed(() => {
    const p = this.project();
    if (!p) return [];
    return ALL_PROJECTS.filter(x => x.id !== p.id && x.type === p.type).slice(0, 3);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      const found = ALL_PROJECTS.find(p => p.slug === id || p.id === Number(id)) ?? null;
      this.project.set(found);
      if (found) this.geocodeAndSetMap(found);
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0 });
      }
    });
  }

  private async geocodeAndSetMap(p: OffPlanProject): Promise<void> {
    const raw   = p.community?.trim() || p.location?.trim() || p.title?.trim() || 'Dubai';
    const query = raw.toLowerCase().includes('dubai') ? raw : raw + ', Dubai, UAE';
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const q   = encodeURIComponent(query);
        const url = `https://maps.google.com/maps?q=${q}&ll=${lat},${lon}&t=m&z=15&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  toggleFaq(i: number): void {
    this.faqs = this.faqs.map((f, idx) => ({ ...f, open: idx === i ? !f.open : false }));
  }

  sendInquiry(): void {
    if (this.inquiryName() && this.inquiryPhone()) {
      this.inquirySent.set(true);
    }
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail()) {
      this.newsletterDone.set(true);
    }
  }

  formatPrice(n: number): string {
    if (n >= 1000000) return 'AED ' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (n >= 1000) return 'AED ' + (n / 1000).toFixed(0) + 'K';
    return 'AED ' + n.toLocaleString();
  }

  getPaymentPlanDash(pct: number): string {
    const r = 40;
    const circ = 2 * Math.PI * r;
    return `${(pct / 100) * circ} ${circ}`;
  }

  getPaymentPlanOffset(index: number): string {
    const r = 40;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (this.paymentPlan[i].pct / 100) * circ;
    }
    return `${-offset}`;
  }

  getDescParagraphs(p: OffPlanProject): string[] {
    return p.description.split('\n\n');
  }
}
