import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type PropStatus = 'active' | 'pending' | 'sold' | 'rented' | 'off_market';
export type PropType   = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio' | 'office';
export type PropCategory = 'sale' | 'rent' | 'off_plan';

export interface Property {
  id: number;
  title: string;
  type: PropType;
  category: PropCategory;
  status: PropStatus;
  price: number;
  currency: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  community: string;
  agent: string;
  listedDate: string;
  images: number;
  views: number;
  leads: number;
  featured: boolean;
}

const SAMPLE_PROPERTIES: Property[] = [
  { id: 1,  title: 'Luxury 3BR Apartment in Downtown',     type: 'apartment',  category: 'sale',     status: 'active',     price: 2850000, currency: 'AED', area: 1850, bedrooms: 3, bathrooms: 3, location: 'Downtown Dubai',       community: 'Burj Views',         agent: 'Sarah Al-Mansouri', listedDate: '2026-04-10', images: 12, views: 342, leads: 8,  featured: true  },
  { id: 2,  title: 'Spacious 2BR in Dubai Marina',         type: 'apartment',  category: 'rent',     status: 'active',     price: 120000,  currency: 'AED', area: 1240, bedrooms: 2, bathrooms: 2, location: 'Dubai Marina',          community: 'Marina Gate',        agent: 'Ahmed Hassan',      listedDate: '2026-04-15', images: 8,  views: 215, leads: 5,  featured: false },
  { id: 3,  title: '4BR Villa with Private Pool',          type: 'villa',      category: 'sale',     status: 'active',     price: 7200000, currency: 'AED', area: 5200, bedrooms: 4, bathrooms: 5, location: 'Palm Jumeirah',         community: 'Signature Villas',   agent: 'Sarah Al-Mansouri', listedDate: '2026-03-22', images: 20, views: 589, leads: 14, featured: true  },
  { id: 4,  title: 'Studio Apartment in JVC',              type: 'studio',     category: 'rent',     status: 'pending',    price: 45000,   currency: 'AED', area: 480,  bedrooms: 0, bathrooms: 1, location: 'Jumeirah Village Circle', community: 'Bloom Heights',      agent: 'Rania Khalid',      listedDate: '2026-05-01', images: 5,  views: 98,  leads: 3,  featured: false },
  { id: 5,  title: 'Off-Plan 2BR in Dubai Creek Harbour',  type: 'apartment',  category: 'off_plan', status: 'active',     price: 1650000, currency: 'AED', area: 1100, bedrooms: 2, bathrooms: 2, location: 'Dubai Creek Harbour',   community: 'Creek Gate',         agent: 'Omar Al-Farsi',     listedDate: '2026-02-14', images: 15, views: 712, leads: 22, featured: true  },
  { id: 6,  title: 'Penthouse with Full Burj View',        type: 'penthouse',  category: 'sale',     status: 'active',     price: 9500000, currency: 'AED', area: 6800, bedrooms: 5, bathrooms: 6, location: 'Downtown Dubai',       community: 'Opera Grand',        agent: 'Sarah Al-Mansouri', listedDate: '2026-01-30', images: 25, views: 1024,leads: 31, featured: true  },
  { id: 7,  title: '3BR Townhouse in Arabian Ranches',     type: 'townhouse',  category: 'sale',     status: 'sold',       price: 3100000, currency: 'AED', area: 2800, bedrooms: 3, bathrooms: 4, location: 'Arabian Ranches',       community: 'Rasha',              agent: 'Ahmed Hassan',      listedDate: '2026-01-05', images: 10, views: 450, leads: 18, featured: false },
  { id: 8,  title: '1BR in Business Bay',                  type: 'apartment',  category: 'rent',     status: 'rented',     price: 80000,   currency: 'AED', area: 750,  bedrooms: 1, bathrooms: 1, location: 'Business Bay',          community: 'Damac Towers',       agent: 'Rania Khalid',      listedDate: '2026-03-10', images: 7,  views: 180, leads: 6,  featured: false },
  { id: 9,  title: 'Office Space in DIFC',                 type: 'office',     category: 'rent',     status: 'active',     price: 250000,  currency: 'AED', area: 2000, bedrooms: 0, bathrooms: 2, location: 'DIFC',                  community: 'Gate Village',       agent: 'Omar Al-Farsi',     listedDate: '2026-04-20', images: 6,  views: 134, leads: 4,  featured: false },
  { id: 10, title: '5BR Villa in Emirates Hills',          type: 'villa',      category: 'sale',     status: 'off_market', price:15000000, currency: 'AED', area: 9500, bedrooms: 5, bathrooms: 7, location: 'Emirates Hills',        community: 'Sector E',           agent: 'Sarah Al-Mansouri', listedDate: '2026-02-28', images: 30, views: 890, leads: 25, featured: false },
  { id: 11, title: '2BR Apartment in JBR',                 type: 'apartment',  category: 'rent',     status: 'active',     price: 140000,  currency: 'AED', area: 1300, bedrooms: 2, bathrooms: 2, location: 'Jumeirah Beach Residence','community': 'Sadaf',           agent: 'Ahmed Hassan',      listedDate: '2026-05-05', images: 9,  views: 201, leads: 7,  featured: false },
  { id: 12, title: 'Off-Plan 1BR in MBR City',             type: 'apartment',  category: 'off_plan', status: 'pending',    price: 980000,  currency: 'AED', area: 720,  bedrooms: 1, bathrooms: 1, location: 'Mohammed Bin Rashid City','community': 'District One',   agent: 'Rania Khalid',      listedDate: '2026-05-10', images: 4,  views: 67,  leads: 2,  featured: false },
];

