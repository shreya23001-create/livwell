import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AgentCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  budget: string;
  status: 'active' | 'inactive' | 'closed';
  enquiries: number;
  joinedDate: string;
  lastActive: string;
  notes: string;
}

const SAMPLE_CUSTOMERS: AgentCustomer[] = [
  { id: 1, name: 'Mohammed Al-Rashidi', email: 'mohammed@example.com', phone: '+971508888888', interest: 'Buy · Apartment · Downtown Dubai',  budget: 'AED 2M–3M',   status: 'active',   enquiries: 3, joinedDate: '2026-01-14', lastActive: '2026-05-19', notes: 'Serious buyer, pre-approved.'       },
  { id: 2, name: 'James Carter',        email: 'james@example.com',    phone: '+447700900123', interest: 'Invest · Villa · Palm Jumeirah',    budget: 'AED 5M+',     status: 'active',   enquiries: 5, joinedDate: '2026-02-10', lastActive: '2026-05-18', notes: 'Rental yield focused.'              },
  { id: 3, name: 'Elena Petrova',       email: 'elena@example.com',    phone: '+79161234567',  interest: 'Invest · Apartment · Dubai Hills',  budget: 'AED 2M',      status: 'active',   enquiries: 2, joinedDate: '2026-03-05', lastActive: '2026-05-14', notes: 'Referred by James Carter.'          },
  { id: 4, name: 'David Kim',           email: 'david@example.com',    phone: '+821012345678', interest: 'Buy · Townhouse · JVC',             budget: 'AED 1.5M',    status: 'active',   enquiries: 4, joinedDate: '2026-03-20', lastActive: '2026-05-16', notes: 'Pre-approved mortgage in hand.'     },
  { id: 5, name: 'Fatima Al-Zaabi',     email: 'fzaabi@example.com',   phone: '+971557654321', interest: 'Rent · Apartment · DIFC',           budget: 'AED 120K/yr', status: 'active',   enquiries: 2, joinedDate: '2026-04-01', lastActive: '2026-05-19', notes: 'Corporate relocation package.'     },
  { id: 6, name: 'Khalid Al-Maktoum',   email: 'khalid@example.com',   phone: '+971501234567', interest: 'Buy · Penthouse · Business Bay',    budget: 'AED 4M',      status: 'closed',   enquiries: 6, joinedDate: '2025-12-01', lastActive: '2026-05-02', notes: 'Deal closed — Bay Residences.'     },
  { id: 7, name: 'Layla Hussain',       email: 'layla@example.com',    phone: '+971509999999', interest: 'Rent · Studio · JBR',               budget: 'AED 80K/yr',  status: 'active',   enquiries: 1, joinedDate: '2026-04-10', lastActive: '2026-05-10', notes: 'Needs parking space.'               },
  { id: 8, name: 'Priya Nair',          email: 'priya@example.com',    phone: '+919876543210', interest: 'Buy · Apartment · Dubai Marina',    budget: 'AED 1M–1.5M', status: 'active',   enquiries: 3, joinedDate: '2026-04-15', lastActive: '2026-05-18', notes: 'First-time buyer.'                 },
  { id: 9, name: 'Tariq Ibrahim',       email: 'tariq@example.com',    phone: '+971553456789', interest: 'Buy · Villa · Arabian Ranches',     budget: 'AED 3M–4M',   status: 'active',   enquiries: 2, joinedDate: '2026-05-10', lastActive: '2026-05-17', notes: 'Garden & pool essential.'          },
  { id: 10,name: 'Robert Wilson',       email: 'robert@example.com',   phone: '+12025551234',  interest: 'Invest · Villa · Palm Jumeirah',   budget: 'AED 10M+',    status: 'inactive', enquiries: 1, joinedDate: '2026-05-18', lastActive: '2026-05-18', notes: 'High-net-worth, follow up urgently.'},
];

@Component({
  selector: 'app-agent-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-customers.component.html',
  styleUrl: './agent-customers.component.scss',
})
export class AgentCustomersComponent {
  customers = signal<AgentCustomer[]>([...SAMPLE_CUSTOMERS]);
  search    = signal('');
  filterStatus = signal<'active'|'inactive'|'closed'|''>('');

  stats = computed(() => {
    const a = this.customers();
    return { total: a.length, active: a.filter(c=>c.status==='active').length, closed: a.filter(c=>c.status==='closed').length, enquiries: a.reduce((s,c)=>s+c.enquiries,0) };
  });

  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const st = this.filterStatus();
    return this.customers().filter(c => {
      const mq  = !q  || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.interest.toLowerCase().includes(q);
      const mst = !st || c.status === st;
      return mq && mst;
    });
  });
}
