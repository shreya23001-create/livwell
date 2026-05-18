import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyListing } from '../properties/properties.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

// Full property dataset (same source as listing page)
const ALL_PROPERTIES: PropertyListing[] = [
  {
    id: 1, title: 'Luxury Penthouse with Burj View', location: 'Downtown Dubai, UAE', community: 'Downtown Dubai',
    price: 4500000, priceLabel: 'AED 4,500,000', pricePerSqft: 'AED 1,406/sqft',
    beds: 4, baths: 3, sqft: 3200, sqftLabel: '3,200 sqft',
    type: 'Penthouse', status: 'Sale', furnished: 'Furnished', badge: 'Featured',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=90',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Gym', 'Concierge', 'Balcony', 'Parking'],
    developer: 'Emaar', completionYear: '2022', isOffPlan: false,
    views: 1842, postedDate: '2026-05-10', lat: 25.1972, lng: 55.2744,
    agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971501234567',
  },
  {
    id: 2, title: 'Modern Villa with Private Pool', location: 'Palm Jumeirah, Dubai', community: 'Palm Jumeirah',
    price: 8200000, priceLabel: 'AED 8,200,000', pricePerSqft: 'AED 1,414/sqft',
    beds: 5, baths: 5, sqft: 5800, sqftLabel: '5,800 sqft',
    type: 'Villa', status: 'Sale', furnished: 'Unfurnished', badge: 'Hot',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=90',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Gym', 'Beach Access', 'Parking', 'Security', 'BBQ Area'],
    developer: 'Nakheel', completionYear: '2021', isOffPlan: false,
    views: 3210, postedDate: '2026-05-08', lat: 25.1124, lng: 55.1390,
    agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971502345678',
  },
  {
    id: 3, title: 'Beachfront Apartment Sea Views', location: 'JBR Walk, Dubai Marina', community: 'JBR',
    price: 2100000, priceLabel: 'AED 2,100,000', pricePerSqft: 'AED 1,448/sqft',
    beds: 2, baths: 2, sqft: 1450, sqftLabel: '1,450 sqft',
    type: 'Apartment', status: 'Sale', furnished: 'Furnished', badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Gym', 'Beach Access', 'Balcony', 'Parking'],
    developer: 'Meraas', completionYear: '2023', isOffPlan: false,
    views: 987, postedDate: '2026-05-12', lat: 25.0777, lng: 55.1328,
    agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971503456789',
  },
  {
    id: 4, title: 'Contemporary Townhouse Family Living', location: 'Arabian Ranches, Dubai', community: 'Arabian Ranches',
    price: 3750000, priceLabel: 'AED 3,750,000', pricePerSqft: 'AED 1,293/sqft',
    beds: 4, baths: 3, sqft: 2900, sqftLabel: '2,900 sqft',
    type: 'Townhouse', status: 'Sale', furnished: 'Unfurnished',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=90',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Kids Play Area', 'Security', 'Parking', 'BBQ Area'],
    developer: 'Emaar', completionYear: '2020', isOffPlan: false,
    views: 654, postedDate: '2026-05-06', lat: 25.0501, lng: 55.2607,
    agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971504567890',
  },
  {
    id: 5, title: 'Sky View Studio Business Bay', location: 'Business Bay, Dubai', community: 'Business Bay',
    price: 980000, priceLabel: 'AED 980,000', pricePerSqft: 'AED 1,508/sqft',
    beds: 'Studio', baths: 1, sqft: 650, sqftLabel: '650 sqft',
    type: 'Apartment', status: 'Sale', furnished: 'Furnished', badge: 'Reduced',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
    ],
    amenities: ['Gym', 'Concierge', 'Parking', 'Balcony'],
    developer: 'DAMAC', completionYear: '2024', isOffPlan: false,
    views: 1543, postedDate: '2026-05-14', lat: 25.1867, lng: 55.2640,
    agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971501234567',
  },
  {
    id: 6, title: 'Heritage Mansion Emirates Hills', location: 'Emirates Hills, Dubai', community: 'Emirates Hills',
    price: 22000000, priceLabel: 'AED 22,000,000', pricePerSqft: 'AED 1,774/sqft',
    beds: 7, baths: 8, sqft: 12400, sqftLabel: '12,400 sqft',
    type: 'Villa', status: 'Sale', furnished: 'Furnished', badge: 'Exclusive',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Golf Course', 'Gym', 'Security', 'Concierge', 'Maid Room', 'Parking', 'BBQ Area'],
    developer: 'Emaar', completionYear: '2018', isOffPlan: false,
    views: 4120, postedDate: '2026-04-28', lat: 25.0798, lng: 55.1699,
    agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971502345678',
  },
  {
    id: 7, title: 'Marina View 1BR Apartment', location: 'Dubai Marina', community: 'Dubai Marina',
    price: 85000, priceLabel: 'AED 85,000/yr', pricePerSqft: 'AED 70/sqft/yr',
    beds: 1, baths: 1, sqft: 1200, sqftLabel: '1,200 sqft',
    type: 'Apartment', status: 'Rent', furnished: 'Furnished',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=90',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Gym', 'Marina View', 'Balcony', 'Parking'],
    developer: 'Select Group', completionYear: '2019', isOffPlan: false,
    views: 2890, postedDate: '2026-05-15', lat: 25.0782, lng: 55.1401,
    agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971503456789',
  },
  {
    id: 8, title: '3BR Townhouse Dubai Hills', location: 'Dubai Hills Estate, Dubai', community: 'Dubai Hills Estate',
    price: 220000, priceLabel: 'AED 220,000/yr', pricePerSqft: 'AED 88/sqft/yr',
    beds: 3, baths: 3, sqft: 2500, sqftLabel: '2,500 sqft',
    type: 'Townhouse', status: 'Rent', furnished: 'Semi-Furnished',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=90',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Kids Play Area', 'Security', 'Parking'],
    developer: 'Emaar', completionYear: '2022', isOffPlan: false,
    views: 432, postedDate: '2026-05-13', lat: 25.1124, lng: 55.2233,
    agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971504567890',
  },
  {
    id: 9, title: 'Premium Office Space Business Bay', location: 'Business Bay, Dubai', community: 'Business Bay',
    price: 350000, priceLabel: 'AED 350,000/yr',
    beds: 0 as any, baths: 2, sqft: 2800, sqftLabel: '2,800 sqft',
    type: 'Office', status: 'Rent', furnished: 'Furnished',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=90',
      'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&q=90',
    ],
    amenities: ['Parking', 'Concierge', 'Security', 'Gym'],
    developer: 'DWTC', completionYear: '2020', isOffPlan: false,
    views: 765, postedDate: '2026-05-11', lat: 25.1881, lng: 55.2644,
    agentName: 'Ahmed Hassan', agentAvatar: 'https://randomuser.me/api/portraits/men/45.jpg', agentPhone: '+971502345678',
  },
  {
    id: 10, title: '2BR Apartment JVC with Pool', location: 'Jumeirah Village Circle, Dubai', community: 'Jumeirah Village Circle',
    price: 1350000, priceLabel: 'AED 1,350,000', pricePerSqft: 'AED 964/sqft',
    beds: 2, baths: 2, sqft: 1400, sqftLabel: '1,400 sqft',
    type: 'Apartment', status: 'Sale', furnished: 'Unfurnished',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=90',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Gym', 'Kids Play Area', 'Parking'],
    developer: 'Binghatti', completionYear: '2025', isOffPlan: true,
    views: 312, postedDate: '2026-05-09', lat: 25.0609, lng: 55.2097,
    agentName: 'Priya Sharma', agentAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', agentPhone: '+971503456789',
  },
  {
    id: 11, title: 'Stunning 4BR Meydan Villa', location: 'Meydan, Dubai', community: 'Meydan',
    price: 5800000, priceLabel: 'AED 5,800,000', pricePerSqft: 'AED 1,254/sqft',
    beds: 4, baths: 4, sqft: 4625, sqftLabel: '4,625 sqft',
    type: 'Villa', status: 'Sale', furnished: 'Unfurnished', badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=90',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=90',
    ],
    amenities: ['Swimming Pool', 'Golf Course', 'Security', 'Parking', 'Maid Room'],
    developer: 'Meydan Group', completionYear: '2026', isOffPlan: true,
    views: 891, postedDate: '2026-05-07', lat: 25.1605, lng: 55.3119,
    agentName: 'Sarah Al-Mansouri', agentAvatar: 'https://randomuser.me/api/portraits/women/32.jpg', agentPhone: '+971501234567',
  },
  {
    id: 12, title: 'Retail Space Ground Floor JBR', location: 'JBR, Dubai Marina', community: 'JBR',
    price: 420000, priceLabel: 'AED 420,000/yr',
    beds: 0 as any, baths: 1, sqft: 1800, sqftLabel: '1,800 sqft',
    type: 'Retail', status: 'Rent', furnished: 'Unfurnished',
    images: [
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=90',
    ],
    amenities: ['Parking', 'Security'],
    developer: 'Meraas', completionYear: '2017', isOffPlan: false,
    views: 244, postedDate: '2026-05-05', lat: 25.0790, lng: 55.1320,
    agentName: 'Michael Chen', agentAvatar: 'https://randomuser.me/api/portraits/men/22.jpg', agentPhone: '+971504567890',
  },
];

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FooterComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  // v4 — with footer

  property = signal<PropertyListing | null>(null);
  activeImageIndex = signal(0);
  descExpanded = signal(false);
  isFaved = signal(false);

  // Mortgage calculator
  mortgagePrice = signal(0);
  mortgageDown = signal(20);
  mortgagePeriod = signal(25);
  mortgageRate = signal(4.5);

  monthlyPayment = computed(() => {
    const p = this.property();
    if (!p) return 0;
    const price = this.mortgagePrice() || p.price;
    const loan = price * (1 - this.mortgageDown() / 100);
    const r = this.mortgageRate() / 100 / 12;
    const n = this.mortgagePeriod() * 12;
    if (r === 0) return loan / n;
    return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  // Purchase costs
  purchaseCosts = computed(() => {
    const p = this.property();
    if (!p) return [];
    const price = p.price;
    return [
      { label: 'Purchase Price', amount: price },
      { label: 'Dubai Land Department Fee (4%)', amount: Math.round(price * 0.04) },
      { label: 'Agency Fee (2% + 5% VAT)', amount: Math.round(price * 0.021) },
      { label: 'Registration & Conveyancer', amount: 10000 },
      { label: 'Mortgage Registration (0.25%)', amount: Math.round(price * 0.0025) },
    ];
  });

  totalPurchaseCost = computed(() =>
    this.purchaseCosts().reduce((s, c) => s + c.amount, 0)
  );

  similarProperties = computed(() => {
    const p = this.property();
    if (!p) return [];
    return ALL_PROPERTIES
      .filter(x => x.id !== p.id && x.type === p.type)
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      const found = ALL_PROPERTIES.find(p => p.id === id) ?? null;
      this.property.set(found);
      if (found) {
        this.mortgagePrice.set(found.price);
      }
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0 });
      }
    });
  }

  setImage(i: number): void {
    this.activeImageIndex.set(i);
  }

  prevImage(): void {
    const p = this.property();
    if (!p) return;
    this.activeImageIndex.set((this.activeImageIndex() - 1 + p.images.length) % p.images.length);
  }

  nextImage(): void {
    const p = this.property();
    if (!p) return;
    this.activeImageIndex.set((this.activeImageIndex() + 1) % p.images.length);
  }

  formatBeds(beds: number | 'Studio'): string {
    if (beds === 'Studio') return 'Studio';
    if (beds === 0) return '—';
    return `${beds} Bed${beds > 1 ? 's' : ''}`;
  }

  formatPrice(n: number): string {
    return 'AED ' + n.toLocaleString('en-AE', { maximumFractionDigits: 0 });
  }

  getReferenceNumber(id: number): string {
    return `LW-${String(id).padStart(6, '0')}`;
  }

  getDescription(p: PropertyListing): string {
    return `This exceptional ${p.type.toLowerCase()} in ${p.community} offers an unparalleled living experience in one of Dubai's most sought-after communities. ` +
      `Spanning ${p.sqftLabel}, the property features ${this.formatBeds(p.beds)} and ${p.baths} bathrooms, ` +
      `finished to the highest standards with premium materials throughout.\n\n` +
      `The spacious layout is designed to maximise natural light and ventilation, with floor-to-ceiling windows ` +
      `offering stunning views. The open-plan kitchen features modern appliances and a large island perfect for entertaining. ` +
      `The master suite includes a walk-in wardrobe and en-suite bathroom with designer fixtures.\n\n` +
      `Residents enjoy access to world-class amenities including ${p.amenities.slice(0, 3).join(', ')} and more. ` +
      `${p.community} is strategically located with excellent connectivity to major highways and key destinations across Dubai.`;
  }
}
