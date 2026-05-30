import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Project {
  slug: string;
  name: string;
  location: string;
  type: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  price: string;
  beds: string;
  area: string;
  image: string;
  handover?: string;
}

interface DeveloperDetail {
  slug: string;
  name: string;
  logo: string;
  established: number;
  hq: string;
  nationality: string;
  about: string;
  stats: { projects: number; units: number; salesVolume: string; salesValue: string; capitalGain: string; delivered: number };
  highlights: string[];
  projects: Project[];
  awards: string[];
}

const IMG = (q: string) => `https://images.unsplash.com/${q}?w=600&q=80`;

const DEVS: Record<string, DeveloperDetail> = {
  'emaar': {
    slug: 'emaar', name: 'Emaar Properties', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Emaar_Properties_logo.svg/320px-Emaar_Properties_logo.svg.png',
    established: 1997, hq: 'Dubai, UAE', nationality: 'UAE',
    about: "Emaar Properties is one of the world's largest real estate companies and is the UAE's biggest listed developer. Founded in 1997 by Mohamed Alabbar, Emaar is the creator of the Burj Khalifa, Dubai Mall, and the entire Downtown Dubai master community. The developer has a global presence spanning across the Middle East, North Africa, South Asia, and North America.\n\nEmaar's residential portfolio is renowned for quality, design excellence, and timely delivery — making it a trusted choice for investors and end-users alike. The developer consistently tops Dubai transaction charts and continues to release landmark projects that redefine city living.",
    stats: { projects: 87, units: 95000, salesVolume: '84', salesValue: 'AED 785.4M', capitalGain: 'AED 296.9M', delivered: 62 },
    highlights: ['Creator of Burj Khalifa — world\'s tallest building', 'Delivered 85,000+ residential units globally', 'Developer of Downtown Dubai, Dubai Hills, Emaar Beachfront', 'Listed on Dubai Financial Market (DFM)', 'Operations in 36 countries worldwide', 'Consistent top performer in DLD transaction rankings'],
    awards: ['Best Developer — Arabian Property Awards 2024', 'Developer of the Year — Cityscape Global 2023', 'Most Trusted Brand in Real Estate — Forbes Middle East 2024'],
    projects: [
      { slug: 'address-residences-dubai-opera', name: 'Address Residences Dubai Opera', location: 'Downtown Dubai', type: 'Apartment', status: 'Ready', price: 'from AED 2.1M', beds: '1–4 Beds', area: '750–3,200 sqft', image: IMG('photo-1512453979798-5ea266f8880c'), handover: 'Ready' },
      { slug: 'emaar-beachfront-grand-bleu-tower', name: 'Emaar Beachfront Grand Bleu Tower', location: 'Dubai Harbour', type: 'Apartment', status: 'Under Construction', price: 'from AED 2.8M', beds: '1–3 Beds', area: '650–2,100 sqft', image: IMG('photo-1507525428034-b723cf961d3e'), handover: 'Q4 2026' },
      { slug: 'dubai-hills-estate-villas', name: 'Dubai Hills Estate Villas', location: 'Dubai Hills', type: 'Villa', status: 'Off-Plan', price: 'from AED 4.5M', beds: '3–6 Beds', area: '2,800–8,500 sqft', image: IMG('photo-1613977257363-707ba9348227'), handover: 'Q2 2027' },
      { slug: 'creek-waters-2', name: 'Creek Waters 2', location: 'Dubai Creek Harbour', type: 'Apartment', status: 'Off-Plan', price: 'from AED 1.5M', beds: 'Studio–3 Beds', area: '450–1,800 sqft', image: IMG('photo-1560518883-ce09059eeffa'), handover: 'Q3 2027' },
      { slug: 'golf-links-emaar-south', name: 'Golf Links — Emaar South', location: 'Dubai South', type: 'Townhouse', status: 'Off-Plan', price: 'from AED 1.8M', beds: '3–4 Beds', area: '1,800–2,800 sqft', image: IMG('photo-1574362848149-11496d93a7c7'), handover: 'Q1 2028' },
      { slug: 'savanna-dubai-hills', name: 'Savanna — Dubai Hills', location: 'Dubai Hills Estate', type: 'Apartment', status: 'Off-Plan', price: 'from AED 1.2M', beds: '1–3 Beds', area: '650–1,650 sqft', image: IMG('photo-1544984243-ec57ea16fe25'), handover: 'Q2 2027' },
    ],
  },
  'damac': {
    slug: 'damac', name: 'DAMAC Properties', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/DAMAC_Logo.svg/320px-DAMAC_Logo.svg.png',
    established: 2002, hq: 'Dubai, UAE', nationality: 'UAE',
    about: "DAMAC Properties is one of the Middle East's leading luxury real estate developers. Founded in 2002 by Hussain Sajwani, DAMAC has delivered more than 46,000 homes across the UAE, Saudi Arabia, Qatar, Jordan, Lebanon, and the UK.\n\nDAMAC is renowned for its branded residences partnerships — including DAMAC Hills with the Trump International Golf Course, DAMAC Lagoons, Cavalli Tower, and the Roberto Cavalli and de Grisogono collections. The developer focuses on affordable luxury and lifestyle-led communities.",
    stats: { projects: 65, units: 46000, salesVolume: '72', salesValue: 'AED 620.3M', capitalGain: 'AED 218.7M', delivered: 48 },
    highlights: ['46,000+ homes delivered globally', 'Branded residences with Cavalli, Trump, Versace', 'DAMAC Hills golf community with Trump branding', 'Listed on Dubai Financial Market', 'Projects in 8 countries across Middle East and UK'],
    awards: ['Luxury Developer of the Year — Arabian Business 2023', 'Best Branded Residences — International Property Awards 2024'],
    projects: [
      { slug: 'damac-hills-2-townhouses', name: 'DAMAC Hills 2 Townhouses', location: 'DAMAC Hills 2', type: 'Townhouse', status: 'Off-Plan', price: 'from AED 850K', beds: '3–5 Beds', area: '1,500–3,200 sqft', image: IMG('photo-1580587771525-78b9dba3b914'), handover: 'Q4 2026' },
      { slug: 'cavalli-tower', name: 'Cavalli Tower', location: 'Dubai Marina', type: 'Apartment', status: 'Under Construction', price: 'from AED 2.2M', beds: '1–4 Beds', area: '700–3,500 sqft', image: IMG('photo-1582672060674-bc2bd808a8b5'), handover: 'Q2 2027' },
      { slug: 'damac-lagoons-morocco', name: 'DAMAC Lagoons Morocco', location: 'DAMAC Lagoons', type: 'Villa', status: 'Off-Plan', price: 'from AED 1.9M', beds: '4–7 Beds', area: '2,200–6,000 sqft', image: IMG('photo-1568605114967-8130f3a36994'), handover: 'Q3 2027' },
      { slug: 'safa-one', name: 'Safa One', location: 'Business Bay', type: 'Apartment', status: 'Under Construction', price: 'from AED 1.6M', beds: '1–3 Beds', area: '600–2,000 sqft', image: IMG('photo-1614730321146-b6fa6a46bcb4'), handover: 'Q4 2026' },
    ],
  },
  'nakheel': {
    slug: 'nakheel', name: 'Nakheel', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Nakheel_Logo.svg/320px-Nakheel_Logo.svg.png',
    established: 2000, hq: 'Dubai, UAE', nationality: 'UAE',
    about: "Nakheel is one of Dubai's largest master developers and a wholly owned subsidiary of Dubai World. Best known for creating Palm Jumeirah — the world's largest man-made island — Nakheel has transformed Dubai's coastline with iconic projects including The World Islands, Palm Jebel Ali, and Deira Islands.\n\nBeyond islands, Nakheel has developed major master communities including Jumeirah Village Circle, Al Furjan, International City, Jumeirah Park, and The Gardens. The developer manages over 300 retail units and a diverse portfolio of hospitality, leisure, and residential assets.",
    stats: { projects: 54, units: 80000, salesVolume: '61', salesValue: 'AED 540.2M', capitalGain: 'AED 196.4M', delivered: 41 },
    highlights: ['Creator of Palm Jumeirah — world\'s largest man-made island', '80,000+ units developed', 'JVC, Al Furjan, International City master developer', 'Palm Jebel Ali — new mega-project underway', '300+ retail assets under management'],
    awards: ['Best Master Developer — Cityscape 2023', 'Infrastructure Achievement Award — Arabian Property Awards 2022'],
    projects: [
      { slug: 'como-residences-palm-jumeirah', name: 'Como Residences Palm Jumeirah', location: 'Palm Jumeirah', type: 'Penthouse', status: 'Off-Plan', price: 'from AED 21M', beds: '2–5 Beds', area: '4,000–21,000 sqft', image: IMG('photo-1578662996442-48f60103fc96'), handover: 'Q4 2027' },
      { slug: 'palm-jebel-ali-villas', name: 'Palm Jebel Ali Villas', location: 'Palm Jebel Ali', type: 'Villa', status: 'Off-Plan', price: 'from AED 9.5M', beds: '4–7 Beds', area: '5,000–15,000 sqft', image: IMG('photo-1564013799919-ab600027ffc6'), handover: 'Q2 2028' },
      { slug: 'deira-islands-beach-residences', name: 'Deira Islands Beach Residences', location: 'Deira Islands', type: 'Apartment', status: 'Off-Plan', price: 'from AED 950K', beds: '1–3 Beds', area: '550–1,800 sqft', image: IMG('photo-1507525428034-b723cf961d3e'), handover: 'Q1 2027' },
    ],
  },
};

