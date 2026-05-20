import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type LeadStatus   = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';
export type LeadSource   = 'website' | 'referral' | 'walk_in' | 'social_media' | 'portal' | 'cold_call';
export type LeadCategory = 'buy' | 'rent' | 'invest';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  category: LeadCategory;
  budget: string;
  location: string;
  propertyType: string;
  assignedAgent: string;
  notes: string;
  createdDate: string;
  lastContact: string;
}

const AGENTS = ['Sarah Al-Mansouri', 'Ahmed Hassan', 'Rania Khalid', 'Omar Al-Farsi', 'Unassigned'];

const SAMPLE_LEADS: Lead[] = [
  { id: 1,  name: 'Mohammed Al-Rashidi', email: 'mohammed@example.com', phone: '+971508888888', status: 'new',         source: 'website',      category: 'buy',    budget: 'AED 2M–3M',   location: 'Downtown Dubai',    propertyType: 'Apartment', assignedAgent: 'Sarah Al-Mansouri', notes: 'Looking for 2BHK with sea view.',           createdDate: '2026-05-01', lastContact: '2026-05-01' },
  { id: 2,  name: 'Layla Hussain',       email: 'layla@example.com',    phone: '+971509999999', status: 'contacted',   source: 'referral',     category: 'rent',   budget: 'AED 80K/yr',  location: 'JBR',               propertyType: 'Studio',    assignedAgent: 'Ahmed Hassan',       notes: 'Needs parking.',                            createdDate: '2026-04-28', lastContact: '2026-05-10' },
  { id: 3,  name: 'James Carter',        email: 'james@example.com',    phone: '+447700900123', status: 'qualified',   source: 'portal',       category: 'invest', budget: 'AED 5M+',     location: 'Palm Jumeirah',     propertyType: 'Villa',     assignedAgent: 'Sarah Al-Mansouri', notes: 'Investment for rental yield.',              createdDate: '2026-04-20', lastContact: '2026-05-15' },
  { id: 4,  name: 'Priya Nair',          email: 'priya@example.com',    phone: '+919876543210', status: 'negotiating', source: 'social_media', category: 'buy',    budget: 'AED 1M–1.5M', location: 'Dubai Marina',      propertyType: 'Apartment', assignedAgent: 'Rania Khalid',       notes: 'First-time buyer.',                         createdDate: '2026-04-15', lastContact: '2026-05-18' },
  { id: 5,  name: 'Khalid Al-Maktoum',   email: 'khalid@example.com',   phone: '+971501234567', status: 'won',         source: 'walk_in',      category: 'buy',    budget: 'AED 4M',      location: 'Business Bay',      propertyType: 'Penthouse', assignedAgent: 'Ahmed Hassan',       notes: 'Closed deal — Villa Bay Residences.',       createdDate: '2026-03-10', lastContact: '2026-05-02' },
  { id: 6,  name: 'Ana Sousa',           email: 'ana@example.com',      phone: '+351912345678', status: 'lost',        source: 'cold_call',    category: 'rent',   budget: 'AED 60K/yr',  location: 'Deira',             propertyType: 'Apartment', assignedAgent: 'Omar Al-Farsi',      notes: 'Moved to a competitor.',                    createdDate: '2026-04-01', lastContact: '2026-04-25' },
  { id: 7,  name: 'Tariq Ibrahim',       email: 'tariq@example.com',    phone: '+971553456789', status: 'new',         source: 'website',      category: 'buy',    budget: 'AED 3M–4M',   location: 'Arabian Ranches',   propertyType: 'Villa',     assignedAgent: 'Unassigned',         notes: 'Wants garden & pool.',                      createdDate: '2026-05-17', lastContact: '2026-05-17' },
  { id: 8,  name: 'Elena Petrova',       email: 'elena@example.com',    phone: '+79161234567',  status: 'contacted',   source: 'referral',     category: 'invest', budget: 'AED 2M',      location: 'Dubai Hills',       propertyType: 'Apartment', assignedAgent: 'Rania Khalid',       notes: 'Referred by James Carter.',                 createdDate: '2026-05-08', lastContact: '2026-05-14' },
  { id: 9,  name: 'David Kim',           email: 'david@example.com',    phone: '+821012345678', status: 'qualified',   source: 'portal',       category: 'buy',    budget: 'AED 1.5M',    location: 'Jumeirah Village',  propertyType: 'Townhouse', assignedAgent: 'Sarah Al-Mansouri', notes: 'Pre-approved mortgage.',                    createdDate: '2026-05-05', lastContact: '2026-05-16' },
  { id: 10, name: 'Fatima Al-Zaabi',     email: 'fzaabi@example.com',   phone: '+971557654321', status: 'negotiating', source: 'walk_in',      category: 'rent',   budget: 'AED 120K/yr', location: 'DIFC',              propertyType: 'Apartment', assignedAgent: 'Ahmed Hassan',       notes: 'Corporate relocation.',                     createdDate: '2026-04-22', lastContact: '2026-05-19' },
  { id: 11, name: 'Robert Wilson',       email: 'robert@example.com',   phone: '+12025551234',  status: 'new',         source: 'social_media', category: 'invest', budget: 'AED 10M+',    location: 'Palm Jumeirah',     propertyType: 'Villa',     assignedAgent: 'Unassigned',         notes: 'High-net-worth buyer — priority follow-up.', createdDate: '2026-05-18', lastContact: '2026-05-18' },
  { id: 12, name: 'Nadia Benali',        email: 'nadia@example.com',    phone: '+21361234567',  status: 'contacted',   source: 'website',      category: 'rent',   budget: 'AED 70K/yr',  location: 'Barsha Heights',    propertyType: 'Studio',    assignedAgent: 'Omar Al-Farsi',      notes: 'Needs furnished unit.',                     createdDate: '2026-05-12', lastContact: '2026-05-15' },
];

