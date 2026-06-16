import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface BrandedResidence {
  id: number;
  title: string;
  developer: string;
  location: string;
  community: string;
  status: string;
  price_from: number;
  price_label: string;
  price_per_sqft: string;
  beds: string;
  completion_date: string;
  images: string[];
  badge: string;
  brand: string;
  brand_logo_url: string;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
}

@Component({
  selector: 'app-branded-residences',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './branded-residences.component.html',
  styleUrl: './branded-residences.component.scss',
})
export class BrandedResidencesComponent implements OnInit {
  private sb = inject(SupabaseService).client;
  private sanitizer = inject(DomSanitizer);

  allResidences = signal<BrandedResidence[]>([]);
  loading       = signal(true);
  hoveredId     = signal<number | null>(null);
  activeFilter  = signal('All');
  searchQuery   = signal('');

  readonly filters = ['All', 'Luxury', 'Ultra Luxury'];

  dbError = signal('');

  async ngOnInit() {
    const { data, error } = await this.sb
      .from('projects')
      .select('id,title,developer,location,community,status,price_from,price_label,price_per_sqft,beds,completion_date,images,badge,brand,brand_logo_url,is_branded,is_luxury,is_ultra_luxury')
      .eq('is_branded', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BrandedResidences] Supabase error:', error);
      this.dbError.set(error.message);
    }
    this.allResidences.set((data as BrandedResidence[]) ?? []);
    this.loading.set(false);
  }

  filteredResidences = computed(() => {
    let list = this.allResidences();
    const f  = this.activeFilter();
    const q  = this.searchQuery().toLowerCase().trim();
    if (f === 'Ultra Luxury') list = list.filter(r => r.is_ultra_luxury);
    else if (f === 'Luxury')  list = list.filter(r => r.is_luxury && !r.is_ultra_luxury);
    if (q) list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.developer ?? '').toLowerCase().includes(q) ||
      (r.location ?? '').toLowerCase().includes(q) ||
      (r.brand ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  hoveredResidence = computed(() =>
    this.allResidences().find(r => r.id === this.hoveredId()) ?? null
  );

  formatPrice(n: number): string {
    if (!n) return 'Price on request';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

}
