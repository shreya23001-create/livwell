import { Component, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface BrandedResidence {
  id: number;
  title: string;
  developer: string;
  developerLogo: string;
  location: string;
  community: string;
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  startingPrice: string;
  pricePerSqft: string;
  beds: string;
  completionDate: string;
  image: string;
  badge?: string;
  lat: number;
  lng: number;
  brand: string;
}

@Component({
  selector: 'app-branded-residences',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './branded-residences.component.html',
  styleUrl: './branded-residences.component.scss',
})
export class BrandedResidencesComponent {
  hoveredId = signal<number | null>(null);
  activeFilter = signal('All');
  searchQuery = signal('');

  readonly filters = ['All', 'Ready', 'Off-Plan', 'Under Construction'];

  readonly allResidences: BrandedResidence[] = [
    {
      id: 1, title: 'Address Grand Downtown', developer: 'Emaar', developerLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Emaar_Properties_logo.svg/200px-Emaar_Properties_logo.svg.png',
      location: 'Downtown Dubai', community: 'Downtown Dubai', status: 'Off-Plan',
      startingPrice: 'AED 10,860,000', pricePerSqft: 'AED 4,100', beds: '1 – 4 BR',
      completionDate: 'Q4 2027', brand: 'Address Hotels',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=85',
      badge: 'Off Plan', lat: 25.1972, lng: 55.2744,
    },
    {
      id: 2, title: 'Bulgari Residences', developer: 'Meraas', developerLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Meraas_Logo.svg/200px-Meraas_Logo.svg.png',
      location: 'Jumeira Bay Island', community: 'Jumeira Bay', status: 'Ready',
      startingPrice: 'AED 22,000,000', pricePerSqft: 'AED 9,800', beds: '2 – 6 BR',
      completionDate: 'Ready', brand: 'Bulgari',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85',
      badge: 'Ultra Luxury', lat: 25.2048, lng: 55.2347,
    },
    {
      id: 3, title: 'Dorchester Collection Dubai', developer: 'OMNIYAT', developerLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Meraas_Logo.svg/200px-Meraas_Logo.svg.png',
      location: 'Business Bay', community: 'Business Bay', status: 'Ready',
      startingPrice: 'AED 9,800,000', pricePerSqft: 'AED 4,200', beds: '1 – 4 BR',
      completionDate: 'Ready', brand: 'Dorchester Collection',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=900&q=85',
      lat: 25.1865, lng: 55.2644,
    },
    {
      id: 4, title: 'Six Senses Residences', developer: 'Select Group', developerLogo: '',
      location: 'Palm Jumeirah', community: 'Palm Jumeirah', status: 'Off-Plan',
      startingPrice: 'AED 5,500,000', pricePerSqft: 'AED 3,200', beds: '1 – 5 BR',
      completionDate: 'Q2 2026', brand: 'Six Senses',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85',
      badge: 'Beachfront', lat: 25.1124, lng: 55.1287,
    },
    {
      id: 5, title: 'Armani Beach Residences', developer: 'Arada', developerLogo: '',
      location: 'Palm Jumeirah', community: 'Palm Jumeirah', status: 'Off-Plan',
      startingPrice: 'AED 15,000,000', pricePerSqft: 'AED 6,500', beds: '2 – 5 BR',
      completionDate: 'Q1 2027', brand: 'Giorgio Armani',
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=85',
      badge: 'Iconic', lat: 25.1200, lng: 55.1380,
    },
    {
      id: 6, title: 'Jumeirah Living Marina Gate', developer: 'Select Group', developerLogo: '',
      location: 'Dubai Marina', community: 'Dubai Marina', status: 'Ready',
      startingPrice: 'AED 3,200,000', pricePerSqft: 'AED 2,800', beds: '1 – 4 BR',
      completionDate: 'Ready', brand: 'Jumeirah',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=85',
      lat: 25.0800, lng: 55.1400,
    },
    {
      id: 7, title: 'Chelsea Residences by DAMAC', developer: 'DAMAC', developerLogo: '',
      location: 'Business Bay', community: 'Business Bay', status: 'Off-Plan',
      startingPrice: 'AED 3,138,000', pricePerSqft: 'AED 2,100', beds: '1 – 3 BR',
      completionDate: 'Q3 2027', brand: 'Chelsea FC',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=85',
      badge: 'Off Plan', lat: 25.1880, lng: 55.2600,
    },
    {
      id: 8, title: 'Como Residences', developer: 'Nakheel', developerLogo: '',
      location: 'Palm Jumeirah', community: 'Palm Jumeirah', status: 'Off-Plan',
      startingPrice: 'AED 37,000,000', pricePerSqft: 'AED 9,400', beds: '4 – 7 BR',
      completionDate: 'Q4 2027', brand: 'COMO Hotels',
      image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&q=85',
      badge: 'Rare', lat: 25.1050, lng: 55.1250,
    },
    {
      id: 9, title: 'W Residences Downtown', developer: 'DAR Global', developerLogo: '',
      location: 'Downtown Dubai', community: 'Downtown Dubai', status: 'Off-Plan',
      startingPrice: 'AED 4,500,000', pricePerSqft: 'AED 3,500', beds: '1 – 3 BR',
      completionDate: 'Q2 2026', brand: 'W Hotels',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=85',
      lat: 25.1930, lng: 55.2780,
    },
    {
      id: 10, title: 'Rosewood Residences', developer: 'IRTH Development', developerLogo: '',
      location: 'Emaar Beachfront', community: 'Dubai Harbour', status: 'Off-Plan',
      startingPrice: 'AED 8,200,000', pricePerSqft: 'AED 5,100', beds: '2 – 4 BR',
      completionDate: 'Q3 2027', brand: 'Rosewood Hotels',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=85',
      badge: 'Waterfront', lat: 25.0860, lng: 55.1320,
    },
    {
      id: 11, title: 'Baccarat Hotel & Residences', developer: 'SH Hotels', developerLogo: '',
      location: 'Downtown Dubai', community: 'Downtown Dubai', status: 'Off-Plan',
      startingPrice: 'AED 12,000,000', pricePerSqft: 'AED 7,200', beds: '1 – 4 BR',
      completionDate: 'Q1 2028', brand: 'Baccarat',
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=85',
      badge: 'Ultra Luxury', lat: 25.1945, lng: 55.2760,
    },
    {
      id: 12, title: 'Four Seasons Private Residences', developer: 'Four Seasons', developerLogo: '',
      location: 'DIFC', community: 'DIFC', status: 'Ready',
      startingPrice: 'AED 14,500,000', pricePerSqft: 'AED 6,800', beds: '2 – 5 BR',
      completionDate: 'Ready', brand: 'Four Seasons',
      image: 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=900&q=85',
      lat: 25.2141, lng: 55.2810,
    },
  ];

  filteredResidences = computed(() => {
    let list = [...this.allResidences];
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    if (f !== 'All') list = list.filter(r => r.status === f);
    if (q) list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.developer.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q)
    );
    return list;
  });

  hoveredResidence = computed(() =>
    this.allResidences.find(r => r.id === this.hoveredId()) ?? null
  );

  mapSrc = computed((): SafeResourceUrl => {
    const h = this.hoveredResidence();
    const lat = h?.lat ?? 25.1972;
    const lng = h?.lng ?? 55.2744;
    const zoom = 14;
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor(private sanitizer: DomSanitizer) {}

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
