import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

interface CommercialDetail {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: string;
  status: string;
  price: string;
  pricePerSqft: string;
  area: string;
  refNo: string;
  view?: string;
  furnished: boolean;
  forRent: boolean;
  images: string[];
  about: string;
  features: string[];
  agent: { name: string; role: string; phone: string; email: string; avatar: string };
  mapUrl: string;
}

const A = { name: 'Anuj Sharma', role: 'Commercial Property Specialist', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' };
const N = { name: 'Niket Mehta', role: 'Senior Commercial Consultant', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' };

const DIFC_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.2!2d55.2818!3d25.2124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43495ded3741%3A0xf8a89b7fe22be21d!2sDIFC!5e0!3m2!1sen!2sae!4v1700000000000';
const BB_MAP   = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.5!2d55.2644!3d25.1865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682b0d8b24f3%3A0x5f6a7f4d3e3b2f1a!2sBusiness%20Bay!5e0!3m2!1sen!2sae!4v1700000000000';
const DT_MAP   = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178!2d55.27568!3d25.19489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1cbb7e2!2sDowntown%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000';
const JBR_MAP  = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.0!2d55.1395!3d25.0786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b5b1e4e1c1f%3A0x4e2c5b7f3a2d1b0c!2sJBR!5e0!3m2!1sen!2sae!4v1700000000000';
const JLT_MAP  = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.5!2d55.1555!3d25.0693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f856a29a2bdcf%3A0xa9b2fc6c5e3e2d2a!2sJLT!5e0!3m2!1sen!2sae!4v1700000000000';
const AQ_MAP   = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.0!2d55.2203!3d25.1402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f68e8b4a9e2c7%3A0x1b3f2c4e5d6a7b8c!2sAl%20Quoz!5e0!3m2!1sen!2sae!4v1700000000000';
const MBR_MAP  = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.5!2d55.3055!3d25.2066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6966461bfa61%3A0x3a3c2a2e6b5f4d30!2sMBR%20City!5e0!3m2!1sen!2sae!4v1700000000000';

const OFFICE_FEATURES  = ['Central A/C', 'High-Speed Internet', 'Raised Floor', 'Suspended Ceilings', 'Built-in Meeting Rooms', 'Pantry Area', '24/7 Security', 'CCTV', 'Covered Parking', 'Reception Lobby', 'Backup Generator', 'Fire Suppression System', 'Server Room', 'Disabled Access', 'Loading Bay'];
const RETAIL_FEATURES  = ['Prominent Signage Rights', 'High Footfall Location', 'Direct Street Access', 'Storage Room', '24/7 Security', 'CCTV', 'Central A/C', 'Electrical Fit-out', 'Plumbing Points', 'Shared Loading Bay', 'Nearby Parking', 'Mezzanine Option'];
const WAREHOUSE_FEATURES = ['High Ceiling (8–12m)', 'Loading Dock (3–5 doors)', 'Mezzanine Level', 'Office Section', '3-Phase Power Supply', 'Fire Suppression', 'CCTV', '24/7 Security', 'Heavy-Duty Flooring', 'Covered Storage', 'Outdoor Yard Area', 'Forklift Access'];
const PLOT_FEATURES    = ['Freehold Title', 'DLD Registered', 'Road Frontage', 'Utility Connections Available', 'No Height Restriction', 'Mixed-Use Permit Eligible', 'Corner Plot', 'Close to Metro'];

const ALL_COMMERCIAL: Record<number, CommercialDetail> = {
  1: {
    id: 1, title: 'Grade A Office — DIFC Gate Village', developer: 'DIFC Authority', location: 'DIFC, Dubai',
    type: 'Office', status: 'Ready', price: 'AED 8,500,000', pricePerSqft: 'AED 3,200 / sqft',
    area: '2,656 sqft', refNo: 'COM-001', view: 'City View', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85'],
    about: 'A premium Grade A office unit located within the prestigious DIFC Gate Village — one of Dubai\'s most sought-after business addresses. This 2,656 sqft open-plan office boasts floor-to-ceiling glazing with stunning city views, raised access floors, and suspended ceilings pre-fitted for IT infrastructure. Ideal for financial services, law firms, or regional headquarters seeking a world-class address.',
    features: OFFICE_FEATURES, agent: A, mapUrl: DIFC_MAP,
  },
  2: {
    id: 2, title: 'Business Bay Office Tower', developer: 'Damac', location: 'Business Bay, Dubai',
    type: 'Office', status: 'Ready', price: 'AED 3,200,000', pricePerSqft: 'AED 1,800 / sqft',
    area: '1,778 sqft', refNo: 'COM-002', view: 'Canal View', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85'],
    about: 'A well-appointed office unit in one of Business Bay\'s most recognised commercial towers. Offering canal views, this 1,778 sqft fitted office is move-in ready with a dedicated reception area, two enclosed meeting rooms, and open-plan workspace for 12–15 staff. The building features a five-star lobby, concierge service, and direct access to the Dubai Canal promenade.',
    features: OFFICE_FEATURES, agent: N, mapUrl: BB_MAP,
  },
  3: {
    id: 3, title: 'Downtown Dubai Retail Shop', developer: 'Emaar', location: 'Downtown Dubai',
    type: 'Shop', status: 'Ready', price: 'AED 4,800,000', pricePerSqft: 'AED 4,800 / sqft',
    area: '1,000 sqft', refNo: 'COM-003', view: 'Street View', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85','https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=85','https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=1200&q=85'],
    about: 'A ground-floor retail unit on one of Downtown Dubai\'s busiest pedestrian corridors, steps from the Dubai Mall and Burj Khalifa. Featuring 10-metre frontage, prominent signage rights, and shell-and-core handover, this 1,000 sqft unit is perfectly positioned for F&B, luxury retail, or lifestyle brands targeting Dubai\'s highest-spending demographic.',
    features: RETAIL_FEATURES, agent: A, mapUrl: DT_MAP,
  },
  4: {
    id: 4, title: 'JBR Beach Walk Retail Unit', developer: 'Meraas', location: 'JBR, Dubai Marina',
    type: 'Shop', status: 'Ready', price: 'AED 6,200,000', pricePerSqft: 'AED 5,167 / sqft',
    area: '1,200 sqft', refNo: 'COM-004', view: 'Sea View', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=85','https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85','https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=85'],
    about: 'A prime beachfront retail unit on The Walk at JBR — Dubai\'s most visited open-air retail and leisure destination. This 1,200 sqft ground-floor unit enjoys direct beach access, sea views, and year-round footfall from tourists and residents. An exceptional opportunity for F&B, beach lifestyle, or premium retail operators.',
    features: RETAIL_FEATURES, agent: N, mapUrl: JBR_MAP,
  },
  5: {
    id: 5, title: 'Al Quoz Industrial Warehouse', developer: 'Dubai Properties', location: 'Al Quoz, Dubai',
    type: 'Warehouse', status: 'Ready', price: 'AED 5,500,000', pricePerSqft: 'AED 550 / sqft',
    area: '10,000 sqft', refNo: 'COM-005', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=85','https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=85','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=85'],
    about: 'A strategically located industrial warehouse in Al Quoz — Dubai\'s most established industrial district. This 10,000 sqft facility features a 9-metre clear height, three loading docks, a 500 sqft mezzanine office, and three-phase power supply. With direct access to Sheikh Zayed Road, this unit is ideal for logistics, manufacturing, or storage operations.',
    features: WAREHOUSE_FEATURES, agent: A, mapUrl: AQ_MAP,
  },
  6: {
    id: 6, title: 'Jebel Ali Logistics Warehouse', developer: 'DP World', location: 'Jebel Ali, Dubai',
    type: 'Warehouse', status: 'Ready', price: 'AED 9,800,000', pricePerSqft: 'AED 490 / sqft',
    area: '20,000 sqft', refNo: 'COM-006', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=85','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=85','https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=85'],
    about: 'A large-scale logistics warehouse adjacent to Jebel Ali Free Zone — the world\'s largest man-made harbour and a global trade hub. This 20,000 sqft facility includes 5 loading docks, 12-metre clear height, a 1,000 sqft admin office, and an adjacent open yard of 5,000 sqft. Ideally suited for regional distribution, e-commerce fulfilment, or cold chain operations.',
    features: WAREHOUSE_FEATURES, agent: N, mapUrl: AQ_MAP,
  },
  7: {
    id: 7, title: 'MBR City Commercial Plot', developer: 'Meydan', location: 'MBR City, Dubai',
    type: 'Plot', status: 'Ready', price: 'AED 18,000,000', pricePerSqft: 'AED 900 / sqft',
    area: '20,000 sqft', refNo: 'COM-007', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=85'],
    about: 'A prime freehold commercial plot in the heart of Mohammed Bin Rashid City — Dubai\'s most ambitious urban development. The 20,000 sqft G+10 permitted plot sits on a wide boulevard with dual road frontage and is within walking distance of the Meydan Racecourse and Dubai Creek Harbour. Suitable for commercial towers, mixed-use developments, or boutique hotel projects.',
    features: PLOT_FEATURES, agent: A, mapUrl: MBR_MAP,
  },
  8: {
    id: 8, title: 'Dubai South Commercial Plot', developer: 'Dubai South', location: 'Dubai South',
    type: 'Plot', status: 'Off-Plan', price: 'AED 7,200,000', pricePerSqft: 'AED 480 / sqft',
    area: '15,000 sqft', refNo: 'COM-008', furnished: false, forRent: false,
    images: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=85','https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85'],
    about: 'A commercially zoned freehold plot in Dubai South — the city\'s newest master-planned district and home to Al Maktoum International Airport. This 15,000 sqft plot is earmarked for logistics, aviation support services, or commercial mixed-use development. With Phase 2 of the airport expansion underway, demand in this corridor is expected to grow significantly over the next decade.',
    features: PLOT_FEATURES, agent: N, mapUrl: AQ_MAP,
  },
  9: {
    id: 9, title: 'DIFC Grade A Office — Full Floor', developer: 'DIFC Authority', location: 'DIFC, Dubai',
    type: 'Office', status: 'Ready', price: 'AED 420,000 / year', pricePerSqft: 'AED 158 / sqft / yr',
    area: '2,656 sqft', refNo: 'COM-009', view: 'City View', furnished: true, forRent: true,
    images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=85','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85'],
    about: 'A fully furnished, turnkey Grade A office floor in DIFC Gate Village — the financial heart of Dubai. This 2,656 sqft office comes fitted with a custom boardroom for 12, five private offices, open-plan workspace for 20 staff, a fully equipped pantry, and premium furniture throughout. Available for immediate occupation. 12-month lease with renewal option.',
    features: [...OFFICE_FEATURES, 'Fully Furnished', 'Turnkey Ready', 'IT Infrastructure Installed', 'Access to DIFC Courts'],
    agent: A, mapUrl: DIFC_MAP,
  },
  10: {
    id: 10, title: 'Jumeirah Lake Towers Office', developer: 'DMCC', location: 'JLT, Dubai',
    type: 'Office', status: 'Ready', price: 'AED 180,000 / year', pricePerSqft: 'AED 120 / sqft / yr',
    area: '1,500 sqft', refNo: 'COM-010', view: 'Lake View', furnished: false, forRent: true,
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85'],
    about: 'A shell-and-core office unit in JLT\'s free zone cluster, offering serene lake views and a DMCC free zone licence option. This 1,500 sqft unit is ideal for SMEs, startups, or regional offices seeking a prestigious JLT address with competitive lease rates. The building features a 5-star lobby, high-speed elevators, and basement parking for 4 vehicles.',
    features: OFFICE_FEATURES, agent: N, mapUrl: JLT_MAP,
  },
  11: {
    id: 11, title: 'Arjan Retail Shop — Ground Floor', developer: 'Dubai Properties', location: 'Arjan, Dubai',
    type: 'Shop', status: 'Ready', price: 'AED 85,000 / year', pricePerSqft: 'AED 283 / sqft / yr',
    area: '300 sqft', refNo: 'COM-011', view: 'Street View', furnished: false, forRent: true,
    images: ['https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=1200&q=85','https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85','https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=85'],
    about: 'A ground-floor retail unit in Arjan\'s growing commercial corridor, adjacent to a 2,500-unit residential cluster. This 300 sqft shell-and-core unit benefits from a busy main road location, good visibility, and parking availability for customers. Suited for cafes, convenience stores, beauty services, or other neighbourhood retail concepts.',
    features: RETAIL_FEATURES, agent: A, mapUrl: AQ_MAP,
  },
  12: {
    id: 12, title: 'Dubai Marina Waterfront Shop', developer: 'Emaar', location: 'Dubai Marina',
    type: 'Shop', status: 'Ready', price: 'AED 240,000 / year', pricePerSqft: 'AED 600 / sqft / yr',
    area: '400 sqft', refNo: 'COM-012', view: 'Sea View', furnished: false, forRent: true,
    images: ['https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&q=85','https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=1200&q=85','https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=85'],
    about: 'A premium waterfront retail unit on the Dubai Marina promenade — one of Dubai\'s busiest leisure and dining destinations with over 120,000 residents within a 1km radius. This 400 sqft unit offers sea views, direct marina frontage, and excellent signage opportunities. Ideal for upscale F&B, lifestyle boutiques, or experiential retail brands.',
    features: RETAIL_FEATURES, agent: N, mapUrl: JBR_MAP,
  },
};

// ── Additional Office for Rent listings ────────────────────
const EXTRA_OFFICES: CommercialDetail[] = [
  {
    id: 13, title: 'Downtown Dubai Office Suite', developer: 'Emaar', location: 'Downtown Dubai',
    type: 'Office', status: 'Ready', price: 'AED 320,000 / year', pricePerSqft: 'AED 267 / sqft / yr',
    area: '1,200 sqft', refNo: 'COM-013', view: 'Burj View', furnished: true, forRent: true,
    images: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=85','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85'],
    about: 'A premium furnished office suite in Downtown Dubai offering an unobstructed view of the Burj Khalifa. This 1,200 sqft fully fitted unit includes three private offices, a boardroom for 8, and a modern open-plan area. Located steps from Dubai Mall, with valet parking and a prestigious business address that impresses clients from the first visit.',
    features: [...OFFICE_FEATURES, 'Fully Furnished', 'Burj Khalifa View', 'Valet Parking'], agent: A, mapUrl: DT_MAP,
  },
  {
    id: 14, title: 'Media City Creative Office', developer: 'TECOM', location: 'Dubai Media City',
    type: 'Office', status: 'Ready', price: 'AED 155,000 / year', pricePerSqft: 'AED 155 / sqft / yr',
    area: '1,000 sqft', refNo: 'COM-014', furnished: false, forRent: true,
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85'],
    about: 'A creative open-plan office in Dubai Media City — the UAE\'s leading media and technology free zone. This 1,000 sqft shell unit is perfect for media agencies, tech startups, or content studios. TECOM free zone licence available on request. The campus offers world-class amenities including restaurants, a gym, childcare facilities, and networking events.',
    features: [...OFFICE_FEATURES, 'Free Zone Licence Option', 'Campus Amenities', 'Networking Events'], agent: N, mapUrl: JLT_MAP,
  },
  {
    id: 15, title: 'Silicon Oasis Tech Office', developer: 'Dubai Silicon Oasis Authority', location: 'Dubai Silicon Oasis',
    type: 'Office', status: 'Ready', price: 'AED 95,000 / year', pricePerSqft: 'AED 95 / sqft / yr',
    area: '1,000 sqft', refNo: 'COM-015', furnished: false, forRent: true,
    images: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=85'],
    about: 'A functional office unit within Dubai Silicon Oasis — a purpose-built tech hub home to over 1,000 companies from 95 countries. This affordable 1,000 sqft unit is ideal for IT companies, tech startups, or R&D centres seeking DSO free zone status. Fibre internet, backup power, and access to the onsite incubator and accelerator programmes are included.',
    features: [...OFFICE_FEATURES, 'DSO Free Zone Licence', 'Fibre Internet (1 Gbps)', 'Incubator Access'], agent: A, mapUrl: AQ_MAP,
  },
];

EXTRA_OFFICES.forEach(o => { ALL_COMMERCIAL[o.id] = o; });

@Component({
  selector: 'app-commercial-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './commercial-property-detail.component.html',
  styleUrl: './commercial-property-detail.component.scss',
})
export class CommercialPropertyDetailComponent implements OnInit {
  property = signal<CommercialDetail | null>(null);
  notFound = signal(false);
  activeImage = signal(0);
  showEnquiry = signal(false);

  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      const found = ALL_COMMERCIAL[id] ?? null;
      this.property.set(found);
      this.notFound.set(!found);
      this.activeImage.set(0);
      window.scrollTo({ top: 0 });
    });
  }

  safeMap(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

  statusClass(s: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[s] ?? '');
  }
}
