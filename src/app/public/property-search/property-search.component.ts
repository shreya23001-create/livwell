import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { toPropertySlug } from '../../shared/utils/slug';

interface SlugConfig {
  title: string;
  status?: string;
  type?: string;
  q?: string;
  beds?: string;
  furnished?: string;
}

const SLUG_MAP: Record<string, SlugConfig> = {
  'dubai-penthouse-for-sale':           { title: 'Dubai Penthouse for Sale',           status: 'Sale', type: 'Penthouse' },
  'dubai-mansion-for-sale':             { title: 'Dubai Mansion for Sale',             status: 'Sale', q: 'Mansion' },
  'dubai-apartment-for-sale':           { title: 'Dubai Apartment for Sale',           status: 'Sale', type: 'Apartment' },
  'dubai-villa-for-sale':               { title: 'Dubai Villa for Sale',               status: 'Sale', type: 'Villa' },
  'houses-for-sale-in-dubai':           { title: 'Houses for Sale in Dubai',           status: 'Sale', type: 'Villa' },
  'buy-ready-apartments-in-dubai':      { title: 'Buy Ready Apartments in Dubai',      status: 'Sale', type: 'Apartment' },
  'buy-ready-villas-in-dubai':          { title: 'Buy Ready Villas in Dubai',          status: 'Sale', type: 'Villa' },
  'townhouse-for-sale-in-dubai':        { title: 'Townhouse for Sale in Dubai',        status: 'Sale', type: 'Townhouse' },
  'lands-in-dubai-for-sale':            { title: 'Lands in Dubai for Sale',            status: 'Sale', type: 'Plot' },
  'dubai-penthouse-for-rent':           { title: 'Dubai Penthouse for Rent',           status: 'Rent', type: 'Penthouse' },
  'dubai-apartment-for-rent':           { title: 'Dubai Apartment for Rent',           status: 'Rent', type: 'Apartment' },
  'dubai-villa-for-rent':               { title: 'Dubai Villa for Rent',               status: 'Rent', type: 'Villa' },
  'townhouse-for-rent-in-dubai':        { title: 'Townhouse for Rent in Dubai',        status: 'Rent', type: 'Townhouse' },
  'houses-for-rent-in-dubai':           { title: 'Houses for Rent in Dubai',           status: 'Rent', type: 'Villa' },
  'furnished-apartments-for-rent':      { title: 'Furnished Apartments for Rent',      status: 'Rent', type: 'Apartment', furnished: 'Furnished' },
  'furnished-villas-for-rent':          { title: 'Furnished Villas for Rent',          status: 'Rent', type: 'Villa', furnished: 'Furnished' },
  'furnished-townhouses-for-rent':      { title: 'Furnished Townhouses for Rent',      status: 'Rent', type: 'Townhouse', furnished: 'Furnished' },
  'furnished-studio-for-sale':          { title: 'Furnished Studio For Sale',          status: 'Sale', beds: 'Studio', furnished: 'Furnished' },
  'furnished-1-bed-apartment-for-sale': { title: 'Furnished 1 Bed Apartment For Sale', status: 'Sale', type: 'Apartment', beds: '1', furnished: 'Furnished' },
  'furnished-2-bed-apartment-for-sale': { title: 'Furnished 2 Bed Apartment For Sale', status: 'Sale', type: 'Apartment', beds: '2', furnished: 'Furnished' },
  'furnished-3-bed-apartment-for-sale': { title: 'Furnished 3 Bed Apartment For Sale', status: 'Sale', type: 'Apartment', beds: '3', furnished: 'Furnished' },
  'furnished-4-bed-apartment-for-sale': { title: 'Furnished 4 Bed Apartment For Sale', status: 'Sale', type: 'Apartment', beds: '4', furnished: 'Furnished' },
  'furnished-studio-for-rent':          { title: 'Furnished Studio For Rent',          status: 'Rent', beds: 'Studio', furnished: 'Furnished' },
  'furnished-1-bed-apartment-for-rent': { title: 'Furnished 1 Bed Apartment For Rent', status: 'Rent', type: 'Apartment', beds: '1', furnished: 'Furnished' },
  'furnished-2-bed-apartment-for-rent': { title: 'Furnished 2 Bed Apartment For Rent', status: 'Rent', type: 'Apartment', beds: '2', furnished: 'Furnished' },
  'furnished-3-bed-apartment-for-rent': { title: 'Furnished 3 Bed Apartment For Rent', status: 'Rent', type: 'Apartment', beds: '3', furnished: 'Furnished' },
  'furnished-4-bed-apartment-for-rent': { title: 'Furnished 4 Bed Apartment For Rent', status: 'Rent', type: 'Apartment', beds: '4', furnished: 'Furnished' },
  'beachfront-properties-for-sale':     { title: 'Beachfront Properties for Sale',     status: 'Sale', q: 'Beachfront' },
  'beachfront-properties-for-rent':     { title: 'Beachfront Properties for Rent',     status: 'Rent', q: 'Beachfront' },
  'waterfront-properties-for-sale':     { title: 'Waterfront Properties for Sale',     status: 'Sale', q: 'Waterfront' },
  'waterfront-properties-for-rent':     { title: 'Waterfront Properties for Rent',     status: 'Rent', q: 'Waterfront' },
  'beachfront-villas-for-sale':         { title: 'Beachfront Villas for Sale',         status: 'Sale', type: 'Villa', q: 'Beachfront' },
  'beachfront-villas-for-rent':         { title: 'Beachfront Villas for Rent',         status: 'Rent', type: 'Villa', q: 'Beachfront' },
  'beachfront-apartments-for-sale':     { title: 'Beachfront Apartments for Sale',     status: 'Sale', type: 'Apartment', q: 'Beachfront' },
  'beachfront-apartments-for-rent':     { title: 'Beachfront Apartments for Rent',     status: 'Rent', type: 'Apartment', q: 'Beachfront' },
  'dubai-apartment-prices':             { title: 'Dubai Apartment Prices',             type: 'Apartment' },
  'dubai-villa-prices':                 { title: 'Dubai Villa Prices',                 type: 'Villa' },
};

