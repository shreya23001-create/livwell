import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

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

@Component({
  selector: 'app-agent-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-properties.component.html',
  styleUrl: './agent-properties.component.scss',
})
export class AgentPropertiesComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  properties   = signal<AgentProperty[]>([]);
  search       = signal('');
  filterStatus = signal<PropStatus | ''>('');
  filterCat    = signal<'sale' | 'rent' | ''>('');
  loading      = signal(true);
  saving       = signal(false);
  saveError    = signal('');

  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number | null>(null);
  form            = signal<Partial<AgentProperty>>(this.emptyForm());
  formErrors      = signal<Record<string, string>>({});
  showDeleteModal = signal(false);
  deleteTarget    = signal<AgentProperty | null>(null);

  readonly types:    string[]     = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office'];
  readonly statuses: PropStatus[] = ['available', 'reserved', 'sold', 'rented'];

  stats = computed(() => {
    const a = this.properties();
    return {
      total:     a.length,
      available: a.filter(p => p.status === 'available').length,
      reserved:  a.filter(p => p.status === 'reserved').length,
      views:     a.reduce((s, p) => s + p.views, 0),
    };
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

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const agentName = this.auth.currentUser()?.name;
    if (!agentName) { this.loading.set(false); return; }

    const { data, error } = await this.sb
      .from('properties')
      .select('id, title, location, type, listing_type, price, bedrooms, bathrooms, area_sqft, status, created_at, views')
      .eq('agent_name', agentName)
      .order('created_at', { ascending: false });

    if (error) console.error('Agent properties fetch:', error);
    this.properties.set((data ?? []).map((p: any) => this.mapRow(p)));
    this.loading.set(false);
  }

  private mapRow(p: any): AgentProperty {
    const dbStatus = (p.status || '').toLowerCase();
    let status: PropStatus = 'available';
    if (dbStatus === 'reserved') status = 'reserved';
    else if (dbStatus === 'sold') status = 'sold';
    else if (dbStatus === 'rented') status = 'rented';

    return {
      id:         p.id,
      title:      p.title       || '',
      location:   p.location    || '',
      type:       p.type        || 'Apartment',
      category:   p.listing_type === 'Rent' ? 'rent' : 'sale',
      price:      'AED ' + Number(p.price).toLocaleString() + (p.listing_type === 'Rent' ? '/yr' : ''),
      beds:       p.bedrooms    || 0,
      baths:      p.bathrooms   || 0,
      area:       p.area_sqft ? p.area_sqft.toLocaleString() + ' sqft' : '',
      status,
      listedDate: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '',
      views:      p.views       || 0,
      enquiries:  0,
    };
  }

  private emptyForm(): Partial<AgentProperty> {
    return {
      title: '', location: '', type: 'Apartment', category: 'sale',
      price: '', beds: 1, baths: 1, area: '', status: 'available',
      listedDate: new Date().toISOString().slice(0, 10), views: 0, enquiries: 0,
    };
  }

  openAdd(): void { this.form.set(this.emptyForm()); this.formErrors.set({}); this.isEdit.set(false); this.editId.set(null); this.showModal.set(true); }
  openEdit(p: AgentProperty): void { this.form.set({ ...p }); this.formErrors.set({}); this.isEdit.set(true); this.editId.set(p.id); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); this.saveError.set(''); }
  updateForm(patch: Partial<AgentProperty>): void { this.form.update(f => ({ ...f, ...patch })); }

  async save(): Promise<void> {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.title?.trim())    e['title']    = 'Required.';
    if (!f.location?.trim()) e['location'] = 'Required.';
    if (!f.price?.trim())    e['price']    = 'Required.';
    if (!f.area?.trim())     e['area']     = 'Required.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const agentName = this.auth.currentUser()?.name ?? '';
    // price stored as string in form — strip non-numeric for DB
    const numPrice = parseFloat((f.price ?? '').replace(/[^0-9.]/g, '')) || 0;

    if (this.isEdit() && this.editId() !== null) {
      const { error } = await this.sb.from('properties').update({
        title:        f.title!.trim(),
        location:     f.location!.trim(),
        type:         f.type,
        listing_type: f.category === 'rent' ? 'Rent' : 'Sale',
        price:        numPrice,
        bedrooms:     f.beds,
        bathrooms:    f.baths,
        area_sqft:    parseFloat((f.area ?? '').replace(/[^0-9.]/g, '')) || null,
        status:       f.status === 'available' ? 'Published' : f.status,
        agent_name:   agentName,
      }).eq('id', this.editId()!);
      if (error) { this.saveError.set('Failed to save. Please try again.'); this.saving.set(false); return; }
      this.properties.update(list => list.map(p => p.id === this.editId() ? { ...p, ...f } as AgentProperty : p));
    } else {
      const { data, error } = await this.sb.from('properties').insert({
        title:        f.title!.trim(),
        location:     f.location!.trim(),
        type:         f.type,
        listing_type: f.category === 'rent' ? 'Rent' : 'Sale',
        price:        numPrice,
        bedrooms:     f.beds,
        bathrooms:    f.baths,
        area_sqft:    parseFloat((f.area ?? '').replace(/[^0-9.]/g, '')) || null,
        status:       'Published',
        agent_name:   agentName,
        views:        0,
      }).select().single();
      if (error) { this.saveError.set('Failed to add property. Please try again.'); this.saving.set(false); return; }
      if (data) this.properties.update(list => [this.mapRow(data), ...list]);
    }

    this.saving.set(false);
    this.showModal.set(false);
  }

  confirmDelete(p: AgentProperty): void { this.deleteTarget.set(p); this.showDeleteModal.set(true); }
  cancelDelete(): void { this.showDeleteModal.set(false); this.deleteTarget.set(null); }

  async doDelete(): Promise<void> {
    const t = this.deleteTarget();
    if (!t) return;
    await this.sb.from('properties').delete().eq('id', t.id);
    this.properties.update(list => list.filter(p => p.id !== t.id));
    this.cancelDelete();
  }

  labelStatus(s: PropStatus): string {
    return ({ available: 'Available', reserved: 'Reserved', sold: 'Sold', rented: 'Rented' } as Record<string, string>)[s] ?? s;
  }
}
