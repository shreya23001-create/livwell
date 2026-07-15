import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { AdminDataService } from '../../shared/services/admin-data.service';
import { toProjectSlug } from '../../shared/utils/slug';

interface Project {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: string;
  beds: string;
  price_from: number;
  price_per_sqft: string;
  completion_date: string;
  payment_plan: string;
  images: string[];
  badge: string;
  is_ultra_luxury: boolean;
}

@Component({
  selector: 'app-ultra-luxury-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './ultra-luxury-projects.component.html',
  styleUrl: './ultra-luxury-projects.component.scss',
})
export class UltraLuxuryProjectsComponent implements OnInit {
  private sb      = inject(SupabaseService).client;
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private dataSvc = inject(AdminDataService);

  allProjects  = signal<Project[]>([]);
  loading      = signal(true);
  savedIds     = signal<Set<number>>(new Set());
  shareToastId = signal<number | null>(null);

  isSaved(id: number): boolean { return this.savedIds().has(id); }

  async toggleSave(id: number, event: Event): Promise<void> {
    event.preventDefault(); event.stopPropagation();
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.router.navigate(['/customer']); return; }
    if (this.isSaved(id)) {
      await this.sb.from('saved_projects').delete().eq('user_id', userId).eq('project_id', id);
      this.savedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await this.sb.from('saved_projects').insert({ user_id: userId, project_id: id });
      this.savedIds.update(s => new Set(s).add(id));
    }
  }

  shareCard(id: number, title: string, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    const url = `${window.location.origin}/projects/${toProjectSlug(title, id)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    this.shareToastId.set(id);
    setTimeout(() => this.shareToastId.set(null), 2000);
  }

  private async loadSavedIds(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb.from('saved_projects').select('project_id').eq('user_id', userId);
    if (data) this.savedIds.set(new Set(data.map((r: any) => r.project_id)));
  }

  // ── Filter state ─────────────────────────────────────
  searchQuery    = signal('');
  filterType     = signal('');
  filterBeds     = signal('');
  filterPriceMin = signal<number | null>(null);
  filterPriceMax = signal<number | null>(null);

  typeDropOpen  = signal(false);
  bedsDropOpen  = signal(false);
  priceDropOpen = signal(false);

  readonly bedOptions  = ['Studio', '1', '2', '3', '4', '5', '6+'];
  readonly priceRanges = [
    { label: 'Any Price',     min: null,       max: null },
    { label: 'Under AED 5M',  min: null,       max: 5_000_000 },
    { label: 'AED 5M – 10M',  min: 5_000_000,  max: 10_000_000 },
    { label: 'AED 10M – 20M', min: 10_000_000, max: 20_000_000 },
    { label: 'AED 20M – 50M', min: 20_000_000, max: 50_000_000 },
    { label: 'AED 50M+',      min: 50_000_000, max: null },
  ];

  typeOptions = computed(() => this.dataSvc.propTypes());

  filteredProjects = computed(() => {
    const q    = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();
    const beds = this.filterBeds();
    const pMin = this.filterPriceMin();
    const pMax = this.filterPriceMax();

    return this.allProjects().filter(p => {
      if (q && !p.title.toLowerCase().includes(q) &&
               !p.developer?.toLowerCase().includes(q) &&
               !p.location?.toLowerCase().includes(q)) return false;
      if (type && p.type !== type) return false;
      if (beds) {
        const b = beds === '6+' ? 6 : parseInt(beds);
        const pBeds = parseInt(p.beds ?? '0');
        if (beds === '6+' ? pBeds < 6 : pBeds !== b) return false;
      }
      if (pMin && p.price_from && p.price_from < pMin) return false;
      if (pMax && p.price_from && p.price_from > pMax) return false;
      return true;
    });
  });

  activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterType()) n++;
    if (this.filterBeds()) n++;
    if (this.filterPriceMin() || this.filterPriceMax()) n++;
    return n;
  });

  selectedPriceLabel = computed(() => {
    const pMin = this.filterPriceMin();
    const pMax = this.filterPriceMax();
    if (!pMin && !pMax) return 'Price';
    return this.priceRanges.find(r => r.min === pMin && r.max === pMax)?.label ?? 'Price';
  });

  async ngOnInit() {
    const { data } = await this.sb
      .from('projects').select('*')
      .eq('status', 'Published')
      .eq('is_ultra_luxury', true)
      .order('created_at', { ascending: false });
    const projects = (data as Project[]) ?? [];
    projects.forEach(p => {
      const clean = (p.images ?? []).filter((u: string) => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
      p.images = [...clean.filter((u: string) => !u.includes('/images/')), ...clean.filter((u: string) => u.includes('/images/'))];
    });
    this.allProjects.set(projects);
    this.loading.set(false);
    this.loadSavedIds();
  }

  closeAllDrops() {
    this.typeDropOpen.set(false);
    this.bedsDropOpen.set(false);
    this.priceDropOpen.set(false);
  }

  toggleDrop(drop: 'type' | 'beds' | 'price') {
    const isOpen = drop === 'type' ? this.typeDropOpen() : drop === 'beds' ? this.bedsDropOpen() : this.priceDropOpen();
    this.closeAllDrops();
    if (!isOpen) {
      if (drop === 'type')  this.typeDropOpen.set(true);
      if (drop === 'beds')  this.bedsDropOpen.set(true);
      if (drop === 'price') this.priceDropOpen.set(true);
    }
  }

  selectType(t: string) { this.filterType.set(t); this.typeDropOpen.set(false); }
  selectBeds(b: string) { this.filterBeds.set(b); this.bedsDropOpen.set(false); }
  selectPrice(r: typeof this.priceRanges[0]) {
    this.filterPriceMin.set(r.min);
    this.filterPriceMax.set(r.max);
    this.priceDropOpen.set(false);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.filterType.set('');
    this.filterBeds.set('');
    this.filterPriceMin.set(null);
    this.filterPriceMax.set(null);
    this.closeAllDrops();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.ulxp-filter-bar')) this.closeAllDrops();
  }

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  projectSlug(p: { title: string; id: number }): string {
    return toProjectSlug(p.title, p.id);
  }

  openUrl(url: string): void { window.open(url, '_blank'); }
}
