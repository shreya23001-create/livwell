import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  type: 'Apartment' | 'Villa' | 'Townhouse' | 'Penthouse' | 'Mixed';
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
export class OffPlanComponent {

  searchQuery = signal('');
  selectedType = signal('All');
  selectedLocation = signal('All');
  selectedBeds = signal('All');
  selectedHandover = signal('All');
  sortBy = signal('newest');

  readonly projectTypes = ['All', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Mixed'];
  readonly locations = ['All', 'Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'Dubai Hills Estate', 'Dubai Creek Harbour', 'MBR City', 'JVC', 'Al Furjan', 'Emaar Beachfront'];
  readonly bedOptions = ['All', 'Studio', '1', '2', '3', '4', '5+'];
  readonly handoverOptions = ['All', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027', '2028', '2029+'];
  readonly sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'completion', label: 'Completion Date' },
  ];

  readonly allProjects: OffPlanProject[] = [
    {
      id: 1, slug: 'binghatti-zenith', title: 'Binghatti Zenith', developer: 'Binghatti Developers', location: 'Al Jaddaf, Dubai', community: 'Al Jaddaf',
      priceFrom: 750000, priceFromLabel: 'AED 750K', completionDate: 'Q4 2026',
      type: 'Apartment', badge: 'New Launch', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      beds: 'Studio – 3 Beds', description: 'Iconic architecture meets smart living in this striking development at Al Jaddaf.',
      amenities: ['Pool', 'Gym', 'Concierge', 'Smart Home'], isNew: true, isFeatured: true,
    },
    {
      id: 2, slug: 'emaar-skyrise', title: 'Emaar Skyrise', developer: 'Emaar Properties', location: 'Business Bay, Dubai', community: 'Business Bay',
      priceFrom: 1200000, priceFromLabel: 'AED 1.2M', completionDate: 'Q2 2027',
      type: 'Apartment', badge: 'Featured', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      beds: '1 – 4 Beds', description: 'Luxury high-rise residences with panoramic Burj Khalifa and canal views.',
      amenities: ['Infinity Pool', 'Sky Lounge', 'Gym', 'Valet'], isFeatured: true,
    },
    {
      id: 3, slug: 'nakheel-gardens', title: 'Nakheel Gardens', developer: 'Nakheel', location: 'Palm Jumeirah, Dubai', community: 'Palm Jumeirah',
      priceFrom: 3500000, priceFromLabel: 'AED 3.5M', completionDate: 'Q1 2027',
      type: 'Villa', badge: 'Hot', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      beds: '3 – 6 Beds', description: 'Exclusive beachfront villas on one of the world\'s most iconic islands.',
      amenities: ['Private Beach', 'Pool', 'Garden', 'Security'], isFeatured: true,
    },
    {
      id: 4, slug: 'creek-horizon', title: 'Creek Horizon', developer: 'Emaar Properties', location: 'Dubai Creek Harbour', community: 'Dubai Creek Harbour',
      priceFrom: 950000, priceFromLabel: 'AED 950K', completionDate: 'Q3 2026',
      type: 'Apartment', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      beds: '1 – 3 Beds', description: 'Waterfront living with stunning Creek Tower views and vibrant retail promenade.',
      amenities: ['Pool', 'Gym', 'Creek View', 'Kids Club'],
    },
    {
      id: 5, slug: 'damac-hills-vistas', title: 'Damac Hills Vistas', developer: 'Damac Properties', location: 'Dubai Hills Estate', community: 'Dubai Hills Estate',
      priceFrom: 2200000, priceFromLabel: 'AED 2.2M', completionDate: 'Q4 2027',
      type: 'Townhouse', badge: 'Limited Units', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      beds: '3 – 5 Beds', description: 'Contemporary townhomes surrounded by lush parks and championship golf course.',
      amenities: ['Golf Course', 'Pool', 'Park', 'Kids Play Area'],
    },
    {
      id: 6, slug: 'sobha-seahaven', title: 'Sobha Seahaven', developer: 'Sobha Realty', location: 'Dubai Harbour', community: 'Dubai Harbour',
      priceFrom: 4800000, priceFromLabel: 'AED 4.8M', completionDate: 'Q2 2026',
      type: 'Penthouse', badge: 'Exclusive', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      beds: '3 – 5 Beds', description: 'Ultra-luxury penthouses with private pools and uninterrupted sea views.',
      amenities: ['Private Pool', 'Concierge', 'Helipad', 'Marina Access'],
    },
    {
      id: 7, slug: 'meraas-elara', title: 'Meraas Elara', developer: 'Meraas', location: 'MBR City, Dubai', community: 'MBR City',
      priceFrom: 1100000, priceFromLabel: 'AED 1.1M', completionDate: 'Q1 2028',
      type: 'Apartment', badge: 'New Launch', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      beds: '1 – 4 Beds', description: 'Elegant living in the heart of Mohammed Bin Rashid City, next to Meydan.',
      amenities: ['Pool', 'Gym', 'Retail', 'BBQ Area'], isNew: true,
    },
    {
      id: 8, slug: 'azizi-riviera-phase-5', title: 'Azizi Riviera Phase 5', developer: 'Azizi Developments', location: 'Meydan, Dubai', community: 'Meydan',
      priceFrom: 680000, priceFromLabel: 'AED 680K', completionDate: 'Q2 2026',
      type: 'Apartment', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      beds: 'Studio – 2 Beds', description: 'French Riviera-inspired canal community with retail and dining at your doorstep.',
      amenities: ['Canal View', 'Pool', 'Gym', 'Promenade'],
    },
    {
      id: 9, slug: 'aldar-yas-residences', title: 'Aldar Yas Residences', developer: 'Aldar Properties', location: 'Dubai South', community: 'Dubai South',
      priceFrom: 890000, priceFromLabel: 'AED 890K', completionDate: 'Q3 2027',
      type: 'Villa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      beds: '3 – 4 Beds', description: 'Spacious family villas near Al Maktoum International Airport in a green community.',
      amenities: ['Pool', 'Garden', 'Kids Club', 'Security'],
    },
    {
      id: 10, slug: 'select-group-marina-gate-iii', title: 'Select Group Marina Gate III', developer: 'Select Group', location: 'Dubai Marina', community: 'Dubai Marina',
      priceFrom: 1350000, priceFromLabel: 'AED 1.35M', completionDate: 'Q4 2026',
      type: 'Apartment', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      beds: '1 – 3 Beds', description: 'Premium marina-front residences steps away from JBR Walk and Dubai Marina Mall.',
      amenities: ['Marina View', 'Pool', 'Gym', 'Concierge'],
    },
    {
      id: 11, slug: 'danube-oceanz', title: 'Danube Oceanz', developer: 'Danube Properties', location: 'Dubai Maritime City', community: 'Maritime City',
      priceFrom: 790000, priceFromLabel: 'AED 790K', completionDate: 'Q1 2027',
      type: 'Apartment', badge: 'Trending', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      beds: 'Studio – 3 Beds', description: 'Waterfront residences in Dubai\'s premier maritime hub with sea-facing amenities.',
      amenities: ['Sea View', 'Pool', 'Water Sports', 'Gym'],
    },
    {
      id: 12, slug: 'omniyat-the-lana', title: 'Omniyat The Lana', developer: 'Omniyat', location: 'Business Bay, Dubai', community: 'Business Bay',
      priceFrom: 6500000, priceFromLabel: 'AED 6.5M', completionDate: 'Q2 2026',
      type: 'Penthouse', badge: 'Ultra Luxury', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      beds: '2 – 5 Beds', description: 'Dorchester Collection-branded residences redefining ultra-luxury in Business Bay.',
      amenities: ['Hotel Services', 'Private Pool', 'Spa', 'Concierge'],
    },
  ];

  filteredProjects = computed(() => {
    let list = this.allProjects.filter(p => {
      const q = this.searchQuery().toLowerCase();
      if (q && !p.title.toLowerCase().includes(q) && !p.developer.toLowerCase().includes(q) && !p.community.toLowerCase().includes(q)) return false;
      if (this.selectedType() !== 'All' && p.type !== this.selectedType()) return false;
      if (this.selectedLocation() !== 'All' && p.community !== this.selectedLocation()) return false;
      if (this.selectedHandover() !== 'All' && !p.completionDate.includes(this.selectedHandover())) return false;
      return true;
    });

    const sort = this.sortBy();
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.priceFrom - a.priceFrom);

    return list;
  });

