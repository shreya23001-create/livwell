import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import * as XLSX from 'xlsx';

export interface Project {
  id?: number;
  title: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: 'Draft' | 'Published' | 'Archived';
  price_from: number;
  price_label: string;
  price_per_sqft: string;
  beds: string;
  bathrooms: number;
  area_sqft: number;
  completion_date: string;
  payment_plan: string;
  description: string;
  amenities: string[];
  images: string[];
  floor_plan_url: string;
  badge: string;
  is_featured: boolean;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
  is_branded: boolean;
  brand: string;
  brand_logo_url: string;
  agent_name: string;
  video_url: string | null;
  created_at?: string;
}

const BLANK: Project = {
  title: '', developer: '', location: '', community: '', type: 'Apartment',
  status: 'Draft', price_from: 0, price_label: '', price_per_sqft: '',
  beds: '', bathrooms: 0, area_sqft: 0, completion_date: '', payment_plan: '',
  description: '', amenities: [], images: [], floor_plan_url: '',
  badge: '', is_featured: false, is_luxury: false, is_ultra_luxury: false,
  is_branded: false, brand: '', brand_logo_url: '', agent_name: '', video_url: null,
};

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-projects.component.html',
  styleUrl: './admin-projects.component.scss',
})
export class AdminProjectsComponent implements OnInit {
  private sb   = inject(SupabaseService).client;
  public  auth = inject(AuthService);

  projects     = signal<Project[]>([]);
  agents       = signal<{ name: string }[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  importing    = signal(false);
  search       = signal('');
  filterStatus = signal('');
  filterType   = signal('');
  filterLuxe   = signal('');

  showModal       = signal(false);
  editMode        = signal(false);
  form            = signal<Project>({ ...BLANK });
  amenityInput    = signal('');
  uploadingImages    = signal(false);
  uploadedImages     = signal<string[]>([]);
  previewImages      = signal<string[]>([]);
  uploadingBrandLogo = signal(false);

  readonly types    = ['Apartment','Villa','Townhouse','Penthouse','Home','Mixed','Duplex'];
  readonly statuses = ['Draft','Published','Archived'];
  readonly badges   = ['','New Launch','Featured','Hot','Exclusive','Trending','Luxury','Ultra Luxury','Limited Units'];

  page     = signal(1);
  pageSize = signal(10);

  filtered = computed(() => {
    let list = this.projects();
    const q  = this.search().toLowerCase().trim();
    if (q)  list = list.filter(p => p.title.toLowerCase().includes(q) || (p.developer ?? '').toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q));
    if (this.filterStatus()) list = list.filter(p => p.status === this.filterStatus());
    if (this.filterType())   list = list.filter(p => p.type   === this.filterType());
    if (this.filterLuxe() === 'luxury')       list = list.filter(p => p.is_luxury);
    if (this.filterLuxe() === 'ultra_luxury') list = list.filter(p => p.is_ultra_luxury);
    return list;
  });

