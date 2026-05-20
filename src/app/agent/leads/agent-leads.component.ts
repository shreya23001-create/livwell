import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';

export interface AgentLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  category: string;
  budget: string;
  location: string;
  propertyType: string;
  source: string;
  notes: string;
  lastContact: string;
  createdDate: string;
}

const SAMPLE_LEADS: AgentLead[] = [
  { id: 1,  name: 'Mohammed Al-Rashidi', email: 'mohammed@example.com', phone: '+971508888888', status: 'new',         category: 'Buy',    budget: 'AED 2M–3M',   location: 'Downtown Dubai',  propertyType: 'Apartment', source: 'Website',      notes: 'Looking for 2BHK with sea view.',   lastContact: '2026-05-19', createdDate: '2026-05-19' },
  { id: 2,  name: 'James Carter',        email: 'james@example.com',    phone: '+447700900123', status: 'qualified',   category: 'Invest', budget: 'AED 5M+',     location: 'Palm Jumeirah',   propertyType: 'Villa',     source: 'Portal',       notes: 'Investment for rental yield.',      lastContact: '2026-05-15', createdDate: '2026-04-20' },
  { id: 3,  name: 'Elena Petrova',       email: 'elena@example.com',    phone: '+79161234567',  status: 'contacted',   category: 'Invest', budget: 'AED 2M',      location: 'Dubai Hills',     propertyType: 'Apartment', source: 'Referral',     notes: 'Referred by James Carter.',         lastContact: '2026-05-14', createdDate: '2026-05-08' },
  { id: 4,  name: 'David Kim',           email: 'david@example.com',    phone: '+821012345678', status: 'qualified',   category: 'Buy',    budget: 'AED 1.5M',    location: 'JVC',             propertyType: 'Townhouse', source: 'Portal',       notes: 'Pre-approved mortgage.',            lastContact: '2026-05-16', createdDate: '2026-05-05' },
  { id: 5,  name: 'Robert Wilson',       email: 'robert@example.com',   phone: '+12025551234',  status: 'new',         category: 'Invest', budget: 'AED 10M+',    location: 'Palm Jumeirah',   propertyType: 'Villa',     source: 'Social Media', notes: 'High-net-worth — priority.',        lastContact: '2026-05-18', createdDate: '2026-05-18' },
  { id: 6,  name: 'Fatima Al-Zaabi',     email: 'fzaabi@example.com',   phone: '+971557654321', status: 'negotiating', category: 'Rent',   budget: 'AED 120K/yr', location: 'DIFC',            propertyType: 'Apartment', source: 'Walk-in',      notes: 'Corporate relocation.',             lastContact: '2026-05-19', createdDate: '2026-04-22' },
  { id: 7,  name: 'Khalid Al-Maktoum',   email: 'khalid@example.com',   phone: '+971501234567', status: 'won',         category: 'Buy',    budget: 'AED 4M',      location: 'Business Bay',    propertyType: 'Penthouse', source: 'Walk-in',      notes: 'Closed — Bay Residences.',          lastContact: '2026-05-02', createdDate: '2026-03-10' },
  { id: 8,  name: 'Layla Hussain',       email: 'layla@example.com',    phone: '+971509999999', status: 'contacted',   category: 'Rent',   budget: 'AED 80K/yr',  location: 'JBR',             propertyType: 'Studio',    source: 'Referral',     notes: 'Needs parking.',                    lastContact: '2026-05-10', createdDate: '2026-04-28' },
  { id: 9,  name: 'Priya Nair',          email: 'priya@example.com',    phone: '+919876543210', status: 'negotiating', category: 'Buy',    budget: 'AED 1M–1.5M', location: 'Dubai Marina',    propertyType: 'Apartment', source: 'Social Media', notes: 'First-time buyer.',                 lastContact: '2026-05-18', createdDate: '2026-04-15' },
  { id: 10, name: 'Tariq Ibrahim',       email: 'tariq@example.com',    phone: '+971553456789', status: 'new',         category: 'Buy',    budget: 'AED 3M–4M',   location: 'Arabian Ranches', propertyType: 'Villa',     source: 'Website',      notes: 'Wants garden & pool.',              lastContact: '2026-05-17', createdDate: '2026-05-17' },
];

