import { Component, OnInit, ElementRef, QueryList, ViewChild, ViewChildren, PLATFORM_ID, Inject, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';

interface Property {
  id: number;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  type: string;
  badge?: string;
  image: string;
}

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

interface Agent {
  name: string;
  role: string;
  deals: number;
  rating: number;
  avatar: string;
  phone: string;
  email: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
}

interface NewsArticle {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UpperCasePipe, FooterComponent, NewsletterSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  searchQuery = signal('');
  searchType = signal('buy');

  searchTabs = [
    { value: 'buy', label: 'Buy' },
    { value: 'rent', label: 'Rent' },
    { value: 'new-projects', label: 'New Projects' },
  ];
  activeTestimonial = signal(0);
  activeSlide = signal(0);

  heroSlides = [
    {
      // Dark moody city skyline at dusk — towers lit up, stormy sky
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=90',
      project: 'Creek Horizon Residences',
      location: 'Dubai Creek Harbour',
      desc: 'Contemporary waterfront living with panoramic creek and skyline views in the heart of the new Dubai.',
      startingPrice: 'AED 1.8M',
      paymentPlan: '20 / 60 / 20 %',
    },
    {
      // Night city skyline — glowing towers, deep blue hour
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=90',
      project: 'Downtown Heights',
      location: 'Downtown Dubai',
      desc: 'Iconic residences steps from Burj Khalifa — where luxury meets the pulse of the city.',
      startingPrice: 'AED 2.4M',
      paymentPlan: '10 / 65 / 25 %',
    },
    {
      // Golden hour city skyline wide — warm towers, hazy horizon
      image: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=1920&q=90',
      project: 'Marina Cove',
      location: 'Dubai Marina',
      desc: 'Elegant apartments with full marina views. Lifestyle living at its finest.',
      startingPrice: 'AED 950K',
      paymentPlan: '20 / 55 / 25 %',
    },
    {
      // Deep blue hour city panorama — distant glowing skyline
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1920&q=90',
      project: 'Business Bay Towers',
      location: 'Business Bay',
      desc: 'Premium high-rise residences at the centre of Dubai\'s dynamic business and lifestyle district.',
      startingPrice: 'AED 1.2M',
      paymentPlan: '10 / 60 / 30 %',
    },
    {
      // Aerial city dusk — warm orange glow across dense skyline
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=90',
      project: 'Jumeirah Living',
      location: 'Jumeirah Beach Residence',
      desc: 'Beachfront residences with sweeping sea views and direct access to the finest dining and leisure.',
      startingPrice: 'AED 3.1M',
      paymentPlan: '20 / 55 / 25 %',
    },
    {
      // Luxury villa with pool — warm evening light, one villa slide
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&q=90',
      project: 'Emerald Hills Villa',
      location: 'Emirates Hills',
      desc: 'Sprawling private villa with lush gardens, infinity pool and panoramic city views.',
      startingPrice: 'AED 8.9M',
      paymentPlan: '20 / 50 / 30 %',
    },
    {
      // Contemporary villa exterior — minimalist, one villa slide
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90',
      project: 'Palm Vista Villas',
      location: 'Palm Jumeirah',
      desc: 'Exclusive beachfront villas on the iconic Palm — the pinnacle of Dubai luxury.',
      startingPrice: 'AED 12.5M',
      paymentPlan: '15 / 55 / 30 %',
    },
  ];

  stats: Stat[] = [
    { value: '2,500', label: 'Properties Listed', suffix: '+' },
    { value: '1,800', label: 'Happy Families', suffix: '+' },
    { value: '98', label: 'Client Satisfaction', suffix: '%' },
    { value: '15', label: 'Years Experience', suffix: '+' },
  ];

  featuredProperties: Property[] = [
    {
      id: 1,
      title: 'Luxury Penthouse Suite',
      location: 'Downtown Dubai, UAE',
      price: 'AED 4,500,000',
      beds: 4, baths: 3, sqft: '3,200',
      type: 'Apartment',
      badge: 'Featured',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    },
    {
      id: 2,
      title: 'Modern Villa with Pool',
      location: 'Palm Jumeirah, Dubai',
      price: 'AED 8,200,000',
      beds: 5, baths: 5, sqft: '5,800',
      type: 'Villa',
      badge: 'Hot',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    },
    {
      id: 3,
      title: 'Beachfront Apartment',
      location: 'JBR Walk, Dubai Marina',
      price: 'AED 2,100,000',
      beds: 2, baths: 2, sqft: '1,450',
      type: 'Apartment',
      badge: 'New',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    },
    {
      id: 4,
      title: 'Contemporary Town House',
      location: 'Arabian Ranches, Dubai',
      price: 'AED 3,750,000',
      beds: 4, baths: 3, sqft: '2,900',
      type: 'Townhouse',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    },
    {
      id: 5,
      title: 'Sky View Studio',
      location: 'Business Bay, Dubai',
      price: 'AED 980,000',
      beds: 1, baths: 1, sqft: '650',
      type: 'Studio',
      badge: 'Reduced',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    },
    {
      id: 6,
      title: 'Heritage Mansion',
      location: 'Emirates Hills, Dubai',
      price: 'AED 22,000,000',
      beds: 7, baths: 8, sqft: '12,400',
      type: 'Villa',
      badge: 'Exclusive',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    },
  ];

  topAgents: Agent[] = [
    { name: 'Anuj Sharma',      role: 'Business Associate', deals: 0, rating: 5.0, avatar: 'images/Anuj.jpeg',   phone: '+971542481813',  email: 'anuj@livwelldubai.ae'  },
    { name: 'Niket Mehta',      role: 'Business Associate', deals: 0, rating: 5.0, avatar: 'images/Niket .jpeg', phone: '+971585798027',  email: 'niket@livwelldubai.ae' },
    { name: 'Yash Uday Chari',  role: 'Business Associate', deals: 0, rating: 5.0, avatar: 'images/Yash.jpeg',   phone: '+971585833629',  email: 'yash@livwelldubai.ae'  },
  ];

  testimonials: Testimonial[] = [
    {
      name: 'James & Emily Carter',
      role: 'Purchased Villa in Palm Jumeirah',
      text: 'Livwell made our dream of owning a home in Dubai a reality. The team was incredibly professional, transparent through every step, and found us the perfect property within our budget.',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/34.jpg',
    },
    {
      name: 'Fatima Al-Rashidi',
      role: 'Sold Apartment in Downtown Dubai',
      text: 'I was amazed by how quickly my property sold and at a price above my expectations. The marketing team did an exceptional job and my agent was always available to answer questions.',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      name: 'Raj Patel',
      role: 'Investment Portfolio – 5 Properties',
      text: 'As an investor, I need data-driven advice. Livwell\'s team provided in-depth market analysis that helped me build a portfolio with consistent returns. Highly recommend their investment consulting.',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/57.jpg',
    },
  ];

  newsArticles: NewsArticle[] = [
    {
      id: 1,
      category: 'Market Insights',
      title: 'Dubai Real Estate Market Hits Record AED 141 Billion in 2025 Transactions',
      excerpt: 'The UAE property market continues its remarkable growth trajectory, with off-plan sales driving unprecedented demand across premium communities.',
      author: 'Sarah Al-Mansouri',
      date: 'May 14, 2026',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      featured: true,
    },
    {
      id: 2,
      category: 'Investment',
      title: 'Top 5 Communities for ROI in Dubai: Where Smart Money Is Flowing',
      excerpt: 'From Business Bay to Jumeirah Village Circle, we break down which communities are delivering the strongest rental yields for investors in 2026.',
      author: 'Ahmed Hassan',
      date: 'May 12, 2026',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
    },
    {
      id: 3,
      category: 'Lifestyle',
      title: 'Palm Jumeirah Residences: A Complete Living Guide for New Homeowners',
      excerpt: 'Everything you need to know about settling into one of the world\'s most iconic addresses — from amenities to community life.',
      author: 'Priya Sharma',
      date: 'May 10, 2026',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    },
    {
      id: 4,
      category: 'Regulations',
      title: 'New UAE Golden Visa Rules: How Property Ownership Qualifies You',
      excerpt: 'Updated guidelines make it easier than ever for property investors to secure long-term residency through real estate investments above AED 2 million.',
      author: 'Michael Chen',
      date: 'May 8, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    },
  ];

  propertyTypes = [
    { label: 'Apartments', icon: '🏢', count: '1,240+' },
    { label: 'Villas', icon: '🏡', count: '380+' },
    { label: 'Townhouses', icon: '🏘️', count: '290+' },
    { label: 'Offices', icon: '🏛️', count: '180+' },
    { label: 'Retail', icon: '🏪', count: '95+' },
    { label: 'Plots', icon: '🗺️', count: '210+' },
  ];

  offPlanProjects = [
    {
      id: 1,
      name: 'Creek Horizon Residences',
      developer: 'Emaar Properties',
      location: 'Dubai Creek Harbour',
      startingPrice: 'AED 1,250,000',
      completion: 'Q4 2027',
      type: 'Apartments',
      roi: '8.5% est. ROI',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      badge: 'New Launch',
    },
    {
      id: 2,
      name: 'Palm Vista Villas',
      developer: 'Nakheel',
      location: 'Palm Jebel Ali, Dubai',
      startingPrice: 'AED 6,800,000',
      completion: 'Q2 2026',
      type: 'Villas',
      roi: '7.2% est. ROI',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      badge: 'Selling Fast',
    },
    {
      id: 3,
      name: 'Skyline Towers',
      developer: 'DAMAC Properties',
      location: 'Business Bay, Dubai',
      startingPrice: 'AED 890,000',
      completion: 'Q1 2028',
      type: 'Apartments',
      roi: '9.1% est. ROI',
      image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
      badge: 'Early Bird',
    },
  ];

  @ViewChildren('animateEl') animateEls!: QueryList<ElementRef>;
  @ViewChild('lpTrack') lpTrack!: ElementRef<HTMLElement>;
  @ViewChild('trendingTrack') trendingTrack!: ElementRef<HTMLElement>;

  latestProjects = [
    {
      name: 'Avena by Emaar',
      location: 'Arabian Ranches 3',
      developer: 'Emaar',
      handover: 'Q1 2029',
      startingPrice: 'AED 3.5M',
      paymentPlan: '10 / 80',
      badge: true,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
    },
    {
      name: 'Avarra By Palace',
      location: 'Business Bay',
      developer: 'Emaar',
      handover: 'Q2 2031',
      startingPrice: 'AED 13.6M',
      paymentPlan: '10 / 80 / 10',
      badge: false,
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    },
    {
      name: 'Binghatti Skyflame',
      location: 'Majan',
      developer: 'Binghatti',
      handover: 'Q4 2027',
      startingPrice: 'AED 585K',
      paymentPlan: '10 / 60 / 30',
      badge: false,
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    },
    {
      name: 'The Edit at d3',
      location: 'Dubai Design District',
      developer: 'Meraas',
      handover: 'Q4 2027',
      startingPrice: 'AED 1.9M',
      paymentPlan: '20 / 55 / 25',
      badge: false,
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
    },
    {
      name: 'Creek Horizon',
      location: 'Dubai Creek Harbour',
      developer: 'Emaar',
      handover: 'Q4 2027',
      startingPrice: 'AED 1.25M',
      paymentPlan: '20 / 60 / 20',
      badge: true,
      image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80',
    },
    {
      name: 'Palm Vista Residences',
      location: 'Palm Jebel Ali',
      developer: 'Nakheel',
      handover: 'Q2 2026',
      startingPrice: 'AED 6.8M',
      paymentPlan: '15 / 55 / 30',
      badge: false,
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private slideInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startSlideshow();
      this.startTestimonialRotation();
      setTimeout(() => this.setupScrollAnimations(), 100);
    }
  }

  private startSlideshow(): void {
    this.slideInterval = setInterval(() => {
      this.activeSlide.set((this.activeSlide() + 1) % this.heroSlides.length);
    }, 5000);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.startSlideshow();
  }

  prevSlide(): void {
    const prev = (this.activeSlide() - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.goToSlide(prev);
  }

  nextSlide(): void {
    const next = (this.activeSlide() + 1) % this.heroSlides.length;
    this.goToSlide(next);
  }

  private startTestimonialRotation(): void {
    setInterval(() => {
      this.activeTestimonial.set((this.activeTestimonial() + 1) % this.testimonials.length);
    }, 5000);
  }

  private setupScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  setTestimonial(index: number): void {
    this.activeTestimonial.set(index);
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  activeTeam = signal(0);
  activeTrendingTab = signal('luxury');

  trendingTabs = [
    { value: 'villas', label: 'Villas' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'flats', label: 'Flats' },
  ];

  trendingProjects = [
    { name: 'One at Palm Jumeirah', developer: 'Omniyat', price: '14M', badge: 'Ready', type: 'luxury', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80' },
    { name: 'The Royal Atlantis Residences', developer: 'Kerzner International', price: '17M', badge: 'Ready', type: 'luxury', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80' },
    { name: 'Six Senses', developer: 'Select Group', price: '12.5M', badge: '40 / 60 Payment Plan', type: 'luxury', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80' },
    { name: 'Burj Binghatti', developer: 'Binghatti', price: '8M', badge: '60 / 40 Payment Plan', type: 'luxury', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80' },
    { name: 'Bugatti Residences', developer: 'Binghatti', price: '19.1M', badge: '70 / 30 Payment Plan', type: 'luxury', image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&q=80' },
    { name: 'Palm Vista Villas', developer: 'Nakheel', price: '6.8M', badge: 'Ready', type: 'villas', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80' },
    { name: 'Emirates Hills Villa', developer: 'Emaar', price: '22M', badge: '20 / 80 Payment Plan', type: 'villas', image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&q=80' },
    { name: 'Tilal Al Ghaf Villa', developer: 'Majid Al Futtaim', price: '4.2M', badge: '10 / 80 / 10 Payment Plan', type: 'villas', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80' },
    { name: 'Skyline Tower', developer: 'DAMAC', price: '890K', badge: '60 / 40 Payment Plan', type: 'flats', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80' },
    { name: 'Creek Horizon', developer: 'Emaar', price: '1.25M', badge: '20 / 60 / 20 Payment Plan', type: 'flats', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80' },
    { name: 'Binghatti Nova', developer: 'Binghatti', price: '680K', badge: 'Ready', type: 'flats', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  ];

  filteredTrendingProjects = computed(() =>
    this.trendingProjects.filter(p => p.type === this.activeTrendingTab())
  );

  guides = [
    { title: 'Buying Guide', subtitle: 'How to Buy Property in Dubai', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { title: 'Buying Offplan Guide', subtitle: 'How to Buy Off Plan in Dubai', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { title: 'Renting Guide', subtitle: 'How to Rent Property in Dubai', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { title: 'Selling Guide', subtitle: 'How to Sell Property in Dubai', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  ];

  teamAreas = [
    {
      area: 'Our Associates', agents: [
        { name: 'Anuj Sharma',     role: 'Business Associate', avatar: 'images/Anuj.jpeg',   phone: '+971542481813',  email: 'anuj@livwelldubai.ae'  },
        { name: 'Niket Mehta',     role: 'Business Associate', avatar: 'images/Niket .jpeg', phone: '+971585798027',  email: 'niket@livwelldubai.ae' },
        { name: 'Yash Uday Chari', role: 'Business Associate', avatar: 'images/Yash.jpeg',   phone: '+971585833629',  email: 'yash@livwelldubai.ae'  },
      ]
    },
  ];

  scrollTrending(dir: 1 | -1): void {
    const track = this.trendingTrack?.nativeElement;
    if (track) track.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  scrollLatestProjects(dir: 1 | -1): void {
    const track = this.lpTrack?.nativeElement;
    if (track) track.scrollBy({ left: dir * 370, behavior: 'smooth' });
  }

  get featuredArticle(): NewsArticle {
    return this.newsArticles.find(a => a.featured) ?? this.newsArticles[0];
  }

  get sideArticles(): NewsArticle[] {
    return this.newsArticles.filter(a => !a.featured);
  }
}
