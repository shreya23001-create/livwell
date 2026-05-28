import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  avatar: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent {
  readonly perPage = 12;
  currentPage = signal(1);
  activeCategory = signal('All');
  subscribeEmail = signal('');
  subscribed = signal(false);

  readonly categories = [
    { label: 'All', count: 20 },
    { label: 'Market Trends', count: 6 },
    { label: 'Investment', count: 5 },
    { label: 'Legal & Regulations', count: 3 },
    { label: 'Property Guide', count: 4 },
    { label: 'Dubai Life', count: 2 },
  ];

  readonly allArticles: Article[] = [
    {
      id: 1, slug: 'jabel-ali-village-one-of-dubais-best',
      title: "Why Jabel Ali Village Remains One of Dubai's B...",
      excerpt: 'Jabel Ali Village has long been one of the most sought-after communities for families seeking a quiet, green, and well-connected lifestyle in Dubai.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
      author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      date: 'May 20, 2025', readTime: '5 min read', category: 'Dubai Life', featured: true,
    },
    {
      id: 2, slug: '11-things-landlords-should-look-for-in-a-property',
      title: '11 Things Landlords Should Look for in a Prope...',
      excerpt: 'Whether you are a first-time landlord or an experienced investor, knowing what to look for when evaluating a rental property can make or break your investment returns.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: 'May 18, 2025', readTime: '7 min read', category: 'Property Guide',
    },
    {
      id: 3, slug: 'dubai-property-market-pricing-right-in-uncertain-times',
      title: 'Dubai Property Market – Pricing Right in Uncert...',
      excerpt: 'In an era of global economic shifts, pricing your Dubai property correctly has never been more critical. We explore the key factors shaping valuations in 2025.',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
      author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      date: 'May 16, 2025', readTime: '6 min read', category: 'Market Trends',
    },
    {
      id: 4, slug: 'how-to-make-ejari-in-dubai-2026-guide',
      title: 'How to Make Ejari in Dubai (2026 Guide)',
      excerpt: 'A step-by-step guide to registering your tenancy contract on Ejari, the mandatory rental registration system in Dubai managed by RERA.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      date: 'May 14, 2025', readTime: '4 min read', category: 'Legal & Regulations',
    },
    {
      id: 5, slug: 'dubai-real-estate-in-times-of-tension',
      title: 'Dubai Real Estate in Times of Tension: Why Sma...',
      excerpt: 'Geopolitical uncertainty globally has historically driven capital flows into safe-haven markets. Dubai continues to benefit from this trend in 2025.',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
      author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      date: 'May 12, 2025', readTime: '8 min read', category: 'Investment',
    },
    {
      id: 6, slug: 'dubai-property-market-resilience-turning-uncertainty-into-opportunity',
      title: 'Dubai Property Market Resilience: Turning Unce...',
      excerpt: 'Dubai\'s real estate market has demonstrated remarkable resilience in the face of global headwinds. Transaction volumes remain strong and prices continue their upward trajectory.',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80',
      author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
      date: 'May 10, 2025', readTime: '6 min read', category: 'Market Trends',
    },
    {
      id: 7, slug: 'outsourced-investment-management-expands-in-dubai',
      title: 'Outsourced Investment Management Expands Hi...',
      excerpt: 'A growing number of Dubai property investors are outsourcing portfolio management to specialist firms, seeking higher yields and reduced day-to-day operational burden.',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: 'May 8, 2025', readTime: '5 min read', category: 'Investment',
    },
    {
      id: 8, slug: 'dubai-real-estate-in-uncertain-times',
      title: 'Dubai Real Estate in Uncertain Times: Why Smar...',
      excerpt: 'Smart investors are doubling down on Dubai as traditional markets show volatility. Here\'s why the emirate remains a top destination for capital preservation and growth.',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80',
      author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      date: 'May 6, 2025', readTime: '7 min read', category: 'Investment',
    },
    {
      id: 9, slug: 'dubai-real-estate-stability-why-insight-matters',
      title: 'Dubai Real Estate Stability: Why Insight Matters...',
      excerpt: 'Data-driven insights are reshaping how buyers, sellers, and investors approach the Dubai market. We examine the tools and metrics that matter most.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
      author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      date: 'May 4, 2025', readTime: '5 min read', category: 'Market Trends',
    },
    {
      id: 10, slug: 'residential-vs-commercial-properties-in-dubai',
      title: 'Residential vs Commercial Properties in Dubai...',
      excerpt: 'Choosing between residential and commercial real estate investment in Dubai depends on your risk appetite, capital, and long-term goals. We break down both options.',
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80',
      author: 'Sara Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      date: 'May 2, 2025', readTime: '6 min read', category: 'Property Guide',
    },
    {
      id: 11, slug: 'maqam-the-next-frontier-for-youth-dubai-business',
      title: 'Maqam: The Next Frontier for Youth Dubai Busine...',
      excerpt: 'Dubai\'s Maqam initiative is opening new doors for young entrepreneurs in the real estate sector, with dedicated zones and licensing frameworks designed for the next generation.',
      image: 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',
      author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      date: 'Apr 30, 2025', readTime: '4 min read', category: 'Dubai Life',
    },
    {
      id: 12, slug: 'dubai-advantage-historic-moment-for-commercial-real-estate',
      title: 'The Dubai Advantage: A Historic Moment for C...',
      excerpt: 'Commercial real estate in Dubai is at an inflection point. Rising demand for Grade A office space, logistics hubs, and retail is creating a generational investment opportunity.',
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
      author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
      date: 'Apr 28, 2025', readTime: '7 min read', category: 'Investment',
    },
    {
      id: 13, slug: '10-best-practices-to-rent-your-property-in-dubai',
      title: '10 Best Practices to Rent Your Property in Duba...',
      excerpt: 'Maximising rental yield in Dubai requires more than listing your property. From pricing strategy to tenant screening, here are the 10 practices that separate good landlords from great ones.',
      image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&q=80',
      author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: 'Apr 26, 2025', readTime: '6 min read', category: 'Property Guide',
    },
    {
      id: 14, slug: 'is-the-al-furjan-property-market-booming-or-blossoming',
      title: 'Is the Al Furjan Property Market Booming or Blo...',
      excerpt: 'Al Furjan has quietly become one of Dubai\'s most consistent performers. We deep-dive into the community\'s price trends, rental yields, and future development pipeline.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      date: 'Apr 24, 2025', readTime: '5 min read', category: 'Market Trends',
    },
    {
      id: 15, slug: 'client-focused-management-model-that-delivers',
      title: 'A Client-Focused Management Model That Deli...',
      excerpt: 'In a competitive market, the agencies that thrive are those putting client outcomes first. We explore what a truly client-focused property management model looks like in practice.',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
      author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      date: 'Apr 22, 2025', readTime: '5 min read', category: 'Property Guide',
    },
    {
      id: 16, slug: 'dubai-golden-visa-property-investment-guide-2025',
      title: 'Dubai Golden Visa: Complete Property Investment Guide 2025',
      excerpt: 'Everything you need to know about qualifying for a UAE Golden Visa through Dubai property investment, including minimum thresholds, eligibility, and the application process.',
      image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80',
      author: 'Sara Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      date: 'Apr 20, 2025', readTime: '8 min read', category: 'Legal & Regulations',
    },
    {
      id: 17, slug: 'top-off-plan-communities-to-watch-in-dubai-2025',
      title: 'Top Off-Plan Communities to Watch in Dubai in 2025',
      excerpt: 'From Dubailand to Dubai Creek Harbour, we highlight the off-plan communities with the strongest fundamentals, developer track records, and growth potential for 2025 investors.',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
      author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      date: 'Apr 18, 2025', readTime: '7 min read', category: 'Investment',
    },
    {
      id: 18, slug: 'rera-regulations-landlord-tenant-rights-2025',
      title: 'RERA Regulations: Landlord & Tenant Rights in 2025',
      excerpt: 'Understanding your rights and obligations under Dubai\'s RERA framework is essential for both landlords and tenants. We provide a comprehensive breakdown of the 2025 regulations.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
      date: 'Apr 16, 2025', readTime: '6 min read', category: 'Legal & Regulations',
    },
    {
      id: 19, slug: 'how-to-calculate-roi-on-dubai-rental-property',
      title: 'How to Calculate ROI on Your Dubai Rental Property',
      excerpt: 'A practical guide to calculating net rental yield and return on investment for Dubai properties, with real examples from popular communities across the emirate.',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: 'Apr 14, 2025', readTime: '5 min read', category: 'Property Guide',
    },
    {
      id: 20, slug: 'dubai-real-estate-price-forecast-2025-2026',
      title: 'Dubai Real Estate Price Forecast: 2025–2026 Outlook',
      excerpt: 'Industry analysts, developers, and data from the Dubai Land Department paint a complex but broadly positive picture for property prices through 2025 and into 2026.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
      author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      date: 'Apr 12, 2025', readTime: '9 min read', category: 'Market Trends',
    },
  ];

  filteredArticles = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this.allArticles : this.allArticles.filter(a => a.category === cat);
  });

  totalPages = computed(() => Math.ceil(this.filteredArticles().length / this.perPage));

  pagedArticles = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filteredArticles().slice(start, start + this.perPage);
  });

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  featuredArticles = computed(() => this.allArticles.filter(a => a.featured).slice(0, 4));

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setCategory(cat: string) {
    this.activeCategory.set(cat);
    this.currentPage.set(1);
  }

  subscribe() {
    if (this.subscribeEmail().trim()) {
      this.subscribed.set(true);
    }
  }
}
