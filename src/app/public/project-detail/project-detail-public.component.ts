import { Component, OnInit, signal, computed, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { EmailService } from '../../shared/services/email.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';

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
}

@Component({
  selector: 'app-project-detail-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NewsletterSectionComponent],
  templateUrl: './project-detail-public.component.html',
  styleUrl: './project-detail-public.component.scss',
})
export class ProjectDetailPublicComponent implements OnInit {
  private sb         = inject(SupabaseService).client;
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private sanitizer  = inject(DomSanitizer);
  private auth       = inject(AuthService);
  private emailSvc   = inject(EmailService);
  private platformId = inject(PLATFORM_ID);

  isLoggedIn = this.auth.isLoggedIn;

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

  project    = signal<Project | null>(null);
  agent      = signal<{ name: string; email: string; phone: string } | null>(null);
  loading    = signal(true);
  notFound   = signal(false);
  activeImg  = signal(0);
  mapUrl     = signal<SafeResourceUrl>('');

  avatarError  = signal(false);
  agentAvatar  = computed(() => '');
  agentPhone   = computed(() => this.agent()?.phone ?? '');
  agentEmail   = computed(() => this.agent()?.email ?? '');

  isFaved     = signal(false);
  favLoading  = signal(false);
  shareToast  = signal(false);

  lightboxOpen  = signal(false);
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
    if (e.key === 'ArrowLeft')  this.lightboxPrev();
    if (e.key === 'Escape')     this.closeLightbox();
  }

  inquiryName    = '';
  inquiryPhone   = '';
  inquiryEmail   = '';
  inquiryBudget  = '';
  inquiryMessage = '';
  inquirySent        = signal(false);
  inquirySubmitting  = signal(false);
  inquiryError       = signal('');

  getReferenceNumber(id: number): string {
    return `LW-${String(id).padStart(6, '0')}`;
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('status', 'Published')
      .single();

    if (data) {
      const p = data as Project;
      p.images = (p.images ?? []).filter(u => u && !u.includes('unsplash.com'));
      this.project.set(p);
      this.geocodeAndSetMap(data as Project);
      const userId = this.auth.currentUser()?.id;
      if (userId) {
        const { data: saved } = await this.sb.from('saved_projects').select('id').eq('user_id', userId).eq('project_id', p.id).maybeSingle();
        this.isFaved.set(!!saved);
      }
      if ((data as Project).agent_name) {
        const { data: agentData } = await this.sb
          .from('admin_users')
          .select('name, email, phone')
          .eq('name', (data as Project).agent_name)
          .maybeSingle();
        if (agentData) this.agent.set(agentData as any);
      }
    } else {
      this.notFound.set(true);
    }
    this.loading.set(false);
    this.auth.waitForSession().then(() => this.prefillInquiryForm());
  }

  private prefillInquiryForm(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (!this.inquiryName)  this.inquiryName  = user.name  ?? '';
    if (!this.inquiryPhone) this.inquiryPhone = user.phone ?? '';
    if (!this.inquiryEmail) this.inquiryEmail = user.email ?? '';
  }

  redirectToLogin(): void {
    this.router.navigate(['/customer'], { queryParams: { returnUrl: this.router.url } });
  }

  private async geocodeAndSetMap(p: Project): Promise<void> {
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
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    const projId = this.project()?.id;
    if (!projId || this.favLoading()) return;
    this.favLoading.set(true);
    if (this.isFaved()) {
      await this.sb.from('saved_projects').delete().eq('user_id', userId).eq('project_id', projId);
      this.isFaved.set(false);
    } else {
      await this.sb.from('saved_projects').insert({ user_id: userId, project_id: projId });
      this.isFaved.set(true);
    }
    this.favLoading.set(false);
  }

  async shareProject(): Promise<void> {
    const p = this.project();
    if (!p) return;
    const url  = isPlatformBrowser(this.platformId) ? window.location.href : '';
    const text = `Check out ${p.title} by ${p.developer} on LivWell Dubai`;
    if (isPlatformBrowser(this.platformId) && navigator.share) {
      try { await navigator.share({ title: p.title, text, url }); return; } catch {}
    }
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard?.writeText(url).catch(() => {});
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
      name:           this.inquiryName.trim(),
      phone:          this.inquiryPhone.trim(),
      email:          this.inquiryEmail.trim(),
      notes:          this.inquiryMessage.trim() || `Enquiry about project: ${p.title}`,
      budget:         this.inquiryBudget.trim() || null,
      project_id:     p.id,
      project_title:  p.title,
      property_type:  p.type,
      customer_id:    userId,
      location:       p.community || p.location,
      assigned_agent: hasAgent ? p.agent_name : null,
      agent_email:    agentEmail,
      source:         'website',
      status:         'new',
    });
    this.inquirySubmitting.set(false);

    // Confirmation email to enquirer
    if (!insertError && this.inquiryEmail.trim()) {
      this.emailSvc.send('enquiry_project', {
        to_email:      this.inquiryEmail.trim(),
        name:          this.inquiryName.trim(),
        project_title: p.title,
        agent_name:    hasAgent ? p.agent_name : 'Livwell Team',
        agent_phone:   this.agentPhone() || '+971 4 000 0000',
      });
    }

    // Email agent or admin
    if (agentEmail) {
      if (hasAgent) {
        this.emailSvc.send('agent_new_lead', {
          to_email:       agentEmail,
          agent_name:     p.agent_name,
          customer_name:  this.inquiryName.trim(),
          customer_phone: this.inquiryPhone.trim(),
          customer_email: this.inquiryEmail.trim(),
          property_title: p.title,
          message:        this.inquiryMessage.trim() || '',
        });
      } else {
        this.emailSvc.send('admin_unassigned_lead', {
          to_email:       agentEmail,
          customer_name:  this.inquiryName.trim(),
          customer_phone: this.inquiryPhone.trim(),
          customer_email: this.inquiryEmail.trim(),
          property_title: p.title,
          message:        this.inquiryMessage.trim() || '',
        });
      }
    }

    this.inquirySent.set(true);
  }
}
