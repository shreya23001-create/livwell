import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface ProjectDetail {
  id: string;
  title: string;
  subtitle: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  startingPrice: string;
  beds: string;
  baths: string;
  area: string;
  completionDate: string;
  paymentPlan: { label: string; percent: number }[];
  images: string[];
  overview: string;
  highlights: string[];
  amenities: { label: string; icon: string }[];
  faqs: { q: string; a: string }[];
  experts: { name: string; role: string; phone: string; avatar: string }[];
  transactions: { date: string; beds: string; type: string; price: string; priceSqft: string }[];
  mapEmbed?: string;
  badge?: string;
}

const PROJECTS: Record<string, ProjectDetail> = {
  'one-za-abeel-residences': {
    id: 'one-za-abeel-residences',
    title: "One Za'abeel Residences",
    subtitle: "Luxury Apartments & Penthouse",
    developer: 'Ithra Dubai',
    location: "Za'abeel, Dubai",
    community: "Za'abeel",
    type: 'Penthouse',
    status: 'Ready',
    startingPrice: 'AED 18,500,000',
    beds: '2 – 5 BR',
    baths: '3 – 6',
    area: '2,800 – 9,200 sqft',
    completionDate: 'Q4 2024',
    badge: 'Iconic',
    paymentPlan: [
      { label: 'On Booking', percent: 30 },
      { label: 'During Construction', percent: 40 },
      { label: 'On Handover', percent: 30 },
    ],
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=85',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85',
    ],
    overview: "One Za'abeel is an iconic twin-tower development by Ithra Dubai, home to the world's highest inhabited sky bridge 'The Link'. The residences offer unparalleled views of Downtown Dubai and the Za'abeel Palace gardens. Each residence is designed with bespoke finishes, floor-to-ceiling glazing, and access to a curated collection of world-class amenities.",
    highlights: [
      "World's highest inhabited sky bridge",
      'Panoramic views of Downtown Dubai & Za\'abeel Palace',
      'Bespoke Italian marble interiors',
      'Private concierge & valet service',
      'Rooftop infinity pool at 300m elevation',
      '5-minute drive to DIFC & Downtown',
    ],
    amenities: [
      { label: 'Infinity Pool', icon: '🏊' },
      { label: 'Private Gym', icon: '💪' },
      { label: 'Concierge', icon: '🛎️' },
      { label: 'Valet Parking', icon: '🚗' },
      { label: 'Sky Lounge', icon: '🌆' },
      { label: 'Fine Dining', icon: '🍽️' },
      { label: 'Spa & Wellness', icon: '🧖' },
      { label: 'Business Centre', icon: '💼' },
    ],
    faqs: [
      { q: "What is the starting price for One Za'abeel Residences?", a: "Residences start from AED 18,500,000 for a 2-bedroom unit." },
      { q: 'Is the project completed?', a: 'Yes, One Za\'abeel was completed in Q4 2024 and is ready for handover.' },
      { q: 'Who is the developer?', a: 'One Za\'abeel is developed by Ithra Dubai, a subsidiary of the Investment Corporation of Dubai.' },
      { q: 'What payment plans are available?', a: 'A 30/40/30 payment plan is available — 30% on booking, 40% during construction, and 30% on handover.' },
    ],
    experts: [
      { name: 'Anuj Sharma', role: 'Luxury Property Specialist', phone: '+971542481813', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { name: 'Niket Mehta', role: 'Senior Property Consultant', phone: '+971585798027', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    ],
    transactions: [
      { date: '12 Mar 2025', beds: '3 BR', type: 'Apartment', price: 'AED 22,400,000', priceSqft: 'AED 6,800' },
      { date: '8 Feb 2025',  beds: '2 BR', type: 'Apartment', price: 'AED 19,100,000', priceSqft: 'AED 6,500' },
      { date: '14 Jan 2025', beds: '4 BR', type: 'Penthouse', price: 'AED 38,500,000', priceSqft: 'AED 7,100' },
    ],
  },
  'bulgari-ocean-mansions': {
    id: 'bulgari-ocean-mansions',
    title: 'Bulgari Ocean Mansions',
    subtitle: 'Ultra Luxury Villas & Mansions',
    developer: 'Meraas',
    location: 'Jumeira Bay Island, Dubai',
    community: 'Jumeira Bay',
    type: 'Villa',
    status: 'Off-Plan',
    startingPrice: 'AED 65,000,000',
    beds: '5 – 7 BR',
    baths: '7 – 9',
    area: '10,000 – 18,000 sqft',
    completionDate: 'Q2 2026',
    badge: 'Ultra Luxury',
    paymentPlan: [
      { label: 'On Booking', percent: 20 },
      { label: 'During Construction', percent: 60 },
      { label: 'On Handover', percent: 20 },
    ],
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=85',
    ],
    overview: "Bulgari Ocean Mansions is an ultra-exclusive collection of beachfront mansions on the pristine shores of Jumeira Bay Island. Crafted in collaboration with Bulgari's world-renowned design team, each mansion is a masterpiece of Italian craftsmanship fused with Dubai's architectural ambition. Residents enjoy direct beach access, private pools, and the legendary Bulgari Resort services.",
    highlights: [
      'Direct beachfront on Jumeira Bay Island',
      'Designed in collaboration with Bulgari Italy',
      'Private beach access for each mansion',
      'Dedicated marina berth included',
      'Access to Bulgari Resort & Spa facilities',
      '24/7 butler and concierge service',
    ],
    amenities: [
      { label: 'Private Beach', icon: '🏖️' },
      { label: 'Infinity Pool', icon: '🏊' },
      { label: 'Marina Berth', icon: '⛵' },
      { label: 'Butler Service', icon: '🛎️' },
      { label: 'Home Cinema', icon: '🎬' },
      { label: 'Wine Cellar', icon: '🍷' },
      { label: 'Spa', icon: '🧖' },
      { label: 'Smart Home', icon: '🏠' },
    ],
    faqs: [
      { q: 'What is the starting price?', a: 'Bulgari Ocean Mansions start from AED 65,000,000.' },
      { q: 'When is the expected completion?', a: 'The project is expected to be completed in Q2 2026.' },
      { q: 'Is a marina berth included?', a: 'Yes, each mansion comes with a dedicated marina berth at the Bulgari Marina.' },
    ],
    experts: [
      { name: 'Yash Uday Chari', role: 'Ultra Luxury Specialist', phone: '+971585833629', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' },
      { name: 'Anuj Sharma', role: 'Senior Property Consultant', phone: '+971542481813', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    ],
    transactions: [],
  },
};

// Generate minimal entries for other projects
const STUB_IDS = [
  'six-senses-residences', 'atlantis-the-royal-residences', 'dorchester-collection-dubai',
  'emaar-beachfront-grand-bleu', 'nakheel-como-residences', 'damac-cavalli-tower',
  'district-one-villas-phase-3', 'ellington-ocean-house', 'sobha-hartland-waves-opulence',
  'jumeirah-living-business-bay', 'aeterna-by-omniyat', 'jumeirah-marsa-al-arab-residences',
];
STUB_IDS.forEach(id => {
  PROJECTS[id] = {
    id, title: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    subtitle: 'Luxury Residences in Dubai', developer: 'Livwell Developer', location: 'Dubai',
    community: 'Dubai', type: 'Apartment', status: 'Off-Plan', startingPrice: '',
    beds: '', baths: '', area: '', completionDate: '', badge: undefined,
    paymentPlan: [], images: [], overview: '', highlights: [], amenities: [], faqs: [], experts: [], transactions: [],
  };
});

@Component({
  selector: 'app-luxury-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-project-detail.component.html',
  styleUrl: './luxury-project-detail.component.scss',
})
export class LuxuryProjectDetailComponent implements OnInit {
  project    = signal<ProjectDetail | null>(null);
  notFound   = signal(false);
  openFaq    = signal<number | null>(null);
  activeImage = signal(0);
  mapUrl     = signal<SafeResourceUrl>('');

  private sanitizer = inject(DomSanitizer);

  hasData = computed(() => {
    const p = this.project();
    return p !== null && p.overview.length > 0;
  });

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      const found = PROJECTS[id];
      if (found) {
        this.project.set(found);
        this.geocodeAndSetMap(found.community, found.location);
      } else {
        this.notFound.set(true);
      }
    });
  }

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
      this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