  faqs: FaqItem[] = [
    { question: 'What qualifies as an off-plan project in Dubai?', answer: 'An off-plan property is one that is purchased before or during construction, directly from the developer at pre-launch prices.', open: false },
    { question: 'How reliable are off-plan developers in Dubai?', answer: 'Dubai\'s RERA (Real Estate Regulatory Agency) regulates all developers and mandates escrow accounts to protect buyer funds.', open: false },
    { question: 'What payment plans are typically available?', answer: 'Most developers offer 40/60, 50/50, or post-handover plans. Some offer 1% monthly plans. Terms vary by developer and project.', open: false },
    { question: 'When does property appreciation happen on new projects?', answer: 'Properties typically appreciate from launch to handover. Prime locations in Dubai have historically seen 15–30% appreciation over the project cycle.', open: false },
    { question: 'Can I invest in off-plan projects if I\'m based outside the UAE?', answer: 'Yes. Foreign nationals can purchase freehold property in designated areas. We can assist with remote signing and power of attorney.', open: false },
    { question: 'Is a mortgage available for off-plan properties in Dubai?', answer: 'Yes, banks offer off-plan mortgages up to 50% LTV during construction. Full mortgage kicks in at completion. We work with leading UAE banks.', open: false },
  ];

  toggleFaq(index: number) {
    this.faqs = this.faqs.map((f, i) => ({ ...f, open: i === index ? !f.open : false }));
  }

