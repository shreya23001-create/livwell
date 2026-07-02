import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Project {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: string;
  beds: string;
  price_from: number;
  price_label: string;
  price_per_sqft: string;
  completion_date: string;
  payment_plan: string;
  images: string[];
  badge: string;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
}

@Component({
  selector: 'app-luxury-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-projects.component.html',
  styleUrl: './luxury-projects.component.scss',
})
export class LuxuryProjectsComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private route = inject(ActivatedRoute);

  projects = signal<Project[]>([]);
  loading  = signal(true);
  filter   = signal('');

  pageTitle = computed(() =>
    this.filter() === 'ultra'
      ? 'Ultra Luxury Projects in Dubai'
      : 'Luxury Real Estate Projects in Dubai'
  );

  constructor() {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.filter.set(params.get('filter') ?? '');
      this.loadProjects();
    });
  }

  private async loadProjects() {
    this.loading.set(true);
    let query = this.sb
      .from('projects')
      .select('*')
      .eq('status', 'Published');

    if (this.filter() === 'ultra') {
      query = query.eq('is_ultra_luxury', true);
    } else {
      query = query.eq('is_luxury', true);
    }

    const { data } = await query.order('is_ultra_luxury', { ascending: false }).order('created_at', { ascending: false });
    const projects = (data as Project[]) ?? [];
    projects.forEach(p => { const clean = (p.images ?? []).filter((u: string) => u && !u.includes('unsplash.com') && !u.includes('dummy-image')); p.images = [...clean.filter((u: string) => !u.includes('/images/')), ...clean.filter((u: string) => u.includes('/images/'))]; });
    this.projects.set(projects);
    this.loading.set(false);
  }

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }
}
