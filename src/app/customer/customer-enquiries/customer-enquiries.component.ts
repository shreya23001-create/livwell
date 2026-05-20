import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Enquiry {
  id: number;
  property: string;
  location: string;
  price: string;
  agent: string;
  agentInitials: string;
  date: string;
  status: 'pending' | 'replied' | 'closed';
  message: string;
  reply?: string;
  replyDate?: string;
}

@Component({
  selector: 'app-customer-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-enquiries.component.html',
  styleUrl: './customer-enquiries.component.scss',
})
export class CustomerEnquiriesComponent {
  filterStatus = signal('all');
  expandedId   = signal<number | null>(null);

  enquiries = signal<Enquiry[]>([
    {
      id: 1,
      property: 'Luxury 2BR in Downtown Dubai',
      location: 'Downtown Dubai',
      price: 'AED 2,800,000',
      agent: 'Sarah Al-Mansouri',
      agentInitials: 'SA',
      date: '18 May 2026',
      status: 'replied',
      message: 'I am interested in scheduling a viewing this weekend. Is the property available for Saturday morning?',
      reply: 'Hello! Yes, the property is available for viewing on Saturday between 10am–1pm. I will send you a confirmation shortly.',
      replyDate: '19 May 2026',
    },
    {
      id: 2,
      property: 'Studio in JVC with Pool View',
      location: 'Jumeirah Village Circle',
      price: 'AED 650,000',
      agent: 'Ahmed Hassan',
      agentInitials: 'AH',
      date: '15 May 2026',
      status: 'pending',
      message: 'Can you share more details about the payment plan? Is there a post-handover plan available?',
    },
    {
      id: 3,
      property: 'Penthouse in Palm Jumeirah',
      location: 'Palm Jumeirah',
      price: 'AED 18,000,000',
      agent: 'Priya Nair',
      agentInitials: 'PN',
      date: '5 May 2026',
      status: 'closed',
      message: 'Is the price negotiable for a cash buyer? We are ready to move fast.',
      reply: 'Thank you for your interest. Unfortunately the seller has accepted another offer. We have similar properties — shall I share options?',
      replyDate: '6 May 2026',
    },
    {
      id: 4,
      property: 'Modern 1BR in Business Bay',
      location: 'Business Bay',
      price: 'AED 7,500 / mo',
      agent: 'Omar Khalid',
      agentInitials: 'OK',
      date: '12 May 2026',
      status: 'replied',
      message: 'Is the apartment furnished? And are pets allowed in the building?',
      reply: 'The apartment is semi-furnished. Pets are allowed with a refundable deposit of AED 2,000.',
      replyDate: '13 May 2026',
    },
  ]);

  filtered = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? this.enquiries() : this.enquiries().filter(e => e.status === s);
  });

  stats = computed(() => ({
    total:   this.enquiries().length,
    pending: this.enquiries().filter(e => e.status === 'pending').length,
    replied: this.enquiries().filter(e => e.status === 'replied').length,
    closed:  this.enquiries().filter(e => e.status === 'closed').length,
  }));

  toggleExpand(id: number): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  statusLabel(s: string): string {
    return { pending: 'Pending', replied: 'Replied', closed: 'Closed' }[s] ?? s;
  }
}
