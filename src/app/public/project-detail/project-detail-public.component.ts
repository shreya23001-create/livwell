import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, signal, computed, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl, Title } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { EmailService } from '../../shared/services/email.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { AMENITY_ICONS } from '../../shared/constants/amenity-icons';
import { projectIdFromSlug, toProjectSlug } from '../../shared/utils/slug';

interface Project {
  id: number;
  title: string;
  developer: string;
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
  launch_date: string;
  payment_plan: string;
  description: string;
  amenities: string[];
  images: string[];
  floor_plan_url: string;
  badge: string;
  is_featured: boolean;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
  agent_name: string;
  created_at: string;
  video_url: string | null;
  total_units: number | null;
  faqs: { question: string; answer: string }[];
}

@Component({
  selector: 'app-project-detail-public',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule, RouterLink, NewsletterSectionComponent],
  templateUrl: './project-detail-public.component.html',
  styleUrl: './project-detail-public.component.scss',
})
export class ProjectDetailPublicComponent implements OnInit {
  private sb = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private titleSvc = inject(Title);
  private auth = inject(AuthService);
  private emailSvc = inject(EmailService);
  private platformId = inject(PLATFORM_ID);

  isLoggedIn = this.auth.isLoggedIn;

  masterAmenities = signal<{ name: string; icon: string }[]>([]);

  getAmenityIconSvg(name: string): SafeHtml {
    // 1. Try exact match from master_data (name → icon key → svg)
    const masterEntry = this.masterAmenities().find(a => a.name.toLowerCase() === name.toLowerCase());
    const byKey = masterEntry ? AMENITY_ICONS.find(i => i.key === masterEntry.icon) : null;
    if (byKey) return this.sanitizer.bypassSecurityTrustHtml(byKey.svg);

    // 2. Fallback: match amenity name against AMENITY_ICONS label directly
    const byLabel = AMENITY_ICONS.find(i => i.label.toLowerCase() === name.toLowerCase())
      ?? AMENITY_ICONS.find(i => name.toLowerCase().includes(i.key));
    const svg = byLabel?.svg ?? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  videoEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.project()?.video_url;
    if (!url) return null;
    // Match watch?v=, youtu.be/, /shorts/, /live/
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
    }
    // Direct video file — not embeddable in iframe, return null
    if (/\.(mp4|mov|avi|webm)(\?|$)/i.test(url)) return null;
    // Fallback: try embedding as-is
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  videoDirectUrl = computed<string | null>(() => {
    const url = this.project()?.video_url;
    if (!url) return null;
    // Only return direct URL for non-embeddable files
    if (/\.(mp4|mov|avi|webm)(\?|$)/i.test(url)) return url;
    return null;
  });

  project = signal<Project | null>(null);
  agent = signal<{ name: string; email: string; phone: string; avatar_url?: string; designation?: string; whatsapp_number?: string } | null>(null);
  loading = signal(true);

  projectProperties = signal<{
    id: number; title: string; price: number; price_label: string;
    type: string; bedrooms: number; bathrooms: number; area_sqft: string; images: string[];
    listing_type: string; community: string; location: string; badge: string; views: number;
    agent_name: string; agent_phone: string;
  }[]>([]);
  propCarouselIndex = signal(0);

  propCarouselVisible = computed(() => {
    return this.projectProperties().slice(this.propCarouselIndex(), this.propCarouselIndex() + 3);
  });

  propCarouselPrev(): void {
    this.propCarouselIndex.set(Math.max(0, this.propCarouselIndex() - 1));
  }

  propCarouselNext(): void {
    const max = Math.max(0, this.projectProperties().length - 3);
    this.propCarouselIndex.set(Math.min(max, this.propCarouselIndex() + 1));
  }

  formatBeds(beds: number): string {
    return beds === 0 ? 'Studio' : `${beds} Beds`;
  }

  propSlug(p: { title: string; id: number }): string {
    return p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + p.id;
  }
  notFound = signal(false);
  activeImg = signal(0);
  mapUrl = signal<SafeResourceUrl>('');

  avatarError = signal(false);
  agentAvatar = computed(() => '');
  agentPhone = computed(() => this.agent()?.phone ?? '');
  agentEmail = computed(() => this.agent()?.email ?? '');
  agentWhatsapp = computed(() => this.agent()?.whatsapp_number ?? '');
  waUnavailable = signal(false);

  showWaUnavailable(): void {
    this.waUnavailable.set(true);
    setTimeout(() => this.waUnavailable.set(false), 3000);
  }

  isFaved = signal(false);
  favLoading = signal(false);
  shareToast = signal(false);

