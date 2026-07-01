import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Developer {
  slug: string;
  name: string;
  logo: string;
  coverImage: string;
  established: number;
  projects: number;
  deliveredProjects: number;
  units: number;
  salesVolume: string;
  salesValue: string;
  capitalGain: string;
  about: string;
  nationality: string;
  featured?: boolean;
}

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './developers.component.html',
  styleUrl: './developers.component.scss',
})
export class DevelopersComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  searchQuery   = signal('');
  activeFilter  = signal('All');
  loading       = signal(true);
  allDevelopers = signal<Developer[]>([]);
  showSuggestions = signal(false);

  suggestions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.allDevelopers()
      .map(d => d.name)
      .filter(n => !q || n.toLowerCase().includes(q))
      .slice(0, 8);
  });

  selectSuggestion(name: string): void {
    this.searchQuery.set(name);
    this.showSuggestions.set(false);
  }

  onSearchBlur(): void {
    // Small delay so mousedown on suggestion fires first
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  readonly filters = ['All', 'Featured', 'UAE', 'International'];

  async ngOnInit(): Promise<void> {
    const [{ data, error }, { data: projData }] = await Promise.all([
      this.sb
        .from('developers')
        .select('slug,name,logo,cover_image,established,projects,delivered_projects,about,nationality,featured')
        .order('sort_order', { ascending: true }),
      this.sb
        .from('projects')
        .select('developer')
        .eq('status', 'Published'),
    ]);

    // Build live project count per developer name
    const countMap = new Map<string, number>();
    for (const p of (projData ?? [])) {
      const key = (p.developer ?? '').trim().toLowerCase();
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    if (!error && data) {
      this.allDevelopers.set(data.map((d: any) => ({
        slug:              d.slug,
        name:              d.name,
        logo:              d.logo,
        coverImage:        d.cover_image || '',
        established:       d.established,
        projects:          countMap.get((d.name ?? '').trim().toLowerCase()) ?? d.projects ?? 0,
        deliveredProjects: d.delivered_projects,
        units:             d.units        ?? 0,
        salesVolume:       d.sales_volume ?? '',
        salesValue:        d.sales_value  ?? '',
        capitalGain:       d.capital_gain ?? '',
        about:             d.about,
        nationality:       d.nationality,
        featured:          d.featured,
      })));
    }
    this.loading.set(false);
  }

  filtered = computed(() => {
    let list = [...this.allDevelopers()];
    const f  = this.activeFilter();
    const q  = this.searchQuery().toLowerCase().trim();
    if (f === 'Featured')      list = list.filter(d => d.featured);
    else if (f === 'UAE')       list = list.filter(d => d.nationality === 'UAE');
    else if (f === 'International') list = list.filter(d => d.nationality === 'International');
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q) || d.about.toLowerCase().includes(q));
    return list;
  });

  featuredDevs = computed(() => this.allDevelopers().filter(d => d.featured).slice(0, 8));
}
