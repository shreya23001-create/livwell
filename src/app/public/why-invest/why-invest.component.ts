import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

interface ReasonArticle {
  id: number;
  title: string;
  date: string;
  author: string;
  avatar: string;
  category: string;
  excerpt: string;
}

interface Stat {
  value: string;
  label: string;
  icon: string;
}

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-why-invest',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './why-invest.component.html',
  styleUrl: './why-invest.component.scss',
})
export class WhyInvestComponent {
  openId = signal<number | null>(null);

  readonly stats: Stat[] = [
    { value: '0%', label: 'Income & Capital Gains Tax', icon: 'tax' },
    { value: '6–9%', label: 'Average Rental Yield', icon: 'yield' },
    { value: '#1', label: 'Most Visited City Globally', icon: 'travel' },
    { value: '200+', label: 'Nationalities Call Dubai Home', icon: 'global' },
  ];

  readonly benefits: Benefit[] = [
    { icon: 'tax', title: 'Tax-Free Returns', desc: 'Dubai levies zero income tax, zero capital gains tax, and zero inheritance tax on property. Your rental income and appreciation are entirely yours to keep.' },
    { icon: 'yield', title: 'High Rental Yields', desc: 'Dubai consistently delivers 6–9% gross rental yields — far outpacing London (3%), Paris (3.5%), and New York (4%). Prime communities exceed 10% in some cases.' },
    { icon: 'legal', title: 'Robust Legal Framework', desc: 'RERA, the Dubai Land Department, and the Escrow Law provide world-class investor protections. Freehold ownership is available to all nationalities in designated zones.' },
    { icon: 'visa', title: 'Residency Visa Pathway', desc: 'Invest AED 750K+ and qualify for a 2-year investor visa. Invest AED 2M+ in a single property and qualify for the prestigious 10-year UAE Golden Visa.' },
    { icon: 'infra', title: 'World-Class Infrastructure', desc: 'Dubai ranked #1 in infrastructure quality globally. Superb connectivity, a modern healthcare system, top international schools, and a thriving lifestyle ecosystem.' },
    { icon: 'growth', title: 'Strong Capital Appreciation', desc: 'Dubai property prices have risen 40–65% since 2020 in prime areas. With Expo legacy, population growth, and new supply lagging demand, the long-term outlook remains positive.' },
    { icon: 'stable', title: 'Political & Economic Stability', desc: 'The UAE is consistently ranked among the world\'s most politically stable nations. A diversified economy, visionary leadership, and AED peg to the USD ensure long-term confidence.' },
    { icon: 'lifestyle', title: 'Unmatched Lifestyle', desc: 'Year-round sunshine, world-class dining, beaches, skiing, and luxury retail — Dubai offers a quality of life that attracts and retains high-net-worth residents from every corner of the globe.' },
  ];

