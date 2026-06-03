import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import * as XLSX from 'xlsx';

export type PropStatus   = 'Draft' | 'Pending Review' | 'Published' | 'Archived' | 'Sold' | 'Rented';
export type PropType     = 'Apartment' | 'Villa' | 'Townhouse' | 'Penthouse' | 'Studio' | 'Office';
export type PropCategory = 'Sale' | 'Rent' | 'Off-Plan';

export interface Property {
  id:           number;
  title:        string;
  type:         PropType;
  listing_type: PropCategory;
  status:       PropStatus;
  price:        number;
  area_sqft:    number;
  bedrooms:     number;
  bathrooms:    number;
  location:     string;
  community:    string;
  agent_name:   string;
  created_at:   string;
  views:        number;
  is_featured:  boolean;
  description:  string;
  address:      string;
  furnishing:   string;
  images:       string[];
}

const EMPTY_FORM = (): Partial<Property> => ({
  title: '', type: 'Apartment', listing_type: 'Sale', status: 'Draft',
  price: 0, area_sqft: 0, bedrooms: 1, bathrooms: 1,
  location: '', community: '', address: '', description: '',
  furnishing: 'Unfurnished', agent_name: '', is_featured: false, images: [],
});

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.scss',
})
export class AdminPropertiesComponent implements OnInit {
  private sb = inject(SupabaseService).client;

  // ── Data ──────────────────────────────────────────────
  properties  = signal<Property[]>([]);
  agents      = signal<{ name: string }[]>([]);
  loading     = signal(true);
  saving      = signal(false);

  // ── Filters ───────────────────────────────────────────
  search         = signal('');
  filterStatus   = signal<PropStatus | ''>('');
  filterType     = signal<PropType | ''>('');
  filterCategory = signal<PropCategory | ''>('');
  sortField      = signal<keyof Property>('created_at');
  sortDir        = signal<'asc' | 'desc'>('desc');

  // ── Pagination ────────────────────────────────────────
  page     = signal(1);
  pageSize = signal(10);

  // ── Modal ─────────────────────────────────────────────
  modalOpen      = signal(false);
  editingId      = signal<number | null>(null);
  deleteModal    = signal<Property | null>(null);
  form           = signal<Partial<Property>>(EMPTY_FORM());
  formErrors     = signal<Record<string, string>>({});
  saveError      = signal('');
  uploadingImages = signal(false);
  uploadedImages  = signal<string[]>([]);   // final public URLs (saved to DB)
  previewImages   = signal<string[]>([]);   // local blob URLs for instant preview

  // ── Computed ──────────────────────────────────────────
  filtered = computed(() => {
    const q  = this.search().toLowerCase();
    const s  = this.filterStatus();
    const t  = this.filterType();
    const c  = this.filterCategory();
    const sf = this.sortField();
    const sd = this.sortDir();

    let list = this.properties().filter(p => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q) || (p.community ?? '').toLowerCase().includes(q) || (p.agent_name ?? '').toLowerCase().includes(q);
      const matchS = !s || p.status === s;
      const matchT = !t || p.type === t;
      const matchC = !c || p.listing_type === c;
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

  paginated  = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()));

  stats = computed(() => {
    const all = this.properties();
    return {
      total:     all.length,
      published: all.filter(p => p.status === 'Published').length,
      draft:     all.filter(p => p.status === 'Draft').length,
      pending:   all.filter(p => p.status === 'Pending Review').length,
      featured:  all.filter(p => p.is_featured).length,
    };
  });

  hasFilters = computed(() => !!(this.search() || this.filterStatus() || this.filterType() || this.filterCategory()));

