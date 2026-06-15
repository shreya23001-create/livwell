import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
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
}

@Component({
  selector: 'app-project-detail-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NewsletterSectionComponent],
  templateUrl: './project-detail-public.component.html',
  styleUrl: './project-detail-public.component.scss',
})
export class ProjectDetailPublicComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  project    = signal<Project | null>(null);
  agent      = signal<{ name: string; email: string; phone: string; avatar_url: string } | null>(null);
  loading    = signal(true);
  notFound   = signal(false);
  activeImg  = signal(0);
  mapUrl     = signal<SafeResourceUrl>('');

  avatarError  = signal(false);
  agentAvatar  = computed(() => this.avatarError() ? '' : (this.agent()?.avatar_url ?? ''));
  agentPhone   = computed(() => this.agent()?.phone ?? '');
  agentEmail   = computed(() => this.agent()?.email ?? '');

  inquiryName    = '';
  inquiryPhone   = '';
  inquiryEmail   = '';
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
      this.project.set(data as Project);
      this.geocodeAndSetMap(data as Project);
      if ((data as Project).agent_name) {
        const { data: agentData } = await this.sb
          .from('admin_users')
          .select('name, email, phone, avatar_url')
          .eq('name', (data as Project).agent_name)
          .maybeSingle();
        if (agentData) this.agent.set(agentData as any);
      }
    } else {
      this.notFound.set(true);
    }
    this.loading.set(false);
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
    this.inquirySubmitting.set(true);
    this.inquiryError.set('');
    await this.sb.from('leads').insert({
      name:     this.inquiryName,
      phone:    this.inquiryPhone,
      email:    this.inquiryEmail,
      message:  this.inquiryMessage || `Enquiry about project: ${p.title}`,
      source:   'Project Detail',
      status:   'New',
    });
    this.inquirySubmitting.set(false);
    this.inquirySent.set(true);
  }
}