  reviewModalOpen  = signal(false);
  reviewRating     = signal(0);
  reviewHover      = signal(0);
  reviewComment    = '';
  reviewSubmitting = signal(false);
  reviewSubmitted  = signal(false);

  async openReviewModal(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    this.reviewRating.set(0);
    this.reviewHover.set(0);
    this.reviewComment = '';
    this.reviewSubmitted.set(false);
    this.reviewModalOpen.set(true);
  }

  closeReviewModal(): void { this.reviewModalOpen.set(false); }

  async submitReview(): Promise<void> {
    if (this.reviewRating() === 0 || this.reviewSubmitting()) return;
    const userId = this.auth.currentUser()?.id;
    const projId = this.project()?.id;
    if (!userId || !projId) return;
    this.reviewSubmitting.set(true);
    const user = this.auth.currentUser();
    await this.sb.from('reviews').insert({
      user_id:        userId,
      project_id:     projId,
      rating:         this.reviewRating(),
      comment:        this.reviewComment.trim() || null,
      reviewer_name:  user?.name  ?? '',
      reviewer_email: user?.email ?? '',
    });
    this.reviewSubmitting.set(false);
    this.reviewSubmitted.set(true);
    setTimeout(() => this.reviewModalOpen.set(false), 2000);
  }

  savedPropIds     = signal<Set<number>>(new Set());
  propShareToastId = signal<number | null>(null);

  isPropSaved(id: number): boolean { return this.savedPropIds().has(id); }

  async togglePropSave(id: number, event: Event): Promise<void> {
    event.preventDefault(); event.stopPropagation();
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    if (this.isPropSaved(id)) {
      await this.sb.from('saved_properties').delete().eq('user_id', userId).eq('property_id', id);
      this.savedPropIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await this.sb.from('saved_properties').insert({ user_id: userId, property_id: id });
      this.savedPropIds.update(s => new Set(s).add(id));
    }
  }

