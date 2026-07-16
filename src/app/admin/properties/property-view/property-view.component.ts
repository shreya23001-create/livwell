import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AdminDataService } from '../../../shared/services/admin-data.service';
import { AMENITY_ICONS } from '../../../shared/constants/amenity-icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface PropertyDetail {
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
  agent_name: string;
  agent_avatar: string;
  created_by: string;
  created_at: string;
  views: number;
  share_count: number;
  is_featured: boolean;
  description: string;
  address: string;
  furnishing: string;
  images: string[];
  amenities: string[];
  video_url: string | null;
}

interface LeadRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  created_at: string;
  notes: string;
  assigned_agent: string;
}

interface SavedRow {
  id: number;
  user_id: string;
  created_at: string;
  profiles?: { name: string | null; email: string | null } | null;
}

@Component({
  selector: 'app-property-view',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, DecimalPipe],
  templateUrl: './property-view.component.html',
  styleUrl: './property-view.component.scss',
})
export class PropertyViewComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private auth      = inject(AuthService);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private dataSvc   = inject(AdminDataService);
  private sanitizer = inject(DomSanitizer);

  property    = signal<PropertyDetail | null>(null);
  leads       = signal<LeadRow[]>([]);
  saved       = signal<SavedRow[]>([]);
  loading     = signal(true);
  activeImage  = signal(0);
  activeTab    = signal<'leads' | 'saved'>('leads');
  descExpanded = signal(false);

  safeDesc(html: string): SafeHtml {
    const cleaned = (html ?? '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<\/p>\s*<p>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ');
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  amenitiesWithIcons = computed<{ name: string; svg: SafeHtml | null }[]>(() => {
    const masterMap = new Map(this.dataSvc.amenities().map(a => [a.name, a.icon]));
    const svgMap    = new Map(AMENITY_ICONS.map(i => [i.key, i.svg]));
    return (this.property()?.amenities ?? []).map(name => {
      const raw = svgMap.get(masterMap.get(name) ?? '');
      return { name, svg: raw ? this.sanitizer.bypassSecurityTrustHtml(raw) : null };
    });
  });

  leadStats = computed(() => {
    const l = this.leads();
    return {
      total:       l.length,
      new:         l.filter(x => x.status === 'new').length,
      contacted:   l.filter(x => x.status === 'contacted').length,
      qualified:   l.filter(x => x.status === 'qualified').length,
      negotiating: l.filter(x => x.status === 'negotiating').length,
      won:         l.filter(x => x.status === 'won').length,
      lost:        l.filter(x => x.status === 'lost').length,
    };
  });

  conversionRate = computed(() => {
    const s = this.leadStats();
    if (!s.total) return 0;
    return Math.round((s.won / s.total) * 100);
  });

  pricePerSqft = computed(() => {
    const p = this.property();
    if (!p || !p.area_sqft) return 0;
    return Math.round(p.price / p.area_sqft);
  });

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/properties']); return; }
    await Promise.all([this.loadProperty(id), this.loadLeads(id), this.loadSaved(id)]);
    this.loading.set(false);
  }

  private async loadProperty(id: number): Promise<void> {
    const { data } = await this.sb.from('properties').select('*').eq('id', id).single();
    if (!data) return;
    let agentAvatar = '';
    if (data.agent_name) {
      const { data: prof } = await this.sb
        .from('profiles')
        .select('avatar_url')
        .eq('name', data.agent_name)
        .eq('role', 'agent')
        .maybeSingle();
      if (prof?.avatar_url) {
        const av = prof.avatar_url.split('?')[0];
        agentAvatar = /\/avatars\/[^/]+$/.test(av) ? prof.avatar_url : '';
      }
    }
    this.property.set({ ...data, agent_avatar: agentAvatar } as PropertyDetail);
  }

  private async loadLeads(id: number): Promise<void> {
    const { data } = await this.sb
      .from('admin_leads')
      .select('id, name, email, phone, status, source, notes, assigned_agent, created_at')
      .eq('property_id', id)
      .order('created_at', { ascending: false });
    if (data) this.leads.set(data as LeadRow[]);
  }

  private async loadSaved(id: number): Promise<void> {
    const { data } = await this.sb
      .from('saved_properties')
      .select('id, user_id, created_at, profiles(name, email)')
      .eq('property_id', id)
      .order('created_at', { ascending: false });
    if (data) this.saved.set((data as any[]).map(r => ({
      ...r,
      profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
    })) as SavedRow[]);
  }

  formatPrice(n: number): string {
    if (!n) return 'AED —';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      new: '#6366f1', contacted: '#f59e0b', qualified: '#3b82f6',
      negotiating: '#8b5cf6', won: '#10b981', lost: '#ef4444',
    };
    return map[s] ?? '#6b7280';
  }

  sourceLabel(s: string): string {
    const map: Record<string, string> = {
      website: 'Website', referral: 'Referral', walk_in: 'Walk-in',
      social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call',
    };
    return map[s] ?? s;
  }

  goBack(): void { this.router.navigate(['/admin/properties']); }
}
