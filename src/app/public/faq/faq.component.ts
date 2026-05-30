import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsletterSectionComponent } from '../../shared/components/newsletter-section/newsletter-section.component';
import { SeoLinksSectionComponent } from '../../shared/components/seo-links-section/seo-links-section.component';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  author: string;
  avatar: string;
  date: string;
  category: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, NewsletterSectionComponent, SeoLinksSectionComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  openId = signal<number | null>(null);
  currentPage = signal(1);
  readonly perPage = 12;

  readonly categories = ['All', 'Buying', 'Renting', 'Legal', 'Finance', 'Investment', 'Market'];
  activeCategory = signal('All');

  readonly allFaqs: Faq[] = [
    { id: 1, question: 'What documents are required to buy off-plan property directly from a developer in Dubai?', answer: 'To buy off-plan property in Dubai you typically need: a valid passport copy, Emirates ID (for UAE residents), a signed Sale and Purchase Agreement (SPA), proof of funds or mortgage pre-approval, and a 4% DLD registration fee payment. The developer may also require additional KYC documents depending on their compliance requirements.', author: 'Sarah Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', date: '14 Sep, 2025', category: 'Buying' },
    { id: 2, question: "What's the difference between flipping and speculation in Dubai real estate?", answer: "Flipping refers to buying a property, renovating or improving it, and reselling it quickly for a profit. Speculation involves purchasing property purely based on anticipated price appreciation without necessarily adding value. In Dubai's market, flipping is common in off-plan properties where investors assign contracts before handover at a premium.", author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', date: '11 Aug, 2025', category: 'Investment' },
    { id: 3, question: 'What is RERA DIFC?', answer: "RERA stands for Real Estate Regulatory Agency, which is the regulatory arm of the Dubai Land Department (DLD). It governs all real estate activities in Dubai, including developer registrations, agent licensing, escrow accounts, and property disputes. DIFC (Dubai International Financial Centre) has its own separate regulatory framework for financial services.", author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', date: '9 Jul, 2025', category: 'Legal' },
    { id: 4, question: 'Can an investor cancel their contract with the developer without going to court?', answer: 'Yes, under RERA Law No. 11 of 2008, buyers may be entitled to cancel off-plan contracts and receive refunds if the developer fails to meet certain conditions. The process involves filing a complaint with the Dubai Land Department or RERA. However, specific conditions and penalties depend on the stage of construction and the terms of the SPA.', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', date: '28 Jun, 2025', category: 'Legal' },
    { id: 5, question: "What happens if an investor pays more than the project's progress, but the project hasn't started, is under cancellation, or has been cancelled?", answer: "If a project is cancelled by RERA, investors are entitled to a full refund of all payments made. The developer is legally required to refund these amounts from the escrow account. If the developer cannot refund, RERA facilitates the process through the escrow trustee. Investors should file a complaint with the DLD immediately upon learning of cancellation.", author: 'Sara Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', date: '26 Jun, 2025', category: 'Legal' },
    { id: 6, question: 'Is the law applicable to projects launched before it was issued?', answer: 'RERA regulations generally apply to all registered projects regardless of when they were launched. However, transitional provisions may apply to older projects. It is advisable to consult with a RERA-registered legal advisor or the Dubai Land Department to understand the specific applicability to a given project.', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', date: '26 Jun, 2025', category: 'Legal' },
    { id: 7, question: 'Which financial institutions are authorised by the Real Estate Regulatory Agency to handle escrow accounts?', answer: 'RERA maintains an approved list of financial institutions authorised to hold developer escrow accounts. These include major UAE banks such as Emirates NBD, Abu Dhabi Commercial Bank, First Abu Dhabi Bank, Dubai Islamic Bank, and several others. All off-plan developer projects must use RERA-approved escrow accounts to protect investor funds.', author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', date: '26 Jun, 2025', category: 'Finance' },
    { id: 8, question: 'How can I check the latest progress of a real estate project based on its approved technical audit?', answer: "You can check project progress on the Dubai Land Department's official portal (dubailand.gov.ae) or through the Dubai REST app. Developers are required to update construction progress regularly. RERA also conducts technical audits and publishes findings. Always verify against the approved construction timeline in your SPA.", author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', date: '26 Jun, 2025', category: 'Market' },
    { id: 9, question: 'Who is the real owner of Burj Khalifa?', answer: "Burj Khalifa is developed and primarily owned by Emaar Properties, one of the largest real estate developers in the UAE. However, individual units within the tower are owned by private buyers from around the world. The building itself and common areas are managed by Emaar's property management division.", author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', date: '19 May, 2025', category: 'Market' },
    { id: 10, question: 'How to find local real estate transactions in Dubai?', answer: 'You can find transaction data on the Dubai REST app, the Dubai Land Department website, or through platforms like Property Finder and Bayut which publish market data. The DLD also releases quarterly transaction reports. For detailed historical data, REIDIN and other data providers offer comprehensive transaction databases.', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', date: '18 May, 2025', category: 'Buying' },
    { id: 11, question: 'How to find a good real estate agent in Dubai?', answer: 'Always verify that an agent is registered with RERA by checking the Dubai REST app or the DLD website. Look for agents with strong local market knowledge, positive client reviews, and membership in recognised industry bodies. A good agent will be transparent about fees, provide comparable market data, and guide you through the full transaction process.', author: 'Sara Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', date: '17 May, 2025', category: 'Buying' },
    { id: 12, question: 'How much real estate agents earn in commission in Dubai?', answer: "Real estate agents in Dubai typically earn a commission of 2% of the property sale price for transactions. For rentals, the commission is usually 5% of the annual rent value. These rates are not legally fixed and can vary by agency and negotiation. Commissions are typically paid by the buyer or tenant, though seller-paid structures also exist.", author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', date: '17 May, 2025', category: 'Finance' },
    { id: 13, question: 'What are the benefits of investing in Dubai real estate?', answer: "Dubai offers a tax-free environment with no capital gains tax or income tax on property. The city has a strong rental yield averaging 6-8% annually, a stable legal framework, and a growing population driving demand. Dubai's strategic location, world-class infrastructure, and residency visa benefits for property investors make it one of the world's top investment destinations.", author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', date: '17 May, 2025', category: 'Investment' },
    { id: 14, question: 'Do villas appreciate in value in Dubai?', answer: "Yes, Dubai villas have shown strong capital appreciation, particularly in prime locations such as Palm Jumeirah, Emirates Hills, and Dubai Hills Estate. Post-2020, villa demand surged significantly as residents sought more space. Villa prices in many communities have appreciated 40-60% between 2020 and 2024, outperforming apartment segments in many areas.", author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', date: '17 May, 2025', category: 'Investment' },
    { id: 15, question: "What can I do if my landlord hasn't paid building service charges in Dubai?", answer: 'If your landlord has not paid service charges, you can report the matter to the Dubai Land Department or file a complaint with RERA. Service charge defaults can lead to restrictions on the property title, which may affect your tenancy. Tenants are not responsible for service charges unless specifically agreed in the tenancy contract.', author: 'Priya Nair', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', date: '17 May, 2025', category: 'Renting' },
    { id: 16, question: 'What is the minimum down payment for a mortgage in Dubai?', answer: 'For UAE nationals, the minimum down payment is 15% for properties under AED 5 million. For expatriates, the minimum is 20% for properties under AED 5 million and 30% for properties above AED 5 million. For off-plan properties, banks typically require 50% completion before releasing mortgage funds.', author: 'Ahmed Hassan', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', date: '10 May, 2025', category: 'Finance' },
    { id: 17, question: 'Can foreigners buy property in Dubai?', answer: "Yes, foreigners can buy freehold property in designated areas across Dubai. These include Downtown Dubai, Dubai Marina, Palm Jumeirah, Jumeirah Village Circle, Business Bay, and many other communities. Foreign buyers enjoy the same ownership rights as UAE nationals in these zones, and purchasing property above AED 750,000 qualifies for a UAE investor visa.", author: 'Sara Al Mansouri', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', date: '5 May, 2025', category: 'Buying' },
    { id: 18, question: 'What is the Dubai Land Department transfer fee?', answer: 'The Dubai Land Department (DLD) charges a 4% transfer fee on the property purchase price. This is typically split equally between buyer and seller (2% each), though this can be negotiated. Additional fees include AED 4,200 for registration of properties above AED 500,000, and AED 2,100 for properties below that threshold.', author: 'Omar Farsi', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', date: '1 May, 2025', category: 'Buying' },
    { id: 19, question: 'How does the Ejari system work in Dubai?', answer: "Ejari is the official tenancy contract registration system in Dubai, managed by the Real Estate Regulatory Agency (RERA). All tenancy contracts must be registered on Ejari to be legally recognised. Registration costs AED 220 and can be done through the Dubai REST app, typing centres, or real estate offices. It is mandatory for DEWA connection and visa renewals.", author: 'Fatima Al Zahra', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', date: '28 Apr, 2025', category: 'Renting' },
    { id: 20, question: 'What is a Golden Visa and how can I get it through property investment?', answer: 'The UAE Golden Visa is a long-term residency visa (5 or 10 years) available to property investors who purchase real estate worth at least AED 2 million. The property must be fully paid (not mortgaged beyond the minimum threshold). The visa covers the investor and their family members including spouse, children, and household staff.', author: 'Khalid Rehman', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', date: '20 Apr, 2025', category: 'Legal' },
  ];

  filteredFaqs = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this.allFaqs : this.allFaqs.filter(f => f.category === cat);
  });

  totalPages = computed(() => Math.ceil(this.filteredFaqs().length / this.perPage));

  pagedFaqs = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filteredFaqs().slice(start, start + this.perPage);
  });

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  toggle(id: number) {
    this.openId.set(this.openId() === id ? null : id);
  }

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
}