const EMPTY_FORM = (): Partial<Lead> => ({
  name: '', email: '', phone: '', status: 'new', source: 'website', category: 'buy',
  budget: '', location: '', propertyType: '', assignedAgent: 'Unassigned', notes: '',
  createdDate: new Date().toISOString().slice(0, 10),
  lastContact: new Date().toISOString().slice(0, 10),
});

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-leads.component.html',
  styleUrl: './admin-leads.component.scss',
})
export class AdminLeadsComponent {

  leads = signal<Lead[]>([...SAMPLE_LEADS]);

  search      = signal('');
  filterStatus = signal<LeadStatus | ''>('');
  filterSource = signal<LeadSource | ''>('');
  filterAgent  = signal('');
  sortCol     = signal<keyof Lead>('createdDate');
  sortDir     = signal<'asc' | 'desc'>('desc');
  page        = signal(1);
  pageSize    = 10;

  // Modal state
  showModal      = signal(false);
  isEdit         = signal(false);
  editId         = signal<number | null>(null);
  form           = signal<Partial<Lead>>(EMPTY_FORM());
  formErrors     = signal<Record<string, string>>({});
  showDeleteModal = signal(false);
  deleteTarget   = signal<Lead | null>(null);

  readonly agents = AGENTS;

  readonly statuses: LeadStatus[]  = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];
  readonly sources: LeadSource[]   = ['website', 'referral', 'walk_in', 'social_media', 'portal', 'cold_call'];
  readonly categories: LeadCategory[] = ['buy', 'rent', 'invest'];

  stats = computed(() => {
    const all = this.leads();
    return {
      total:       all.length,
      new:         all.filter(l => l.status === 'new').length,
      qualified:   all.filter(l => l.status === 'qualified').length,
      negotiating: all.filter(l => l.status === 'negotiating').length,
      won:         all.filter(l => l.status === 'won').length,
    };
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const st = this.filterStatus();
    const src = this.filterSource();
    const ag = this.filterAgent();
    const col = this.sortCol();
    const dir = this.sortDir();

    let list = this.leads().filter(l => {
      const matchQ  = !q  || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
      const matchSt  = !st  || l.status === st;
      const matchSrc = !src || l.source === src;
      const matchAg  = !ag  || l.assignedAgent === ag;
      return matchQ && matchSt && matchSrc && matchAg;
    });

    list = [...list].sort((a, b) => {
      const av = a[col] as string;
      const bv = b[col] as string;
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paginated = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    return this.filtered().slice((p - 1) * this.pageSize, p * this.pageSize);
  });

  sort(col: keyof Lead): void {
    if (this.sortCol() === col) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }

  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.isEdit.set(false);
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(lead: Lead): void {
    this.form.set({ ...lead });
    this.formErrors.set({});
    this.isEdit.set(true);
    this.editId.set(lead.id);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveLead(): void {
    const f = this.form();
    const errs: Record<string, string> = {};
    if (!f.name?.trim())   errs['name']  = 'Name is required.';
    if (!f.email?.trim())  errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'Enter a valid email.';
    if (!f.phone?.trim())  errs['phone'] = 'Phone is required.';
    if (!f.budget?.trim()) errs['budget'] = 'Budget is required.';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    if (this.isEdit()) {
      this.leads.update(list => list.map(l => l.id === this.editId() ? { ...l, ...(f as Lead) } : l));
    } else {
      const newId = Math.max(...this.leads().map(l => l.id)) + 1;
      this.leads.update(list => [{ ...(f as Lead), id: newId }, ...list]);
    }
    this.showModal.set(false);
  }

  confirmDelete(lead: Lead): void {
    this.deleteTarget.set(lead);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  doDelete(): void {
    const t = this.deleteTarget();
    if (t) this.leads.update(list => list.filter(l => l.id !== t.id));
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }

  updateForm(patch: Partial<Lead>): void {
    this.form.update(f => ({ ...f, ...patch }));
  }

  labelStatus(s: LeadStatus): string {
    return { new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiating: 'Negotiating', won: 'Won', lost: 'Lost' }[s];
  }

  labelSource(s: LeadSource): string {
    return { website: 'Website', referral: 'Referral', walk_in: 'Walk-in', social_media: 'Social Media', portal: 'Portal', cold_call: 'Cold Call' }[s];
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) pages.push(i);
    return pages;
  }
}
