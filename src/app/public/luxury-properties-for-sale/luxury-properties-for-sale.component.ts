import { Component, computed, signal, HostListener, ElementRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';

interface LuxuryProperty {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: 'Apartment' | 'Villa' | 'Home' | 'Penthouse' | 'Townhouse';
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  price: number;
  priceDisplay: string;
  pricePerSqft: string;
  beds: number | 'Studio';
  baths: number;
  area: number;
  areaDisplay: string;
  image: string;
  badge?: string;
  furnished?: boolean;
  waterfront?: boolean;
  beachfront?: boolean;
  forRent?: boolean;
  detailSlug?: string;
  agent: { name: string; phone: string; email: string; avatar: string };
}

const LUXE_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home', 'Mansion', 'Duplex'];

@Component({
  selector: 'app-luxury-properties-for-sale',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-properties-for-sale.component.html',
  styleUrl: './luxury-properties-for-sale.component.scss',
})
export class LuxuryPropertiesForSaleComponent implements OnInit {
  private sb    = inject(SupabaseService).client;

  // ── Search & filter state ──────────────────────────────
  searchArea   = signal('');
  activeType   = signal('Any');
  activeBeds   = signal('Any');
  activeBaths  = signal('Any');
  priceMin     = signal('');
  priceMax     = signal('');
  areaMin      = signal('');
  areaMax      = signal('');
  filterFurnished  = signal(false);
  filterWaterfront = signal(false);
  filterBeachfront = signal(false);
  activeStatus = signal('All');
  interestedTo = signal<'Buy' | 'Rent'>('Buy');
  sortBy       = signal('default');
  loading      = signal(true);

  allProperties = signal<LuxuryProperty[]>([]);

  // ── Dropdown open state ────────────────────────────────
  openDropdown = signal<string | null>(null);

  readonly propertyTypes = ['Any', 'Apartment', 'Villa', 'Townhouse', 'Home', 'Penthouse'];
  readonly bedOptions    = ['Any', 'Studio', '1', '2', '3', '4', '5', '6', '7+'];
  readonly bathOptions   = ['Any', '1', '2', '3', '4', '5', '6', '7+'];
  readonly statusOptions = ['All', 'Ready', 'Off-Plan', 'Under Construction'];

  filteredProperties = computed(() => {
    let list = [...this.allProperties()];
    const intent = this.interestedTo();
    list = list.filter(p => intent === 'Rent' ? !!p.forRent : !p.forRent);
    const type   = this.activeType();
    const beds   = this.activeBeds();
    const baths  = this.activeBaths();
    const pMin   = this.priceMin() ? parseInt(this.priceMin().replace(/,/g, '')) : 0;
    const pMax   = this.priceMax() ? parseInt(this.priceMax().replace(/,/g, '')) : Infinity;
    const aMin   = this.areaMin() ? parseInt(this.areaMin().replace(/,/g, '')) : 0;
    const aMax   = this.areaMax() ? parseInt(this.areaMax().replace(/,/g, '')) : Infinity;
    const status = this.activeStatus();
    const search = this.searchArea().toLowerCase().trim();

    if (type !== 'Any') list = list.filter(p => p.type === type);
    if (status !== 'All') list = list.filter(p => p.status === status);
    if (beds !== 'Any') {
      list = list.filter(p => {
        if (beds === 'Studio') return p.beds === 'Studio';
        if (beds === '7+') return typeof p.beds === 'number' && p.beds >= 7;
        return p.beds === parseInt(beds);
      });
    }
    if (baths !== 'Any') {
      list = list.filter(p => {
        if (baths === '7+') return p.baths >= 7;
        return p.baths === parseInt(baths);
      });
    }
    if (pMin > 0) list = list.filter(p => p.price >= pMin);
    if (pMax < Infinity) list = list.filter(p => p.price <= pMax);
    if (aMin > 0) list = list.filter(p => p.area >= aMin);
    if (aMax < Infinity) list = list.filter(p => p.area <= aMax);
    if (this.filterFurnished()) list = list.filter(p => p.furnished);
    if (this.filterWaterfront()) list = list.filter(p => p.waterfront);
    if (this.filterBeachfront()) list = list.filter(p => p.beachfront);
    if (search) list = list.filter(p =>
      p.location.toLowerCase().includes(search) ||
      p.title.toLowerCase().includes(search) ||
      p.developer.toLowerCase().includes(search)
    );

    const sort = this.sortBy();
    if (sort === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'area-desc')  list.sort((a, b) => b.area - a.area);

    return list;
  });

  pageDesc = computed(() => {
    const t = this.activeType();
    const isRent = this.interestedTo() === 'Rent';
    const map: Record<string, { buy: string; rent: string }> = {
      Any:       { buy: "Explore an exclusive collection of ultra-premium properties for sale across Dubai's most coveted addresses — from sky-high penthouses to sprawling waterfront villas.", rent: "Find your perfect luxury rental in Dubai. From fully furnished penthouses to beachfront villas, discover residences that match an elevated lifestyle." },
      Apartment: { buy: "Own a piece of Dubai's iconic skyline. Browse luxury apartments for sale in Downtown, Business Bay, Palm Jumeirah, and beyond — crafted by the world's finest developers.", rent: "Rent a world-class luxury apartment in Dubai's most prestigious towers. High-floor views, premium amenities, and flexible lease terms await." },
      Villa:     { buy: "Invest in Dubai's most sought-after luxury villas for sale. Gated communities, private pools, and expansive gardens in Palm Jumeirah, Emirates Hills, and more.", rent: "Experience the pinnacle of villa living. Rent a luxury villa in Dubai with private pools, lush gardens, and direct beach or waterfront access." },
      Home:      { buy: "Discover luxury homes for sale in Dubai's premier residential communities — bespoke architecture, landscaped grounds, and unmatched privacy.", rent: "Rent a luxury home in one of Dubai's most exclusive neighbourhoods. Spacious layouts, premium finishes, and resort-style amenities." },
      Penthouse: { buy: "Acquire an iconic penthouse in Dubai. Sky-high living with panoramic city and sea views, private terraces, and white-glove building services.", rent: "Rent a luxury penthouse in Dubai and live above it all. Floor-to-ceiling glass, wraparound terraces, and concierge services at the most prestigious addresses." },
      Townhouse: { buy: "Browse luxury townhouses for sale in Dubai's finest gated communities — the perfect blend of villa privacy and contemporary apartment convenience.", rent: "Rent a luxury townhouse in Dubai with the space and privacy of a villa, in an exclusive community with world-class facilities." },
    };
    const entry = map[t] ?? map['Any'];
    return isRent ? entry.rent : entry.buy;
  });

  pageTitle = computed(() => {
    const t = this.activeType();
    const action = this.interestedTo() === 'Rent' ? 'for Rent' : 'for Sale';
    const map: Record<string, string> = {
      Any: `Luxury Properties ${action} in Dubai`,
      Apartment: `Luxury Apartments ${action} in Dubai`,
      Villa: `Luxury Villas ${action} in Dubai`,
      Home: `Luxury Homes ${action} in Dubai`,
      Penthouse: `Luxury Penthouses ${action} in Dubai`,
      Townhouse: `Luxury Townhouses ${action} in Dubai`,
    };
    return map[t] ?? `Luxury Properties ${action} in Dubai`;
  });

  activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterFurnished()) n++;
    if (this.filterWaterfront()) n++;
    if (this.filterBeachfront()) n++;
    if (this.areaMin() || this.areaMax()) n++;
    return n;
  });

  constructor(private route: ActivatedRoute, private router: Router, private el: ElementRef) {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type && this.propertyTypes.includes(type)) {
        this.activeType.set(type);
      }
      const intent = params.get('intent');
      this.interestedTo.set(intent === 'Rent' ? 'Rent' : 'Buy');
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadProperties();
  }

  private async loadProperties(): Promise<void> {
    this.loading.set(true);

    const { data, error } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, listing_type, type, area_sqft, bedrooms, bathrooms, images, furnishing, agent_name, description, is_featured, created_at, status')
      .in('type', LUXE_TYPES)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      this.loading.set(false);
      return;
    }

    // Batch-fetch agent avatars
    const agentNames = [...new Set((data as any[]).map(p => p.agent_name).filter(Boolean))];
    const agentMap: Record<string, { phone: string; email: string; avatar: string }> = {};
    if (agentNames.length) {
      const { data: profiles } = await this.sb
        .from('profiles')
        .select('name, phone, email, avatar_url')
        .in('name', agentNames);
      for (const prof of profiles ?? []) {
        const av = prof.avatar_url ?? '';
        agentMap[prof.name] = {
          phone:  prof.phone ?? '',
          email:  prof.email ?? '',
          avatar: (av && !av.startsWith('data:')) ? av : '',
        };
      }
    }

    const mapped: LuxuryProperty[] = (data as any[]).map(p => {
      const priceNum  = typeof p.price === 'number' ? p.price : parseFloat(String(p.price ?? '0').replace(/[^0-9.]/g, ''));
      const areaNum   = typeof p.area_sqft === 'number' ? p.area_sqft : parseFloat(String(p.area_sqft ?? '0'));
      const ppsf      = areaNum > 0 ? Math.round(priceNum / areaNum) : 0;
      const isRent    = (p.listing_type ?? '').toLowerCase() === 'rent';
      const raw: string[] = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []); const clean = raw.filter((u: string) => u && !u.includes('unsplash.com') && !u.includes('dummy-image')); const imgs: string[] = [...clean.filter((u: string) => !u.includes('/images/')), ...clean.filter((u: string) => u.includes('/images/'))];
      const bedsRaw   = p.bedrooms;
      const bedsVal: number | 'Studio' = bedsRaw === 0 || String(bedsRaw).toLowerCase() === 'studio' ? 'Studio' : (Number(bedsRaw) || 0);
      const agentInfo = agentMap[p.agent_name] ?? { phone: '', email: '', avatar: '' };
      const dbStatus  = (p.status ?? '');

      // Map furnishing
      const furnishingLower = (p.furnishing ?? '').toLowerCase();

      const rawAgent = (p.agent_name ?? '').trim().replace(/^[-–—]+$/, '');
      const agentName = rawAgent || 'LivWell Agent';
      return {
        id:           p.id,
        title:        p.title ?? '',
        developer:    p.community ?? '',
        location:     p.location ?? '',
        type:         (LUXE_TYPES.includes(p.type) ? p.type : 'Apartment') as any,
        status:       (['Ready', 'Off-Plan', 'Under Construction'].includes(dbStatus) ? dbStatus : 'Ready') as any,
        price:        priceNum,
        priceDisplay: priceNum > 0
                        ? (isRent ? `AED ${priceNum.toLocaleString()} / yr` : `AED ${priceNum.toLocaleString()}`)
                        : '',
        pricePerSqft: ppsf > 0 ? `AED ${ppsf.toLocaleString()}` : '',
        beds:         bedsVal,
        baths:        Number(p.bathrooms) || 0,
        area:         areaNum,
        areaDisplay:  areaNum > 0 ? `${areaNum.toLocaleString()} sqft` : '',
        image:        imgs[0] ?? '/images/dummy-image.png',
        furnished:    furnishingLower === 'furnished',
        forRent:      isRent,
        agent: {
          name:   agentName,
          phone:  agentInfo.phone,
          email:  agentInfo.email,
          avatar: agentInfo.avatar,
        },
      };
    });

    this.allProperties.set(mapped);
    this.loading.set(false);
  }

  setIntent(value: 'Buy' | 'Rent') {
    this.interestedTo.set(value);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: { intent: value },
    });
  }

  toggleDropdown(name: string) {
    this.openDropdown.set(this.openDropdown() === name ? null : name);
  }

  closeDropdown(name: string) {
    if (this.openDropdown() === name) this.openDropdown.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) {
      this.openDropdown.set(null);
    }
  }

  resetAll() {
    this.activeType.set('Any');
    this.activeBeds.set('Any');
    this.activeBaths.set('Any');
    this.priceMin.set('');
    this.priceMax.set('');
    this.areaMin.set('');
    this.areaMax.set('');
    this.filterFurnished.set(false);
    this.filterWaterfront.set(false);
    this.filterBeachfront.set(false);
    this.activeStatus.set('All');
    this.interestedTo.set('Buy');
    this.searchArea.set('');
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  detailLink(p: LuxuryProperty): string {
    // DB properties use numeric id; static legacy ones use slug
    return p.detailSlug ?? String(p.id);
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  bedsLabel(): string {
    const b = this.activeBeds();
    if (b === 'Any') return 'Beds';
    if (b === 'Studio') return 'Studio';
    return `${b} Bed${b === '1' ? '' : 's'}`;
  }

  priceLabel(): string {
    const mn = this.priceMin(), mx = this.priceMax();
    if (!mn && !mx) return 'Price';
    if (mn && !mx) return `AED ${mn}+`;
    if (!mn && mx) return `Up to AED ${mx}`;
    return `AED ${mn} – ${mx}`;
  }

  typeLabel(): string {
    return this.activeType() === 'Any' ? 'Property Type' : this.activeType() + 's';
  }
}
