import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';

interface Property {
  id: number;
  title: string;
  type: string;
  listing_type: string;
  status: string;
  price: number;
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  community: string;
  address: string;
  description: string;
  furnishing: string;
  images: string[];
  is_featured: boolean;
  agent_name: string;
  created_at: string;
  views: number;
  amenities: string[];
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FooterComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private sb         = inject(SupabaseService).client;
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  property          = signal<Property | null>(null);
  similarProperties = signal<Property[]>([]);
  loading           = signal(true);
  notFound          = signal(false);
  activeImageIndex  = signal(0);
  descExpanded      = signal(false);
  isFaved           = signal(false);
  favLoading        = signal(false);

  // Mortgage calculator
  mortgageDown   = signal(20);
  mortgagePeriod = signal(25);
  mortgageRate   = signal(4.5);

  monthlyPayment = computed(() => {
    const p = this.property();
    if (!p) return 0;
    const price = this.mortgagePrice() || p.price;
    const loan = price * (1 - this.mortgageDown() / 100);
    const r = this.mortgageRate() / 100 / 12;
    const n = this.mortgagePeriod() * 12;
    if (r === 0) return loan / n;
    return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  purchaseCosts = computed(() => {
    const p = this.property();
    if (!p) return [];
    return [
      { label: 'Purchase Price',                    amount: p.price },
      { label: 'Dubai Land Department Fee (4%)',    amount: Math.round(p.price * 0.04) },
      { label: 'Agency Fee (2% + 5% VAT)',          amount: Math.round(p.price * 0.021) },
      { label: 'Registration & Conveyancer',        amount: 10000 },
      { label: 'Mortgage Registration (0.25%)',     amount: Math.round(p.price * 0.0025) },
    ];
  });

  totalPurchaseCost = computed(() =>
    this.purchaseCosts().reduce((s, c) => s + c.amount, 0)
  );

  // Newsletter
  newsletterEmail     = signal('');
  newsletterSubmitted = signal(false);
  subscribeNewsletter(): void { if (this.newsletterEmail()) this.newsletterSubmitted.set(true); }

  // Inquiry form — pre-fill from logged-in user if available
  inquiryForm_name    = '';
  inquiryForm_phone   = '';
  inquiryForm_email   = '';
  inquiryForm_message = '';
  inquirySent         = signal(false);
  inquirySubmitting   = signal(false);
  inquiryError        = signal('');

  private prefillInquiryForm(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (!this.inquiryForm_name)  this.inquiryForm_name  = user.name  ?? '';
    if (!this.inquiryForm_phone) this.inquiryForm_phone = user.phone ?? '';
    if (!this.inquiryForm_email) this.inquiryForm_email = user.email ?? '';
  }

  async submitInquiry(p: Property): Promise<void> {
    if (!this.inquiryForm_name.trim() || !this.inquiryForm_phone.trim() || !this.inquiryForm_email.trim()) {
      this.inquiryError.set('Please fill in Name, Phone and Email.');
      return;
    }
    this.inquirySubmitting.set(true);
    this.inquiryError.set('');
    const userId = this.auth.currentUser()?.id ?? null;
    const { error } = await this.sb.from('admin_leads').insert({
      name:           this.inquiryForm_name.trim(),
      phone:          this.inquiryForm_phone.trim(),
      email:          this.inquiryForm_email.trim(),
      notes:          this.inquiryForm_message.trim() || `Enquiry about: ${p.title}`,
      property_type:  p.type,
      property_id:    p.id,
      property_title: p.title,
      customer_id:    userId,
      location:       p.community || p.location,
      assigned_agent: p.agent_name !== 'Unassigned' ? p.agent_name : null,
      status:         'new',
      source:         'website',
    });
    this.inquirySubmitting.set(false);
    if (error) { this.inquiryError.set('Failed to send. Please try again.'); return; }
    this.inquirySent.set(true);
    this.inquiryForm_name = ''; this.inquiryForm_phone = '';
    this.inquiryForm_email = ''; this.inquiryForm_message = '';
  }

  // Mortgage price input
  mortgagePrice = signal(0);

  // Demand chart (decorative static data)
  readonly demandQuarters = ['Q2\'23','Q3\'23','Q4\'23','Q1\'24','Q2\'24','Q3\'24','Q4\'24','Q1\'25','Q2\'25','Q3\'25','Q4\'25','Q1\'26'];
  readonly demandValues   = [42,55,38,61,74,68,82,79,91,85,98,107];
  getDemandBarHeight(val: number): number { return Math.round((val / Math.max(...this.demandValues)) * 100); }

  // Price trend (static chart data — decorative)
  readonly priceTrendPoints = [1180, 1195, 1210, 1198, 1220, 1245, 1238, 1260, 1255, 1278, 1290, 1305];
  readonly priceTrendMonths = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  get priceTrendMax(): number { return Math.max(...this.priceTrendPoints); }
  get priceTrendMin(): number { return Math.min(...this.priceTrendPoints); }

  getPriceTrendPath(): string {
    const w = 600, h = 120, pad = 10;
    const min = this.priceTrendMin - 30, max = this.priceTrendMax + 30;
    return this.priceTrendPoints.map((v, i) => {
      const x = pad + (i / (this.priceTrendPoints.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      const id = Number(params['id']);
      this.loading.set(true);
      this.notFound.set(false);
      this.isFaved.set(false);
      this.activeImageIndex.set(0);

      const { data, error } = await this.sb
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      const prop = this.mapProperty(data);
      this.property.set(prop);
      this.mortgagePrice.set(prop.price);

      // Increment view count
      this.sb.from('properties').update({ views: (data.views || 0) + 1 }).eq('id', id).then(() => {});

      // Load similar properties (no status filter — properties may not be Published)
      const { data: similar } = await this.sb
        .from('properties')
        .select('*')
        .eq('type', data.type)
        .neq('id', id)
        .limit(3);
      if (similar) this.similarProperties.set(similar.map(this.mapProperty));

      this.loading.set(false);

      if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0 });

      // Check fav status + pre-fill inquiry form after session loads
      this.auth.waitForSession().then(async () => {
        const userId = this.auth.currentUser()?.id;
        this.prefillInquiryForm();
        if (!userId) return;
        const { data: saved } = await this.sb
          .from('saved_properties')
          .select('id')
          .eq('user_id', userId)
          .eq('property_id', id)
          .maybeSingle();
        this.isFaved.set(!!saved);
      });
    });
  }

  async toggleFav(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const propId = this.property()?.id;
    if (!userId || !propId || this.favLoading()) return;

    this.favLoading.set(true);
    if (this.isFaved()) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', propId);
      this.isFaved.set(false);
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: propId });
      this.isFaved.set(true);
    }
    this.favLoading.set(false);
  }

  private mapProperty = (p: any): Property => ({
    id:           p.id,
    title:        p.title        || '',
    type:         p.type         || '',
    listing_type: p.listing_type || '',
    status:       p.status       || '',
    price:        p.price        || 0,
    area_sqft:    p.area_sqft    || 0,
    bedrooms:     p.bedrooms     || 0,
    bathrooms:    p.bathrooms    || 0,
    location:     p.location     || '',
    community:    p.community    || '',
    address:      p.address      || '',
    description:  p.description  || '',
    furnishing:   p.furnishing   || '',
    images:       p.images       || [],
    is_featured:  p.is_featured  || false,
    agent_name:   p.agent_name   || 'Unassigned',
    created_at:   p.created_at   || '',
    views:        p.views        || 0,
    amenities:    p.amenities    || [],
  });

  setImage(i: number): void { this.activeImageIndex.set(i); }

  prevImage(): void {
    const p = this.property();
    if (!p?.images.length) return;
    this.activeImageIndex.set((this.activeImageIndex() - 1 + p.images.length) % p.images.length);
  }

  nextImage(): void {
    const p = this.property();
    if (!p?.images.length) return;
    this.activeImageIndex.set((this.activeImageIndex() + 1) % p.images.length);
  }

  formatPrice(n: number): string {
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  formatBeds(n: number): string {
    if (n === 0) return 'Studio';
    return `${n} Bed${n > 1 ? 's' : ''}`;
  }

  getReferenceNumber(id: number): string {
    return `LW-${String(id).padStart(6, '0')}`;
  }

  getDescription(p: Property): string {
    if (p.description) return p.description;
    return `This exceptional ${p.type.toLowerCase()} in ${p.community} offers an unparalleled living experience. ` +
      `Spanning ${p.area_sqft.toLocaleString()} sqft with ${this.formatBeds(p.bedrooms)} and ${p.bathrooms} bathrooms.`;
  }

  getFallbackImage(): string {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80';
  }
}
