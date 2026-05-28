import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

interface LuxuryProject {
  id: number;
  title: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  startingPrice: string;
  pricePerSqft: string;
  paymentPlan: string;
  completionDate: string;
  beds: string;
  image: string;
  badge?: string;
  featured?: boolean;
}

@Component({
  selector: 'app-luxury-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-projects.component.html',
  styleUrl: './luxury-projects.component.scss',
})
export class LuxuryProjectsComponent {
  filter = signal('');

  pageTitle = computed(() =>
    this.filter() === 'ultra'
      ? 'Ultra Luxury Projects in Dubai'
      : 'Luxury Real Estate Projects in Dubai'
  );

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      this.filter.set(params.get('filter') ?? '');
    });
  }
  projects: LuxuryProject[] = [
    {
      id: 1,
      title: 'One Za\'abeel Residences',
      developer: 'Ithra Dubai',
      location: 'Za\'abeel, Dubai',
      community: 'Za\'abeel',
      type: 'Penthouse',
      status: 'Ready',
      startingPrice: 'AED 18,500,000',
      pricePerSqft: 'AED 6,200',
      paymentPlan: '30 / 40 / 30 %',
      completionDate: 'Q4 2024',
      beds: '2 – 5 BR',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=85',
      badge: 'Iconic',
      featured: true,
    },
    {
      id: 2,
      title: 'Bulgari Ocean Mansions',
      developer: 'Meraas',
      location: 'Jumeira Bay Island, Dubai',
      community: 'Jumeira Bay',
      type: 'Villa',
      status: 'Off-Plan',
      startingPrice: 'AED 65,000,000',
      pricePerSqft: 'AED 12,500',
      paymentPlan: '20 / 60 / 20 %',
      completionDate: 'Q2 2026',
      beds: '5 – 7 BR',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85',
      badge: 'Ultra Luxury',
      featured: true,
    },
    {
      id: 3,
      title: 'Six Senses Residences',
      developer: 'Select Group',
      location: 'Palm Jumeirah, Dubai',
      community: 'Palm Jumeirah',
      type: 'Penthouse',
      status: 'Off-Plan',
      startingPrice: 'AED 22,000,000',
      pricePerSqft: 'AED 8,800',
      paymentPlan: '15 / 55 / 30 %',
      completionDate: 'Q1 2026',
      beds: '3 – 5 BR',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85',
      badge: 'New Launch',
      featured: true,
    },
    {
      id: 4,
      title: 'Atlantis The Royal Residences',
      developer: 'Kerzner International',
      location: 'Palm Jumeirah, Dubai',
      community: 'Palm Jumeirah',
      type: 'Apartment',
      status: 'Ready',
      startingPrice: 'AED 14,200,000',
      pricePerSqft: 'AED 5,900',
      paymentPlan: '100% Ready',
      completionDate: 'Completed',
      beds: '2 – 4 BR',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=85',
      featured: true,
    },
    {
      id: 5,
      title: 'Dorchester Collection Dubai',
      developer: 'OMNIYAT',
      location: 'Business Bay, Dubai',
      community: 'Business Bay',
      type: 'Apartment',
      status: 'Ready',
      startingPrice: 'AED 9,800,000',
      pricePerSqft: 'AED 4,200',
      paymentPlan: '100% Ready',
      completionDate: 'Completed',
      beds: '1 – 3 BR',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=900&q=85',
    },
    {
      id: 6,
      title: 'Emaar Beachfront Grand Bleu',
      developer: 'Emaar',
      location: 'Dubai Harbour, Dubai',
      community: 'Emaar Beachfront',
      type: 'Apartment',
      status: 'Under Construction',
      startingPrice: 'AED 4,500,000',
      pricePerSqft: 'AED 3,100',
      paymentPlan: '20 / 60 / 20 %',
      completionDate: 'Q3 2026',
      beds: '1 – 4 BR',
      image: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=900&q=85',
      badge: 'High ROI',
    },
    {
      id: 7,
      title: 'Nakheel Como Residences',
      developer: 'Nakheel',
      location: 'Palm Jumeirah, Dubai',
      community: 'Palm Jumeirah',
      type: 'Penthouse',
      status: 'Off-Plan',
      startingPrice: 'AED 37,000,000',
      pricePerSqft: 'AED 9,400',
      paymentPlan: '10 / 70 / 20 %',
      completionDate: 'Q4 2027',
      beds: '4 – 7 BR',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=85',
      badge: 'Rare',
    },
    {
      id: 8,
      title: 'DAMAC Cavalli Tower',
      developer: 'DAMAC Properties',
      location: 'Dubai Marina, Dubai',
      community: 'Dubai Marina',
      type: 'Apartment',
      status: 'Under Construction',
      startingPrice: 'AED 3,200,000',
      pricePerSqft: 'AED 2,800',
      paymentPlan: '20 / 50 / 30 %',
      completionDate: 'Q2 2026',
      beds: '2 – 4 BR',
      image: 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=900&q=85',
    },
    {
      id: 9,
      title: 'District One Villas Phase 3',
      developer: 'Meydan',
      location: 'MBR City, Dubai',
      community: 'Mohammed Bin Rashid City',
      type: 'Villa',
      status: 'Off-Plan',
      startingPrice: 'AED 8,900,000',
      pricePerSqft: 'AED 2,200',
      paymentPlan: '10 / 70 / 20 %',
      completionDate: 'Q1 2027',
      beds: '5 – 7 BR',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85',
      badge: 'Limited',
    },
    {
      id: 10,
      title: 'Ellington Ocean House',
      developer: 'Ellington Properties',
      location: 'Palm Jumeirah, Dubai',
      community: 'Palm Jumeirah',
      type: 'Apartment',
      status: 'Under Construction',
      startingPrice: 'AED 5,600,000',
      pricePerSqft: 'AED 3,600',
      paymentPlan: '20 / 55 / 25 %',
      completionDate: 'Q4 2026',
      beds: '1 – 3 BR',
      image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=85',
    },
    {
      id: 11,
      title: 'Sobha Hartland Waves Opulence',
      developer: 'Sobha Realty',
      location: 'MBR City, Dubai',
      community: 'Sobha Hartland',
      type: 'Apartment',
      status: 'Off-Plan',
      startingPrice: 'AED 2,800,000',
      pricePerSqft: 'AED 2,100',
      paymentPlan: '20 / 60 / 20 %',
      completionDate: 'Q2 2027',
      beds: '1 – 4 BR',
      image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=85',
    },
    {
      id: 12,
      title: 'Jumeirah Living Business Bay',
      developer: 'Jumeirah Group',
      location: 'Business Bay, Dubai',
      community: 'Business Bay',
      type: 'Penthouse',
      status: 'Ready',
      startingPrice: 'AED 11,000,000',
      pricePerSqft: 'AED 4,800',
      paymentPlan: '100% Ready',
      completionDate: 'Completed',
      beds: '2 – 5 BR',
      image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&q=85',
      badge: 'Best Seller',
    },
  ];

  slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  statusClass(status: string): string {
    return {
      'Ready': 'status--ready',
      'Off-Plan': 'status--offplan',
      'Under Construction': 'status--construction',
    }[status] ?? '';
  }
}