  sharePropCard(id: number, title: string, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    const slug = this.propSlug({ title, id });
    const url  = `${window.location.origin}/properties/${slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
    this.propShareToastId.set(id);
    setTimeout(() => this.propShareToastId.set(null), 2000);
  }

  private async loadSavedPropIds(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb.from('saved_properties').select('property_id').eq('user_id', userId);
    if (data) this.savedPropIds.set(new Set(data.map((r: any) => r.property_id)));
  }

  faqOpen = signal<string | null>(null);
  toggleFaq(idx: number): void {
    const key = String(idx);
    this.faqOpen.set(this.faqOpen() === key ? null : key);
  }

  dbFaqOpen = signal<number | null>(null);
  descExpanded = signal(false);
  toggleDbFaq(i: number): void { this.dbFaqOpen.set(this.dbFaqOpen() === i ? null : i); }
  safeHtml(html: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html ?? ''); }

  fpOpenIndex = signal<number | null>(null);
  toggleFpRow(i: number): void {
    this.fpOpenIndex.set(this.fpOpenIndex() === i ? null : i);
  }

  floorPlanRows = computed(() => {
    const p = this.project();
    if (!p?.floor_plan_url) return [];
    const beds = p.beds?.trim();
    if (!beds) return [{ label: p.type || 'Unit', sqft: p.area_sqft ? `${p.area_sqft.toLocaleString()} Sqft` : '—' }];
    // Parse comma/slash-separated bed configs e.g. "1, 2, 3" or "3 & 4"
    const parts = beds.split(/[,\/&]/).map(b => b.trim()).filter(Boolean);
    return parts.map(b => ({
      label: isNaN(Number(b)) ? b : `${b} Bed${Number(b) !== 1 ? 's' : ''}`,
      sqft: p.area_sqft ? `${p.area_sqft.toLocaleString()} Sqft` : '—',
    }));
  });

  scrollToEnquiry(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.querySelector('.pd-inquiry-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

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
    const imgs = this.project()?.images ?? [];
    this.lightboxIndex.set((this.lightboxIndex() - 1 + imgs.length) % imgs.length);
  }
  lightboxNext(): void {
    const imgs = this.project()?.images ?? [];
    this.lightboxIndex.set((this.lightboxIndex() + 1) % imgs.length);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (e.key === 'ArrowRight') this.lightboxNext();
    if (e.key === 'ArrowLeft') this.lightboxPrev();
    if (e.key === 'Escape') this.closeLightbox();
  }

  inquiryName = '';
  inquiryPhone = '';
  inquiryEmail = '';
  inquiryBudget = '';
  inquiryMessage = '';
  inquirySent = signal(false);
  inquirySubmitting = signal(false);
  inquiryError = signal('');

  getReferenceNumber(id: number): string {
    return `LW-${String(id).padStart(6, '0')}`;
  }

  async ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw) { this.notFound.set(true); this.loading.set(false); return; }

    // Support both legacy numeric IDs and new slug format (title-slug-id)
    const numericId = /^\d+$/.test(raw) ? Number(raw) : projectIdFromSlug(raw);
    if (!numericId) { this.notFound.set(true); this.loading.set(false); return; }

    this.loadMasterAmenities();
    await this.auth.waitForSession();

    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('id', numericId)
      .eq('status', 'Published')
      .single();

    if (data) {
      const p = data as Project;

      // Redirect legacy numeric URL to SEO-friendly slug URL
      if (/^\d+$/.test(raw)) {
        this.router.navigate(['/projects', toProjectSlug(p.title, p.id)], { replaceUrl: true });
      }

      p.images = (p.images ?? []).filter(u => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
      // Put real uploaded images first, placeholder fallback last
      const real = p.images.filter(u => !u.includes('/images/'));
      const local = p.images.filter(u => u.includes('/images/'));
      p.images = [...real, ...local];
      p.faqs = Array.isArray((data as any).faqs) ? (data as any).faqs : [];
      this.project.set(p);
      this.titleSvc.setTitle(`${p.title} | Livwell`);
      this.geocodeAndSetMap(data as Project);
      this.loadProjectProperties(p.title);
      const userId = this.auth.currentUser()?.id;
      if (userId) {
        const { data: saved } = await this.sb.from('saved_projects').select('id').eq('user_id', userId).eq('project_id', p.id).maybeSingle();
        this.isFaved.set(!!saved);
      }
      if ((data as Project).agent_name) {
        const { data: agentData } = await this.sb
          .from('profiles')
          .select('name, email, phone, avatar_url, designation, whatsapp_number')
          .eq('name', (data as Project).agent_name)
          .maybeSingle();
        if (agentData) this.agent.set(agentData as any);
      }
    } else {
      this.notFound.set(true);
    }
    this.loading.set(false);
    this.prefillInquiryForm();
  }

  private async loadProjectProperties(projectTitle: string): Promise<void> {
    const fields = 'id, title, price, price_label, type, bedrooms, bathrooms, area_sqft, images, listing_type, community, location, badge, views, agent_name';

    // Try matching by project_name (case-insensitive, wildcard)
    const { data: d1 } = await this.sb
      .from('properties')
      .select(fields)
      .ilike('project_name', `%${projectTitle}%`)
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(12);
    let data = d1;

    // Fallback: match by community
    if (!data || data.length === 0) {
      const res2 = await this.sb
        .from('properties')
        .select(fields)
        .ilike('community', `%${projectTitle}%`)
        .eq('status', 'Published')
        .order('created_at', { ascending: false })
        .limit(12);
      data = res2.data;
    }


    if (data && data.length > 0) {
      // Fetch agent phones in one query
      const agentNames = [...new Set(data.map((p: any) => p.agent_name).filter(Boolean))];
      let agentPhoneMap: Record<string, string> = {};
      if (agentNames.length > 0) {
        const { data: agents } = await this.sb
          .from('profiles')
          .select('name, phone')
          .in('name', agentNames);
        if (agents) agents.forEach((a: any) => { agentPhoneMap[a.name] = a.phone ?? ''; });
      }

      this.projectProperties.set(data.map((p: any) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images.filter((u: string) => u && !u.includes('unsplash.com')) : [],
        area_sqft: p.area_sqft ? p.area_sqft.toLocaleString() : '',
        agent_phone: agentPhoneMap[p.agent_name] ?? '',
      })));
      this.loadSavedPropIds();
    }
  }

  private prefillInquiryForm(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (!this.inquiryName) this.inquiryName = user.name ?? '';
    if (!this.inquiryPhone) this.inquiryPhone = user.phone ?? '';
    if (!this.inquiryEmail) this.inquiryEmail = user.email ?? '';
  }

  redirectToLogin(): void {
    this.router.navigate(['/customer'], { queryParams: { returnUrl: this.router.url } });
  }

  private async geocodeAndSetMap(p: Project): Promise<void> {
    const raw = p.community?.trim() || p.location?.trim() || p.title?.trim() || 'Dubai';
    const query = raw.toLowerCase().includes('dubai') ? raw : raw + ', Dubai, UAE';
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const q = encodeURIComponent(query);
        const url = `https://maps.google.com/maps?q=${q}&ll=${lat},${lon}&t=m&z=15&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=15&output=embed`;
      this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  async toggleFav(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    const projId = this.project()?.id;
    if (!projId || this.favLoading()) return;
    this.favLoading.set(true);
    if (this.isFaved()) {
      const { error } = await this.sb.from('saved_projects').delete().eq('user_id', userId).eq('project_id', projId);
      if (!error) this.isFaved.set(false);
      else console.error('[toggleFav delete]', error);
    } else {
      const { error } = await this.sb.from('saved_projects').insert({ user_id: userId, project_id: projId });
      if (!error) this.isFaved.set(true);
      else console.error('[toggleFav insert]', error);
    }
    this.favLoading.set(false);
  }

  async shareProject(): Promise<void> {
    const p = this.project();
    if (!p) return;

    const url = isPlatformBrowser(this.platformId) ? window.location.href : '';

    const text = `Hi, Please check this listing I found on LivWell Real Estate.

🏡 ${p.title}
👤 Developer: ${p.developer}

${url}`;

    if (isPlatformBrowser(this.platformId) && navigator.share) {
      try {
        await navigator.share({
          title: p.title,
          text,
          url
        });
        return;
      } catch { }
    }

    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard?.writeText(url).catch(() => { });
    }

    this.shareToast.set(true);
    setTimeout(() => this.shareToast.set(false), 2500);
  }

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  formatPriceShort(n: number): string {
    if (!n) return 'Call for Price';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  async submitInquiry(p: Project) {
    if (!this.inquiryName.trim() || !this.inquiryPhone.trim()) {
      this.inquiryError.set('Name and phone are required.');
      return;
    }
    const _ph = this.inquiryPhone.trim();
    if (!/^\+?[\d\s\-()]+$/.test(_ph) || _ph.replace(/\D/g, '').length < 7 || _ph.replace(/\D/g, '').length > 15) {
      this.inquiryError.set('Enter a valid phone number (7–15 digits).');
      return;
    }
    this.inquirySubmitting.set(true);
    this.inquiryError.set('');
    const userId = this.auth.currentUser()?.id ?? null;

    // Resolve agent email, fallback to admin
    const hasAgent = !!(p.agent_name);
    let agentEmail: string | null = null;
    if (hasAgent) {
      const { data: agentData } = await this.sb.from('profiles').select('email').eq('name', p.agent_name).eq('role', 'agent').maybeSingle();
      agentEmail = agentData?.email ?? null;
    }
    if (!agentEmail) {
      const { data: adminProf } = await this.sb.from('profiles').select('email').eq('role', 'admin').limit(1).maybeSingle();
      agentEmail = adminProf?.email ?? null;
    }

    const { error: insertError } = await this.sb.from('admin_leads').insert({
      name: this.inquiryName.trim(),
      phone: this.inquiryPhone.trim(),
      email: this.inquiryEmail.trim(),
      notes: this.inquiryMessage.trim() || `Enquiry about project: ${p.title}`,
      budget: this.inquiryBudget.trim() || null,
      project_id: p.id,
      project_title: p.title,
      property_type: p.type,
      customer_id: userId,
      location: p.community || p.location,
      assigned_agent: hasAgent ? p.agent_name : null,
      agent_email: agentEmail,
      source: 'website',
      status: 'new',
    });
    this.inquirySubmitting.set(false);

    // Confirmation email to enquirer
    if (!insertError && this.inquiryEmail.trim()) {
      this.emailSvc.send('enquiry_project', {
        to_email: this.inquiryEmail.trim(),
        name: this.inquiryName.trim(),
        project_title: p.title,
        agent_name: hasAgent ? p.agent_name : 'Livwell Team',
        agent_phone: this.agentPhone() || '+971 4 000 0000',
      });
    }

    // Email agent or admin
    if (agentEmail) {
      if (hasAgent) {
        this.emailSvc.send('agent_new_lead', {
          to_email: agentEmail,
          agent_name: p.agent_name,
          customer_name: this.inquiryName.trim(),
          customer_phone: this.inquiryPhone.trim(),
          customer_email: this.inquiryEmail.trim(),
          property_title: p.title,
          message: this.inquiryMessage.trim() || '',
        });
      } else {
        this.emailSvc.send('admin_unassigned_lead', {
          to_email: agentEmail,
          customer_name: this.inquiryName.trim(),
          customer_phone: this.inquiryPhone.trim(),
          customer_email: this.inquiryEmail.trim(),
          property_title: p.title,
          message: this.inquiryMessage.trim() || '',
        });
      }
    }

    this.inquirySent.set(true);
  }

  private async loadMasterAmenities(): Promise<void> {
    try {
      const { data } = await this.sb.from('master_data').select('name, color').eq('type', 'amenity');
      if (data) this.masterAmenities.set(data.map((r: any) => ({ name: r.name, icon: r.color || 'star' })));
    } catch { /* table may not have amenities yet */ }
  }
}