  // ── Lifecycle ─────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadProperties(), this.loadAgents()]);
  }

  async loadProperties(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.properties.set(data.map((p: any) => ({
        ...p,
        agent_name: p.agent_name || '—',
      })));
    }
    this.loading.set(false);
  }

  async loadAgents(): Promise<void> {
    const { data } = await this.sb
      .from('admin_users')
      .select('name')
      .eq('role', 'agent')
      .order('name');
    if (data) this.agents.set(data.map((a: any) => ({ name: a.name })));
  }

  // ── Sorting / Filtering ───────────────────────────────
  sort(field: keyof Property): void {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }
  onSearch(): void { this.page.set(1); }
  onFilter(): void { this.page.set(1); }
  clearFilters(): void {
    this.search.set(''); this.filterStatus.set('');
    this.filterType.set(''); this.filterCategory.set('');
    this.page.set(1);
  }

  // ── Modal ─────────────────────────────────────────────
  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set([]);
    this.previewImages.set([]);
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: Property): void {
    this.form.set({ ...p });
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set(p.images ?? []);
    this.previewImages.set(p.images ?? []);   // existing URLs are already public
    this.editingId.set(p.id);
    this.modalOpen.set(true);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    this.runUpload(files);
  }

  private async runUpload(files: File[]): Promise<void> {
    this.uploadingImages.set(true);
    this.saveError.set('');

    // Show instant local previews before upload starts
    const blobs = files.map(f => URL.createObjectURL(f));
    this.previewImages.update(p => [...p, ...blobs]);

    const publicUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `properties/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await this.sb.storage
          .from('imagesFolder')
          .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });

        if (error) {
          this.saveError.set(`Image ${i + 1} failed: ${error.message}`);
          // Revoke the blob that failed
          URL.revokeObjectURL(blobs[i]);
          this.previewImages.update(p => p.filter(u => u !== blobs[i]));
          break;
        }

        if (data) {
          const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
          // Replace the blob preview with the real public URL
          this.previewImages.update(p => p.map(u => u === blobs[i] ? pub.publicUrl : u));
          URL.revokeObjectURL(blobs[i]);
          publicUrls.push(pub.publicUrl);
        }
      }
    } catch (e: any) {
      this.saveError.set('Upload error: ' + (e?.message ?? 'Unknown error'));
    } finally {
      this.uploadedImages.update(p => [...p, ...publicUrls]);
      this.uploadingImages.set(false);
    }
  }

  removeImage(index: number): void {
    this.previewImages.update(imgs => imgs.filter((_, i) => i !== index));
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }


  closeModal(): void {
    this.modalOpen.set(false);
    this.previewImages.set([]);
    this.uploadedImages.set([]);
  }

  async saveProperty(): Promise<void> {
    const errs = this.validateForm();
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const f = this.form();

    const payload: any = {
      title:        f.title?.trim(),
      type:         f.type         || 'Apartment',
      listing_type: f.listing_type || 'Sale',
      status:       f.status       || 'Draft',
      price:        Number(f.price)    || 0,
      area_sqft:    Number(f.area_sqft) || 0,
      bedrooms:     Number(f.bedrooms)  || 0,
      bathrooms:    Number(f.bathrooms) || 1,
      location:     f.location?.trim()  || '',
      community:    f.community?.trim() || '',
      address:      f.address?.trim()   || '',
      description:  f.description?.trim() || '',
      furnishing:   f.furnishing    || 'Unfurnished',
      agent_name:   f.agent_name    || null,
      agent_id:     null,
      is_featured:  f.is_featured   ?? false,
      images:       this.uploadedImages(),
    };

    try {
      let error: any;

      if (this.editingId() !== null) {
        ({ error } = await this.sb.from('properties').update(payload).eq('id', this.editingId()));
      } else {
        ({ error } = await this.sb.from('properties').insert(payload));
      }

      if (error) {
        console.error('Supabase save error:', error);
        this.saveError.set(`Error: ${error.message || error.code || 'Unknown error'}`);
        this.saving.set(false);
        return;
      }

      this.saving.set(false);
      this.closeModal();
      await this.loadProperties();

    } catch (e: any) {
      console.error('Save exception:', e);
      this.saveError.set('Unexpected error: ' + (e?.message || 'Please try again.'));
      this.saving.set(false);
    }
  }

  private validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    const f = this.form();
    if (!f.title?.trim())    errs['title']    = 'Title is required.';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
    if (!f.price || f.price <= 0) errs['price'] = 'Price must be greater than 0.';
    if (!f.area_sqft || f.area_sqft <= 0) errs['area_sqft'] = 'Area must be greater than 0.';
    return errs;
  }

  patchForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    this.formErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  // ── Delete ────────────────────────────────────────────
  confirmDelete(p: Property): void { this.deleteModal.set(p); }
  cancelDelete(): void  { this.deleteModal.set(null); }

  async doDelete(): Promise<void> {
    const p = this.deleteModal();
    if (!p) return;
    const { error } = await this.sb.from('properties').delete().eq('id', p.id);
    if (!error) {
      this.deleteModal.set(null);
      await this.loadProperties();
    }
  }

  // ── Status quick-change ───────────────────────────────
  async updateStatus(p: Property, status: PropStatus): Promise<void> {
    await this.sb.from('properties').update({ status }).eq('id', p.id);
    await this.loadProperties();
  }

  // ── Helpers ───────────────────────────────────────────
  formatPrice(price: number): string {
    if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(2)}M`;
    if (price >= 1_000)     return `AED ${(price / 1_000).toFixed(0)}K`;
    return `AED ${price.toLocaleString()}`;
  }

  agentName(name: string | null): string {
    return name || '—';
  }

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total-4, total-3, total-2, total-1, total];
    return [1, -1, cur-1, cur, cur+1, -1, total];
  }

  importError   = signal('');
  importSuccess = signal('');
  importing     = signal(false);

  // ── Export ────────────────────────────────────────────
  exportToExcel(): void {
    const rows = this.properties().map(p => ({
      'Title':        p.title,
      'Type':         p.type,
      'Category':     p.listing_type,
      'Status':       p.status,
      'Price (AED)':  p.price,
      'Area (sqft)':  p.area_sqft,
      'Bedrooms':     p.bedrooms,
      'Bathrooms':    p.bathrooms,
      'Location':     p.location,
      'Community':    p.community,
      'Address':      p.address,
      'Furnishing':   p.furnishing,
      'Description':  p.description,
      'Featured':     p.is_featured ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, `livwell-properties-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── Import ────────────────────────────────────────────
  async importFromExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.importing.set(true);
    this.importError.set('');
    this.importSuccess.set('');

    const file   = input.files[0];
    const buffer = await file.arrayBuffer();
    const wb     = XLSX.read(buffer, { type: 'array' });
    const ws     = wb.Sheets[wb.SheetNames[0]];
    const rows   = XLSX.utils.sheet_to_json(ws) as any[];

    if (!rows.length) {
      this.importError.set('No data found in the file.');
      this.importing.set(false);
      return;
    }

    const records = rows.map(r => ({
      title:        r['Title']       || '',
      type:         r['Type']        || 'Apartment',
      listing_type: r['Category']    || 'Sale',
      status:       r['Status']      || 'Draft',
      price:        Number(r['Price (AED)']) || 0,
      area_sqft:    Number(r['Area (sqft)']) || 0,
      bedrooms:     Number(r['Bedrooms'])    || 0,
      bathrooms:    Number(r['Bathrooms'])   || 1,
      location:     r['Location']    || '',
      community:    r['Community']   || '',
      address:      r['Address']     || '',
      furnishing:   r['Furnishing']  || 'Unfurnished',
      description:  r['Description'] || '',
      is_featured:  r['Featured'] === 'Yes',
      images:       [],
    })).filter(r => r.title.trim());

    const { error } = await this.sb.from('properties').insert(records);

    if (error) {
      this.importError.set('Import failed: ' + error.message);
    } else {
      this.importSuccess.set(`✓ ${records.length} properties imported successfully.`);
      await this.loadProperties();
    }

    this.importing.set(false);
    input.value = '';
  }

  readonly statusList:   PropStatus[]   = ['Draft', 'Pending Review', 'Published', 'Archived', 'Sold', 'Rented'];
  readonly typeList:     PropType[]     = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office'];
  readonly categoryList: PropCategory[] = ['Sale', 'Rent', 'Off-Plan'];
  readonly furnishingList = ['Furnished', 'Unfurnished', 'Partly Furnished'];
}
