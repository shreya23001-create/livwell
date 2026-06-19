import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

export interface Area {
  slug: string;
  name: string;
  location: string;
  image: string;
  propertiesForSale: number;
  propertiesForRent: number;
  projectCount?: number;
  commercialCount?: number;
  totalListings?: number;
  avgPriceSale: string;
  avgPriceRent?: string;
  types: string[];
  category?: string;
  featured: boolean;
  description: string;
}

const AREA_IMAGES: Record<string, string> = {
  'palm jumeirah':           'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  'downtown dubai':          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'business bay':            'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80',
  'dubai marina':            'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800&q=80',
  'jumeirah village circle': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'jvc':                     'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'dubai hills estate':      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
  'jumeirah lake towers':    'https://images.unsplash.com/photo-1582407947304-fd86f28f4e94?w=800&q=80',
  'jlt':                     'https://images.unsplash.com/photo-1582407947304-fd86f28f4e94?w=800&q=80',
  'arabian ranches':         'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'jumeirah beach residence':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'jbr':                     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'mbr city':                'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80',
  'mohammed bin rashid city':'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80',
  'difc':                    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'damac hills':             'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'the springs':             'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
  'dubai sports city':       'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80',
  'al barsha':               'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
  'international city':      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'bluewaters island':       'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80',
  'sobha hartland':          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'jumeirah':                'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80',
  'dubai creek harbour':     'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  'al furjan':               'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  'tilal al ghaf':           'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  'meydan':                  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
  'dubai south':             'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80';

function toSlug(name: string): string {
  // Use only the first comma-separated part to avoid long slugs from full addresses
  const short = name.split(',')[0].trim();
  return short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getImage(name: string): string {
  const key = name.toLowerCase().trim();
  return AREA_IMAGES[key] ?? DEFAULT_IMAGE;
}

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss',
})
export class AreasComponent implements OnInit {
  private sb     = inject(SupabaseService).client;
  private router = inject(Router);

  searchQuery  = signal('');
  activeType   = signal('All');
  loading      = signal(true);
  allAreas     = signal<Area[]>([]);

  readonly propertyTypes = ['All', 'Apartments', 'Villas', 'Townhouses', 'Offices', 'Plots'];

  readonly faqs = [
    { q: 'Which areas in Dubai are freehold for expats?', a: 'Dubai has designated over 60 freehold areas where non-UAE nationals can purchase property. Key freehold areas include Downtown Dubai, Dubai Marina, Palm Jumeirah, Business Bay, JBR, JVC, Dubai Hills Estate, MBR City, and DAMAC Hills.' },
    { q: 'What is the most affordable area to buy property in Dubai?', a: 'Jumeirah Village Circle (JVC), International City, Discovery Gardens, Dubai South, and Dubailand are among the most affordable areas. Studios and 1-bedroom apartments start from AED 350,000.' },
    { q: 'Which Dubai community is best for families?', a: 'Dubai Hills Estate, Arabian Ranches, The Springs, Mudon, and Jumeirah are widely regarded as the best family-oriented communities, offering schools, parks, community centres, and a safe suburban environment.' },
    { q: 'What is the average rental price in Dubai Marina?', a: 'As of 2026, average rentals in Dubai Marina range from AED 70,000–90,000/yr for a studio, AED 100,000–130,000/yr for a 1-bed, and AED 140,000–200,000/yr for a 2-bed apartment.' },
    { q: 'Which areas offer the highest rental yield in Dubai?', a: 'JVC, Dubai Sports City, International City, Business Bay, and DAMAC Hills 2 consistently deliver the highest rental yields — typically 7–9% gross per annum.' },
    { q: 'What makes a Dubai area eligible for the Golden Visa through property?', a: 'Investors must purchase a completed property worth a minimum of AED 2,000,000 in a freehold area. The property must be fully paid (or equity portion exceeds AED 2M).' },
  ];

  openFaq = signal<number | null>(null);
  toggleFaq(i: number) { this.openFaq.set(this.openFaq() === i ? null : i); }

