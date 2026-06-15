import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './ultra-luxury-projects.component.html',
  styleUrl: './ultra-luxury-projects.component.scss',
})
export class UltraLuxuryProjectsComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  projects = signal<Project[]>([]);
  loading  = signal(true);

  async ngOnInit() {
    const { data } = await this.sb
      .from('projects')
      .select('*')
      .eq('status', 'Published')
      .eq('is_ultra_luxury', true)
      .order('created_at', { ascending: false });

    this.projects.set((data as Project[]) ?? []);
    this.loading.set(false);
  }

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }
}
