import { Component, OnInit, ElementRef, QueryList, ViewChild, ViewChildren, PLATFORM_ID, Inject, signal, computed, effect, inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { AdminDataService } from '../../shared/services/admin-data.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { toProjectSlug, toPropertySlug } from '../../shared/utils/slug';

interface Property {
  id: number;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  type: string;
  badge?: string;
  image: string;
}

interface HomeProject {
  id: number;
  name: string;
  location: string;
  developer: string;
  handover: string;
  startingPrice: string;
  paymentPlan: string;
  badge: boolean;
  image: string;
  slug: string;
}

interface OffPlanCard {
  id: number;
  name: string;
  developer: string;
  location: string;
  startingPrice: string;
  completion: string;
  type: string;
  roi: string;
  image: string;
  badge: string;
  slug: string;
}

interface TrendingProject {
  id: number;
  name: string;
  developer: string;
  price: string;
  badge: string;
  type: string;
  image: string;
  slug: string;
}

interface HomeAgent {
  name: string;
  role: string;
  avatar: string | null;
  phone: string;
  email: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
}

interface NewsArticle {
  id: number;
  slug?: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UpperCasePipe, FooterComponent, NewsletterSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private dataSvc = inject(AdminDataService);
  private sb = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private router = inject(Router);

  savedPropertyIds = signal<Set<number>>(new Set());
  savedProjectIds = signal<Set<number>>(new Set());
  sharePropToast = signal<number | null>(null);
  shareProjToast = signal<number | null>(null);

  isPropSaved(id: number): boolean { return this.savedPropertyIds().has(id); }
  isProjSaved(id: number): boolean { return this.savedProjectIds().has(id); }

  async toggleSaveProperty(id: number, event: Event): Promise<void> {
    event.preventDefault(); event.stopPropagation();
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    if (this.isPropSaved(id)) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', id);
      this.savedPropertyIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: id });
      this.savedPropertyIds.update(s => new Set(s).add(id));
    }
  }

  async toggleSaveProject(id: number, event: Event): Promise<void> {
    event.preventDefault(); event.stopPropagation();
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    if (this.isProjSaved(id)) {
      await this.sb.from('saved_projects').delete().eq('user_id', userId).eq('project_id', id);
      this.savedProjectIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await this.sb.from('saved_projects').insert({ user_id: userId, project_id: id });
      this.savedProjectIds.update(s => new Set(s).add(id));
    }
  }

  shareProperty(id: number, title: string, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    const url = `${window.location.origin}/properties/${toPropertySlug(title, id)}`;
    navigator.clipboard.writeText(url).catch(() => { });
    this.sharePropToast.set(id);
    setTimeout(() => this.sharePropToast.set(null), 2000);
  }

  shareProject(id: number, title: string, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    const url = `${window.location.origin}/projects/${toProjectSlug(title, id)}`;
    navigator.clipboard.writeText(url).catch(() => { });
    this.shareProjToast.set(id);
    setTimeout(() => this.shareProjToast.set(null), 2000);
  }

  private async loadSavedIds(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const [propsRes, projsRes] = await Promise.all([
      this.sb.from('saved_properties').select('property_id').eq('user_id', userId),
      this.sb.from('saved_projects').select('project_id').eq('user_id', userId),
    ]);
    if (propsRes.data) this.savedPropertyIds.set(new Set(propsRes.data.map((r: any) => r.property_id)));
    if (projsRes.data) this.savedProjectIds.set(new Set(projsRes.data.map((r: any) => r.project_id)));
  }

  homePage = computed(() => this.dataSvc.pages().find(p => p.id === 'home-hero'));
  heroHeadline = computed(() => this.homePage()?.heading || 'Find Your Dream Property in Dubai');
  heroSubline = computed(() => this.homePage()?.subheading || 'Over 2,500 premium listings. Expert agents. End-to-end support.');

  searchQuery = signal('');
  searchType = signal('buy');
  selectedLocations = signal<string[]>([]);


  // Search dropdown
  searchDropOpen = signal(false);
  searchResults = signal<{ type: 'location' | 'property' | 'project'; id?: number; label: string; sub: string }[]>([]);
  searchLoading = signal(false);
  private searchTimer: any;
  private propLocations = signal<string[]>([]);
  private projectLocations = signal<string[]>([]);

  private activeLocations(): string[] {
    return this.searchType() === 'new-projects' ? this.projectLocations() : this.propLocations();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimer);
    if (!value.trim()) {
      this.searchResults.set([]);
      this.searchDropOpen.set(false);
      return;
    }
    this.searchLoading.set(true);
    this.searchDropOpen.set(true);
    this.searchTimer = setTimeout(() => this.runSearch(value.trim()), 300);
  }

  private async runSearch(q: string): Promise<void> {
    const lower = q.toLowerCase();
    const tab = this.searchType();

    const locMatches = this.activeLocations()
      .filter(l => l.toLowerCase().includes(lower))
      .map(l => ({ type: 'location' as const, label: l, sub: 'Area / Community' }));

    if (tab === 'new-projects') {
      const { data } = await this.sb.from('projects')
        .select('id, title, location, community')
        .or(`title.ilike.%${q}%,location.ilike.%${q}%,community.ilike.%${q}%`)
        .eq('status', 'Published')
        .limit(8);

      const projItems = (data ?? []).map((p: any) => ({
        type: 'project' as const, id: p.id,
        label: p.title, sub: p.community || p.location || 'Project',
      }));

      this.searchResults.set([...locMatches, ...projItems].slice(0, 10));
    } else {
      this.searchResults.set(locMatches.slice(0, 10));
    }

    this.searchLoading.set(false);
    this.searchDropOpen.set(true);
  }

  selectResult(item: { type: 'location' | 'property' | 'project'; id?: number; label: string; sub: string }): void {
    if (item.type === 'property' && item.id) {
      this.searchDropOpen.set(false);
      this.router.navigate(['/properties', toPropertySlug(item.label, item.id)]);
      return;
    }
    // Both location and project — add/remove from multi-select tags, navigate on Search
    const locs = this.selectedLocations();
    if (locs.includes(item.label)) {
      this.selectedLocations.set(locs.filter(l => l !== item.label));
    } else {
      this.selectedLocations.set([...locs, item.label]);
    }
    this.searchQuery.set('');
  }

  removeLocation(loc: string): void {
    this.selectedLocations.set(this.selectedLocations().filter(l => l !== loc));
  }

  doSearch(): void {
    this.searchDropOpen.set(false);
    const q = this.searchQuery().trim();
    const tab = this.searchType();
    const locs = this.selectedLocations();

    if (tab === 'new-projects') {
      const params: Record<string, string> = {};
      if (locs.length > 0) params['q'] = locs.join(',');
      else if (q) params['q'] = q;
      this.router.navigate(['/projects'], Object.keys(params).length ? { queryParams: params } : {});
    } else {
      const params: Record<string, string> = {};
      params['status'] = tab === 'rent' ? 'Rent' : 'Sale';
      if (locs.length > 0) params['location'] = locs.join('|');
      else if (q) params['q'] = q;
      this.router.navigate(['/properties'], { queryParams: params });
    }
  }

  onSearchFocus(): void {
    if (this.searchQuery().trim()) {
      this.searchDropOpen.set(true);
    }
  }

  private async loadAllProjects(): Promise<void> {
    this.searchLoading.set(true);
    const { data } = await this.sb.from('projects')
      .select('id, title, location, community')
      .eq('status', 'Published')
      .order('is_featured', { ascending: false })
      .limit(12);

    const items = (data ?? []).map((p: any) => ({
      type: 'project' as const, id: p.id,
      label: p.title, sub: p.community || p.location || 'Project',
    }));
    this.searchResults.set(items);
    this.searchLoading.set(false);
  }

  closeSearchDrop(): void {
    setTimeout(() => this.searchDropOpen.set(false), 300);
  }

  searchTabs = [
    { value: 'buy', label: 'Buy' },
    { value: 'rent', label: 'Rent' },
    { value: 'new-projects', label: 'Projects' },
  ];
  activeTestimonial = signal(0);
  activeSlide = signal(0);

  // Hero slides driven by CMS banners (active only, ordered by sort_order)
  heroSlides = computed(() => {
    const banners = this.dataSvc.banners().filter(b => b.status === 'active');
    if (banners.length) {
      return banners.map(b => ({
        image: b.imageUrl || 'images/img1.jpeg',
        project: b.title,
        location: b.locationTag || '',
        desc: b.subtitle,
        startingPrice: b.startingPrice || '',
        paymentPlan: b.paymentPlan || '',
      }));
    }
    // Fallback while CMS loads
    return [
      { image: 'images/img1.jpeg', project: 'Creek Horizon Residences', location: 'Dubai Creek Harbour', desc: 'Contemporary waterfront living with panoramic creek and skyline views.', startingPrice: 'AED 1.8M', paymentPlan: '20 / 60 / 20 %' },
      { image: 'images/img2.jpeg', project: 'Downtown Heights', location: 'Downtown Dubai', desc: 'Iconic residences steps from Burj Khalifa.', startingPrice: 'AED 2.4M', paymentPlan: '10 / 65 / 25 %' },
      { image: 'images/img3.jpeg', project: 'Marina Cove', location: 'Dubai Marina', desc: 'Elegant apartments with full marina views.', startingPrice: 'AED 950K', paymentPlan: '20 / 55 / 25 %' },
    ];
  });

  // stats = [
  //   { value: '2,500', label: 'Properties Listed', suffix: '+' },
  //   { value: '1,800', label: 'Happy Families', suffix: '+' },
  //   { value: '98', label: 'Client Satisfaction', suffix: '%' },
  //   { value: '15', label: 'Years Experience', suffix: '+' },
  // ];

  featuredPropertiesLive = signal<Property[]>([]);
  latestProjectsLive = signal<HomeProject[]>([]);
  offPlanProjectsLive = signal<OffPlanCard[]>([]);
  trendingProjectsDb = signal<TrendingProject[]>([]);
  topAgentsLive = signal<HomeAgent[]>([]);
  propertyCounts = signal<Record<string, number>>({});
  partnerLogos = signal<{ url: string; name: string; link: string }[]>([]);

  displayedAgents = computed(() => this.topAgentsLive().length ? this.topAgentsLive() : this.topAgents);

  private async loadHomeData(): Promise<void> {
    await Promise.all([
      this.loadFeaturedProperties(),
      this.loadLatestProjects(),
      this.loadOffPlanFeatured(),
      this.loadTrendingProjects(),
      this.loadPropertyCounts(),
      this.loadTopAgents(),
      this.loadLocations(),
      this.loadSuccessStories(),
      this.loadBlogPosts(),
      this.loadPartnerLogos(),
    ]);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.setupScrollAnimations(), 50);
    }
  }

  private async loadLocations(): Promise<void> {
    // Property locations come from the Location Master (admin-managed)
    const masterLocs = this.dataSvc.locations();
    this.propLocations.set([...masterLocs].sort());

    // Project locations still derived from the projects table
    const { data } = await this.sb.from('projects').select('location').eq('status', 'Published');
    const projSet = new Set<string>();
    const clean = (v: string) => v.split(',')[0].trim();
    for (const r of (data ?? [])) {
      const v = clean(r.location ?? '');
      if (v) projSet.add(v);
    }
    this.projectLocations.set([...projSet].sort());
  }

  private async loadFeaturedProperties(): Promise<void> {
    let { data } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, bedrooms, bathrooms, area_sqft, type, images, is_featured, status')
      .eq('is_featured', true)
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!data || !data.length) {
      ({ data } = await this.sb
        .from('properties')
        .select('id, title, location, community, price, price_label, bedrooms, bathrooms, area_sqft, type, images, is_featured, status')
        .eq('status', 'Published')
        .order('created_at', { ascending: false })
        .limit(6));
    }

    if (data && data.length) {
      this.featuredPropertiesLive.set(data.map((p: any) => ({
        id: p.id,
        title: p.title,
        location: [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        price: p.price_label || `AED ${Number(p.price || 0).toLocaleString()}`,
        beds: p.bedrooms || 0,
        baths: p.bathrooms || 0,
        sqft: Number(p.area_sqft || 0).toLocaleString(),
        type: p.type,
        badge: p.is_featured ? 'Featured' : '',
        image: (p.images && p.images[0]) || '/images/dummy-image.png',
      })));
    }
  }

  private async loadLatestProjects(): Promise<void> {
    const { data } = await this.sb
      .from('projects')
      .select('id, title, location, community, developer, completion_date, price_from, price_label, payment_plan, images, badge, is_featured, status')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(8);

    if (data && data.length) {
      this.latestProjectsLive.set(data.map((p: any) => ({
        id: p.id,
        name: p.title ?? '',
        location: [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        developer: p.developer ?? '',
        handover: p.completion_date ?? '',
        startingPrice: p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : ''),
        paymentPlan: p.payment_plan ?? '',
        badge: !!p.is_featured,
        image: (p.images && p.images[0]) || '/images/dummy-image.png',
        slug: toProjectSlug(p.title ?? '', p.id),
      })));
    }
  }

  private async loadOffPlanFeatured(): Promise<void> {
    let { data } = await this.sb
      .from('projects')
      .select('id, title, developer, location, community, price_from, price_label, completion_date, type, badge, images, status')
      .eq('is_featured', true)
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!data || !data.length) {
      ({ data } = await this.sb
        .from('projects')
        .select('id, title, developer, location, community, price_from, price_label, completion_date, type, badge, images, status')
        .eq('status', 'Published')
        .order('created_at', { ascending: false })
        .limit(3));
    }

    if (data && data.length) {
      this.offPlanProjectsLive.set(data.map((p: any) => ({
        id: p.id,
        name: p.title ?? '',
        developer: p.developer ?? '',
        location: [p.community, p.location].filter(Boolean).join(', ') || 'Dubai',
        startingPrice: p.price_label || (p.price_from ? `AED ${Number(p.price_from).toLocaleString()}` : 'Price on Request'),
        completion: p.completion_date ?? '',
        type: p.type ?? 'Apartments',
        roi: '',
        image: (p.images && p.images[0]) || '/images/dummy-image.png',
        slug: toProjectSlug(p.title ?? '', p.id),
        badge: p.badge || 'New Launch',
      })));
    }
  }

  private async loadTrendingProjects(): Promise<void> {
    const { data } = await this.sb
      .from('projects')
      .select('id, title, developer, price_from, price_label, badge, type, is_luxury, is_ultra_luxury, images, status, trending_category')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && data.length) {
      const mapped: TrendingProject[] = data
        .filter((p: any) => p.trending_category && p.trending_category.trim())
        .map((p: any) => {
          const priceNum = Number(p.price_from || 0);
          const priceStr = p.price_label
            ? p.price_label.replace(/^AED\s*/i, '').trim()
            : priceNum > 0 ? `AED ${priceNum.toLocaleString('en-US')}` : '';

          return {
            id: p.id,
            name: p.title ?? '',
            developer: p.developer ?? '',
            price: priceStr,
            badge: p.badge || 'New Launch',
            type: (p.trending_category ?? '').trim(),
            image: (p.images && p.images[0]) || '/images/dummy-image.png',
            slug: toProjectSlug(p.title ?? '', p.id),
          };
        });

      this.trendingProjectsDb.set(mapped);
    }
  }

  private async loadTopAgents(): Promise<void> {
    const { data } = await this.sb
      .from('profiles')
      .select('name, email, phone, avatar_url, designation')
      .eq('role', 'agent')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(6);

    if (data && data.length) {
      this.topAgentsLive.set(data.map((a: any) => ({
        name: a.name ?? 'Agent',
        role: a.designation ?? 'Business Associate',
        avatar: (a.avatar_url && !a.avatar_url.startsWith('data:')) ? a.avatar_url : null,
        phone: a.phone ?? '',
        email: a.email ?? '',
      })));
    }
  }

  private async loadPropertyCounts(): Promise<void> {
    const types = ['Apartment', 'Villa', 'Townhouse', 'Office', 'Shop', 'Plot'];
    const counts: Record<string, number> = {};
    await Promise.all(types.map(async t => {
      const { count } = await this.sb
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('type', t)
        .eq('status', 'Published');
      counts[t] = count ?? 0;
    }));
    this.propertyCounts.set(counts);
  }

  testimonials = signal<Testimonial[]>([
    {
      name: 'James & Emily Carter',
      role: 'Purchased Villa in Palm Jumeirah',
      text: 'Livwell made our dream of owning a home in Dubai a reality. The team was incredibly professional, transparent through every step, and found us the perfect property within our budget.',
      rating: 5,
      avatar: '',
    },
    {
      name: 'Fatima Al-Rashidi',
      role: 'Sold Apartment in Downtown Dubai',
      text: 'I was amazed by how quickly my property sold and at a price above my expectations. The marketing team did an exceptional job and my agent was always available to answer questions.',
      rating: 5,
      avatar: '',
    },
    {
      name: 'Raj Patel',
      role: 'Investment Portfolio – 5 Properties',
      text: 'As an investor, I need data-driven advice. Livwell\'s team provided in-depth market analysis that helped me build a portfolio with consistent returns. Highly recommend their investment consulting.',
      rating: 5,
      avatar: '',
    },
  ]);

  private async loadSuccessStories(): Promise<void> {
    const { data } = await this.sb
      .from('success_stories')
      .select('name, role, text, rating, avatar')
      .eq('active', true)
      .order('sort_order');
    if (data && data.length) {
      this.testimonials.set(data as Testimonial[]);
      this.activeTestimonial.set(0);
    }
  }

  newsArticles = signal<NewsArticle[]>([
    { id: 1, category: 'Market Insights', title: 'Dubai Real Estate Market Hits Record AED 141 Billion in 2025 Transactions', excerpt: 'The UAE property market continues its remarkable growth trajectory, with off-plan sales driving unprecedented demand across premium communities.', author: 'Sarah Al-Mansouri', date: 'May 14, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', featured: true },
    { id: 2, category: 'Investment', title: 'Top 5 Communities for ROI in Dubai: Where Smart Money Is Flowing', excerpt: 'From Business Bay to Jumeirah Village Circle, we break down which communities are delivering the strongest rental yields for investors in 2026.', author: 'Ahmed Hassan', date: 'May 12, 2026', readTime: '4 min read', image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80' },
    { id: 3, category: 'Lifestyle', title: 'Palm Jumeirah Residences: A Complete Living Guide for New Homeowners', excerpt: 'Everything you need to know about settling into one of the world\'s most iconic addresses — from amenities to community life.', author: 'Priya Sharma', date: 'May 10, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { id: 4, category: 'Regulations', title: 'New UAE Golden Visa Rules: How Property Ownership Qualifies You', excerpt: 'Updated guidelines make it easier than ever for property investors to secure long-term residency through real estate investments above AED 2 million.', author: 'Michael Chen', date: 'May 8, 2026', readTime: '3 min read', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80' },
  ]);

  private async loadBlogPosts(): Promise<void> {
    const { data } = await this.sb.from('blogs').select('id,title,slug,category,excerpt,author,image,read_time,featured,published_at')
      .eq('published', true).order('published_at', { ascending: false }).limit(4);
    if (data && data.length) {
      this.newsArticles.set(data.map((p: any) => ({
        id: p.id, category: p.category, title: p.title, excerpt: p.excerpt,
        author: p.author, date: new Date(p.published_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }),
        readTime: p.read_time, image: p.image ?? '', featured: p.featured, slug: p.slug,
      })));
    }
  }

  propertyTypes = computed(() => {
    const c = this.propertyCounts();
    return [
      { label: 'Apartments', count: c['Apartment'] ? `${c['Apartment']}` : '' },
      { label: 'Villas', count: c['Villa'] ? `${c['Villa']}` : '' },
      { label: 'Townhouses', count: c['Townhouse'] ? `${c['Townhouse']}` : '' },
      { label: 'Offices', count: c['Office'] ? `${c['Office']}` : '' },
      { label: 'Retail', count: c['Shop'] ? `${c['Shop']}` : '' },
      { label: 'Plots', count: c['Plot'] ? `${c['Plot']}` : '' },
    ];
  });

  offPlanProjects = computed<OffPlanCard[]>(() => {
    const live = this.offPlanProjectsLive();
    if (live.length) return live;
    return [
      { id: 1, name: 'Creek Horizon Residences', developer: 'Emaar Properties', location: 'Dubai Creek Harbour', startingPrice: 'AED 1,250,000', completion: 'Q4 2027', type: 'Apartments', roi: '8.5% est. ROI', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', badge: 'New Launch', slug: '' },
      { id: 2, name: 'Palm Vista Villas', developer: 'Nakheel', location: 'Palm Jebel Ali, Dubai', startingPrice: 'AED 6,800,000', completion: 'Q2 2026', type: 'Villas', roi: '7.2% est. ROI', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', badge: 'Selling Fast', slug: '' },
      { id: 3, name: 'Skyline Towers', developer: 'DAMAC Properties', location: 'Business Bay, Dubai', startingPrice: 'AED 890,000', completion: 'Q1 2028', type: 'Apartments', roi: '9.1% est. ROI', image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80', badge: 'Early Bird', slug: '' },
    ];
  });

  @ViewChildren('animateEl') animateEls!: QueryList<ElementRef>;
  @ViewChild('lpTrack') lpTrack!: ElementRef<HTMLElement>;
  @ViewChild('trendingTrack') trendingTrack!: ElementRef<HTMLElement>;
  @ViewChild('featPropTrack') featPropTrack!: ElementRef<HTMLElement>;
  @ViewChild('offplanTrack') offplanTrack!: ElementRef<HTMLElement>;
  @ViewChild('teamsTrack') teamsTrack!: ElementRef<HTMLElement>;

  latestProjects = computed<HomeProject[]>(() => {
    const live = this.latestProjectsLive();
    if (live.length) return live;
    return [
      { id: 0, name: 'Avena by Emaar', location: 'Arabian Ranches 3', developer: 'Emaar', handover: 'Q1 2029', startingPrice: 'AED 3.5M', paymentPlan: '10 / 80', badge: true, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', slug: '' },
      { id: 0, name: 'Avarra By Palace', location: 'Business Bay', developer: 'Emaar', handover: 'Q2 2031', startingPrice: 'AED 13.6M', paymentPlan: '10 / 80 / 10', badge: false, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80', slug: '' },
      { id: 0, name: 'Binghatti Skyflame', location: 'Majan', developer: 'Binghatti', handover: 'Q4 2027', startingPrice: 'AED 585K', paymentPlan: '10 / 60 / 30', badge: false, image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', slug: '' },
      { id: 0, name: 'The Edit at d3', location: 'Dubai Design District', developer: 'Meraas', handover: 'Q4 2027', startingPrice: 'AED 1.9M', paymentPlan: '20 / 55 / 25', badge: false, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80', slug: '' },
      { id: 0, name: 'Creek Horizon', location: 'Dubai Creek Harbour', developer: 'Emaar', handover: 'Q4 2027', startingPrice: 'AED 1.25M', paymentPlan: '20 / 60 / 20', badge: true, image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80', slug: '' },
      { id: 0, name: 'Palm Vista Residences', location: 'Palm Jebel Ali', developer: 'Nakheel', handover: 'Q2 2026', startingPrice: 'AED 6.8M', paymentPlan: '15 / 55 / 30', badge: false, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80', slug: '' },
    ];
  });

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    effect(() => {
      const tabs = this.dataSvc.trendingTabs();
      if (tabs.length && !tabs.includes(this.activeTrendingTab())) {
        this.activeTrendingTab.set(tabs[0]);
      }
    });
  }

  private async loadPartnerLogos(): Promise<void> {
    const { data } = await this.sb
      .from('site_settings')
      .select('value')
      .eq('key', 'partner_logos')
      .maybeSingle();
    if (data?.value) {
      try { this.partnerLogos.set(JSON.parse(data.value)); } catch { }
    }
  }

  private slideInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadHomeData();
    this.loadSavedIds();
    if (isPlatformBrowser(this.platformId)) {
      this.startSlideshow();
      this.startTestimonialRotation();
      setTimeout(() => this.setupScrollAnimations(), 100);
    }
  }

  private startSlideshow(): void {
    this.slideInterval = setInterval(() => {
      const len = this.heroSlides().length;
      this.activeSlide.set((this.activeSlide() + 1) % (len || 1));
    }, 5000);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.startSlideshow();
  }

  prevSlide(): void {
    const len = this.heroSlides().length || 1;
    this.goToSlide((this.activeSlide() - 1 + len) % len);
  }

  nextSlide(): void {
    const len = this.heroSlides().length || 1;
    this.goToSlide((this.activeSlide() + 1) % len);
  }

  private startTestimonialRotation(): void {
    setInterval(() => {
      this.activeTestimonial.set((this.activeTestimonial() + 1) % (this.testimonials().length || 1));
    }, 5000);
  }

  private setupScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  setTestimonial(index: number): void {
    this.activeTestimonial.set(index);
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AG';
  }

  activeTeam = signal(0);
  activeTrendingTab = signal('Luxury');

  trendingTabs = computed(() =>
    this.dataSvc.trendingTabs().map(t => ({ value: t, label: t }))
  );

  filteredTrendingProjects = computed(() => {
    const tab = this.activeTrendingTab();
    const live = this.trendingProjectsDb();
    if (live.length) return live.filter(p => p.type === tab);
    const fallback: TrendingProject[] = [
      { id: 0, name: 'One at Palm Jumeirah', developer: 'Omniyat', price: '14M', badge: 'Ready', type: 'Luxury', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80', slug: '' },
      { id: 0, name: 'Six Senses', developer: 'Select Group', price: '12.5M', badge: '40 / 60 Payment Plan', type: 'Luxury', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80', slug: '' },
      { id: 0, name: 'Palm Vista Villas', developer: 'Nakheel', price: '6.8M', badge: 'Ready', type: 'Villas', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', slug: '' },
      { id: 0, name: 'Emirates Hills Villa', developer: 'Emaar', price: '22M', badge: '20 / 80 Payment Plan', type: 'Villas', image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80', slug: '' },
      { id: 0, name: 'Skyline Tower', developer: 'DAMAC', price: '890K', badge: '60 / 40 Payment Plan', type: 'Flats', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80', slug: '' },
      { id: 0, name: 'Creek Horizon', developer: 'Emaar', price: '1.25M', badge: '20 / 60 / 20 Payment Plan', type: 'Flats', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', slug: '' },
    ];
    return fallback.filter(p => p.type === (tab || 'Luxury'));
  });

  guides = [
    { title: 'Buying Guide', subtitle: 'How to Buy Property in Dubai', slug: 'buying-guide', icon: '🏠', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { title: 'Buying Offplan Guide', subtitle: 'How to Buy Off Plan in Dubai', slug: 'off-plan-guide', icon: '🏗️', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { title: 'Renting Guide', subtitle: 'How to Rent Property in Dubai', slug: 'renting-guide', icon: '🔑', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { title: 'Selling Guide', subtitle: 'How to Sell Property in Dubai', slug: 'selling-guide', icon: '💰', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  ];

  topAgents: HomeAgent[] = [
    { name: 'Anuj Sharma', role: 'Business Associate', avatar: 'images/Anuj.jpeg', phone: '+971542481813', email: 'anuj@livwelldubai.ae' },
    { name: 'Niket Mehta', role: 'Business Associate', avatar: 'images/Niket .jpeg', phone: '+971585798027', email: 'niket@livwelldubai.ae' },
    { name: 'Yash Uday Chari', role: 'Business Associate', avatar: 'images/Yash.jpeg', phone: '+971585833629', email: 'yash@livwelldubai.ae' },
  ];

  teamAreas = computed(() => [{
    area: 'Our Associates',
    agents: this.displayedAgents(),
  }]);

  scrollTrending(dir: 1 | -1): void {
    const track = this.trendingTrack?.nativeElement;
    if (!track) return;
    const cardWidth = track.querySelector('.trending-card')?.clientWidth ?? 320;
    track.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  }

  scrollTeams(dir: 1 | -1): void {
    const viewport = this.teamsTrack?.nativeElement;
    if (viewport) viewport.scrollBy({ left: dir * viewport.offsetWidth, behavior: 'smooth' });
  }

  scrollOffplan(dir: 1 | -1): void {
    const track = this.offplanTrack?.nativeElement;
    if (track) track.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }

  scrollFeaturedProperties(dir: 1 | -1): void {
    const track = this.featPropTrack?.nativeElement;
    if (!track) return;
    const cardWidth = track.querySelector('.property-card')?.clientWidth ?? track.offsetWidth;
    track.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  }

  scrollLatestProjects(dir: 1 | -1): void {
    const track = this.lpTrack?.nativeElement;
    if (track) track.scrollBy({ left: dir * 370, behavior: 'smooth' });
  }

  get featuredArticle(): NewsArticle {
    return this.newsArticles().find(a => a.featured) ?? this.newsArticles()[0];
  }

  get sideArticles(): NewsArticle[] {
    const featured = this.featuredArticle;
    return this.newsArticles().filter(a => a.id !== featured?.id);
  }

  propertySlug(p: { title: string; id: number }): string {
    return toPropertySlug(p.title, p.id);
  }

  navigateTo(commands: any[]): void { this.router.navigate(commands); }
}

