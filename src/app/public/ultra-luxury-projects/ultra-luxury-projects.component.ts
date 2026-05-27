import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

interface UltraLuxuryProject {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  startingPrice: string;
  pricePerSqft: string;
  paymentPlan: string;
  completionDate: string;
  beds: string;
  image: string;
  badge?: string;
}

@Component({
  selector: 'app-ultra-luxury-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './ultra-luxury-projects.component.html',
  styleUrl: './ultra-luxury-projects.component.scss',
})
export class UltraLuxuryProjectsComponent {
  projects: UltraLuxuryProject[] = [
    {
      id: 1,
      title: 'Bulgari Ocean Mansions',
      developer: 'Meraas',
      location: 'Jumeira Bay Island, Dubai',
      type: 'Villa',
      status: 'Off-Plan',
      startingPrice: 'AED 65,000,000',
      pricePerSqft: 'AED 12,500',
      paymentPlan: '20 / 60 / 20 %',
      completionDate: 'Q2 2026',
      beds: '5 – 7 BR',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85',
      badge: 'Ultra Luxury',
    },
    {
      id: 2,
      title: 'Nakheel Como Residences',
      developer: 'Nakheel',
      location: 'Palm Jumeirah, Dubai',
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
      id: 3,
      title: 'Six Senses Residences',
      developer: 'Select Group',
      location: 'Palm Jumeirah, Dubai',
      type: 'Penthouse',
      status: 'Off-Plan',
      startingPrice: 'AED 22,000,000',
      pricePerSqft: 'AED 8,800',
      paymentPlan: '15 / 55 / 30 %',
      completionDate: 'Q1 2026',
      beds: '3 – 5 BR',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85',
      badge: 'New Launch',
    },
    {
      id: 4,
      title: 'One Za\'abeel Residences',
      developer: 'Ithra Dubai',
      location: 'Za\'abeel, Dubai',
      type: 'Penthouse',
      status: 'Ready',
      startingPrice: 'AED 18,500,000',
      pricePerSqft: 'AED 6,200',
      paymentPlan: '30 / 40 / 30 %',
      completionDate: 'Q4 2024',
      beds: '2 – 5 BR',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=85',
      badge: 'Iconic',
    },
    {
      id: 5,
      title: 'AETERNA by Omniyat',
      developer: 'OMNIYAT',
      location: 'Downtown Dubai, Dubai',
      type: 'Penthouse',
      status: 'Off-Plan',
      startingPrice: 'AED 28,000,000',
      pricePerSqft: 'AED 11,200',
      paymentPlan: '20 / 60 / 20 %',
      completionDate: 'Q3 2027',
      beds: '3 – 6 BR',
      image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=900&q=85',
      badge: 'Exclusive',
    },
    {
      id: 6,
      title: 'Jumeirah Marsa Al Arab Residences',
      developer: 'Jumeirah Group',
      location: 'Jumeirah Beach, Dubai',
      type: 'Apartment',
      status: 'Off-Plan',
      startingPrice: 'AED 19,500,000',
      pricePerSqft: 'AED 7,800',
      paymentPlan: '10 / 70 / 20 %',
      completionDate: 'Q2 2027',
      beds: '2 – 5 BR',
      image: 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=900&q=85',
      badge: 'Beachfront',
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