// Generic builder for any developer not in DEVS
function buildGeneric(slug: string): DeveloperDetail | null {
  const nameMap: Record<string, string> = {
    'meraas': 'Meraas', 'meydan': 'Meydan', 'sobha': 'Sobha Realty',
    'aldar': 'Aldar Properties', 'omniyat': 'OMNIYAT', 'select-group': 'Select Group',
    'majid-al-futtaim': 'Majid Al Futtaim', 'ithra-dubai': 'Ithra Dubai',
    'ellington': 'Ellington Properties', 'dubai-properties': 'Dubai Properties',
    'azizi': 'Azizi Developments', 'samana': 'Samana Developers',
    'binghatti': 'Binghatti Developers', 'tiger-group': 'Tiger Group', 'danube': 'Danube Properties',
  };
  const name = nameMap[slug];
  if (!name) return null;
  return {
    slug, name, logo: '', established: 2000, hq: 'Dubai, UAE', nationality: 'UAE',
    about: `${name} is a leading real estate developer in Dubai with a strong track record of delivering quality residential and commercial projects. The developer has built a reputation for innovative design, customer-centric approach, and commitment to timely delivery across multiple communities in Dubai.`,
    stats: { projects: 24, units: 8500, salesVolume: '38', salesValue: 'AED 320M', capitalGain: 'AED 98M', delivered: 18 },
    highlights: ['Strong track record of timely delivery', 'Award-winning architectural design', 'Diverse portfolio across residential and commercial', 'Customer-centric approach with flexible payment plans', 'Established presence in key Dubai communities'],
    awards: ['Best Developer — Arabian Property Awards', 'Excellence in Real Estate — Cityscape Global'],
    projects: [
      { slug: `${slug}-residences`, name: `${name} Residences`, location: 'Dubai', type: 'Apartment', status: 'Off-Plan', price: 'from AED 800K', beds: '1–3 Beds', area: '500–1,800 sqft', image: IMG('photo-1486325212027-8081e485255e'), handover: 'Q2 2027' },
      { slug: `${slug}-villas`, name: `${name} Villas`, location: 'Dubai', type: 'Villa', status: 'Ready', price: 'from AED 2.5M', beds: '3–5 Beds', area: '2,200–4,500 sqft', image: IMG('photo-1613977257363-707ba9348227'), handover: 'Ready' },
    ],
  };
}

@Component({
  selector: 'app-developer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './developer-detail.component.html',
  styleUrl: './developer-detail.component.scss',
})
export class DeveloperDetailComponent implements OnInit {
  dev = signal<DeveloperDetail | null>(null);
  notFound = signal(false);

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.params.subscribe(p => {
      const slug = p['slug'];
      const found = DEVS[slug] ?? buildGeneric(slug);
      this.dev.set(found);
      this.notFound.set(!found);
      window.scrollTo({ top: 0 });
    });
  }

  statusClass(s: string) {
    return { 'Ready': 'st--ready', 'Off-Plan': 'st--offplan', 'Under Construction': 'st--construction' }[s] ?? '';
  }
}
