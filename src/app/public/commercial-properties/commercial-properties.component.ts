import { Component, computed, signal, HostListener, ElementRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';

interface CommercialProperty {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: 'Office' | 'Shop' | 'Warehouse' | 'Plot';
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  price: number;
  priceDisplay: string;
  pricePerSqft: string;
  area: number;
  areaDisplay: string;
  image: string;
  badge?: string;
  forRent?: boolean;
  furnished?: boolean;
  waterfront?: boolean;
  beachfront?: boolean;
  reducedPrice?: boolean;
  tour360?: boolean;
  view?: string;
  refNo: string;
  agent: { name: string; phone: string; email: string; avatar: string };
}

@Component({
  selector: 'app-commercial-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './commercial-properties.component.html',
  styleUrl: './commercial-properties.component.scss',
})
export class CommercialPropertiesComponent implements OnInit {

  private sb   = inject(SupabaseService).client;
  private auth = inject(AuthService);

  savedIds     = signal<Set<number>>(new Set());
  savingId     = signal<number | null>(null);
  shareToastId = signal<number | null>(null);

  isSaved(id: number): boolean { return this.savedIds().has(id); }

  loading = signal(true);
  searchArea = signal('');
  activeType = signal('Any');
  activeBeds = signal('Any');
  activeBaths = signal('Any');
  priceMin = signal('');
  priceMax = signal('');
  areaMin = signal('');
  areaMax = signal('');
  sizeMin = signal('');
  sizeMax = signal('');
  activeView = signal('Any');
  refNo = signal('');
  filterFurnished = signal(false);
  filterWaterfront = signal(false);
  filterBeachfront = signal(false);
  filterReducedPrice = signal(false);
  filter360Tour = signal(false);
  interestedTo = signal<'Buy' | 'Rent'>('Buy');
  sortBy = signal('default');
  openDropdown = signal<string | null>(null);

  readonly propertyTypes = ['Any', 'Office', 'Shop', 'Warehouse', 'Plot'];
  readonly viewOptions = ['Any', 'Sea View', 'City View', 'Park View', 'Canal View', 'Street View'];
  readonly bedOptions = ['Any', 'Studio', '1', '2', '3', '4', '5', '6', '7+'];
  readonly bathOptions = ['Any', '1', '2', '3', '4', '5', '6', '7+'];

  allProperties = signal<CommercialProperty[]>([]);

  readonly staticProperties: CommercialProperty[] = [
    {
      id: 1, title: 'Grade A Office — DIFC Gate Village', developer: 'DIFC Authority', location: 'DIFC',
      type: 'Office', status: 'Ready', price: 8500000, priceDisplay: 'AED 8,500,000',
      pricePerSqft: 'AED 3,200', area: 2656, areaDisplay: '2,656 sqft',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85',
      badge: 'Premium', view: 'City View', refNo: 'COM-001',
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 2, title: 'Business Bay Office Tower', developer: 'Damac', location: 'Business Bay',
      type: 'Office', status: 'Ready', price: 3200000, priceDisplay: 'AED 3,200,000',
      pricePerSqft: 'AED 1,800', area: 1778, areaDisplay: '1,778 sqft',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=85',
      view: 'Canal View', refNo: 'COM-002',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 3, title: 'Downtown Dubai Retail Shop', developer: 'Emaar', location: 'Downtown Dubai',
      type: 'Shop', status: 'Ready', price: 4800000, priceDisplay: 'AED 4,800,000',
      pricePerSqft: 'AED 4,800', area: 1000, areaDisplay: '1,000 sqft',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=85',
      badge: 'Main Road', view: 'Street View', refNo: 'COM-003',
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 4, title: 'JBR Beach Walk Retail Unit', developer: 'Meraas', location: 'JBR',
      type: 'Shop', status: 'Ready', price: 6200000, priceDisplay: 'AED 6,200,000',
      pricePerSqft: 'AED 5,167', area: 1200, areaDisplay: '1,200 sqft',
      image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=900&q=85',
      badge: 'Beachfront', beachfront: true, view: 'Sea View', refNo: 'COM-004',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 5, title: 'Al Quoz Industrial Warehouse', developer: 'Dubai Properties', location: 'Al Quoz',
      type: 'Warehouse', status: 'Ready', price: 5500000, priceDisplay: 'AED 5,500,000',
      pricePerSqft: 'AED 550', area: 10000, areaDisplay: '10,000 sqft',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=85',
      refNo: 'COM-005', reducedPrice: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 6, title: 'Jebel Ali Logistics Warehouse', developer: 'DP World', location: 'Jebel Ali',
      type: 'Warehouse', status: 'Ready', price: 9800000, priceDisplay: 'AED 9,800,000',
      pricePerSqft: 'AED 490', area: 20000, areaDisplay: '20,000 sqft',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=900&q=85',
      refNo: 'COM-006',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 7, title: 'MBR City Commercial Plot', developer: 'Meydan', location: 'MBR City',
      type: 'Plot', status: 'Ready', price: 18000000, priceDisplay: 'AED 18,000,000',
      pricePerSqft: 'AED 900', area: 20000, areaDisplay: '20,000 sqft',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=85',
      badge: 'Prime Location', refNo: 'COM-007', tour360: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 8, title: 'Dubai South Commercial Plot', developer: 'Dubai South', location: 'Dubai South',
      type: 'Plot', status: 'Off-Plan', price: 7200000, priceDisplay: 'AED 7,200,000',
      pricePerSqft: 'AED 480', area: 15000, areaDisplay: '15,000 sqft',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=85',
      refNo: 'COM-008',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    // ── Extra Office for Rent ─────────────────────────────────
    {
      id: 13, title: 'Downtown Dubai Office Suite', developer: 'Emaar', location: 'Downtown Dubai',
      type: 'Office', status: 'Ready', price: 320000, priceDisplay: 'AED 320,000 / yr',
      pricePerSqft: 'AED 267', area: 1200, areaDisplay: '1,200 sqft',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=85',
      badge: 'Furnished', furnished: true, view: 'Burj View', refNo: 'COM-013', forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 14, title: 'Media City Creative Office', developer: 'TECOM', location: 'Dubai Media City',
      type: 'Office', status: 'Ready', price: 155000, priceDisplay: 'AED 155,000 / yr',
      pricePerSqft: 'AED 155', area: 1000, areaDisplay: '1,000 sqft',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=85',
      refNo: 'COM-014', forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 15, title: 'Silicon Oasis Tech Office', developer: 'Dubai Silicon Oasis Authority', location: 'Dubai Silicon Oasis',
      type: 'Office', status: 'Ready', price: 95000, priceDisplay: 'AED 95,000 / yr',
      pricePerSqft: 'AED 95', area: 1000, areaDisplay: '1,000 sqft',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=85',
      refNo: 'COM-015', forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    // ── For Rent ──────────────────────────────────────────────
    {
      id: 9, title: 'DIFC Grade A Office — Full Floor', developer: 'DIFC Authority', location: 'DIFC',
      type: 'Office', status: 'Ready', price: 420000, priceDisplay: 'AED 420,000 / yr',
      pricePerSqft: 'AED 158', area: 2656, areaDisplay: '2,656 sqft',
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=85',
      badge: 'Furnished', furnished: true, view: 'City View', refNo: 'COM-009', forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 10, title: 'Jumeirah Lake Towers Office', developer: 'DMCC', location: 'JLT',
      type: 'Office', status: 'Ready', price: 180000, priceDisplay: 'AED 180,000 / yr',
      pricePerSqft: 'AED 120', area: 1500, areaDisplay: '1,500 sqft',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85',
      view: 'Lake View', refNo: 'COM-010', forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 11, title: 'Arjan Retail Shop — Ground Floor', developer: 'Dubai Properties', location: 'Arjan',
      type: 'Shop', status: 'Ready', price: 85000, priceDisplay: 'AED 85,000 / yr',
      pricePerSqft: 'AED 283', area: 300, areaDisplay: '300 sqft',
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=900&q=85',
      view: 'Street View', refNo: 'COM-011', forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 12, title: 'Dubai Marina Waterfront Shop', developer: 'Emaar', location: 'Dubai Marina',
      type: 'Shop', status: 'Ready', price: 240000, priceDisplay: 'AED 240,000 / yr',
      pricePerSqft: 'AED 600', area: 400, areaDisplay: '400 sqft',
      image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=900&q=85',
      badge: 'High Footfall', waterfront: true, view: 'Sea View', refNo: 'COM-012', forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
  ];

  currentPage = signal(1);
  readonly pageSize = 9;

  filteredProperties = computed(() => {
    let list = [...this.allProperties()];
    const intent = this.interestedTo();
    list = list.filter(p => intent === 'Rent' ? !!p.forRent : !p.forRent);

    const type = this.activeType();
    const view = this.activeView();
    const ref = this.refNo().trim().toLowerCase();
    const search = this.searchArea().toLowerCase().trim();
    const pMin = this.priceMin() ? parseInt(this.priceMin().replace(/,/g, '')) : 0;
    const pMax = this.priceMax() ? parseInt(this.priceMax().replace(/,/g, '')) : Infinity;
    const sMin = this.sizeMin() ? parseInt(this.sizeMin().replace(/,/g, '')) : 0;
    const sMax = this.sizeMax() ? parseInt(this.sizeMax().replace(/,/g, '')) : Infinity;

    if (type !== 'Any') list = list.filter(p => p.type === type);
    if (view !== 'Any') list = list.filter(p => p.view === view);
    if (ref) list = list.filter(p => p.refNo.toLowerCase().includes(ref));
    if (pMin > 0) list = list.filter(p => p.price >= pMin);
    if (pMax < Infinity) list = list.filter(p => p.price <= pMax);
    if (sMin > 0) list = list.filter(p => p.area >= sMin);
    if (sMax < Infinity) list = list.filter(p => p.area <= sMax);
    if (this.filterFurnished()) list = list.filter(p => p.furnished);
    if (this.filterWaterfront()) list = list.filter(p => p.waterfront);
    if (this.filterBeachfront()) list = list.filter(p => p.beachfront);
    if (this.filterReducedPrice()) list = list.filter(p => p.reducedPrice);
    if (this.filter360Tour()) list = list.filter(p => p.tour360);
    if (search) list = list.filter(p =>
      p.location.toLowerCase().includes(search) ||
      p.title.toLowerCase().includes(search) ||
      p.developer.toLowerCase().includes(search)
    );

    const sort = this.sortBy();
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'area-desc') list.sort((a, b) => b.area - a.area);

    return list;
  });

  totalResults  = computed(() => this.filteredProperties().length);
  totalPages    = computed(() => Math.max(1, Math.ceil(this.totalResults() / this.pageSize)));
  pagedProperties = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProperties().slice(start, start + this.pageSize);
  });
  pageNumbers = computed(() => {
    const total = this.totalPages(), cur = this.currentPage();
    const pages: (number | '...')[] = [];
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (cur > 3) pages.push('...');
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });
  goToPage(page: number | '...'): void {
    if (typeof page === 'number') { this.currentPage.set(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  pageTitle = computed(() => {
    const t = this.activeType();
    const action = this.interestedTo() === 'Rent' ? 'for Rent' : 'for Sale';
    const map: Record<string, string> = {
      Any: `Commercial Properties ${action} in Dubai`,
      Office: `Offices ${action} in Dubai`,
      Shop: `Shops ${action} in Dubai`,
      Warehouse: `Warehouses ${action} in Dubai`,
      Plot: `Commercial Plots ${action} in Dubai`,
    };
    return map[t] ?? `Commercial Properties ${action} in Dubai`;
  });

  pageDesc = computed(() => {
    const t = this.activeType();
    const isRent = this.interestedTo() === 'Rent';
    const map: Record<string, { buy: string; rent: string }> = {
      Any:       { buy: 'Browse a full range of commercial properties for sale across Dubai — from Grade A offices to retail shops, warehouses, and commercial plots.', rent: 'Find commercial spaces for rent in Dubai. Offices, retail units, warehouses, and more — across all key business districts.' },
      Office:    { buy: 'Invest in premium office space across Dubai\'s most sought-after business hubs — DIFC, Business Bay, JLT, and Downtown.', rent: 'Rent office space in Dubai\'s leading commercial districts. Flexible sizes, Grade A finishes, and strategic locations for your business.' },
      Shop:      { buy: 'Own high-footfall retail shops in Dubai\'s busiest shopping corridors — from Downtown boutiques to waterfront units.', rent: 'Rent retail shop space in Dubai. Main road units, mall kiosks, and high-footfall street-level units across the emirate.' },
      Warehouse: { buy: 'Buy a warehouse or logistics facility in Dubai. Industrial zones, storage solutions, and last-mile distribution hubs.', rent: 'Rent warehouse and storage space in Dubai\'s established industrial zones — Al Quoz, Jebel Ali, Dubai South, and more.' },
      Plot:      { buy: 'Acquire commercial land in Dubai\'s high-growth corridors. Freehold and leasehold plots ready for development.', rent: 'Long-term commercial plot leases in Dubai. Ideal for construction, logistics yards, or open storage requirements.' },
    };
    const entry = map[t] ?? map['Any'];
    return isRent ? entry.rent : entry.buy;
  });

  activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterFurnished()) n++;
    if (this.filterWaterfront()) n++;
    if (this.filterBeachfront()) n++;
    if (this.filterReducedPrice()) n++;
    if (this.filter360Tour()) n++;
    if (this.sizeMin() || this.sizeMax()) n++;
    if (this.activeView() !== 'Any') n++;
    if (this.refNo()) n++;
    return n;
  });

  async ngOnInit(): Promise<void> {
    this.auth.waitForSession().then(() => this.loadSavedIds());
    await this.loadProperties();
  }

  private async loadProperties(): Promise<void> {
    this.loading.set(true);
    const commercialTypes = ['Office', 'Shop', 'Warehouse', 'Plot'];
    const { data, error } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, listing_type, type, area_sqft, images, is_featured, created_at, agent_name, furnishing, views')
      .in('type', commercialTypes)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const uniqueNames = [...new Set(data.map((p: any) => p.agent_name).filter(Boolean))] as string[];
      const agentMap: Record<string, { avatar: string; phone: string; email: string }> = {};
      if (uniqueNames.length) {
        const { data: profiles } = await this.sb
          .from('profiles')
          .select('name, avatar_url, phone, email')
          .in('name', uniqueNames)
          .eq('role', 'agent');
        if (profiles) {
          for (const pr of profiles) {
            const av = (pr.avatar_url ?? '').split('?')[0];
            const isProfilePhoto = av.length > 0 && !av.startsWith('data:') && /\/avatars\/[^/]+$/.test(av);
            agentMap[pr.name] = {
              avatar: isProfilePhoto ? (pr.avatar_url ?? '') : '',
              phone:  pr.phone ?? '+971 52 520 9703',
              email:  pr.email ?? 'contact@livwelldubai.com',
            };
          }
        }
      }

      this.allProperties.set(data.map((p: any) => {
        const isRent = p.listing_type === 'Rent';
        const price: number = p.price ?? 0;
        const area: number = p.area_sqft ?? 0;
        const pricePerSqft = area > 0 ? `AED ${Math.round(price / area).toLocaleString()}` : '';
        const priceDisplay = isRent
          ? `AED ${price.toLocaleString()} / yr`
          : price >= 1_000_000
            ? `AED ${(price / 1_000_000).toFixed(2)}M`
            : `AED ${price.toLocaleString()}`;
        const ag = agentMap[p.agent_name] ?? { avatar: '', phone: '+971 52 520 9703', email: 'contact@livwelldubai.com' };
        const imgs: string[] = p.images?.length ? p.images : ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85'];
        return {
          id:           p.id,
          title:        p.title        ?? '',
          developer:    p.community    ?? '',
          location:     p.location     ?? '',
          type:         p.type         as any,
          status:       p.listing_type === 'Off-Plan' ? 'Off-Plan' : 'Ready' as any,
          price,
          priceDisplay,
          pricePerSqft,
          area,
          areaDisplay:  area > 0 ? `${area.toLocaleString()} sqft` : '',
          image:        imgs[0],
          badge:        p.is_featured ? 'Featured' : undefined,
          forRent:      isRent,
          furnished:    p.furnishing === 'Furnished',
          waterfront:   false,
          beachfront:   false,
          reducedPrice: false,
          tour360:      false,
          view:         undefined,
          refNo:        `COM-${String(p.id).padStart(3, '0')}`,
          agent: {
            name:   ((p.agent_name ?? '').trim().replace(/^[-–—]+$/, '')) || 'LivWell Agent',
            phone:  ag.phone,
            email:  ag.email,
            avatar: ag.avatar,
          },
        } as CommercialProperty;
      }));
    } else {
      this.allProperties.set(this.staticProperties);
    }
    this.loading.set(false);
  }

  constructor(private route: ActivatedRoute, private router: Router, private el: ElementRef) {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type && this.propertyTypes.includes(type)) this.activeType.set(type);
      const status = params.get('status');
      if (status === 'Rent') this.interestedTo.set('Rent');
      else if (status === 'Sale') this.interestedTo.set('Buy');
      const intent = params.get('intent');
      if (intent === 'Rent') this.interestedTo.set('Rent');
      else if (intent === 'Buy') this.interestedTo.set('Buy');
      const location = params.get('location');
      if (location) this.searchArea.set(location);
    });
  }

  setIntent(value: 'Buy' | 'Rent') {
    this.interestedTo.set(value);
    this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'merge', queryParams: { intent: value } });
  }

  toggleDropdown(name: string) { this.openDropdown.set(this.openDropdown() === name ? null : name); }
  closeDropdown(name: string) { if (this.openDropdown() === name) this.openDropdown.set(null); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) this.openDropdown.set(null);
  }

  resetAll() {
    this.activeType.set('Any'); this.activeView.set('Any');
    this.priceMin.set(''); this.priceMax.set('');
    this.sizeMin.set(''); this.sizeMax.set('');
    this.refNo.set('');
    this.filterFurnished.set(false); this.filterWaterfront.set(false);
    this.filterBeachfront.set(false); this.filterReducedPrice.set(false); this.filter360Tour.set(false);
    this.interestedTo.set('Buy'); this.searchArea.set('');
    this.currentPage.set(1);
  }

  resetMoreFilters() {
    this.activeView.set('Any'); this.sizeMin.set(''); this.sizeMax.set(''); this.refNo.set('');
    this.filterFurnished.set(false); this.filterWaterfront.set(false);
    this.filterBeachfront.set(false); this.filterReducedPrice.set(false); this.filter360Tour.set(false);
    this.currentPage.set(1);
  }

  slugify(title: string): string { return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  typeLabel(): string { return this.activeType() === 'Any' ? 'Property Type' : this.activeType() + 's'; }
  priceLabel(): string {
    const mn = this.priceMin(), mx = this.priceMax();
    if (!mn && !mx) return 'Price';
    if (mn && !mx) return `AED ${mn}+`;
    if (!mn && mx) return `Up to AED ${mx}`;
    return `AED ${mn} – ${mx}`;
  }

  private async loadSavedIds(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb.from('saved_properties').select('property_id').eq('user_id', userId);
    if (data) this.savedIds.set(new Set(data.map((r: any) => r.property_id)));
  }

  async toggleSave(id: number, e: Event): Promise<void> {
    e.preventDefault(); e.stopPropagation();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    if (this.savingId() === id) return;
    this.savingId.set(id);
    const saved = this.savedIds();
    if (saved.has(id)) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', id);
      const next = new Set(saved); next.delete(id);
      this.savedIds.set(next);
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: id });
      const next = new Set(saved); next.add(id);
      this.savedIds.set(next);
    }
    this.savingId.set(null);
  }

  async shareCard(id: number, title: string, priceDisplay: string, e: Event): Promise<void> {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/commercial/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title, text: `${title} — ${priceDisplay}`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
    this.shareToastId.set(id);
    setTimeout(() => this.shareToastId.set(null), 2500);
    const { data } = await this.sb.from('properties').select('share_count').eq('id', id).single();
    const next = ((data as any)?.share_count ?? 0) + 1;
    await this.sb.from('properties').update({ share_count: next }).eq('id', id);
  }
}
