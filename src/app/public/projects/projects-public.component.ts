import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { toProjectSlug } from '../../shared/utils/slug';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

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
  beds: string;
  completion_date: string;
  payment_plan: string;
  description: string;
  images: string[];
  badge: string;
  is_featured: boolean;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
}

@Component({
  selector: 'app-projects-public',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './projects-public.component.html',
  styleUrl: './projects-public.component.scss',
})
export class ProjectsPublicComponent implements OnInit {
  private sb     = inject(SupabaseService).client;
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  savedIds      = signal<Set<number>>(new Set());
  shareToastId  = signal<number | null>(null);

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

  allProjects = signal<Project[]>([]);
  loading     = signal(true);

  searchQuery      = signal('');
  selectedType     = signal('All');
  selectedHandover = signal('All');
  sortBy           = signal('newest');
  currentPage      = signal(1);
  readonly pageSize = 9;

  readonly projectTypes  = ['All', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home', 'Mixed', 'Duplex'];
  readonly handoverOptions = ['All', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', '2028', '2029+'];

  filteredProjects = computed(() => {
    let list = this.allProjects().slice();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      const terms = q.split(',').map(t => t.trim()).filter(Boolean);
      if (terms.length > 1) {
        list = list.filter(p => terms.some(t =>
          p.title.toLowerCase().includes(t) ||
          (p.developer ?? '').toLowerCase().includes(t) ||
          (p.community ?? '').toLowerCase().includes(t) ||
          (p.location ?? '').toLowerCase().includes(t)
        ));
      } else {
        list = list.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.developer ?? '').toLowerCase().includes(q) ||
          (p.community ?? '').toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q)
        );
      }
    }
    if (this.selectedType() !== 'All') list = list.filter(p => p.type === this.selectedType());
    if (this.selectedHandover() !== 'All') list = list.filter(p => (p.completion_date ?? '').includes(this.selectedHandover()));
    const sort = this.sortBy();
    if (sort === 'price_asc')  list = list.sort((a, b) => (a.price_from ?? 0) - (b.price_from ?? 0));
    if (sort === 'price_desc') list = list.sort((a, b) => (b.price_from ?? 0) - (a.price_from ?? 0));
    return list;
  });

  totalResults    = computed(() => this.filteredProjects().length);
  totalPages      = computed(() => Math.max(1, Math.ceil(this.totalResults() / this.pageSize)));
  pagedProjects   = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProjects().slice(start, start + this.pageSize);
  });
  pageNumbers = computed(() => {
    const total = this.totalPages(), cur = this.currentPage();
    const pages: (number | '...')[] = [];
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (cur > 3) pages.push('...');
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });
  goToPage(page: number | '...'): void {
    if (typeof page === 'number') { this.currentPage.set(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  stats = computed(() => ({
    total:      this.allProjects().length,
    featured:   this.allProjects().filter(p => p.is_featured).length,
    luxury:     this.allProjects().filter(p => p.is_luxury || p.is_ultra_luxury).length,
    minPrice:   this.formatPrice(Math.min(...this.allProjects().map(p => p.price_from ?? 0).filter(n => n > 0))),
  }));

  async ngOnInit() {
    // Subscribe so query params apply even if component was already active
    this.route.queryParams.subscribe(params => {
      if (params['q'])        this.searchQuery.set(params['q']);
      if (params['location']) this.searchQuery.set(params['location']);
      if (params['type'])     this.selectedType.set(params['type']);
      this.currentPage.set(1);
    });

    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('status', 'Published')
      .order('is_featured', { ascending: false })
      .order('created_at',  { ascending: false });

    const projects = (data as Project[]) ?? [];
    projects.forEach(p => {
      const all = (p.images ?? []).filter(u => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
      p.images = [...all.filter(u => !u.includes('/images/')), ...all.filter(u => u.includes('/images/'))];
    });
    this.allProjects.set(projects);
    this.loading.set(false);
    this.loadSavedIds();
  }

  formatPrice(n: number): string {
    if (!n || n === Infinity) return '—';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  faqs = [
    { question: 'What qualifies as an off-plan project in Dubai?', answer: 'An off-plan property is one that is purchased before or during construction, directly from the developer at pre-launch prices.', open: false },
    { question: 'How reliable are off-plan developers in Dubai?', answer: "Dubai's RERA (Real Estate Regulatory Agency) regulates all developers and mandates escrow accounts to protect buyer funds.", open: false },
    { question: 'What payment plans are typically available?', answer: 'Most developers offer 40/60, 50/50, or post-handover plans. Some offer 1% monthly plans. Terms vary by developer and project.', open: false },
    { question: 'Can I invest if I\'m based outside the UAE?', answer: 'Yes. Foreign nationals can purchase freehold property in designated areas. We assist with remote signing and power of attorney.', open: false },
  ];

  setSearch(v: string)   { this.searchQuery.set(v);      this.currentPage.set(1); }
  setType(v: string)     { this.selectedType.set(v);     this.currentPage.set(1); }
  setHandover(v: string) { this.selectedHandover.set(v); this.currentPage.set(1); }
  setSort(v: string)     { this.sortBy.set(v);           this.currentPage.set(1); }

  toggleFaq(i: number) {
    this.faqs = this.faqs.map((f, idx) => ({ ...f, open: idx === i ? !f.open : false }));
  }

  projectSlug(p: Project): string {
    return toProjectSlug(p.title, p.id);
  }
}