  paginated  = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()));

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total-4, total-3, total-2, total-1, total];
    return [1, -1, cur-1, cur, cur+1, -1, total];
  }

  stats = computed(() => ({
    total:     this.projects().length,
    published: this.projects().filter(p => p.status === 'Published').length,
    luxury:    this.projects().filter(p => p.is_luxury).length,
    ultra:     this.projects().filter(p => p.is_ultra_luxury).length,
  }));

  setFilter(key: 'search' | 'filterStatus' | 'filterType' | 'filterLuxe', val: string) {
    this[key].set(val);
    this.page.set(1);
  }

  async ngOnInit() {
    await this.auth.waitForSession();
    await Promise.all([this.loadProjects(), this.loadAgents()]);
  }

  async loadAgents(): Promise<void> {
    const { data } = await this.sb
      .from('profiles')
      .select('name')
      .eq('role', 'agent')
      .order('name');
    if (data) this.agents.set(data.map((a: any) => ({ name: a.name })));
  }

  async loadProjects() {
    this.loading.set(true);
    const { data } = await this.sb.from('projects').select('*').order('created_at', { ascending: false });
    const projects = (data as Project[]) ?? [];
    projects.forEach(p => { p.images = (p.images ?? []).filter(u => u && !u.includes('unsplash.com')); });
    this.projects.set(projects);
    this.loading.set(false);
  }

  openAdd() {
    this.form.set({ ...BLANK });
    this.amenityInput.set('');
    this.uploadedImages.set([]);
    this.previewImages.set([]);
    this.editMode.set(false);
    this.showModal.set(true);
  }

  openEdit(p: Project) {
    this.form.set({ ...p });
    this.amenityInput.set('');
    this.uploadedImages.set(p.images ?? []);
    this.previewImages.set(p.images ?? []);
    this.editMode.set(true);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.previewImages.set([]);
    this.uploadedImages.set([]);
  }

  addAmenity() {
    const v = this.amenityInput().trim();
    if (!v) return;
    this.form.update(f => ({ ...f, amenities: [...(f.amenities ?? []), v] }));
    this.amenityInput.set('');
  }

  removeAmenity(i: number) {
    this.form.update(f => ({ ...f, amenities: f.amenities.filter((_, idx) => idx !== i) }));
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
    const maxSize = 5 * 1024 * 1024;
    for (const file of files) {
      if (!allowed.includes(file.type)) { alert(`"${file.name}" is not a supported image type.`); return; }
      if (file.size > maxSize)          { alert(`"${file.name}" exceeds the 5 MB size limit.`); return; }
    }
    this.uploadingImages.set(true);
    const blobs = files.map(f => URL.createObjectURL(f));
    this.previewImages.update(p => [...p, ...blobs]);
    const publicUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext  = file.name.split('.').pop() ?? 'jpg';
        const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await this.sb.storage
          .from('imagesFolder')
          .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });
        if (error) {
          alert(`Image ${i + 1} failed: ${error.message}`);
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
      alert('Upload error: ' + (e?.message ?? 'Unknown error'));
    } finally {
      this.uploadedImages.update(p => [...p, ...publicUrls]);
      this.uploadingImages.set(false);
    }
  }

  removeImage(i: number): void {
    this.previewImages.update(imgs => imgs.filter((_, idx) => idx !== i));
    this.uploadedImages.update(imgs => imgs.filter((_, idx) => idx !== i));
  }

  async uploadBrandLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) { alert('Please upload a JPG, PNG, WebP or SVG image.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2 MB.'); return; }
    this.uploadingBrandLogo.set(true);
    const ext  = file.name.split('.').pop() ?? 'png';
    const path = `brand-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await this.sb.storage.from('imagesFolder').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });
    if (error) { alert('Logo upload failed: ' + error.message); this.uploadingBrandLogo.set(false); return; }
    const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
    this.form.update(f => ({ ...f, brand_logo_url: pub.publicUrl }));
    this.uploadingBrandLogo.set(false);
  }

  async save() {
    const f = this.form();
    if (!f.title.trim()) return;
    this.saving.set(true);

    const payload: any = {
      title: f.title, developer: f.developer, location: f.location, community: f.community,
      type: f.type, status: f.status, price_from: f.price_from || 0,
      price_label: f.price_label, price_per_sqft: f.price_per_sqft,
      beds: f.beds, bathrooms: f.bathrooms || 0, area_sqft: f.area_sqft || 0,
      completion_date: f.completion_date, payment_plan: f.payment_plan,
      description: f.description, amenities: f.amenities,
      images: this.uploadedImages().length > 0 ? this.uploadedImages() : (f.images ?? []),
      floor_plan_url: f.floor_plan_url, badge: f.badge,
      is_featured: f.is_featured, is_luxury: f.is_luxury, is_ultra_luxury: f.is_ultra_luxury,
      is_branded: f.is_branded, brand: f.brand, brand_logo_url: f.brand_logo_url,
      agent_name: f.agent_name,
      video_url: (f as any).video_url ?? null,
    };

    if (this.editMode() && f.id) {
      await this.sb.from('projects').update(payload).eq('id', f.id);
    } else {
      await this.sb.from('projects').insert(payload);
    }

    this.saving.set(false);
    this.showModal.set(false);
    await this.loadProjects();
  }

  async deleteProject(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await this.sb.from('projects').delete().eq('id', p.id!);
    await this.loadProjects();
  }

  async toggleStatus(p: Project) {
    const next = p.status === 'Published' ? 'Draft' : 'Published';
    await this.sb.from('projects').update({ status: next }).eq('id', p.id!);
    await this.loadProjects();
  }

  statusClass(s: string) {
    return { 'Published': 'badge--green', 'Draft': 'badge--grey', 'Archived': 'badge--red' }[s] ?? '';
  }

  formatPrice(n: number) {
    if (!n) return '—';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  // ── Export ────────────────────────────────────────────
  exportToExcel(): void {
    const rows = this.projects().map(p => ({
      'Title':          p.title,
      'Developer':      p.developer,
      'Location':       p.location,
      'Community':      p.community,
      'Type':           p.type,
      'Status':         p.status,
      'Price From (AED)': p.price_from,
      'Price Label':    p.price_label,
      'Price/sqft':     p.price_per_sqft,
      'Beds':           p.beds,
      'Bathrooms':      p.bathrooms,
      'Area (sqft)':    p.area_sqft,
      'Completion':     p.completion_date,
      'Payment Plan':   p.payment_plan,
      'Description':    p.description,
      'Amenities':      (p.amenities ?? []).join(', '),
      'Badge':          p.badge,
      'Featured':       p.is_featured ? 'Yes' : 'No',
      'Luxury':         p.is_luxury ? 'Yes' : 'No',
      'Ultra Luxury':   p.is_ultra_luxury ? 'Yes' : 'No',
      'Agent':          p.agent_name,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, `livwell-projects-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── Import ────────────────────────────────────────────
  async importFromExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.importing.set(true);

    const file   = input.files[0];
    const buffer = await file.arrayBuffer();
    const wb     = XLSX.read(buffer, { type: 'array' });
    const ws     = wb.Sheets[wb.SheetNames[0]];
    const rows   = XLSX.utils.sheet_to_json(ws) as any[];

    if (!rows.length) {
      alert('No data found in the file.');
      this.importing.set(false);
      input.value = '';
      return;
    }

    const records = rows.map(r => ({
      title:          r['Title']            || '',
      developer:      r['Developer']        || '',
      location:       r['Location']         || '',
      community:      r['Community']        || '',
      type:           r['Type']             || 'Apartment',
      status:         r['Status']           || 'Draft',
      price_from:     Number(r['Price From (AED)']) || 0,
      price_label:    r['Price Label']      || '',
      price_per_sqft: r['Price/sqft']       || '',
      beds:           r['Beds']             || '',
      bathrooms:      Number(r['Bathrooms'])|| 0,
      area_sqft:      Number(r['Area (sqft)']) || 0,
      completion_date: r['Completion']      || '',
      payment_plan:   r['Payment Plan']     || '',
      description:    r['Description']      || '',
      amenities:      r['Amenities'] ? String(r['Amenities']).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      badge:          r['Badge']            || '',
      is_featured:    r['Featured']  === 'Yes',
      is_luxury:      r['Luxury']    === 'Yes',
      is_ultra_luxury: r['Ultra Luxury'] === 'Yes',
      agent_name:     r['Agent']            || '',
      images:         [],
    })).filter(r => r.title.trim());

    const { error } = await this.sb.from('projects').insert(records);

    if (error) {
      alert('Import failed: ' + error.message);
    } else {
      alert(`${records.length} project(s) imported successfully.`);
      await this.loadProjects();
    }

    this.importing.set(false);
    input.value = '';
  }
}