const EMPTY_FORM = (): Partial<AgentLead> => ({
  name: '', email: '', phone: '', status: 'new', category: 'Buy',
  budget: '', location: '', propertyType: '', source: 'Website', notes: '',
  createdDate: new Date().toISOString().slice(0,10),
  lastContact: new Date().toISOString().slice(0,10),
});

@Component({
  selector: 'app-agent-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-leads.component.html',
  styleUrl: './agent-leads.component.scss',
})
export class AgentLeadsComponent {
  leads        = signal<AgentLead[]>([...SAMPLE_LEADS]);
  search       = signal('');
  filterStatus = signal<LeadStatus | ''>('');
  sortCol      = signal<keyof AgentLead>('createdDate');
  sortDir      = signal<'asc'|'desc'>('desc');

  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number|null>(null);
  form            = signal<Partial<AgentLead>>(EMPTY_FORM());
  formErrors      = signal<Record<string,string>>({});
  showDeleteModal = signal(false);
  deleteTarget    = signal<AgentLead|null>(null);

  readonly statuses: LeadStatus[] = ['new','contacted','qualified','negotiating','won','lost'];
  readonly categories = ['Buy','Rent','Invest'];
  readonly sources    = ['Website','Referral','Walk-in','Social Media','Portal','Cold Call'];

  stats = computed(() => {
    const a = this.leads();
    return {
      total:  a.length,
      new:    a.filter(l => l.status === 'new').length,
      active: a.filter(l => ['contacted','qualified','negotiating'].includes(l.status)).length,
      won:    a.filter(l => l.status === 'won').length,
    };
  });

  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const st = this.filterStatus();
    let list = this.leads().filter(l => {
      const mq  = !q  || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
      const mst = !st || l.status === st;
      return mq && mst;
    });
    const col = this.sortCol();
    const dir = this.sortDir();
    return [...list].sort((a,b) => { const av=String(a[col]); const bv=String(b[col]); return dir==='asc'?av.localeCompare(bv):bv.localeCompare(av); });
  });

  sort(col: keyof AgentLead) {
    if (this.sortCol() === col) this.sortDir.update(d => d==='asc'?'desc':'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

  openAdd()  { this.form.set(EMPTY_FORM()); this.formErrors.set({}); this.isEdit.set(false); this.editId.set(null); this.showModal.set(true); }
  openEdit(l: AgentLead) { this.form.set({...l}); this.formErrors.set({}); this.isEdit.set(true); this.editId.set(l.id); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    const f = this.form();
    const e: Record<string,string> = {};
    if (!f.name?.trim())     e['name']     = 'Required.';
    if (!f.email?.trim())    e['email']    = 'Required.';
    if (!f.phone?.trim())    e['phone']    = 'Required.';
    if (!f.budget?.trim())   e['budget']   = 'Required.';
    if (!f.location?.trim()) e['location'] = 'Required.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;
    if (this.isEdit()) {
      this.leads.update(list => list.map(l => l.id===this.editId() ? {...l,...(f as AgentLead)} : l));
    } else {
      const id = Math.max(...this.leads().map(l=>l.id)) + 1;
      this.leads.update(list => [{...(f as AgentLead), id}, ...list]);
    }
    this.showModal.set(false);
  }

  confirmDelete(l: AgentLead) { this.deleteTarget.set(l); this.showDeleteModal.set(true); }
  cancelDelete() { this.showDeleteModal.set(false); this.deleteTarget.set(null); }
  doDelete()     { const t=this.deleteTarget(); if(t) this.leads.update(list=>list.filter(l=>l.id!==t.id)); this.cancelDelete(); }
  updateForm(p: Partial<AgentLead>) { this.form.update(f=>({...f,...p})); }

  labelStatus(s: string): string {
    return ({new:'New',contacted:'Contacted',qualified:'Qualified',negotiating:'Negotiating',won:'Won',lost:'Lost'} as Record<string,string>)[s] ?? s;
  }
}
