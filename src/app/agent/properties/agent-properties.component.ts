import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

export type AgentPropStatus = 'Draft' | 'Pending Review' | 'Published' | 'Archived' | 'Sold' | 'Rented';

export interface AgentProperty {
  id:           number;
  title:        string;
  type:         string;
  listing_type: string;
  status:       AgentPropStatus;
  price:        number;
  area_sqft:    number;
  bedrooms:     number;
  bathrooms:    number;
  location:     string;
  community:    string;
  address:      string;
  description:  string;
  furnishing:   string;
  is_featured:  boolean;
  images:       string[];
  agent_name:   string;
  views:        number;
  created_at:   string;
}

const EMPTY_FORM = (): Partial<AgentProperty> => ({
  title: '', type: 'Apartment', listing_type: 'Sale', status: 'Draft',
  price: 0, area_sqft: 0, bedrooms: 1, bathrooms: 1,
  location: '', community: '', address: '', description: '',
  furnishing: 'Unfurnished', is_featured: false, images: [],
});

@Component({
  selector: 'app-agent-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-properties.component.html',
  styleUrl: './agent-properties.component.scss',
})
export class AgentPropertiesComponent implements OnInit {
  private auth  = inject(AuthService);
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  properties   = signal<AgentProperty[]>([]);
  search       = signal('');
  filterStatus = signal<AgentPropStatus | ''>('');
  filterCat    = signal<string>('');
  loading      = signal(true);
  saving       = signal(false);
  saveError    = signal('');

  showModal       = signal(false);
  isEdit          = signal(false);
  editId          = signal<number | null>(null);
  form            = signal<Partial<AgentProperty>>(EMPTY_FORM());
  formErrors      = signal<Record<string, string>>({});
  showDeleteModal = signal(false);
  deleteTarget    = signal<AgentProperty | null>(null);

  uploadingImages = signal(false);
  uploadedImages  = signal<string[]>([]);
  previewImages   = signal<string[]>([]);

  readonly typeList       = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Office'];
  readonly categoryList   = ['Sale', 'Rent', 'Off-Plan'];
  readonly statusList: AgentPropStatus[] = ['Draft', 'Pending Review', 'Published', 'Archived', 'Sold', 'Rented'];
  readonly furnishingList = ['Furnished', 'Unfurnished', 'Partly Furnished'];

  stats = computed(() => {
    const a = this.properties();
    return {
      total:     a.length,
      published: a.filter(p => p.status === 'Published').length,
      draft:     a.filter(p => p.status === 'Draft').length,
      views:     a.reduce((s, p) => s + p.views, 0),
    };
  });

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const st  = this.filterStatus();
    const cat = this.filterCat();
    return this.properties().filter(p => {
      const mq   = !q   || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
      const mst  = !st  || p.status === st;
      const mcat = !cat || p.listing_type === cat;
      return mq && mst && mcat;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const agentName = this.auth.currentUser()?.name;
    if (!agentName) { this.loading.set(false); return; }

    const { data, error } = await this.sb
      .from('properties')
      .select('*')
      .eq('agent_name', agentName)
      .order('created_at', { ascending: false });

    if (error) console.error('Agent properties fetch:', error);
    this.properties.set((data ?? []).map((p: any) => this.mapRow(p)));
    this.loading.set(false);
  }

  private mapRow(p: any): AgentProperty {
    return {
      id:           p.id,
      title:        p.title        || '',
      type:         p.type         || 'Apartment',
      listing_type: p.listing_type || 'Sale',
      status:       (p.status      || 'Draft') as AgentPropStatus,
      price:        p.price        || 0,
      area_sqft:    p.area_sqft    || 0,
      bedrooms:     p.bedrooms     || 0,
      bathrooms:    p.bathrooms    || 1,
      location:     p.location     || '',
      community:    p.community    || '',
      address:      p.address      || '',
      description:  p.description  || '',
      furnishing:   p.furnishing   || 'Unfurnished',
      is_featured:  p.is_featured  ?? false,
      images:       p.images       ?? [],
      agent_name:   p.agent_name   || '',
      views:        p.views        || 0,
      created_at:   p.created_at   || '',
    };
  }

  openAdd(): void {
    this.form.set(EMPTY_FORM());
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set([]);
    this.previewImages.set([]);
    this.isEdit.set(false);
    this.editId.set(null);
    this.showModal.set(true);
  }

  openEdit(p: AgentProperty): void {
    this.form.set({ ...p });
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set(p.images ?? []);
    this.previewImages.set(p.images ?? []);
    this.isEdit.set(true);
    this.editId.set(p.id);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.saveError.set('');
    this.previewImages.set([]);
    this.uploadedImages.set([]);
  }

  patchForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    this.formErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    this.runUpload(files);
  }

