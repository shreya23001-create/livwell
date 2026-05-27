import { Component, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

interface LuxuryProperty {
  id: number;
  title: string;
  developer: string;
  location: string;
  type: 'Apartment' | 'Villa' | 'Home' | 'Penthouse' | 'Townhouse';
  status: 'Ready' | 'Off-Plan' | 'Under Construction';
  price: number;
  priceDisplay: string;
  pricePerSqft: string;
  beds: number | 'Studio';
  baths: number;
  area: number;
  areaDisplay: string;
  image: string;
  badge?: string;
  furnished?: boolean;
  waterfront?: boolean;
  beachfront?: boolean;
  forRent?: boolean;
  agent: { name: string; phone: string; email: string; avatar: string };
}

@Component({
  selector: 'app-luxury-properties-for-sale',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './luxury-properties-for-sale.component.html',
  styleUrl: './luxury-properties-for-sale.component.scss',
})
export class LuxuryPropertiesForSaleComponent {

  // ── Search & filter state ──────────────────────────────
  searchArea = signal('');
  activeType = signal('Any');
  activeBeds = signal('Any');
  activeBaths = signal('Any');
  priceMin = signal('');
  priceMax = signal('');
  areaMin = signal('');
  areaMax = signal('');
  filterFurnished = signal(false);
  filterWaterfront = signal(false);
  filterBeachfront = signal(false);
  activeStatus = signal('All');
  interestedTo = signal<'Buy' | 'Rent'>('Buy');
  sortBy = signal('default');

  // ── Dropdown open state ────────────────────────────────
  openDropdown = signal<string | null>(null);

  readonly propertyTypes = ['Any', 'Apartment', 'Villa', 'Townhouse', 'Home', 'Penthouse'];
  readonly bedOptions = ['Any', 'Studio', '1', '2', '3', '4', '5', '6', '7+'];
  readonly bathOptions = ['Any', '1', '2', '3', '4', '5', '6', '7+'];
  readonly statusOptions = ['All', 'Ready', 'Off-Plan', 'Under Construction'];

  readonly allProperties: LuxuryProperty[] = [
    {
      id: 1, title: 'Address Residences Dubai Opera', developer: 'Emaar', location: 'Downtown Dubai',
      type: 'Apartment', status: 'Ready', price: 4200000, priceDisplay: 'AED 4,200,000',
      pricePerSqft: 'AED 3,800', beds: 2, baths: 3, area: 1105, areaDisplay: '1,105 sqft',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=85',
      badge: 'Furnished', furnished: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 2, title: 'Dorchester Collection Dubai', developer: 'OMNIYAT', location: 'Business Bay',
      type: 'Apartment', status: 'Ready', price: 9800000, priceDisplay: 'AED 9,800,000',
      pricePerSqft: 'AED 4,200', beds: 3, baths: 4, area: 2333, areaDisplay: '2,333 sqft',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=900&q=85',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 3, title: 'Six Senses Residences', developer: 'Select Group', location: 'Palm Jumeirah',
      type: 'Apartment', status: 'Off-Plan', price: 5500000, priceDisplay: 'AED 5,500,000',
      pricePerSqft: 'AED 3,200', beds: 2, baths: 3, area: 1718, areaDisplay: '1,718 sqft',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85',
      badge: 'New Launch', beachfront: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 4, title: 'Emaar Beachfront Grand Bleu', developer: 'Emaar', location: 'Dubai Harbour',
      type: 'Apartment', status: 'Under Construction', price: 4500000, priceDisplay: 'AED 4,500,000',
      pricePerSqft: 'AED 3,100', beds: 1, baths: 2, area: 1451, areaDisplay: '1,451 sqft',
      image: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=900&q=85',
      badge: 'High ROI', waterfront: true, beachfront: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 5, title: 'Bulgari Ocean Mansions', developer: 'Meraas', location: 'Jumeira Bay Island',
      type: 'Villa', status: 'Off-Plan', price: 65000000, priceDisplay: 'AED 65,000,000',
      pricePerSqft: 'AED 12,500', beds: 6, baths: 8, area: 12000, areaDisplay: '12,000 sqft',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85',
      badge: 'Ultra Luxury', waterfront: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 6, title: 'District One Villas Phase 3', developer: 'Meydan', location: 'MBR City',
      type: 'Villa', status: 'Off-Plan', price: 8900000, priceDisplay: 'AED 8,900,000',
      pricePerSqft: 'AED 2,200', beds: 5, baths: 6, area: 7200, areaDisplay: '7,200 sqft',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85',
      badge: 'Limited',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 7, title: 'Jumeirah Islands Villa', developer: 'Nakheel', location: 'Jumeirah Islands',
      type: 'Villa', status: 'Ready', price: 12500000, priceDisplay: 'AED 12,500,000',
      pricePerSqft: 'AED 2,800', beds: 5, baths: 6, area: 8928, areaDisplay: '8,928 sqft',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=85',
      waterfront: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 8, title: 'Lanai Islands by Majid Al Futtaim', developer: 'Majid Al Futtaim', location: 'Tilal Al Ghaf',
      type: 'Home', status: 'Off-Plan', price: 7200000, priceDisplay: 'AED 7,200,000',
      pricePerSqft: 'AED 1,950', beds: 4, baths: 5, area: 5500, areaDisplay: '5,500 sqft',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85',
      badge: 'Golf View',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 9, title: 'Sobha Hartland Forest Villas', developer: 'Sobha Realty', location: 'MBR City',
      type: 'Home', status: 'Ready', price: 6800000, priceDisplay: 'AED 6,800,000',
      pricePerSqft: 'AED 2,100', beds: 4, baths: 5, area: 4800, areaDisplay: '4,800 sqft',
      image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=85',
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 10, title: "One Za'abeel Sky Penthouse", developer: 'Ithra Dubai', location: "Za'abeel",
      type: 'Penthouse', status: 'Ready', price: 28000000, priceDisplay: 'AED 28,000,000',
      pricePerSqft: 'AED 7,200', beds: 4, baths: 5, area: 6500, areaDisplay: '6,500 sqft',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=85',
      badge: 'Iconic',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 11, title: 'Nakheel Como Residences Penthouse', developer: 'Nakheel', location: 'Palm Jumeirah',
      type: 'Penthouse', status: 'Off-Plan', price: 37000000, priceDisplay: 'AED 37,000,000',
      pricePerSqft: 'AED 9,400', beds: 5, baths: 6, area: 9800, areaDisplay: '9,800 sqft',
      image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&q=85',
      badge: 'Rare', waterfront: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 12, title: 'Jumeirah Living Business Bay', developer: 'Jumeirah Group', location: 'Business Bay',
      type: 'Penthouse', status: 'Ready', price: 11000000, priceDisplay: 'AED 11,000,000',
      pricePerSqft: 'AED 4,800', beds: 3, baths: 4, area: 4600, areaDisplay: '4,600 sqft',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=85',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    // ── Townhouse for Sale ────────────────────────────────
    {
      id: 19, title: 'Cherrywoods Townhouses', developer: 'Meraas', location: 'Dubai Science Park',
      type: 'Townhouse', status: 'Ready', price: 3200000, priceDisplay: 'AED 3,200,000',
      pricePerSqft: 'AED 1,400', beds: 3, baths: 4, area: 2285, areaDisplay: '2,285 sqft',
      image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&q=85',
      badge: 'Ready to Move',
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 20, title: 'Mudon Al Ranim Townhouses', developer: 'Dubai Properties', location: 'Mudon',
      type: 'Townhouse', status: 'Off-Plan', price: 4100000, priceDisplay: 'AED 4,100,000',
      pricePerSqft: 'AED 1,650', beds: 4, baths: 5, area: 2486, areaDisplay: '2,486 sqft',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
      badge: 'Golf Community',
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    // ── For Rent — Apartments ─────────────────────────────
    {
      id: 13, title: 'Burj Vista Luxury Apartment', developer: 'Emaar', location: 'Downtown Dubai',
      type: 'Apartment', status: 'Ready', price: 280000, priceDisplay: 'AED 280,000 / yr',
      pricePerSqft: 'AED 253', beds: 2, baths: 3, area: 1105, areaDisplay: '1,105 sqft',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=85',
      badge: 'Furnished', furnished: true, forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 14, title: 'Dorchester Collection Dubai', developer: 'OMNIYAT', location: 'Business Bay',
      type: 'Apartment', status: 'Ready', price: 420000, priceDisplay: 'AED 420,000 / yr',
      pricePerSqft: 'AED 180', beds: 3, baths: 4, area: 2333, areaDisplay: '2,333 sqft',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=85',
      forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 16, title: 'Six Senses Palm Residences', developer: 'Select Group', location: 'Palm Jumeirah',
      type: 'Apartment', status: 'Ready', price: 350000, priceDisplay: 'AED 350,000 / yr',
      pricePerSqft: 'AED 204', beds: 2, baths: 3, area: 1718, areaDisplay: '1,718 sqft',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=85',
      badge: 'Beachfront', beachfront: true, forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    // ── For Rent — Villas ─────────────────────────────────
    {
      id: 15, title: 'Bulgari Ocean Mansion Villa', developer: 'Meraas', location: 'Jumeira Bay Island',
      type: 'Villa', status: 'Ready', price: 2800000, priceDisplay: 'AED 2,800,000 / yr',
      pricePerSqft: 'AED 233', beds: 6, baths: 8, area: 12000, areaDisplay: '12,000 sqft',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85',
      badge: 'Ultra Luxury', waterfront: true, forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 17, title: 'Palm Signature Villa', developer: 'Nakheel', location: 'Palm Jumeirah',
      type: 'Villa', status: 'Ready', price: 950000, priceDisplay: 'AED 950,000 / yr',
      pricePerSqft: 'AED 106', beds: 5, baths: 6, area: 8928, areaDisplay: '8,928 sqft',
      image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&q=85',
      waterfront: true, forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    // ── For Rent — Homes ──────────────────────────────────
    {
      id: 21, title: 'Sobha Hartland Forest Home', developer: 'Sobha Realty', location: 'MBR City',
      type: 'Home', status: 'Ready', price: 480000, priceDisplay: 'AED 480,000 / yr',
      pricePerSqft: 'AED 100', beds: 4, baths: 5, area: 4800, areaDisplay: '4,800 sqft',
      image: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=900&q=85',
      forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      id: 22, title: 'Tilal Al Ghaf Luxury Home', developer: 'Majid Al Futtaim', location: 'Tilal Al Ghaf',
      type: 'Home', status: 'Ready', price: 380000, priceDisplay: 'AED 380,000 / yr',
      pricePerSqft: 'AED 80', beds: 4, baths: 4, area: 4750, areaDisplay: '4,750 sqft',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=85',
      badge: 'Lagoon View', forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    // ── For Rent — Penthouses ─────────────────────────────
    {
      id: 18, title: "One Za'abeel Sky Penthouse", developer: 'Ithra Dubai', location: "Za'abeel",
      type: 'Penthouse', status: 'Ready', price: 1200000, priceDisplay: 'AED 1,200,000 / yr',
      pricePerSqft: 'AED 185', beds: 4, baths: 5, area: 6500, areaDisplay: '6,500 sqft',
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=85',
      badge: 'Iconic', forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
    {
      id: 23, title: 'Como Residences Sky Penthouse', developer: 'Nakheel', location: 'Palm Jumeirah',
      type: 'Penthouse', status: 'Ready', price: 2400000, priceDisplay: 'AED 2,400,000 / yr',
      pricePerSqft: 'AED 245', beds: 5, baths: 6, area: 9800, areaDisplay: '9,800 sqft',
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=85',
      badge: 'Sea View', waterfront: true, forRent: true,
      agent: { name: 'Anuj Sharma', phone: '+971542481813', email: 'anuj@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    // ── For Rent — Townhouses ─────────────────────────────
    {
      id: 24, title: 'Cherrywoods Townhouse Rental', developer: 'Meraas', location: 'Dubai Science Park',
      type: 'Townhouse', status: 'Ready', price: 185000, priceDisplay: 'AED 185,000 / yr',
      pricePerSqft: 'AED 81', beds: 3, baths: 4, area: 2285, areaDisplay: '2,285 sqft',
      image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=85',
      forRent: true,
      agent: { name: 'Niket Mehta', phone: '+971585798027', email: 'niket@livwelldubai.ae', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    },
  ];

  filteredProperties = computed(() => {
    let list = [...this.allProperties];
    const intent = this.interestedTo();
    list = list.filter(p => intent === 'Rent' ? !!p.forRent : !p.forRent);
    const type = this.activeType();
    const beds = this.activeBeds();
    const baths = this.activeBaths();
    const pMin = this.priceMin() ? parseInt(this.priceMin().replace(/,/g, '')) : 0;
    const pMax = this.priceMax() ? parseInt(this.priceMax().replace(/,/g, '')) : Infinity;
    const aMin = this.areaMin() ? parseInt(this.areaMin().replace(/,/g, '')) : 0;
    const aMax = this.areaMax() ? parseInt(this.areaMax().replace(/,/g, '')) : Infinity;
    const status = this.activeStatus();
    const search = this.searchArea().toLowerCase().trim();

    if (type !== 'Any') list = list.filter(p => p.type === type);
    if (status !== 'All') list = list.filter(p => p.status === status);
    if (beds !== 'Any') {
      list = list.filter(p => {
        if (beds === 'Studio') return p.beds === 'Studio';
        if (beds === '7+') return typeof p.beds === 'number' && p.beds >= 7;
        return p.beds === parseInt(beds);
      });
    }
    if (baths !== 'Any') {
      list = list.filter(p => {
        if (baths === '7+') return p.baths >= 7;
        return p.baths === parseInt(baths);
      });
    }
    if (pMin > 0) list = list.filter(p => p.price >= pMin);
    if (pMax < Infinity) list = list.filter(p => p.price <= pMax);
    if (aMin > 0) list = list.filter(p => p.area >= aMin);
    if (aMax < Infinity) list = list.filter(p => p.area <= aMax);
    if (this.filterFurnished()) list = list.filter(p => p.furnished);
    if (this.filterWaterfront()) list = list.filter(p => p.waterfront);
    if (this.filterBeachfront()) list = list.filter(p => p.beachfront);
    if (search) list = list.filter(p =>
      p.location.toLowerCase().includes(search) ||
      p.title.toLowerCase().includes(search) ||
      p.developer.toLowerCase().includes(search)
    );

    const sort = this.sortBy();
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'area-desc') list.sort((a, b) => b.area - a.area);

    return list;
  });

  pageDesc = computed(() => {
    const t = this.activeType();
    const isRent = this.interestedTo() === 'Rent';
    const map: Record<string, { buy: string; rent: string }> = {
      Any:       { buy: "Explore an exclusive collection of ultra-premium properties for sale across Dubai's most coveted addresses — from sky-high penthouses to sprawling waterfront villas.", rent: "Find your perfect luxury rental in Dubai. From fully furnished penthouses to beachfront villas, discover residences that match an elevated lifestyle." },
      Apartment: { buy: "Own a piece of Dubai's iconic skyline. Browse luxury apartments for sale in Downtown, Business Bay, Palm Jumeirah, and beyond — crafted by the world's finest developers.", rent: "Rent a world-class luxury apartment in Dubai's most prestigious towers. High-floor views, premium amenities, and flexible lease terms await." },
      Villa:     { buy: "Invest in Dubai's most sought-after luxury villas for sale. Gated communities, private pools, and expansive gardens in Palm Jumeirah, Emirates Hills, and more.", rent: "Experience the pinnacle of villa living. Rent a luxury villa in Dubai with private pools, lush gardens, and direct beach or waterfront access." },
      Home:      { buy: "Discover luxury homes for sale in Dubai's premier residential communities — bespoke architecture, landscaped grounds, and unmatched privacy.", rent: "Rent a luxury home in one of Dubai's most exclusive neighbourhoods. Spacious layouts, premium finishes, and resort-style amenities." },
      Penthouse: { buy: "Acquire an iconic penthouse in Dubai. Sky-high living with panoramic city and sea views, private terraces, and white-glove building services.", rent: "Rent a luxury penthouse in Dubai and live above it all. Floor-to-ceiling glass, wraparound terraces, and concierge services at the most prestigious addresses." },
      Townhouse: { buy: "Browse luxury townhouses for sale in Dubai's finest gated communities — the perfect blend of villa privacy and contemporary apartment convenience.", rent: "Rent a luxury townhouse in Dubai with the space and privacy of a villa, in an exclusive community with world-class facilities." },
    };
    const entry = map[t] ?? map['Any'];
    return isRent ? entry.rent : entry.buy;
  });

  pageTitle = computed(() => {
    const t = this.activeType();
    const action = this.interestedTo() === 'Rent' ? 'for Rent' : 'for Sale';
    const map: Record<string, string> = {
      Any: `Luxury Properties ${action} in Dubai`,
      Apartment: `Luxury Apartments ${action} in Dubai`,
      Villa: `Luxury Villas ${action} in Dubai`,
      Home: `Luxury Homes ${action} in Dubai`,
      Penthouse: `Luxury Penthouses ${action} in Dubai`,
      Townhouse: `Luxury Townhouses ${action} in Dubai`,
    };
    return map[t] ?? `Luxury Properties ${action} in Dubai`;
  });

  activeFiltersCount = computed(() => {
    let n = 0;
    if (this.filterFurnished()) n++;
    if (this.filterWaterfront()) n++;
    if (this.filterBeachfront()) n++;
    if (this.areaMin() || this.areaMax()) n++;
    return n;
  });

  constructor(private route: ActivatedRoute, private router: Router, private el: ElementRef) {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type && this.propertyTypes.includes(type)) {
        this.activeType.set(type);
      }
      const intent = params.get('intent');
      this.interestedTo.set(intent === 'Rent' ? 'Rent' : 'Buy');
    });
  }

  setIntent(value: 'Buy' | 'Rent') {
    this.interestedTo.set(value);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: { intent: value },
    });
  }

  toggleDropdown(name: string) {
    this.openDropdown.set(this.openDropdown() === name ? null : name);
  }

  closeDropdown(name: string) {
    if (this.openDropdown() === name) this.openDropdown.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) {
      this.openDropdown.set(null);
    }
  }

  resetAll() {
    this.activeType.set('Any');
    this.activeBeds.set('Any');
    this.activeBaths.set('Any');
    this.priceMin.set('');
    this.priceMax.set('');
    this.areaMin.set('');
    this.areaMax.set('');
    this.filterFurnished.set(false);
    this.filterWaterfront.set(false);
    this.filterBeachfront.set(false);
    this.activeStatus.set('All');
    this.interestedTo.set('Buy');
    this.searchArea.set('');
  }

  slugify(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  statusClass(status: string): string {
    return ({ 'Ready': 'status--ready', 'Off-Plan': 'status--offplan', 'Under Construction': 'status--construction' }[status] ?? '');
  }

  bedsLabel(): string {
    const b = this.activeBeds();
    if (b === 'Any') return 'Beds';
    if (b === 'Studio') return 'Studio';
    return `${b} Bed${b === '1' ? '' : 's'}`;
  }

  priceLabel(): string {
    const mn = this.priceMin(), mx = this.priceMax();
    if (!mn && !mx) return 'Price';
    if (mn && !mx) return `AED ${mn}+`;
    if (!mn && mx) return `Up to AED ${mx}`;
    return `AED ${mn} – ${mx}`;
  }

  typeLabel(): string {
    return this.activeType() === 'Any' ? 'Property Type' : this.activeType() + 's';
  }
}