  async ngOnInit(): Promise<void> {
    // Fetch all data in parallel — commercial listings are in properties table filtered by type
    const commercialTypes = ['Office', 'Shop', 'Warehouse', 'Plot'];
    const [propRes, projRes] = await Promise.all([
      this.sb.from('properties').select('location,community,listing_type,type,price').eq('status', 'Published'),
      this.sb.from('projects').select('location'),
    ]);

    // Aggregate by area name (community > location for properties)
    const areaMap = new Map<string, {
      forSale: number; forRent: number; commercial: number;
      projects: number; types: Set<string>; prices: number[];
    }>();

    const ensure = (name: string) => {
      const key = name.trim();
      if (!key) return;
      if (!areaMap.has(key)) {
        areaMap.set(key, { forSale: 0, forRent: 0, commercial: 0, projects: 0, types: new Set(), prices: [] });
      }
      return areaMap.get(key)!;
    };

    // Properties (residential + commercial — all in same table)
    for (const p of (propRes.data ?? [])) {
      const areaName = (p.community?.trim() || p.location?.trim());
      if (!areaName) continue;
      const entry = ensure(areaName);
      if (!entry) continue;
      const isCommercial = commercialTypes.includes(p.type);
      if (isCommercial) {
        entry.commercial++;
        entry.types.add('Offices');
      } else {
        if ((p.listing_type as string) === 'Rent') entry.forRent++;
        else entry.forSale++;
        if (p.type) entry.types.add(this.normaliseType(p.type));
      }
      if (p.price) entry.prices.push(Number(p.price));
    }

    // Projects
    for (const p of (projRes.data ?? [])) {
      const areaName = p.location?.trim();
      if (!areaName) continue;
      const entry = ensure(areaName);
      if (!entry) continue;
      entry.projects++;
    }

    // Build Area objects — merge entries with the same slug (e.g. full address vs short name)
    const slugMap = new Map<string, Area>();
    areaMap.forEach((v, name) => {
      const total = v.forSale + v.forRent + v.commercial + v.projects;
      if (total === 0) return;
      const slug = toSlug(name);
      const displayName = name.split(',')[0].trim(); // use short name for display
      const avgPrice = v.prices.length
        ? Math.round(v.prices.reduce((a, b) => a + b, 0) / v.prices.length)
        : 0;
      if (slugMap.has(slug)) {
        // Merge into existing entry
        const ex = slugMap.get(slug)!;
        ex.propertiesForSale += v.forSale;
        ex.propertiesForRent += v.forRent;
        ex.projectCount      = (ex.projectCount ?? 0) + v.projects;
        ex.commercialCount   = (ex.commercialCount ?? 0) + v.commercial;
        ex.totalListings     = (ex.totalListings ?? 0) + total;
      } else {
        slugMap.set(slug, {
          slug,
          name:              displayName,
          location:          displayName,
          image:             getImage(displayName),
          propertiesForSale: v.forSale,
          propertiesForRent: v.forRent,
          projectCount:      v.projects,
          commercialCount:   v.commercial,
          totalListings:     total,
          avgPriceSale:      avgPrice ? `AED ${this.formatPrice(avgPrice)}` : '',
          types:             Array.from(v.types),
          featured:          total >= 3,
          description:       '',
        });
      }
    });
    const areas = Array.from(slugMap.values());

    // Sort by total listings descending
    areas.sort((a, b) => (b.totalListings ?? 0) - (a.totalListings ?? 0));
    this.allAreas.set(areas);
    this.loading.set(false);
  }

  private normaliseType(t: string): string {
    const lower = t.toLowerCase();
    if (lower.includes('apartment') || lower.includes('flat') || lower.includes('studio')) return 'Apartments';
    if (lower.includes('villa'))       return 'Villas';
    if (lower.includes('townhouse'))   return 'Townhouses';
    if (lower.includes('office'))      return 'Offices';
    if (lower.includes('plot') || lower.includes('land')) return 'Plots';
    return t;
  }

  private formatPrice(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  filtered = computed(() => {
    let list = [...this.allAreas()];
    const type = this.activeType();
    const q    = this.searchQuery().toLowerCase().trim();
    if (type !== 'All') list = list.filter(a => a.types.includes(type));
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
    );
    return list;
  });

  featuredAreas = computed(() => this.allAreas().filter(a => a.featured).slice(0, 6));

  goToArea(slug: string) { this.router.navigate(['/areas', slug]); }
}