const EMPTY_FORM = (): Partial<Property> => ({
  title: '', type: 'apartment', category: 'sale', status: 'active',
  price: 0, currency: 'AED', area: 0, bedrooms: 1, bathrooms: 1,
  location: '', community: '', agent: '', listedDate: new Date().toISOString().slice(0, 10),
  images: 0, views: 0, leads: 0, featured: false,
});

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.scss',
})
export class AdminPropertiesComponent {

  // ── Data ──────────────────────────────────────────────
  properties = signal<Property[]>([...SAMPLE_PROPERTIES]);

  // ── Filters ───────────────────────────────────────────
  search      = signal('');
  filterStatus   = signal<PropStatus | ''>('');
  filterType     = signal<PropType | ''>('');
  filterCategory = signal<PropCategory | ''>('');
  sortField   = signal<keyof Property>('listedDate');
  sortDir     = signal<'asc' | 'desc'>('desc');

  // ── Pagination ────────────────────────────────────────
  page     = signal(1);
  pageSize = signal(10);

  // ── Modal ─────────────────────────────────────────────
  modalOpen   = signal(false);
  editingId   = signal<number | null>(null);
  deleteModal = signal<Property | null>(null);
  form        = signal<Partial<Property>>(EMPTY_FORM());
  formErrors  = signal<Record<string, string>>({});

  // ── Computed list ─────────────────────────────────────
  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const s    = this.filterStatus();
    const t    = this.filterType();
    const c    = this.filterCategory();
    const sf   = this.sortField();
    const sd   = this.sortDir();

    let list = this.properties().filter(p => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.community.toLowerCase().includes(q) || p.agent.toLowerCase().includes(q);
      const matchS = !s || p.status === s;
      const matchT = !t || p.type === t;
      const matchC = !c || p.category === c;
      return matchQ && matchS && matchT && matchC;
    });

    list = [...list].sort((a, b) => {
      const av = a[sf] as any;
      const bv = b[sf] as any;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sd === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()));

  stats = computed(() => {
    const all = this.properties();
    return {
      total:      all.length,
      active:     all.filter(p => p.status === 'active').length,
      sold:       all.filter(p => p.status === 'sold').length,
      pending:    all.filter(p => p.status === 'pending').length,
      featured:   all.filter(p => p.featured).length,
    };
  });

  // ── Sorting ───────────────────────────────────────────
  sort(field: keyof Property): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }
  clearFilters(): void {
    this.search.set(''); this.filterStatus.set('');
    this.filterType.set(''); this.filterCategory.set('');
    this.page.set(1);
  }

  hasFilters = computed(() => !!(this.search() || this.filterStatus() || this.filterType() || this.filterCategory()));

  // ── Modal ─────────────────────────────────────────────
  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: Property): void {
    this.form.set({ ...p });
    this.formErrors.set({});
    this.editingId.set(p.id);
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  saveProperty(): void {
    const errs = this.validateForm();
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    const f = this.form() as Property;
    if (this.editingId() !== null) {
      this.properties.update(list =>
        list.map(p => p.id === this.editingId() ? { ...f, id: p.id } : p)
      );
    } else {
      const newId = Math.max(...this.properties().map(p => p.id)) + 1;
      this.properties.update(list => [{ ...f, id: newId, views: 0, leads: 0 } as Property, ...list]);
    }
    this.closeModal();
  }

  private validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    const f = this.form();
    if (!f.title?.trim()) errs['title'] = 'Title is required.';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
    if (!f.community?.trim()) errs['community'] = 'Community is required.';
    if (!f.agent?.trim()) errs['agent'] = 'Agent is required.';
    if (!f.price || f.price <= 0) errs['price'] = 'Price must be greater than 0.';
    if (!f.area || f.area <= 0) errs['area'] = 'Area must be greater than 0.';
    return errs;
  }

  patchForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    this.formErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  // ── Delete ────────────────────────────────────────────
  confirmDelete(p: Property): void { this.deleteModal.set(p); }
  cancelDelete(): void { this.deleteModal.set(null); }
  doDelete(): void {
    const p = this.deleteModal();
    if (!p) return;
    this.properties.update(list => list.filter(x => x.id !== p.id));
    this.deleteModal.set(null);
  }

  // ── Helpers ───────────────────────────────────────────
  formatPrice(price: number, currency: string): string {
    if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(2)}M`;
    if (price >= 1_000)    return `${currency} ${(price / 1_000).toFixed(0)}K`;
    return `${currency} ${price.toLocaleString()}`;
  }

  statusLabel(s: PropStatus): string {
    return { active: 'Active', pending: 'Pending', sold: 'Sold', rented: 'Rented', off_market: 'Off Market' }[s];
  }

  categoryLabel(c: PropCategory): string {
    return { sale: 'For Sale', rent: 'For Rent', off_plan: 'Off-Plan' }[c];
  }

  typeLabel(t: PropType): string {
    return { apartment: 'Apartment', villa: 'Villa', townhouse: 'Townhouse', penthouse: 'Penthouse', studio: 'Studio', office: 'Office' }[t];
  }

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total-4, total-3, total-2, total-1, total];
    return [1, -1, cur-1, cur, cur+1, -1, total];
  }

  readonly statusList: PropStatus[]   = ['active', 'pending', 'sold', 'rented', 'off_market'];
  readonly typeList: PropType[]       = ['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'office'];
  readonly categoryList: PropCategory[] = ['sale', 'rent', 'off_plan'];
}
