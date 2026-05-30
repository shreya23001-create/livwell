import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Area } from '../areas/areas.component';

interface AreaDetail extends Area {
  about: string;
  whyInvest: string[];
  lifestyle: string[];
  faqs: { q: string; a: string }[];
  projects: number;
  avgRoi: string;
  nearbyAreas: string[];
}

const AGENT_A = { name: 'Anuj Sharma', role: 'Area Specialist', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' };
const AGENT_N = { name: 'Niket Mehta', role: 'Senior Consultant', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' };

const AREA_DATA: Record<string, AreaDetail & { agent: typeof AGENT_A; mapUrl: string; images: string[] }> = {
  'downtown-dubai': {
    slug: 'downtown-dubai', name: 'Downtown Dubai', location: 'Central Dubai',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85','https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85','https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=1200&q=85'],
    propertiesForSale: 342, propertiesForRent: 218, avgPriceSale: 'AED 2.8M', avgPriceRent: 'AED 120K/yr',
    types: ['Apartments', 'Penthouses'], category: 'Freehold', featured: true, projects: 87, avgRoi: '5.8%',
    description: "Home to the Burj Khalifa and Dubai Mall, Downtown is Dubai's most iconic address for luxury living.",
    about: "Downtown Dubai is the beating heart of the city — a 500-acre master development by Emaar Properties built around the iconic Burj Khalifa, the world's tallest building. The neighbourhood is home to the Dubai Mall (the world's largest shopping mall by total area), the Dubai Fountain (the world's largest choreographed fountain), and some of Dubai's most prestigious residential towers.\n\nResidents enjoy immediate access to world-class dining, luxury retail, cultural venues, and the Dubai Opera. The area's central location provides excellent road and metro connectivity to the rest of the city.",
    whyInvest: ['World-famous address with global brand recognition', 'Consistent capital appreciation over 15 years', 'Strong short-term rental demand from tourists', 'Proximity to DIFC drives corporate tenant demand', 'Emaar-managed infrastructure ensures long-term quality'],
    lifestyle: ['Dubai Opera & DIFC art galleries', 'Burj Khalifa At The Top observatory', 'World-class dining on Emaar Boulevard', 'Dubai Fountain shows nightly', 'Walking distance to Dubai Mall & souks'],
    faqs: [
      { q: 'Is Downtown Dubai freehold for expats?', a: 'Yes, Downtown Dubai is a designated freehold area. Expats and foreign nationals can own property here with full ownership rights.' },
      { q: 'What is the minimum price to buy in Downtown Dubai?', a: 'Studio apartments start from approximately AED 900,000. 1-bedroom apartments start from AED 1.4M, with penthouses reaching AED 30M+.' },
      { q: 'What is the average ROI in Downtown Dubai?', a: 'Downtown delivers average gross rental yields of 5–6.5%. Short-term Airbnb rentals can achieve 7–9% depending on the tower and unit size.' },
    ],
    nearbyAreas: ['Business Bay', 'DIFC', 'Jumeirah', 'Dubai Creek Harbour'],
    agent: AGENT_A, mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178474959773!2d55.27568!3d25.19489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1cbb7e2!2sDowntown%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000',
  },
  'dubai-marina': {
    slug: 'dubai-marina', name: 'Dubai Marina', location: 'New Dubai',
    image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200&q=85','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85','https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&q=85'],
    propertiesForSale: 489, propertiesForRent: 376, avgPriceSale: 'AED 1.9M', avgPriceRent: 'AED 95K/yr',
    types: ['Apartments', 'Penthouses'], category: 'Freehold', featured: true, projects: 120, avgRoi: '6.2%',
    description: 'A vibrant waterfront district with world-class dining, a yacht marina, and stunning high-rise views.',
    about: 'Dubai Marina is one of the largest man-made marinas in the world and a favourite destination for residents and tourists alike. Stretching 3.5km along the waterfront, the Marina Walk is lined with over 200 restaurants, cafes, and boutiques. The community is served by two metro stations and a tram line, making it one of the best-connected neighbourhoods in Dubai.\n\nThe area features some of Dubai\'s most iconic residential towers including Marina Gate, Cayan Tower (the twisted tower), and Princess Tower — formerly the world\'s tallest residential building.',
    whyInvest: ['Highest rental demand of any Dubai community', 'Dual metro and tram access', 'Strong short-term rental market via Airbnb', 'Waterfront lifestyle commands premium rents', 'Walking distance to JBR beach'],
    lifestyle: ['Marina Walk promenade & dining', 'JBR beach access', 'Yacht clubs and water sports', 'Dubai Eye Ferris wheel nearby', 'Vibrant nightlife and entertainment'],
    faqs: [
      { q: 'Is Dubai Marina freehold?', a: 'Yes, Dubai Marina is a 100% freehold area. All nationalities can purchase property with full ownership rights.' },
      { q: 'What types of properties are available in Dubai Marina?', a: 'Primarily high-rise apartments ranging from studios to penthouses. A small number of townhouses and duplexes also exist within the community.' },
      { q: 'What is the rental yield in Dubai Marina?', a: 'Long-term rentals average 5.5–7% gross yield. Short-term holiday rentals can achieve 8–10% depending on the tower\'s location and amenities.' },
    ],
    nearbyAreas: ['JBR', 'JLT', 'Palm Jumeirah', 'Al Furjan'],
    agent: AGENT_N, mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.5!2d55.1395!3d25.0786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b5b1e4e1c1f%3A0x4e2c5b7f3a2d1b0c!2sDubai%20Marina!5e0!3m2!1sen!2sae!4v1700000000000',
  },
  'palm-jumeirah': {
    slug: 'palm-jumeirah', name: 'Palm Jumeirah', location: 'Palm Island',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=85','https://images.unsplash.com/photo-1582407947304-fd86f28f4e94?w=1200&q=85','https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&q=85'],
    propertiesForSale: 276, propertiesForRent: 142, avgPriceSale: 'AED 5.2M', avgPriceRent: 'AED 180K/yr',
    types: ['Apartments', 'Villas', 'Townhouses'], category: 'Freehold', featured: true, projects: 45, avgRoi: '5.2%',
    description: "Dubai's iconic palm-shaped island, home to luxury villas, beachfront apartments, and world-famous hotels.",
    about: "Palm Jumeirah is Dubai's most famous man-made island, shaped like a giant palm tree and visible from space. The island consists of a trunk, 16 fronds, and a surrounding crescent, and is home to some of Dubai's most exclusive residences — from signature villas on the fronds to ultra-luxury apartment towers like One at Palm Jumeirah and Palme Couture.\n\nThe island is served by a monorail connecting to the mainland metro network and is home to world-class hotels including Atlantis The Palm, One&Only The Palm, and the Waldorf Astoria.",
    whyInvest: ['Global icon status drives premium pricing', 'Beachfront and sea-view properties retain value', 'High demand from UHNWIs and celebrities', 'Strong short-term rental income', 'Limited supply — no new frond development possible'],
    lifestyle: ['Private beach access for villa residents', 'Atlantis water park and restaurants', 'Nakheel Mall and The Pointe', 'Exclusive beach clubs', 'Water sports and yacht marina'],
    faqs: [
      { q: 'Can foreigners buy on Palm Jumeirah?', a: 'Yes, Palm Jumeirah is fully freehold. All nationalities can purchase villas, townhouses, and apartments with 100% ownership.' },
      { q: 'What is the minimum price to buy on Palm Jumeirah?', a: 'Studio apartments in the Shoreline Apartments start from around AED 1.5M. Signature villas on the fronds range from AED 15M to AED 150M+.' },
      { q: 'Is Palm Jumeirah eligible for the UAE Golden Visa?', a: 'Yes. Properties purchased for AED 2M or more on Palm Jumeirah qualify for the 10-year UAE Golden Visa investor programme.' },
    ],
    nearbyAreas: ['Dubai Marina', 'JBR', 'Jumeirah', 'Bluewaters Island'],
    agent: AGENT_A, mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.5!2d55.1287!3d25.1124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b5c59b8d25f%3A0xa2f8b6c8c17e9d40!2sPalm%20Jumeirah!5e0!3m2!1sen!2sae!4v1700000000000',
  },
};

// Generic fallback for areas without full detail
function buildGeneric(slug: string, areas: Area[]): (AreaDetail & { agent: typeof AGENT_A; mapUrl: string; images: string[] }) | null {
  const base = areas.find(a => a.slug === slug);
  if (!base) return null;
  return {
    ...base, projects: base.propertiesForSale + base.propertiesForRent, avgRoi: '6%',
    about: `${base.name} is one of Dubai's most sought-after communities, located in ${base.location}. The area offers a mix of ${base.types.join(', ')} and is known for its vibrant lifestyle, excellent amenities, and strong investment returns. ${base.description}`,
    whyInvest: ['Strong rental demand year-round', 'Freehold ownership available', 'Good transport connectivity', 'Established community infrastructure', 'Consistent capital appreciation'],
    lifestyle: ['Community parks and leisure facilities', 'Retail and dining options', 'Schools and healthcare nearby', 'Sports and wellness facilities', 'Easy access to major highways'],
    faqs: [
      { q: `Is ${base.name} freehold for expats?`, a: `${base.name} is a ${base.category} area. ${base.category === 'Freehold' ? 'All nationalities can purchase property here with full ownership rights.' : 'Please check current DLD regulations for ownership eligibility.'}` },
      { q: `What types of properties are available in ${base.name}?`, a: `${base.name} primarily offers ${base.types.join(', ')} for sale and rent across a range of price points to suit different budgets.` },
      { q: `What is the average sale price in ${base.name}?`, a: `The average property sale price in ${base.name} is approximately ${base.avgPriceSale}. Rental prices average ${base.avgPriceRent} per year.` },
    ],
    nearbyAreas: [],
    agent: AGENT_A, images: [base.image, base.image, base.image],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d924938.6674830919!2d54.89782993398437!3d25.07589705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43a5f1369cd1%3A0x6e43f79be6bde2b4!2sDubai!5e0!3m2!1sen!2sae!4v1700000000000',
  };
}

@Component({
  selector: 'app-area-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './area-detail.component.html',
  styleUrl: './area-detail.component.scss',
})
export class AreaDetailComponent implements OnInit {
  area = signal<(AreaDetail & { agent: typeof AGENT_A; mapUrl: string; images: string[] }) | null>(null);
  notFound = signal(false);
  activeImage = signal(0);
  openFaq = signal<number | null>(null);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);


  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      const found = AREA_DATA[slug] ?? buildGeneric(slug, this.getAreas());
      if (found) {
        this.area.set(found);
        this.notFound.set(false);
      } else {
        this.notFound.set(true);
      }
      this.activeImage.set(0);
      window.scrollTo({ top: 0 });
    });
  }

  private getAreas(): Area[] {
    // Pull all areas from AREA_DATA for generic fallback
    return Object.values(AREA_DATA) as Area[];
  }

  nextImage() {
    const a = this.area();
    if (!a) return;
    this.activeImage.set((this.activeImage() + 1) % a.images.length);
  }

  prevImage() {
    const a = this.area();
    if (!a) return;
    this.activeImage.set((this.activeImage() - 1 + a.images.length) % a.images.length);
  }

  toggleFaq(i: number) { this.openFaq.set(this.openFaq() === i ? null : i); }

  safeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
