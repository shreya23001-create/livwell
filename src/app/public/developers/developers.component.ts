import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Developer {
  slug: string;
  name: string;
  logo: string;
  established: number;
  projects: number;
  deliveredProjects: number;
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

  searchQuery  = signal('');
  activeFilter = signal('All');
  loading      = signal(true);
  allDevelopers = signal<Developer[]>([]);

  readonly filters = ['All', 'Featured', 'UAE', 'International'];

  async ngOnInit(): Promise<void> {
    const { data, error } = await this.sb
      .from('developers')
      .select('slug,name,logo,established,projects,delivered_projects,about,nationality,featured')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      this.allDevelopers.set(data.map((d: any) => ({
        slug:              d.slug,
        name:              d.name,
        logo:              d.logo,
        established:       d.established,
        projects:          d.projects,
        deliveredProjects: d.delivered_projects,
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
