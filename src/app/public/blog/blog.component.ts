import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  iconPath: string;
  color: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent {
  email = signal('');
  subscribed = signal(false);

  readonly guides: Guide[] = [
    {
      slug: 'buying-guide',
      title: 'Buying Property in Dubai',
      description: 'Step-by-step guide to purchasing property in Dubai. From finding the right home to closing the deal, we cover everything you need to know.',
      category: 'Buying',
      readTime: '8 min read',
      color: '#1a5276',
      iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    },
    {
      slug: 'off-plan-guide',
      title: 'Buying Off-Plan Property',
      description: 'Complete guide to purchasing off-plan property in Dubai. From choosing a project to moving in after handover.',
      category: 'Off-Plan',
      readTime: '10 min read',
      color: '#7d3c98',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      slug: 'renting-guide',
      title: 'Renting in Dubai',
      description: 'Step-by-step guide to leasing your property in Dubai. From finding the right agent to EJARI registration and your rights.',
      category: 'Renting',
      readTime: '7 min read',
      color: '#1e8449',
      iconPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    },
    {
      slug: 'selling-guide',
      title: 'Selling Your Property',
      description: 'Step-by-step guide to selling your property in Dubai. From finding the right agent to final registration and maximum return.',
      category: 'Selling',
      readTime: '6 min read',
      color: '#b9770e',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      slug: 'mortgage-guide',
      title: 'Mortgage & Home Finance',
      description: 'Find the best mortgage in Dubai. Understanding loan-to-value ratios, bank requirements, and how to get the best rates available.',
      category: 'Finance',
      readTime: '9 min read',
      color: '#1a5276',
      iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      slug: 'tenancy-contract',
      title: 'Tenancy Contract Guide',
      description: 'Everything about Ejari tenancy contracts in Dubai — for both landlords and tenants when contracts are coming to an end.',
      category: 'Legal',
      readTime: '5 min read',
      color: '#922b21',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      slug: 'bounced-cheque',
      title: 'Bounced Cheque Guide',
      description: 'Handling bounced cheques in Dubai — legal procedures, tenant rights, penalties, and your resolution options explained clearly.',
      category: 'Legal',
      readTime: '6 min read',
      color: '#922b21',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
      slug: 'dld-fees',
      title: 'DLD Fees & Transfer Costs',
      description: 'A complete breakdown of Dubai Land Department fees, agency commissions, and all costs when buying or selling property in the UAE.',
      category: 'Buying',
      readTime: '5 min read',
      color: '#1e8449',
      iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    },
    {
      slug: 'golden-visa',
      title: 'UAE Golden Visa for Investors',
      description: 'How to obtain the UAE Golden Visa through real estate investment. Eligibility, thresholds, and application process explained.',
      category: 'Legal',
      readTime: '7 min read',
      color: '#7d3c98',
      iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  subscribe() {
    if (this.email().trim()) this.subscribed.set(true);
  }
}
