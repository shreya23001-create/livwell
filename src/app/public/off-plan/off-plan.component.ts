import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';

export interface OffPlanProject {
  id: number;
  slug: string;
  title: string;
  developer: string;
  location: string;
  community: string;
  priceFrom: number;
  priceFromLabel: string;
  completionDate: string;
  type: string;
  badge?: string;
  image: string;
  beds: string;
  description: string;
  amenities: string[];
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-off-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './off-plan.component.html',
  styleUrl: './off-plan.component.scss',
})
export class OffPlanComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  allProjects = signal<OffPlanProject[]>([]);
  loading     = signal(true);

  searchQuery      = signal('');
  selectedType     = signal('All');
  selectedLocation = signal('All');
  selectedBeds     = signal('All');
  selectedHandover = signal('All');
  sortBy           = signal('newest');

  readonly projectTypes    = ['All', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home', 'Mixed', 'Duplex'];
  readonly locations       = ['All', 'Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'Dubai Hills Estate', 'Dubai Creek Harbour', 'MBR City', 'JVC', 'Al Furjan', 'Emaar Beachfront'];
  readonly bedOptions      = ['All', 'Studio', '1', '2', '3', '4', '5+'];
  readonly handoverOptions = ['All', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', '2028', '2029+'];
  readonly sortOptions = [
    { value: 'newest',     label: 'Newest First' },
    { value: 'price_asc',  label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'completion', label: 'Completion Date' },
  ];

  filteredProjects = computed(() => {
    let list = this.allProjects().slice();
    const q  = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.developer ?? '').toLowerCase().includes(q) ||
      (p.community ?? '').toLowerCase().includes(q) ||
      (p.location ?? '').toLowerCase().includes(q)
    );
    if (this.selectedType() !== 'All')     list = list.filter(p => p.type === this.selectedType());
    if (this.selectedLocation() !== 'All') list = list.filter(p => (p.community ?? p.location) === this.selectedLocation());
    if (this.selectedHandover() !== 'All') list = list.filter(p => (p.completionDate ?? '').includes(this.selectedHandover()));
    const sort = this.sortBy();
    if (sort === 'price_asc')  list = list.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'price_desc') list = list.sort((a, b) => b.priceFrom - a.priceFrom);
    return list;
  });

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['type']) this.selectedType.set(params['type']);
    });

    const { data } = await this.sb
      .from('projects')
      .select('id, title, developer, location, community, type, status, price_from, price_label, beds, completion_date, badge, images, is_featured, description, amenities')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (data) {
      this.allProjects.set(data.map((r: any) => this.mapRow(r)));
    }
    this.loading.set(false);
  }

  private mapRow(r: any): OffPlanProject {
    const all: string[] = (r.images ?? []).filter((u: string) => u && !u.includes('unsplash.com') && !u.includes('dummy-image'));
    const imgs: string[] = [...all.filter((u: string) => !u.includes('/images/')), ...all.filter((u: string) => u.includes('/images/'))];
    return {
      id:             r.id,
      slug:           String(r.id),
      title:          r.title ?? '',
      developer:      r.developer ?? '',
      location:       r.location ?? '',
      community:      r.community ?? r.location ?? '',
      priceFrom:      r.price_from ?? 0,
      priceFromLabel: r.price_label || this.formatPrice(r.price_from),
      completionDate: r.completion_date ?? '',
      type:           r.type ?? 'Apartment',
      badge:          r.badge ?? '',
      image:          imgs[0] ?? '/images/dummy-image.png',
      beds:           r.beds ?? '',
      description:    r.description ?? '',
      amenities:      r.amenities ?? [],
      isFeatured:     r.is_featured ?? false,
    };
  }

  private formatPrice(n: number): string {
    if (!n) return 'Call for Price';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  faqs: FaqItem[] = [
    { question: 'What qualifies as an off-plan project in Dubai?', answer: 'An off-plan property is one that is purchased before or during construction, directly from the developer at pre-launch prices.', open: false },
    { question: 'How reliable are off-plan developers in Dubai?', answer: 'Dubai\'s RERA regulates all developers and mandates escrow accounts to protect buyer funds.', open: false },
    { question: 'What payment plans are typically available?', answer: 'Most developers offer 40/60, 50/50, or post-handover plans. Some offer 1% monthly plans. Terms vary by developer and project.', open: false },
    { question: 'When does property appreciation happen on new projects?', answer: 'Properties typically appreciate from launch to handover. Prime locations in Dubai have historically seen 15–30% appreciation over the project cycle.', open: false },
    { question: 'Can I invest in off-plan projects if I\'m based outside the UAE?', answer: 'Yes. Foreign nationals can purchase freehold property in designated areas. We can assist with remote signing and power of attorney.', open: false },
    { question: 'Is a mortgage available for off-plan properties in Dubai?', answer: 'Yes, banks offer off-plan mortgages up to 50% LTV during construction. Full mortgage kicks in at completion.', open: false },
  ];

  toggleFaq(index: number) {
    this.faqs = this.faqs.map((f, i) => ({ ...f, open: i === index ? !f.open : false }));
  }

  safeHtml(html: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html ?? ''); }

  readonly seoLinks = {
    dubaiProjects:     ['Downtown Dubai Projects', 'Palm Jumeirah Projects', 'Dubai Marina Projects', 'Business Bay Projects', 'Dubai Hills Projects', 'Dubai Creek Harbour', 'MBR City Projects', 'JVC Projects', 'Al Furjan Projects', 'Emaar Beachfront'],
    dubaiProperties:   ['Apartments for Sale', 'Villas for Sale', 'Townhouses for Sale', 'Penthouses for Sale', 'Studio Apartments', '1 Bedroom Apartments', '2 Bedroom Apartments', '3 Bedroom Apartments', '4 Bedroom Apartments', '5 Bedroom Villas'],
    offPlanProperties: ['Off-Plan Apartments', 'Off-Plan Villas', 'Off-Plan Townhouses', 'Luxury Off-Plan', 'Branded Residences', 'Waterfront Projects', 'Golf Community Projects', 'Affordable Off-Plan', 'Payment Plan Projects', 'Handover 2026'],
    luxuryProjects:    ['Emaar Projects', 'Nakheel Projects', 'Damac Projects', 'Sobha Projects', 'Binghatti Projects', 'Meraas Projects', 'Aldar Projects', 'Omniyat Projects', 'Select Group', 'Danube Projects'],
    residentialTypes:  ['Furnished Apartments', 'Unfurnished Apartments', 'Smart Home Apartments', 'High-Rise Apartments', 'Low-Rise Apartments', 'Garden Apartments', 'Duplex Apartments', 'Simplex Apartments', 'Loft Apartments', 'Serviced Apartments'],
    developers:        ['Emaar Properties', 'Nakheel', 'Damac Properties', 'Sobha Realty', 'Binghatti', 'Meraas', 'Aldar', 'Azizi', 'Danube', 'Select Group'],
    areas:             ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'DIFC', 'JBR', 'Jumeirah', 'Al Barsha', 'Arabian Ranches', 'Dubai South'],
  };
}