  readonly seoLinks = {
    dubaiProjects: ['Downtown Dubai Projects', 'Palm Jumeirah Projects', 'Dubai Marina Projects', 'Business Bay Projects', 'Dubai Hills Projects', 'Dubai Creek Harbour', 'MBR City Projects', 'JVC Projects', 'Al Furjan Projects', 'Emaar Beachfront'],
    dubaiProperties: ['Apartments for Sale', 'Villas for Sale', 'Townhouses for Sale', 'Penthouses for Sale', 'Studio Apartments', '1 Bedroom Apartments', '2 Bedroom Apartments', '3 Bedroom Apartments', '4 Bedroom Apartments', '5 Bedroom Villas'],
    offPlanProperties: ['Off-Plan Apartments', 'Off-Plan Villas', 'Off-Plan Townhouses', 'Luxury Off-Plan', 'Branded Residences', 'Waterfront Projects', 'Golf Community Projects', 'Affordable Off-Plan', 'Payment Plan Projects', 'Handover 2026'],
    luxuryProjects: ['Emaar Projects', 'Nakheel Projects', 'Damac Projects', 'Sobha Projects', 'Binghatti Projects', 'Meraas Projects', 'Aldar Projects', 'Omniyat Projects', 'Select Group', 'Danube Projects'],
    residentialTypes: ['Furnished Apartments', 'Unfurnished Apartments', 'Smart Home Apartments', 'High-Rise Apartments', 'Low-Rise Apartments', 'Garden Apartments', 'Duplex Apartments', 'Simplex Apartments', 'Loft Apartments', 'Serviced Apartments'],
    developers: ['Emaar Properties', 'Nakheel', 'Damac Properties', 'Sobha Realty', 'Binghatti', 'Meraas', 'Aldar', 'Azizi', 'Danube', 'Select Group'],
    areas: ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Business Bay', 'DIFC', 'JBR', 'Jumeirah', 'Al Barsha', 'Arabian Ranches', 'Dubai South'],
  };

  readonly offices = [
    { name: 'HQ – Business Bay', address: 'Bay Square Building 1, Business Bay' },
    { name: 'Br – Palm Jumeirah', address: 'Shoreline Apartments, Palm Jumeirah' },
    { name: 'Br – Dubai Marina', address: 'Marina Walk, Dubai Marina' },
    { name: 'Br – JVC', address: 'Circle Mall, Jumeirah Village Circle' },
    { name: 'Br – Downtown', address: 'Burj Views Podium, Downtown Dubai' },
    { name: 'Br – Dubai Hills', address: 'Hills Business Park, Dubai Hills' },
    { name: 'Br – Deira', address: 'Al Rigga Road, Deira' },
    { name: 'Br – Al Barsha', address: 'Al Barsha 1, Sheikh Zayed Road' },
    { name: 'Br – DIFC', address: 'Gate Village, DIFC' },
    { name: 'Br – Mirdif', address: 'Mirdif City Centre, Mirdif' },
  ];
}