  readonly articles: ReasonArticle[] = [
    { id: 1, title: 'Why Invest in Dubai South?', date: 'Jul, 2025', author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', category: 'Communities', excerpt: 'Dubai South is rapidly becoming one of the emirate\'s most exciting investment destinations, anchored by Al Maktoum International Airport and the Expo City legacy.' },
    { id: 2, title: 'Why Invest in Dubai Islands?', date: 'Jul, 2025', author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', category: 'Communities', excerpt: 'The five islands of Dubai Islands offer a rare combination of beachfront living, freehold ownership, and proximity to Deira — a compelling investment case.' },
    { id: 3, title: 'Why Invest in Dubai Creek Harbour?', date: 'Jul, 2025', author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', category: 'Communities', excerpt: 'Home to the future Dubai Creek Tower and a 6km waterfront promenade, Dubai Creek Harbour is set to redefine the city\'s skyline and investment landscape.' },
    { id: 4, title: 'Why Invest in Dubai Maritime City?', date: 'Jul, 2025', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', category: 'Communities', excerpt: 'Dubai Maritime City blends a thriving maritime industry with residential developments, offering investors a unique waterfront opportunity near Port Rashid.' },
    { id: 5, title: 'Why Invest in Dubai Hills Estate?', date: 'Jul, 2025', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', category: 'Communities', excerpt: 'With its 18-hole championship golf course, Central Park, and Emaar\'s trusted delivery track record, Dubai Hills Estate is one of the most balanced investment communities.' },
    { id: 6, title: 'Why Invest in Dubai Marina?', date: 'Jul, 2025', author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', category: 'Communities', excerpt: 'Dubai Marina remains one of the highest-yielding communities in the emirate, with strong rental demand from professionals, expats, and short-term tenants.' },
    { id: 7, title: 'Why Invest in Downtown Dubai?', date: 'Jul, 2025', author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', category: 'Communities', excerpt: 'The address that needs no introduction. Burj Khalifa, Dubai Mall, and the Fountain create a global landmark that drives perpetual demand for residential and commercial property.' },
    { id: 8, title: 'Why Invest in District One Dubai?', date: 'Jul, 2025', author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', category: 'Communities', excerpt: 'District One\'s crystal lagoon, ultra-luxury villas, and MBR City location make it one of the most exclusive and fastest-appreciating addresses in Dubai.' },
    { id: 9, title: 'Why Invest in Jumeirah Beach Residences (JBR) Dubai?', date: 'Jul, 2025', author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', category: 'Communities', excerpt: 'JBR\'s beachfront address, vibrant retail strip "The Walk," and consistent short-term rental demand make it a perennial favourite for income-focused investors.' },
    { id: 10, title: 'Why Invest in The Valley Dubai?', date: 'Jul, 2025', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', category: 'Communities', excerpt: 'Emaar\'s The Valley offers affordable villa living with strong community amenities, positioned on the Dubai–Al Ain Road corridor with significant capital growth potential.' },
    { id: 11, title: 'Why Invest in Al Furjan Dubai?', date: 'Jul, 2025', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', category: 'Communities', excerpt: 'Al Furjan\'s Metro connectivity, competitive pricing, and strong rental yields make it one of the most consistent performers for mid-market investors.' },
    { id: 12, title: 'Why Invest in Arjan Dubai?', date: 'Jul, 2025', author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', category: 'Communities', excerpt: 'Arjan\'s proximity to Dubai Miracle Garden, affordable entry prices, and growing F&B and retail scene are drawing increasing investor attention.' },
    { id: 13, title: 'Why Invest in Arabian Ranches Dubai?', date: 'Jul, 2025', author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', category: 'Communities', excerpt: 'One of Dubai\'s most established villa communities. Arabian Ranches combines a proven track record, strong family appeal, and consistent capital appreciation.' },
    { id: 14, title: 'Why Invest in Al Barari Dubai?', date: 'Jul, 2025', author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', category: 'Communities', excerpt: 'Al Barari\'s ultra-lush green environment, botanical gardens, and wellness-focused community attract a discerning buyer seeking privacy and nature within the city.' },
    { id: 15, title: 'Why Invest in Bluewaters Island Dubai?', date: 'Jul, 2025', author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', category: 'Communities', excerpt: 'Home to Ain Dubai — the world\'s largest observation wheel — Bluewaters Island offers a unique lifestyle and investment proposition with strong tourist-driven rental demand.' },
    { id: 16, title: 'Why Invest in Palm Jumeirah Dubai?', date: 'Jul, 2025', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', category: 'Communities', excerpt: 'The world\'s most iconic man-made island. Palm Jumeirah villas and apartments command premium prices and rents, with consistent demand from ultra-high-net-worth buyers globally.' },
    { id: 17, title: 'Why Invest in Jumeirah Village Circle (JVC) Dubai?', date: 'Jul, 2025', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', category: 'Communities', excerpt: 'JVC is Dubai\'s most transaction-active community, driven by its exceptional value, central location, and landlord-friendly rental dynamics.' },
    { id: 18, title: 'Why Invest in Emaar South Dubai?', date: 'Jul, 2025', author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', category: 'Communities', excerpt: 'Adjacent to Expo City and Al Maktoum Airport, Emaar South offers golf course living and long-term growth driven by one of the world\'s largest airport expansion projects.' },
    { id: 19, title: 'Why Invest in Palm Jebel Ali Dubai?', date: 'Jul, 2025', author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', category: 'Communities', excerpt: 'Palm Jebel Ali\'s relaunch by Nakheel marks a once-in-a-generation investment opportunity — larger than Palm Jumeirah, with freehold villas from AED 18M on private beach plots.' },
    { id: 20, title: 'Why Invest in Business Bay Dubai?', date: 'Jul, 2025', author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', category: 'Communities', excerpt: 'Business Bay\'s canal views, central location between Downtown and DIFC, and diverse property mix make it a high-demand zone for both investors and end-users.' },
    { id: 21, title: 'Why Invest in DAMAC Hills Dubai?', date: 'Jul, 2025', author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', category: 'Communities', excerpt: 'DAMAC Hills\' Trump golf course, growing community maturity, and competitive villa pricing offer investors a compelling suburban investment in Dubai\'s western corridor.' },
    { id: 22, title: 'Why Invest in Expo City Dubai?', date: 'Jul, 2025', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', category: 'Communities', excerpt: 'The transformed Expo 2020 site is now a thriving innovation district. With conference centres, hotels, schools, and residential developments, Expo City is Dubai\'s city of the future.' },
    { id: 23, title: 'Why Invest in Jumeirah Lake Towers (JLT) Dubai?', date: 'Jul, 2025', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', category: 'Communities', excerpt: 'JLT\'s lakeside setting, Metro access, strong F&B and commercial ecosystem, and competitive pricing make it one of the best value investment communities in Dubai.' },
  ];

  toggle(id: number) {
    this.openId.set(this.openId() === id ? null : id);
  }
}
