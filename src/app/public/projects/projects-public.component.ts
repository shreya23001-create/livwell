import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
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
  private sb = inject(SupabaseService).client;

  allProjects = signal<Project[]>([]);
  loading     = signal(true);

  searchQuery      = signal('');
  selectedType     = signal('All');
  selectedHandover = signal('All');
  sortBy           = signal('newest');

  readonly projectTypes  = ['All', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home', 'Mixed', 'Duplex'];
  readonly handoverOptions = ['All', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', '2028', '2029+'];

  filteredProjects = computed(() => {
    let list = this.allProjects().slice();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.developer ?? '').toLowerCase().includes(q) ||
      (p.community ?? '').toLowerCase().includes(q)
    );
    if (this.selectedType() !== 'All') list = list.filter(p => p.type === this.selectedType());
    if (this.selectedHandover() !== 'All') list = list.filter(p => (p.completion_date ?? '').includes(this.selectedHandover()));
    const sort = this.sortBy();
    if (sort === 'price_asc')  list = list.sort((a, b) => (a.price_from ?? 0) - (b.price_from ?? 0));
    if (sort === 'price_desc') list = list.sort((a, b) => (b.price_from ?? 0) - (a.price_from ?? 0));
    return list;
  });

  stats = computed(() => ({
    total:      this.allProjects().length,
    featured:   this.allProjects().filter(p => p.is_featured).length,
    luxury:     this.allProjects().filter(p => p.is_luxury || p.is_ultra_luxury).length,
    minPrice:   this.formatPrice(Math.min(...this.allProjects().map(p => p.price_from ?? 0).filter(n => n > 0))),
  }));

  async ngOnInit() {
    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('status', 'Published')
      .order('is_featured', { ascending: false })
      .order('created_at',  { ascending: false });

    this.allProjects.set((data as Project[]) ?? []);
    this.loading.set(false);
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

  toggleFaq(i: number) {
    this.faqs = this.faqs.map((f, idx) => ({ ...f, open: idx === i ? !f.open : false }));
  }
}
