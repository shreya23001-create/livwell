import { Component, OnInit, signal, computed, PLATFORM_ID, Inject, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';

export interface PropertyListing {
  id: number;
  title: string;
  location: string;
  community: string;
  price: number;
  priceLabel: string;
  pricePerSqft?: string;
  beds: number | 'Studio';
  baths: number;
  sqft: number;
  sqftLabel: string;
  type: 'Apartment' | 'Villa' | 'Townhouse' | 'Office' | 'Retail' | 'Plot' | 'Penthouse';
  status: 'Sale' | 'Rent';
  furnished: 'Furnished' | 'Unfurnished' | 'Semi-Furnished';
  badge?: string;
  images: string[];
  amenities: string[];
  developer?: string;
  completionYear?: string;
  isOffPlan?: boolean;
  views: number;
  postedDate: string;
  lat: number;
  lng: number;
  agentName: string;
  agentAvatar: string;
  agentPhone: string;
}

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {

  Math = Math;

  // ── View State ──────────────────────────────────────────────
  viewMode = signal<'grid' | 'list' | 'map'>('grid');
  showFilters = signal(true);
  isLoading = signal(false);
  currentPage = signal(1);
  pageSize = 9;

  // ── Filter State ─────────────────────────────────────────────
  searchQuery = signal('');
  selectedType = signal('');
  selectedStatus = signal('');
  selectedLocation = signal('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  selectedBeds = signal('');
  selectedBaths = signal('');
  minArea = signal<number | null>(null);
  maxArea = signal<number | null>(null);
  selectedFurnished = signal('');
  selectedAmenities = signal<string[]>([]);
  selectedReadiness = signal('');
  selectedView = signal('');
  selectedSpecialFeatures = signal<string[]>([]);
  referenceNumber = signal('');
  sortBy = signal('newest');

  // ── Active Map Property ──────────────────────────────────────
  activeMapProperty = signal<PropertyListing | null>(null);
  hoveredPropertyId = signal<number | null>(null);

  private sb = inject(SupabaseService).client;

  // ── Data ─────────────────────────────────────────────────────
  readonly filterOptions = {
    types: ['Apartment', 'Villa', 'Townhouse', 'Hotel Apartment', 'Duplex', 'Penthouse', 'Mansion', 'Office', 'Shop', 'Residential Plot', 'Commercial Plot'],
    statuses: ['Sale', 'Rent'],
    locations: ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'JBR', 'Arabian Ranches', 'Emirates Hills', 'Jumeirah Village Circle', 'Dubai Hills Estate', 'Meydan', 'Dubai Creek Harbour', 'Jumeirah', 'Al Barsha', 'DIFC', 'Dubai South'],
    beds: ['Studio', '1', '2', '3', '4', '5', '6', '7+'],
    baths: ['1', '2', '3', '4', '5', '6', '7+'],
    furnished: ['Furnished', 'Unfurnished', 'Semi-Furnished'],
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Concierge', 'Kids Play Area', 'BBQ Area', 'Beach Access', 'Golf Course', 'Marina View', 'Balcony', 'Maid Room'],
    views: ['Atlantis View', 'Burj Khalifa View', 'Dubai Mall View', 'Fountain View', 'Palm Jumeirah View', 'Burj Al Arab View', 'Dubai Skyline View', 'Dubai Creek View', 'Dubai Opera View', 'Ain Dubai View', 'Sea View', 'Golf Course View', 'Marina View', 'Park View', 'Pool View', 'Sheikh Zayed Road View', 'Community View'],
    specialFeatures: ['Reduced Price', 'Waterfront', 'Beachfront', 'Furnished', '360° Tour'],
    sortOptions: [
      { value: 'newest', label: 'Newest First' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'price_sqft_asc', label: 'Price/sqft: Low to High' },
      { value: 'price_sqft_desc', label: 'Price/sqft: High to Low' },
      { value: 'most_viewed', label: 'Most Viewed' },
      { value: 'area_asc', label: 'Area: Small to Large' },
      { value: 'area_desc', label: 'Area: Large to Small' },
    ],
  };

  allProperties = signal<PropertyListing[]>([]);

  private readonly _mockProperties: PropertyListing[] = [
    {
      id: 1, title: 'Luxury Penthouse with Burj View', location: 'Downtown Dubai, UAE', community: 'Downtown Dubai',
      price: 4500000, priceLabel: 'AED 4,500,000', pricePerSqft: 'AED 1,406/sqft',
      beds: 4, baths: 3, sqft: 3200, sqftLabel: '3,200 sqft',
      type: 'Penthouse', status: 'Sale', furnished: 'Furnished', badge: 'Featured',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Gym', 'Concierge', 'Balcony', 'Parking'],
      views: 1842, postedDate: '2026-05-10', lat: 25.1972, lng: 55.2744,
      agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971 50 123 4567',
    },
    {
      id: 2, title: 'Modern Villa with Private Pool', location: 'Palm Jumeirah, Dubai', community: 'Palm Jumeirah',
      price: 8200000, priceLabel: 'AED 8,200,000', pricePerSqft: 'AED 1,414/sqft',
      beds: 5, baths: 5, sqft: 5800, sqftLabel: '5,800 sqft',
      type: 'Villa', status: 'Sale', furnished: 'Unfurnished', badge: 'Hot',
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Gym', 'Beach Access', 'Parking', 'Security', 'BBQ Area'],
      views: 3210, postedDate: '2026-05-08', lat: 25.1124, lng: 55.1390,
      agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971 50 234 5678',
    },
    {
      id: 3, title: 'Beachfront Apartment Sea Views', location: 'JBR Walk, Dubai Marina', community: 'JBR',
      price: 2100000, priceLabel: 'AED 2,100,000', pricePerSqft: 'AED 1,448/sqft',
      beds: 2, baths: 2, sqft: 1450, sqftLabel: '1,450 sqft',
      type: 'Apartment', status: 'Sale', furnished: 'Furnished', badge: 'New',
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Gym', 'Beach Access', 'Balcony', 'Parking'],
      views: 987, postedDate: '2026-05-12', lat: 25.0777, lng: 55.1328,
      agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971 50 345 6789',
    },
    {
      id: 4, title: 'Contemporary Townhouse Family Living', location: 'Arabian Ranches, Dubai', community: 'Arabian Ranches',
      price: 3750000, priceLabel: 'AED 3,750,000', pricePerSqft: 'AED 1,293/sqft',
      beds: 4, baths: 3, sqft: 2900, sqftLabel: '2,900 sqft',
      type: 'Townhouse', status: 'Sale', furnished: 'Unfurnished',
      images: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Kids Play Area', 'Security', 'Parking', 'BBQ Area'],
      views: 654, postedDate: '2026-05-06', lat: 25.0501, lng: 55.2607,
      agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971 50 456 7890',
    },
    {
      id: 5, title: 'Sky View Studio Business Bay', location: 'Business Bay, Dubai', community: 'Business Bay',
      price: 980000, priceLabel: 'AED 980,000', pricePerSqft: 'AED 1,508/sqft',
      beds: 'Studio', baths: 1, sqft: 650, sqftLabel: '650 sqft',
      type: 'Apartment', status: 'Sale', furnished: 'Furnished', badge: 'Reduced',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      ],
      amenities: ['Gym', 'Concierge', 'Parking', 'Balcony'],
      views: 1543, postedDate: '2026-05-14', lat: 25.1867, lng: 55.2640,
      agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971 50 123 4567',
    },
    {
      id: 6, title: 'Heritage Mansion Emirates Hills', location: 'Emirates Hills, Dubai', community: 'Emirates Hills',
      price: 22000000, priceLabel: 'AED 22,000,000', pricePerSqft: 'AED 1,774/sqft',
      beds: 7, baths: 8, sqft: 12400, sqftLabel: '12,400 sqft',
      type: 'Villa', status: 'Sale', furnished: 'Furnished', badge: 'Exclusive',
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Golf Course', 'Gym', 'Security', 'Concierge', 'Maid Room', 'Parking', 'BBQ Area'],
      views: 4120, postedDate: '2026-04-28', lat: 25.0798, lng: 55.1699,
      agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971 50 234 5678',
    },
    {
      id: 7, title: 'Marina View 1BR Apartment', location: 'Dubai Marina', community: 'Dubai Marina',
      price: 85000, priceLabel: 'AED 85,000/yr', pricePerSqft: 'AED 70/sqft/yr',
      beds: 1, baths: 1, sqft: 1200, sqftLabel: '1,200 sqft',
      type: 'Apartment', status: 'Rent', furnished: 'Furnished',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Gym', 'Marina View', 'Balcony', 'Parking'],
      views: 2890, postedDate: '2026-05-15', lat: 25.0782, lng: 55.1401,
      agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971 50 345 6789',
    },
    {
      id: 8, title: '3BR Townhouse Dubai Hills', location: 'Dubai Hills Estate, Dubai', community: 'Dubai Hills Estate',
      price: 220000, priceLabel: 'AED 220,000/yr', pricePerSqft: 'AED 88/sqft/yr',
      beds: 3, baths: 3, sqft: 2500, sqftLabel: '2,500 sqft',
      type: 'Townhouse', status: 'Rent', furnished: 'Semi-Furnished',
      images: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Kids Play Area', 'Security', 'Parking'],
      views: 432, postedDate: '2026-05-13', lat: 25.1124, lng: 55.2233,
      agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971 50 456 7890',
    },
    {
      id: 9, title: 'Premium Office Space Business Bay', location: 'Business Bay, Dubai', community: 'Business Bay',
      price: 350000, priceLabel: 'AED 350,000/yr',
      beds: 0 as any, baths: 2, sqft: 2800, sqftLabel: '2,800 sqft',
      type: 'Office', status: 'Rent', furnished: 'Furnished',
      images: [
        'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
        'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
      ],
      amenities: ['Parking', 'Concierge', 'Security', 'Gym'],
      views: 765, postedDate: '2026-05-11', lat: 25.1881, lng: 55.2644,
      agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971 50 234 5678',
    },
    {
      id: 10, title: '2BR Apartment JVC with Pool', location: 'Jumeirah Village Circle, Dubai', community: 'Jumeirah Village Circle',
      price: 1350000, priceLabel: 'AED 1,350,000', pricePerSqft: 'AED 964/sqft',
      beds: 2, baths: 2, sqft: 1400, sqftLabel: '1,400 sqft',
      type: 'Apartment', status: 'Sale', furnished: 'Unfurnished',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Gym', 'Kids Play Area', 'Parking'],
      views: 312, postedDate: '2026-05-09', lat: 25.0609, lng: 55.2097,
      agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971 50 345 6789',
    },
    {
      id: 11, title: 'Stunning 4BR Meydan Villa', location: 'Meydan, Dubai', community: 'Meydan',
      price: 5800000, priceLabel: 'AED 5,800,000', pricePerSqft: 'AED 1,254/sqft',
      beds: 4, baths: 4, sqft: 4625, sqftLabel: '4,625 sqft',
      type: 'Villa', status: 'Sale', furnished: 'Unfurnished', badge: 'New',
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      ],
      amenities: ['Swimming Pool', 'Golf Course', 'Security', 'Parking', 'Maid Room'],
      views: 891, postedDate: '2026-05-07', lat: 25.1605, lng: 55.3119,
      agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971 50 123 4567',
    },
    {
      id: 12, title: 'Retail Space Ground Floor JBR', location: 'JBR, Dubai Marina', community: 'JBR',
      price: 420000, priceLabel: 'AED 420,000/yr',
      beds: 0 as any, baths: 1, sqft: 1800, sqftLabel: '1,800 sqft',
      type: 'Retail', status: 'Rent', furnished: 'Unfurnished',
      images: [
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
      ],
      amenities: ['Parking', 'Security'],
      views: 244, postedDate: '2026-05-05', lat: 25.0790, lng: 55.1320,
      agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971 50 456 7890',
    },
  ];

  // ── Computed: filtered + sorted + paginated ──────────────────
  filteredProperties = computed(() => {
    let result = [...this.allProperties()];
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
    }
    if (this.selectedType()) {
      const t = this.selectedType().toLowerCase();
      result = result.filter(p => p.type.toLowerCase() === t || p.type.toLowerCase().includes(t));
    }
    if (this.selectedStatus()) {
      const s = this.selectedStatus().toLowerCase();
      result = result.filter(p => p.status.toLowerCase() === s);
    }
    if (this.selectedLocation()) result = result.filter(p => p.community === this.selectedLocation());
    if (this.minPrice() !== null) result = result.filter(p => p.price >= this.minPrice()!);
    if (this.maxPrice() !== null) result = result.filter(p => p.price <= this.maxPrice()!);
    if (this.selectedBeds()) {
      result = result.filter(p => {
        if (this.selectedBeds() === 'Studio') return p.beds === 'Studio';
        if (this.selectedBeds() === '5+') return typeof p.beds === 'number' && p.beds >= 5;
        return p.beds === Number(this.selectedBeds());
      });
    }
    if (this.selectedBaths()) {
      result = result.filter(p => {
        if (this.selectedBaths() === '5+') return p.baths >= 5;
        return p.baths === Number(this.selectedBaths());
      });
    }
    if (this.minArea() !== null) result = result.filter(p => p.sqft >= this.minArea()!);
    if (this.maxArea() !== null) result = result.filter(p => p.sqft <= this.maxArea()!);
    if (this.selectedFurnished()) result = result.filter(p => p.furnished === this.selectedFurnished());
    const amenities = this.selectedAmenities();
    if (amenities.length) {
      result = result.filter(p => amenities.every(a => p.amenities.includes(a)));
    }
    if (this.selectedReadiness() === 'off-plan') result = result.filter(p => p.isOffPlan === true);
    if (this.selectedReadiness() === 'ready') result = result.filter(p => !p.isOffPlan);
    const specialFeatures = this.selectedSpecialFeatures();
    if (specialFeatures.length) {
      result = result.filter(p => {
        return specialFeatures.every(f => {
          if (f === 'Furnished') return p.furnished === 'Furnished';
          if (f === 'Reduced Price') return p.badge === 'Reduced';
          if (f === 'Waterfront' || f === 'Beachfront') return p.amenities.includes('Beach Access');
          if (f === '360° Tour') return false;
          return true;
        });
      });
    }
    if (this.referenceNumber()) {
      const ref = this.referenceNumber().toLowerCase();
      result = result.filter(p => `lw-${p.id}`.includes(ref) || ref.includes(`${p.id}`));
    }

    // Sort
    switch (this.sortBy()) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'price_sqft_asc': result.sort((a, b) => (a.price / a.sqft) - (b.price / b.sqft)); break;
      case 'price_sqft_desc': result.sort((a, b) => (b.price / b.sqft) - (a.price / a.sqft)); break;
      case 'most_viewed': result.sort((a, b) => b.views - a.views); break;
      case 'area_asc': result.sort((a, b) => a.sqft - b.sqft); break;
      case 'area_desc': result.sort((a, b) => b.sqft - a.sqft); break;
      default: result.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    }
    return result;
  });

  totalResults = computed(() => this.filteredProperties().length);
  totalPages = computed(() => Math.ceil(this.totalResults() / this.pageSize));

  paginatedProperties = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProperties().slice(start, start + this.pageSize);
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

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedType()) count++;
    if (this.selectedStatus()) count++;
    if (this.selectedLocation()) count++;
    if (this.minPrice() !== null || this.maxPrice() !== null) count++;
    if (this.selectedBeds()) count++;
    if (this.selectedBaths()) count++;
    if (this.minArea() !== null || this.maxArea() !== null) count++;
    if (this.selectedFurnished()) count++;
    count += this.selectedAmenities().length;
    if (this.selectedReadiness()) count++;
    if (this.selectedView()) count++;
    count += this.selectedSpecialFeatures().length;
    if (this.referenceNumber()) count++;
    return count;
  });

  // ── Card image index tracking ────────────────────────────────
  activeImageMap: Record<number, number> = {};

  private sanitizer = inject(DomSanitizer);

  safeImg(url: string): string {
    // Return URL as-is — Angular doesn't block https:// in img src
    return url || '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['type'])      this.selectedType.set(params['type']);
      if (params['status'])    this.selectedStatus.set(params['status']);
      if (params['location'])  this.selectedLocation.set(params['location']);
      if (params['q'])         this.searchQuery.set(params['q']);
      if (params['beds'])      this.selectedBeds.set(params['beds']);
      if (params['minPrice'])  this.minPrice.set(Number(params['minPrice']));
      if (params['maxPrice'])  this.maxPrice.set(Number(params['maxPrice']));
      if (params['furnished']) this.selectedFurnished.set(params['furnished']);
      if (params['plotType'] && !params['type']) this.selectedType.set(params['plotType']);
    });
    await this.loadProperties();
  }

  private async loadProperties(): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.sb
      .from('properties')
      .select('id, title, location, community, price, listing_type, type, bedrooms, bathrooms, area_sqft, furnishing, images, amenities, views, created_at, agent_name, is_featured')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Properties] DB error:', error.message, error.code);
    }

    if (!error && data && data.length > 0) {
      this.allProperties.set(data.map((p: any) => ({
        id:           p.id,
        title:        p.title        ?? '',
        location:     p.location     ?? '',
        community:    p.community    ?? '',
        price:        p.price        ?? 0,
        priceLabel:   this.formatPrice(p.price ?? 0, p.listing_type),
        pricePerSqft: p.area_sqft ? `AED ${Math.round((p.price ?? 0) / p.area_sqft).toLocaleString()}/sqft` : '',
        beds:         p.bedrooms === 0 ? 'Studio' : (p.bedrooms ?? 1),
        baths:        p.bathrooms    ?? 1,
        sqft:         p.area_sqft    ?? 0,
        sqftLabel:    p.area_sqft ? `${p.area_sqft.toLocaleString()} sqft` : '',
        type:         p.type         as any ?? 'Apartment',
        status:       p.listing_type === 'Rent' ? 'Rent' : p.listing_type === 'Off-Plan' ? 'Sale' : 'Sale',
        isOffPlan:    p.listing_type === 'Off-Plan',
        furnished:    p.furnishing   ?? 'Unfurnished',
        badge:        p.is_featured  ? 'Featured' : undefined,
        images:       p.images?.length ? p.images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'],
        amenities:    p.amenities    ?? [],
        views:        p.views        ?? 0,
        postedDate:   p.created_at?.slice(0, 10) ?? '',
        lat:          25.2,
        lng:          55.27,
        agentName:    p.agent_name   ?? 'Livwell Agent',
        agentAvatar:  '',
        agentPhone:   '',
      })));
    } else if (!error) {
      // DB returned no rows — keep mock data so page isn't blank
      this.allProperties.set(this._mockProperties);
    } else {
      // DB error — use mock data as fallback
      this.allProperties.set(this._mockProperties);
    }
    this.isLoading.set(false);
  }

  private formatPrice(price: number, listingType: string): string {
    const suffix = listingType === 'Rent' ? '/yr' : '';
    if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(2)}M${suffix}`;
    if (price >= 1_000) return `AED ${(price / 1_000).toFixed(0)}K${suffix}`;
    return `AED ${price.toLocaleString()}${suffix}`;
  }

  // ── Actions ──────────────────────────────────────────────────
  setView(mode: 'grid' | 'list' | 'map'): void {
    this.viewMode.set(mode);
    if (mode === 'map') this.currentPage.set(1);
  }

  goToPage(page: number | '...'): void {
    if (typeof page !== 'number') return;
    this.currentPage.set(page);
    if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('');
    this.selectedStatus.set('');
    this.selectedLocation.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.selectedBeds.set('');
    this.selectedBaths.set('');
    this.minArea.set(null);
    this.maxArea.set(null);
    this.selectedFurnished.set('');
    this.selectedAmenities.set([]);
    this.selectedReadiness.set('');
    this.selectedView.set('');
    this.selectedSpecialFeatures.set([]);
    this.referenceNumber.set('');
    this.currentPage.set(1);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  toggleAmenity(amenity: string): void {
    const current = this.selectedAmenities();
    if (current.includes(amenity)) {
      this.selectedAmenities.set(current.filter(a => a !== amenity));
    } else {
      this.selectedAmenities.set([...current, amenity]);
    }
    this.currentPage.set(1);
  }

  isAmenitySelected(amenity: string): boolean {
    return this.selectedAmenities().includes(amenity);
  }

  isSpecialFeatureSelected(feature: string): boolean {
    return this.selectedSpecialFeatures().includes(feature);
  }

  toggleSpecialFeature(feature: string): void {
    const current = this.selectedSpecialFeatures();
    if (current.includes(feature)) {
      this.selectedSpecialFeatures.set(current.filter(f => f !== feature));
    } else {
      this.selectedSpecialFeatures.set([...current, feature]);
    }
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  getStars(n: number): number[] { return Array(n).fill(0); }

  getCardImageIndex(id: number): number {
    return this.activeImageMap[id] ?? 0;
  }

  prevImage(id: number, images: string[], e: Event): void {
    e.preventDefault(); e.stopPropagation();
    const cur = this.getCardImageIndex(id);
    this.activeImageMap[id] = (cur - 1 + images.length) % images.length;
  }

  nextImage(id: number, images: string[], e: Event): void {
    e.preventDefault(); e.stopPropagation();
    const cur = this.getCardImageIndex(id);
    this.activeImageMap[id] = (cur + 1) % images.length;
  }

  formatBeds(beds: number | 'Studio'): string {
    if (beds === 'Studio') return 'Studio';
    if (beds === 0) return '—';
    return `${beds} Beds`;
  }

  getBadgeClass(badge?: string): string {
    const map: Record<string, string> = {
      'Featured': 'badge-featured', 'Hot': 'badge-hot', 'New': 'badge-new',
      'Exclusive': 'badge-exclusive', 'Reduced': 'badge-reduced',
    };
    return badge ? (map[badge] ?? 'badge-featured') : '';
  }

  selectMapProperty(p: PropertyListing): void {
    this.activeMapProperty.set(p);
  }
  clearMapProperty(): void {
    this.activeMapProperty.set(null);
  }
}