interface PropertyRow {
  id: number;
  title: string;
  location: string;
  community: string;
  price: number;
  listing_type: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing: string;
  images: string[];
}

@Component({
  selector: 'app-property-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-search.component.html',
  styleUrl: './property-search.component.scss',
})
export class PropertySearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sb = inject(SupabaseService).client;

  readonly pageSize = 9;

  slug = signal('');
  isLoading = signal(false);
  properties = signal<PropertyRow[]>([]);
  currentPage = signal(1);

  config = computed<SlugConfig | null>(() => SLUG_MAP[this.slug()] ?? null);

  pageTitle = computed(() => this.config()?.title ?? 'Properties in Dubai');

  totalPages = computed(() => Math.ceil(this.properties().length / this.pageSize));

  paginatedProperties = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.properties().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | '...')[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async params => {
      const s = params.get('slug') ?? '';
      this.slug.set(s);
      this.currentPage.set(1);
      await this.loadProperties();
    });
  }

  showingAll = signal(false);

  private async loadProperties(): Promise<void> {
    const filters = this.config();
    this.showingAll.set(false);
    this.isLoading.set(true);

    const baseSelect = 'id, title, location, community, price, listing_type, type, bedrooms, bathrooms, area_sqft, furnishing, images';

    if (filters) {
      let query = this.sb.from('properties').select(baseSelect).eq('status', 'Published');

      if (filters.status === 'Rent') {
        query = query.eq('listing_type', 'Rent');
      } else if (filters.status === 'Sale') {
        query = query.in('listing_type', ['Sale', 'Off-Plan', 'Ready']);
      }
      if (filters.type)      query = query.eq('type', filters.type);
      if (filters.furnished) query = query.eq('furnishing', filters.furnished);
      if (filters.beds) {
        query = filters.beds === 'Studio'
          ? query.eq('bedrooms', 0)
          : query.eq('bedrooms', Number(filters.beds));
      }
      if (filters.q) query = query.ilike('title', `%${filters.q}%`);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        this.properties.set(data as PropertyRow[]);
        this.isLoading.set(false);
        return;
      }
    }

    // Fallback: show all published properties
    this.showingAll.set(true);
    const { data: allData } = await this.sb
      .from('properties')
      .select(baseSelect)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    this.properties.set((allData as PropertyRow[]) ?? []);
    this.isLoading.set(false);
  }

  formatPrice(price: number, listingType: string): string {
    if (!price) return '—';
    const suffix = listingType === 'Rent' ? '/yr' : '';
    return `AED ${price.toLocaleString('en-US')}${suffix}`;
  }

  formatBeds(beds: number): string {
    if (beds === 0) return 'Studio';
    return `${beds} Bed${beds > 1 ? 's' : ''}`;
  }

  getImage(images: string[]): string {
    const raw = Array.isArray(images) ? images : (typeof images === 'string' ? (() => { try { return JSON.parse(images as any); } catch { return []; } })() : []);
    const first = raw.find((u: string) => u && !u.includes('unsplash.com'));
    return first || '/images/dummy-image.png';
  }

  propertyLink(p: PropertyRow): string {
    return toPropertySlug(p.title, p.id);
  }

  goToPage(page: number | '...'): void {
    if (typeof page !== 'number') return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