  private async runUpload(files: File[]): Promise<void> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    for (const file of files) {
      if (!allowed.includes(file.type)) { this.toast.error(`"${file.name}" is not a supported image type. Use JPG, PNG, WebP, or GIF.`); return; }
      if (file.size > maxSize)          { this.toast.error(`"${file.name}" exceeds the 5 MB size limit.`); return; }
    }

    this.uploadingImages.set(true);
    this.saveError.set('');
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
          this.toast.error(`Image ${i + 1} failed: ${error.message}`);
          URL.revokeObjectURL(blobs[i]);
          this.previewImages.update(p => p.filter(u => u !== blobs[i]));
          break;
        }
        if (data) {
          const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
          this.previewImages.update(p => p.map(u => u === blobs[i] ? pub.publicUrl : u));
          URL.revokeObjectURL(blobs[i]);
          publicUrls.push(pub.publicUrl);
        }
      }
    } catch (e: any) {
      this.toast.error('Upload error: ' + (e?.message ?? 'Unknown error'));
    } finally {
      this.uploadedImages.update(p => [...p, ...publicUrls]);
      this.uploadingImages.set(false);
    }
  }

  removeImage(index: number): void {
    this.previewImages.update(imgs => imgs.filter((_, i) => i !== index));
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  async save(): Promise<void> {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.title?.trim())    e['title']    = 'Required.';
    if (!f.location?.trim()) e['location'] = 'Required.';
    if (!f.price || f.price <= 0) e['price'] = 'Price must be greater than 0.';
    if (!f.area_sqft || f.area_sqft <= 0) e['area_sqft'] = 'Area must be greater than 0.';
    if (f.bedrooms  !== undefined && (f.bedrooms  < 0 || f.bedrooms  > 50)) e['bedrooms']  = 'Must be between 0 and 50.';
    if (f.bathrooms !== undefined && (f.bathrooms < 0 || f.bathrooms > 50)) e['bathrooms'] = 'Must be between 0 and 50.';
    this.formErrors.set(e);
    if (Object.keys(e).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const agentName = this.auth.currentUser()?.name ?? '';

    const payload: any = {
      title:        f.title!.trim(),
      type:         f.type         || 'Apartment',
      listing_type: f.listing_type || 'Sale',
      status:       f.status       || 'Draft',
      price:        Number(f.price)     || 0,
      area_sqft:    Number(f.area_sqft) || 0,
      bedrooms:     Number(f.bedrooms)  || 0,
      bathrooms:    Number(f.bathrooms) || 1,
      location:     f.location!.trim(),
      community:    f.community?.trim() || '',
      address:      f.address?.trim()   || '',
      description:  f.description?.trim() || '',
      furnishing:   f.furnishing    || 'Unfurnished',
      agent_name:   agentName,
      is_featured:  f.is_featured   ?? false,
      images:       this.uploadedImages().length > 0 ? this.uploadedImages() : (f.images ?? []),
    };

    try {
      if (this.isEdit() && this.editId() !== null) {
        const { error } = await this.sb.from('properties').update(payload).eq('id', this.editId()!);
        if (error) { this.toast.error('Failed to save: ' + error.message); this.saving.set(false); return; }
        this.properties.update(list => list.map(p => p.id === this.editId() ? { ...p, ...this.mapRow({ ...payload, id: p.id, views: p.views, created_at: p.created_at }) } : p));
      } else {
        const { data, error } = await this.sb.from('properties').insert({ ...payload, views: 0, created_by: agentName }).select().single();
        if (error) { this.toast.error('Failed to add: ' + error.message); this.saving.set(false); return; }
        if (data) this.properties.update(list => [this.mapRow(data), ...list]);
      }
      this.saving.set(false);
      this.showModal.set(false);
      this.toast.success(this.editId() !== null ? 'Property updated.' : 'Property added.');
    } catch (ex: any) {
      this.toast.error('Unexpected error: ' + (ex?.message || 'Please try again.'));
      this.saving.set(false);
    }
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

  formatPrice(n: number): string {
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }
}
