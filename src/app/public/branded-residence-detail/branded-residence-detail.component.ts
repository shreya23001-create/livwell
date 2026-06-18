import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface BRProperty {
  id: number;
  title: string;
  developer: string;
  brand: string;
  location: string;
  community: string;
  type: string;
  status: string;
  price_from: number;
  price_label: string;
  price_per_sqft: string;
  beds: string;
  bathrooms: number;
  area_sqft: number;
  completion_date: string;
  payment_plan: string;
  description: string;
  amenities: string[];
  images: string[];
  floor_plan_url: string;
  badge: string;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
  agent_name: string;
  created_at: string;
  video_url: string | null;
  views?: number;
}

@Component({
  selector: 'app-branded-residence-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './branded-residence-detail.component.html',
  styleUrl: './branded-residence-detail.component.scss',
})
export class BrandedResidenceDetailComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private auth      = inject(AuthService);

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

  property         = signal<BRProperty | null>(null);
  agent            = signal<{ name: string; email: string; phone: string; avatar_url: string } | null>(null);
  loading          = signal(true);
  notFound         = signal(false);
  activeImage      = signal(0);
  openFaqIndex     = signal<number | null>(null);
  avatarError      = signal(false);
  overviewExpanded = signal(false);
  activeMapTab     = signal<'location' | 'community'>('location');
  isFaved          = signal(false);
  favLoading       = signal(false);
  shareToast       = signal(false);

  agentAvatar = computed(() => this.avatarError() ? '' : (this.agent()?.avatar_url ?? ''));
  agentPhone  = computed(() => this.agent()?.phone ?? '');
  agentEmail  = computed(() => this.agent()?.email ?? '');

  inquiryName    = '';
  inquiryPhone   = '';
  inquiryEmail   = '';
  inquiryMessage = '';
  inquirySent       = signal(false);
  inquirySubmitting = signal(false);
  inquiryError      = signal('');

  mapSrc = signal<SafeResourceUrl>('');

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      const p = data as BRProperty;
      p.images = (p.images ?? []).filter((u: string) => u && !u.includes('unsplash.com'));
      this.property.set(p);
      this.geocodeAndSetMap(p);
      this.sb.from('projects').update({ views: ((data as BRProperty).views || 0) + 1 }).eq('id', id).then(() => {});
      const agentName = (data as BRProperty).agent_name;
      if (agentName) {
        const { data: ag } = await this.sb
          .from('admin_users')
          .select('name, email, phone, avatar_url')
          .eq('name', agentName)
          .maybeSingle();
        if (ag) this.agent.set(ag as any);
      }
    } else {
      this.notFound.set(true);
    }
    this.loading.set(false);
    if (data) { this.auth.waitForSession().then(() => this.checkFavStatus(Number(id))); }
  }

  private async checkFavStatus(propId: number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb.from('saved_properties').select('id').eq('user_id', userId).eq('property_id', propId).maybeSingle();
    this.isFaved.set(!!data);
  }

  async toggleFav(): Promise<void> {
    const p = this.property();
    const userId = this.auth.currentUser()?.id;
    if (!userId || !p?.id || this.favLoading()) return;
    this.favLoading.set(true);
    if (this.isFaved()) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', p.id);
      this.isFaved.set(false);
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: p.id });
      this.isFaved.set(true);
    }
    this.favLoading.set(false);
  }

  async shareProperty(): Promise<void> {
    const p = this.property();
    if (!p) return;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text: p.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
    this.shareToast.set(true);
    setTimeout(() => this.shareToast.set(false), 2500);
  }

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  getReferenceNumber(id: number): string {
    return `LW-${String(id).padStart(6, '0')}`;
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  toggleFaq(i: number) {
    this.openFaqIndex.set(this.openFaqIndex() === i ? null : i);
  }

  async submitInquiry(p: BRProperty) {
    if (!this.inquiryName.trim() || !this.inquiryPhone.trim()) {
      this.inquiryError.set('Name and phone are required.');
      return;
    }
    this.inquirySubmitting.set(true);
    this.inquiryError.set('');
    await this.sb.from('leads').insert({
      name:    this.inquiryName,
      phone:   this.inquiryPhone,
      email:   this.inquiryEmail,
      message: this.inquiryMessage || `Enquiry about branded residence: ${p.title}`,
      source:  'Branded Residence',
      status:  'New',
    });
    this.inquirySubmitting.set(false);
    this.inquirySent.set(true);
  }

  private async geocodeAndSetMap(p: BRProperty): Promise<void> {
    const raw   = p.community?.trim() || p.location?.trim() || p.title?.trim() || 'Dubai';
    const query = raw.toLowerCase().includes('dubai') ? raw : raw + ', Dubai, UAE';
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const q   = encodeURIComponent(query);
        const url = `https://maps.google.com/maps?q=${q}&ll=${lat},${lon}&t=m&z=15&output=embed`;
        this.mapSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
        this.mapSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      this.mapSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }
}
