import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

interface Faq {
  id?: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY = (): Faq => ({
  question: '', answer: '', category: 'General', sort_order: 0, is_active: true,
});

const DEFAULT_FAQS: Omit<Faq, 'id'>[] = [
  { sort_order: 1,  is_active: true, category: 'Buying',     question: 'What documents are required to buy off-plan property directly from a developer in Dubai?', answer: 'To buy off-plan property in Dubai you typically need: a valid passport copy, Emirates ID (for UAE residents), a signed Sale and Purchase Agreement (SPA), proof of funds or mortgage pre-approval, and a 4% DLD registration fee payment. The developer may also require additional KYC documents depending on their compliance requirements.' },
  { sort_order: 2,  is_active: true, category: 'Investment',  question: "What's the difference between flipping and speculation in Dubai real estate?", answer: "Flipping refers to buying a property, renovating or improving it, and reselling it quickly for a profit. Speculation involves purchasing property purely based on anticipated price appreciation without necessarily adding value. In Dubai's market, flipping is common in off-plan properties where investors assign contracts before handover at a premium." },
  { sort_order: 3,  is_active: true, category: 'Legal',       question: 'What is RERA DIFC?', answer: "RERA stands for Real Estate Regulatory Agency, which is the regulatory arm of the Dubai Land Department (DLD). It governs all real estate activities in Dubai, including developer registrations, agent licensing, escrow accounts, and property disputes. DIFC (Dubai International Financial Centre) has its own separate regulatory framework for financial services." },
  { sort_order: 4,  is_active: true, category: 'Legal',       question: 'Can an investor cancel their contract with the developer without going to court?', answer: 'Yes, under RERA Law No. 11 of 2008, buyers may be entitled to cancel off-plan contracts and receive refunds if the developer fails to meet certain conditions. The process involves filing a complaint with the Dubai Land Department or RERA. However, specific conditions and penalties depend on the stage of construction and the terms of the SPA.' },
  { sort_order: 5,  is_active: true, category: 'Legal',       question: "What happens if an investor pays more than the project's progress, but the project hasn't started, is under cancellation, or has been cancelled?", answer: "If a project is cancelled by RERA, investors are entitled to a full refund of all payments made. The developer is legally required to refund these amounts from the escrow account. If the developer cannot refund, RERA facilitates the process through the escrow trustee. Investors should file a complaint with the DLD immediately upon learning of cancellation." },
  { sort_order: 6,  is_active: true, category: 'Legal',       question: 'Is the law applicable to projects launched before it was issued?', answer: 'RERA regulations generally apply to all registered projects regardless of when they were launched. However, transitional provisions may apply to older projects. It is advisable to consult with a RERA-registered legal advisor or the Dubai Land Department to understand the specific applicability to a given project.' },
  { sort_order: 7,  is_active: true, category: 'Finance',     question: 'Which financial institutions are authorised by the Real Estate Regulatory Agency to handle escrow accounts?', answer: 'RERA maintains an approved list of financial institutions authorised to hold developer escrow accounts. These include major UAE banks such as Emirates NBD, Abu Dhabi Commercial Bank, First Abu Dhabi Bank, Dubai Islamic Bank, and several others. All off-plan developer projects must use RERA-approved escrow accounts to protect investor funds.' },
  { sort_order: 8,  is_active: true, category: 'Market',      question: 'How can I check the latest progress of a real estate project based on its approved technical audit?', answer: "You can check project progress on the Dubai Land Department's official portal (dubailand.gov.ae) or through the Dubai REST app. Developers are required to update construction progress regularly. RERA also conducts technical audits and publishes findings. Always verify against the approved construction timeline in your SPA." },
  { sort_order: 9,  is_active: true, category: 'Market',      question: 'Who is the real owner of Burj Khalifa?', answer: "Burj Khalifa is developed and primarily owned by Emaar Properties, one of the largest real estate developers in the UAE. However, individual units within the tower are owned by private buyers from around the world. The building itself and common areas are managed by Emaar's property management division." },
  { sort_order: 10, is_active: true, category: 'Buying',      question: 'How to find local real estate transactions in Dubai?', answer: 'You can find transaction data on the Dubai REST app, the Dubai Land Department website, or through platforms like Property Finder and Bayut which publish market data. The DLD also releases quarterly transaction reports. For detailed historical data, REIDIN and other data providers offer comprehensive transaction databases.' },
  { sort_order: 11, is_active: true, category: 'Buying',      question: 'How to find a good real estate agent in Dubai?', answer: 'Always verify that an agent is registered with RERA by checking the Dubai REST app or the DLD website. Look for agents with strong local market knowledge, positive client reviews, and membership in recognised industry bodies. A good agent will be transparent about fees, provide comparable market data, and guide you through the full transaction process.' },
  { sort_order: 12, is_active: true, category: 'Finance',     question: 'How much real estate agents earn in commission in Dubai?', answer: "Real estate agents in Dubai typically earn a commission of 2% of the property sale price for transactions. For rentals, the commission is usually 5% of the annual rent value. These rates are not legally fixed and can vary by agency and negotiation. Commissions are typically paid by the buyer or tenant, though seller-paid structures also exist." },
  { sort_order: 13, is_active: true, category: 'Investment',  question: 'What are the benefits of investing in Dubai real estate?', answer: "Dubai offers a tax-free environment with no capital gains tax or income tax on property. The city has a strong rental yield averaging 6-8% annually, a stable legal framework, and a growing population driving demand. Dubai's strategic location, world-class infrastructure, and residency visa benefits for property investors make it one of the world's top investment destinations." },
  { sort_order: 14, is_active: true, category: 'Investment',  question: 'Do villas appreciate in value in Dubai?', answer: "Yes, Dubai villas have shown strong capital appreciation, particularly in prime locations such as Palm Jumeirah, Emirates Hills, and Dubai Hills Estate. Post-2020, villa demand surged significantly as residents sought more space. Villa prices in many communities have appreciated 40-60% between 2020 and 2024, outperforming apartment segments in many areas." },
  { sort_order: 15, is_active: true, category: 'Renting',     question: "What can I do if my landlord hasn't paid building service charges in Dubai?", answer: 'If your landlord has not paid service charges, you can report the matter to the Dubai Land Department or file a complaint with RERA. Service charge defaults can lead to restrictions on the property title, which may affect your tenancy. Tenants are not responsible for service charges unless specifically agreed in the tenancy contract.' },
  { sort_order: 16, is_active: true, category: 'Finance',     question: 'What is the minimum down payment for a mortgage in Dubai?', answer: 'For UAE nationals, the minimum down payment is 15% for properties under AED 5 million. For expatriates, the minimum is 20% for properties under AED 5 million and 30% for properties above AED 5 million. For off-plan properties, banks typically require 50% completion before releasing mortgage funds.' },
  { sort_order: 17, is_active: true, category: 'Buying',      question: 'Can foreigners buy property in Dubai?', answer: "Yes, foreigners can buy freehold property in designated areas across Dubai. These include Downtown Dubai, Dubai Marina, Palm Jumeirah, Jumeirah Village Circle, Business Bay, and many other communities. Foreign buyers enjoy the same ownership rights as UAE nationals in these zones, and purchasing property above AED 750,000 qualifies for a UAE investor visa." },
  { sort_order: 18, is_active: true, category: 'Buying',      question: 'What is the Dubai Land Department transfer fee?', answer: 'The Dubai Land Department (DLD) charges a 4% transfer fee on the property purchase price. This is typically split equally between buyer and seller (2% each), though this can be negotiated. Additional fees include AED 4,200 for registration of properties above AED 500,000, and AED 2,100 for properties below that threshold.' },
  { sort_order: 19, is_active: true, category: 'Renting',     question: 'How does the Ejari system work in Dubai?', answer: "Ejari is the official tenancy contract registration system in Dubai, managed by the Real Estate Regulatory Agency (RERA). All tenancy contracts must be registered on Ejari to be legally recognised. Registration costs AED 220 and can be done through the Dubai REST app, typing centres, or real estate offices. It is mandatory for DEWA connection and visa renewals." },
  { sort_order: 20, is_active: true, category: 'Legal',       question: 'What is a Golden Visa and how can I get it through property investment?', answer: 'The UAE Golden Visa is a long-term residency visa (5 or 10 years) available to property investors who purchase real estate worth at least AED 2 million. The property must be fully paid (not mortgaged beyond the minimum threshold). The visa covers the investor and their family members including spouse, children, and household staff.' },
];

@Component({
  selector: 'app-admin-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-faqs.component.html',
  styleUrl: './admin-faqs.component.scss',
})
export class AdminFaqsComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  faqs         = signal<Faq[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  search       = signal('');
  filterCat    = signal('All');
  modalOpen    = signal(false);
  editingId    = signal<number | null>(null);
  form         = signal<Faq>(EMPTY());
  deleteTarget = signal<Faq | null>(null);
  expandedId   = signal<number | null>(null);

  readonly categories = ['All', 'General', 'Buying', 'Renting', 'Legal', 'Finance', 'Investment', 'Market'];
  readonly formCategories = ['General', 'Buying', 'Renting', 'Legal', 'Finance', 'Investment', 'Market'];

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const cat = this.filterCat();
    return this.faqs().filter(f => {
      if (cat !== 'All' && f.category !== cat) return false;
      if (q && !f.question.toLowerCase().includes(q) && !f.answer.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  counts = computed(() => {
    const all = this.faqs();
    const res: Record<string, number> = { All: all.length };
    for (const f of all) res[f.category] = (res[f.category] ?? 0) + 1;
    return res;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) this.faqs.set(data as Faq[]);
    this.loading.set(false);
  }

  async seedDefaults(): Promise<void> {
    if (this.faqs().length > 0) {
      this.toast.error('FAQs already exist — seed is only for empty tables.');
      return;
    }
    this.saving.set(true);
    const { error } = await this.sb.from('faqs').insert(DEFAULT_FAQS);
    if (error) this.toast.error(error.message);
    else { this.toast.success(`${DEFAULT_FAQS.length} FAQs seeded.`); await this.load(); }
    this.saving.set(false);
  }

  openAdd(): void {
    this.form.set(EMPTY());
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(f: Faq): void {
    this.form.set({ ...f });
    this.editingId.set(f.id!);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  patch(field: keyof Faq, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.question.trim()) { this.toast.error('Question is required.'); return; }
    if (!f.answer.trim())   { this.toast.error('Answer is required.'); return; }
    this.saving.set(true);

    const payload = {
      question:   f.question.trim(),
      answer:     f.answer.trim(),
      category:   f.category,
      sort_order: Number(f.sort_order) || 0,
      is_active:  f.is_active,
    };

    if (this.editingId()) {
      const { error } = await this.sb.from('faqs').update(payload).eq('id', this.editingId()!);
      if (error) this.toast.error(error.message);
      else { this.toast.success('FAQ updated.'); this.closeModal(); await this.load(); }
    } else {
      const { error } = await this.sb.from('faqs').insert(payload);
      if (error) this.toast.error(error.message);
      else { this.toast.success('FAQ added.'); this.closeModal(); await this.load(); }
    }
    this.saving.set(false);
  }

  confirmDelete(f: Faq): void { this.deleteTarget.set(f); }
  cancelDelete(): void { this.deleteTarget.set(null); }

  async doDelete(): Promise<void> {
    const f = this.deleteTarget();
    if (!f?.id) return;
    const { error } = await this.sb.from('faqs').delete().eq('id', f.id);
    if (error) this.toast.error(error.message);
    else { this.toast.success('FAQ deleted.'); await this.load(); }
    this.deleteTarget.set(null);
  }

  async toggleActive(f: Faq): Promise<void> {
    const { error } = await this.sb.from('faqs').update({ is_active: !f.is_active }).eq('id', f.id!);
    if (!error) this.faqs.update(list => list.map(x => x.id === f.id ? { ...x, is_active: !x.is_active } : x));
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }
}
