import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';

interface DeveloperFaq { question: string; answer: string; }

interface Developer {
  id: string;
  slug: string;
  name: string;
  logo: string;
  cover_image: string;
  established: number | null;
  projects: number;
  delivered_projects: number;
  about: string;
  nationality: string;
  featured: boolean;
  faqs: DeveloperFaq[];
}

interface Project {
  id: number;
  title: string;
  location: string;
  community: string;
  type: string;
  price_from: number | null;
  price_label: string | null;
  beds: string | null;
  area_sqft: number | null;
  images: string[];
  completion_date: string | null;
  badge: string | null;
  is_featured: boolean;
}

@Component({
  selector: 'app-developer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './developer-detail.component.html',
  styleUrl: './developer-detail.component.scss',
})
export class DeveloperDetailComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private titleSvc  = inject(Title);

  dev      = signal<Developer | null>(null);
  notFound = signal(false);
  loading  = signal(true);

  allProjects    = signal<Project[]>([]);
  searchQuery    = signal('');
  filterType     = signal('All');
  filterHandover = signal('All');
  openFaqIndex   = signal<number | null>(null);

  projectTypes = ['All', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home', 'Mixed', 'Duplex'];

  // Dynamic handover options from actual DB data
  handoverOptions = computed(() => {
    const dates = this.allProjects()
      .map(p => p.completion_date)
      .filter((d): d is string => !!d);
    const unique = ['All', ...new Set(dates)];
    return unique;
  });

  filteredProjects = computed(() => {
    let list = this.allProjects();
    const q  = this.searchQuery().toLowerCase().trim();
    const ft = this.filterType();
    const fh = this.filterHandover();

    if (q)  list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.location ?? '').toLowerCase().includes(q) ||
      (p.community ?? '').toLowerCase().includes(q)
    );
    if (ft !== 'All') list = list.filter(p => p.type === ft);
    if (fh !== 'All') list = list.filter(p => p.completion_date === fh);
    return list;
  });

  resetFilters() {
    this.searchQuery.set('');
    this.filterType.set('All');
    this.filterHandover.set('All');
  }

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async p => {
      window.scrollTo({ top: 0 });
      await this.loadDev(p['slug']);
    });
  }

  private async loadDev(slug: string): Promise<void> {
    this.loading.set(true);
    this.allProjects.set([]);
    this.notFound.set(false);

    const { data, error } = await this.sb
      .from('developers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const dev = { ...data, faqs: Array.isArray(data.faqs) ? data.faqs : [] } as Developer;
    this.dev.set(dev);
    this.titleSvc.setTitle(`${dev.name} | Livwell`);

    // Load published projects for this developer
    const { data: projs } = await this.sb
      .from('projects')
      .select('id,title,location,community,type,price_from,price_label,beds,area_sqft,images,completion_date,badge,is_featured')
      .eq('status', 'Published')
      .ilike('developer', `%${data.name}%`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    const mapped = (projs ?? []).map((p: any) => {
      const all = (p.images ?? []).filter((u: string) => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
      p.images = [...all.filter((u: string) => !u.includes('/images/')), ...all.filter((u: string) => u.includes('/images/'))];
      return p;
    });
    this.allProjects.set(mapped as Project[]);
    this.loading.set(false);
  }

  formatPrice(p: Project): string {
    if (p.price_label) return p.price_label;
    if (p.price_from) {
      return `AED ${p.price_from.toLocaleString('en-US')}`;
    }
    return '—';
  }

  coverImage(p: Project): string {
    const real = (p.images ?? []).find(u => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
    return real ?? p.images?.[0] ?? '/images/dummy-image.png';
  }

  safeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }

  toggleFaq(i: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === i ? null : i);
  }
}


