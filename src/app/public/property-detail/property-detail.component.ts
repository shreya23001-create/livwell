import { Component, OnInit, signal, computed, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { EmailService } from '../../shared/services/email.service';

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
  share_count: number;
  amenities: string[];
  video_url: string | null;
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
  private router     = inject(Router);
  private sb         = inject(SupabaseService).client;
  private auth       = inject(AuthService);
  private emailSvc   = inject(EmailService);
  private sanitizer  = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  property          = signal<Property | null>(null);
  similarProperties = signal<Property[]>([]);
  agentAvatar       = signal('');
  agentPhone        = signal('');

  lightboxOpen  = signal(false);
  lightboxIndex = signal(0);

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (e.key === 'ArrowRight') this.lightboxNext();
    if (e.key === 'ArrowLeft')  this.lightboxPrev();
    if (e.key === 'Escape')     this.closeLightbox();
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  lightboxPrev(): void {
    const imgs = this.property()?.images ?? [];
    this.lightboxIndex.set((this.lightboxIndex() - 1 + imgs.length) % imgs.length);
  }

  lightboxNext(): void {
    const imgs = this.property()?.images ?? [];
    this.lightboxIndex.set((this.lightboxIndex() + 1) % imgs.length);
  }

  isLoggedIn = this.auth.isLoggedIn;

  videoEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.property()?.video_url;
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${ytMatch[1]}`);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
    if (/\.(mp4|mov|avi|webm)(\?|$)/i.test(url)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  videoDirectUrl = computed<string | null>(() => {
    const url = this.property()?.video_url;
    if (!url) return null;
    return /\.(mp4|mov|avi|webm)(\?|$)/i.test(url) ? url : null;
  });

  mapUrl = signal<SafeResourceUrl>(this.sanitizer.bypassSecurityTrustResourceUrl(''));
  loading           = signal(true);
  notFound          = signal(false);
  activeImageIndex  = signal(0);
  descExpanded      = signal(false);
  isFaved           = signal(false);
  favLoading        = signal(false);
  shareToast        = signal(false);

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
  inquiryForm_budget  = '';
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
    const _ph = this.inquiryForm_phone.trim();
    if (!/^\+?[\d\s\-()]+$/.test(_ph) || _ph.replace(/\D/g, '').length < 7 || _ph.replace(/\D/g, '').length > 15) {
      this.inquiryError.set('Enter a valid phone number (7–15 digits).');
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
      budget:         this.inquiryForm_budget.trim() || null,
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
    // Send confirmation email to the lead
    this.emailSvc.send('enquiry_property', {
      to_email:       this.inquiryForm_email.trim(),
      name:           this.inquiryForm_name.trim(),
      property_title: p.title,
      agent_name:     p.agent_name || 'Livwell Team',
      agent_phone:    this.agentPhone() || '+971 4 000 0000',
    });
    this.inquiryForm_name = ''; this.inquiryForm_phone = '';
    this.inquiryForm_email = ''; this.inquiryForm_budget = ''; this.inquiryForm_message = '';
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
      this.geocodeAndSetMap(prop);

      // Load agent avatar + phone
      this.agentAvatar.set('');
      this.agentPhone.set('');
      if (prop.agent_name && prop.agent_name !== 'LivWell Agent') {
        const { data: profile } = await this.sb
          .from('profiles')
          .select('avatar_url, phone, designation')
          .eq('name', prop.agent_name)
          .eq('role', 'agent')
          .maybeSingle();
        if (profile) {
          const av = profile.avatar_url ?? '';
          if (av && !av.startsWith('data:') && /\/avatars\/[^/]+/.test(av)) {
            this.agentAvatar.set(av);
          }
          this.agentPhone.set(profile.phone ?? '');
        }
      }

      // Increment view count
      this.sb.from('properties').update({ views: (data.views || 0) + 1 }).eq('id', id).then(() => {});

      const { data: similar } = await this.sb
        .from('properties')
        .select('*')
        .eq('type', data.type)
        .eq('status', 'Published')
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

  private async geocodeAndSetMap(prop: Property): Promise<void> {
    const raw   = prop.address?.trim() || prop.community?.trim() || prop.location?.trim() || 'Dubai';
    const query = raw.toLowerCase().includes('dubai') ? raw : raw + ', Dubai, UAE';
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        // Use ll= with the address label — avoids "Place info couldn't load" popup
        const q   = encodeURIComponent(query);
        const url = `https://maps.google.com/maps?q=${q}&ll=${lat},${lon}&t=m&z=16&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=16&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=16&output=embed`;
      this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  async toggleFav(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    const propId = this.property()?.id;
    if (!propId || this.favLoading()) return;

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

  async shareProperty(): Promise<void> {
    const p = this.property();
    if (!p) return;
    const url  = window.location.href;
    const text = `${p.title} — ${this.formatPrice(p.price)}`;
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
    this.shareToast.set(true);
    setTimeout(() => this.shareToast.set(false), 2500);
    await this.incrementShareCount(p.id);
  }

  private async incrementShareCount(propId: number): Promise<void> {
    const { data, error } = await this.sb
      .from('properties')
      .select('share_count')
      .eq('id', propId)
      .single();
    if (error) return;
    const next = ((data as any)?.share_count ?? 0) + 1;
    await this.sb.from('properties').update({ share_count: next }).eq('id', propId);
    this.property.update(x => x ? { ...x, share_count: next } : x);
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
    images:       Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? JSON.parse(p.images) : []),
    is_featured:  p.is_featured  || false,
    agent_name:   ((p.agent_name ?? '').trim().replace(/^[-–—]+$/, '')) || 'LivWell Agent',
    created_at:   p.created_at   || '',
    views:        p.views        || 0,
    share_count:  p.share_count  || 0,
    amenities:    p.amenities    || [],
    video_url:    p.video_url    || null,
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

}
