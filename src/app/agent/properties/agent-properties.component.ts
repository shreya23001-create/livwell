import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type PropStatus = 'available' | 'reserved' | 'sold' | 'rented';

export interface AgentProperty {
  id: number;
  title: string;
  location: string;
  type: string;
  category: 'sale' | 'rent';
  price: string;
  beds: number;
  baths: number;
  area: string;
  status: PropStatus;
  listedDate: string;
  views: number;
  enquiries: number;
}

const SAMPLE_PROPS: AgentProperty[] = [
  { id: 1,  title: 'Marina Heights 2BHK',      location: 'Dubai Marina',      type: 'Apartment', category: 'sale', price: 'AED 2,800,000', beds: 2, baths: 2, area: '1,240 sqft', status: 'available', listedDate: '2026-04-01', views: 142, enquiries: 8  },
  { id: 2,  title: 'Palm Villa 4BR',             location: 'Palm Jumeirah',     type: 'Villa',     category: 'sale', price: 'AED 7,500,000', beds: 4, baths: 5, area: '5,800 sqft', status: 'available', listedDate: '2026-03-15', views: 210, enquiries: 12 },
  { id: 3,  title: 'DIFC Studio',                location: 'DIFC',              type: 'Studio',    category: 'rent', price: 'AED 90,000/yr', beds: 0, baths: 1, area: '480 sqft',   status: 'rented',    listedDate: '2026-02-20', views: 89,  enquiries: 5  },
  { id: 4,  title: 'Skyline Penthouse',          location: 'Downtown Dubai',    type: 'Penthouse', category: 'sale', price: 'AED 5,200,000', beds: 3, baths: 4, area: '3,100 sqft', status: 'reserved',  listedDate: '2026-04-10', views: 178, enquiries: 9  },
  { id: 5,  title: 'JVC Townhouse 3BR',          location: 'Jumeirah Village',  type: 'Townhouse', category: 'sale', price: 'AED 1,850,000', beds: 3, baths: 3, area: '2,200 sqft', status: 'available', listedDate: '2026-05-01', views: 64,  enquiries: 3  },
  { id: 6,  title: 'Business Bay 1BHK',          location: 'Business Bay',      type: 'Apartment', category: 'rent', price: 'AED 75,000/yr', beds: 1, baths: 1, area: '720 sqft',   status: 'available', listedDate: '2026-05-05', views: 51,  enquiries: 2  },
  { id: 7,  title: 'Arabian Ranches Villa 5BR',  location: 'Arabian Ranches',   type: 'Villa',     category: 'sale', price: 'AED 4,100,000', beds: 5, baths: 6, area: '6,200 sqft', status: 'available', listedDate: '2026-04-25', views: 93,  enquiries: 6  },
  { id: 8,  title: 'Dubai Hills Apt 2BR',        location: 'Dubai Hills',       type: 'Apartment', category: 'sale', price: 'AED 2,100,000', beds: 2, baths: 2, area: '1,050 sqft', status: 'sold',      listedDate: '2026-01-10', views: 301, enquiries: 18 },
];

const EMPTY_FORM = (): Partial<AgentProperty> => ({
  title: '', location: '', type: 'Apartment', category: 'sale',
  price: '', beds: 1, baths: 1, area: '', status: 'available',
  listedDate: new Date().toISOString().slice(0,10), views: 0, enquiries: 0,
});

@Component({
  selector: 'app-agent-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-properties.component.html',
  styleUrl: './agent-properties.component.scss',
})
export class AgentPropertiesComponent {
  properties = signal<AgentProperty[]>([...SAMPLE_PROPS]);
  search       = signal('');
  filterStatus = signal<PropStatus | ''>('');
  filterCat    = signal<'sale'|'rent'|''>('');

  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number|null>(null);
  form            = signal<Partial<AgentProperty>>(EMPTY_FORM());
  formErrors      = signal<Record<string,string>>({});
  showDeleteModal = signal(false);
  deleteTarget    = signal<AgentProperty|null>(null);

  readonly types    = ['Apartment','Villa','Townhouse','Penthouse','Studio','Office'];
  readonly statuses: PropStatus[] = ['available','reserved','sold','rented'];

  stats = computed(() => {
    const a = this.properties();
    return { total: a.length, available: a.filter(p=>p.status==='available').length, reserved: a.filter(p=>p.status==='reserved').length, enquiries: a.reduce((s,p)=>s+p.enquiries,0) };
  });

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const st  = this.filterStatus();
    const cat = this.filterCat();
    return this.properties().filter(p => {
      const mq   = !q   || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const mst  = !st  || p.status === st;
      const mcat = !cat || p.category === cat;
      return mq && mst && mcat;
    });
  });

  openAdd()  { this.form.set(EMPTY_FORM()); this.formErrors.set({}); this.isEdit.set(false); this.editId.set(null); this.showModal.set(true); }
  openEdit(p: AgentProperty) { this.form.set({...p}); this.formErrors.set({}); this.isEdit.set(true); this.editId.set(p.id); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    const f = this.form();
    const e: Record<string,string> = {};
    if (!f.title?.trim())    e['title']    = 'Required.';
    if (!f.location?.trim()) e['location'] = 'Required.';
    if (!f.price?.trim())    e['price']    = 'Required.';
    if (!f.area?.trim())     e['area']     = 'Required.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;
    if (this.isEdit()) {
      this.properties.update(list => list.map(p => p.id===this.editId() ? {...p,...(f as AgentProperty)} : p));
    } else {
      const id = Math.max(...this.properties().map(p=>p.id)) + 1;
      this.properties.update(list => [{...(f as AgentProperty), id}, ...list]);
    }
    this.showModal.set(false);
  }

  confirmDelete(p: AgentProperty) { this.deleteTarget.set(p); this.showDeleteModal.set(true); }
  cancelDelete() { this.showDeleteModal.set(false); this.deleteTarget.set(null); }
  doDelete()     { const t=this.deleteTarget(); if(t) this.properties.update(list=>list.filter(p=>p.id!==t.id)); this.cancelDelete(); }
  updateForm(patch: Partial<AgentProperty>) { this.form.update(f=>({...f,...patch})); }

  labelStatus(s: PropStatus): string {
    return ({available:'Available',reserved:'Reserved',sold:'Sold',rented:'Rented'} as Record<string,string>)[s] ?? s;
  }
}
