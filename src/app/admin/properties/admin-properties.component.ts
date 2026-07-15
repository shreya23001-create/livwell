import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import { AdminDataService } from '../../shared/services/admin-data.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';
import { MsSelectComponent, MsOption } from '../../shared/components/ms-select/ms-select.component';
import { AMENITY_ICONS } from '../../shared/constants/amenity-icons';
import * as XLSX from 'xlsx';

export interface PropertyFaq { question: string; answer: string; }

export type PropStatus   = 'Draft' | 'Pending Review' | 'Published' | 'Archived' | 'Sold' | 'Rented';
export type PropType     = 'Apartment' | 'Villa' | 'Townhouse' | 'Penthouse' | 'Studio' | 'Office' | 'Shop' | 'Warehouse' | 'Plot';
export type PropCategory = 'Sale' | 'Rent' | 'Off-Plan';

export interface Property {
  id:              number;
  title:           string;
  type:            PropType;
  listing_type:    PropCategory;
  status:          PropStatus;
  price:           number;
  area_sqft:       number;
  bedrooms:        number;
  bathrooms:       number;
  location:        string;
  community:       string;
  project_name:    string;
  agent_name:      string;
  agent_avatar:    string;
  created_by:      string;
  created_at:      string;
  views:           number;
  is_featured:     boolean;
  is_luxury:       boolean;
  description:     string;
  address:         string;
  furnishing:      string;
  images:          string[];
  amenities:       string[];
  video_url:       string;
  faqs:            PropertyFaq[];
}

const EMPTY_FORM = (): Partial<Property> => ({
  title: '', type: 'Apartment', listing_type: 'Sale', status: 'Draft',
  price: 0, area_sqft: 0, bedrooms: 1, bathrooms: 1,
  location: '', community: '', project_name: '', address: '', description: '',
  furnishing: 'Unfurnished', agent_name: '', agent_avatar: '', is_featured: false, is_luxury: false, images: [],
  amenities: [], video_url: '', faqs: [],
});

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SafeUrlPipe, RichEditorComponent, MsSelectComponent],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.scss',
})
export class AdminPropertiesComponent implements OnInit {
  private sb        = inject(SupabaseService).client;
  private auth      = inject(AuthService);
  private dataSvc   = inject(AdminDataService);
  private toast     = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

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
  // Mutable draft — ngModel binds here; signal only written on open/save
  draft: Partial<Property> = EMPTY_FORM();
  formErrors     = signal<Record<string, string>>({});
  saveError      = signal('');
  uploadingImages  = signal(false);
  uploadedImages   = signal<string[]>([]);   // final public URLs (saved to DB)
  previewImages    = signal<string[]>([]);   // local blob URLs for instant preview
  amenityDropdownOpen = signal(false);
  faqs             = signal<PropertyFaq[]>([]);
  masterAmenities  = this.dataSvc.amenities;
  uploadingVideo   = signal(false);
  videoDragOver    = signal(false);
  videoTab         = signal<'url' | 'upload'>('url');

  // ── Location dropdown ─────────────────────────────────
  locSearch        = signal('');
  locDropdownOpen  = signal(false);
  filteredLocs     = computed(() => {
    const q = this.locSearch().toLowerCase();
    return q ? this.dataSvc.locations().filter(l => l.toLowerCase().includes(q)) : this.dataSvc.locations();
  });

  commSearch       = signal('');
  commDropdownOpen = signal(false);
  filteredComms    = computed(() => {
    const q = this.commSearch().toLowerCase();
    return q ? this.dataSvc.communities().filter(c => c.toLowerCase().includes(q)) : this.dataSvc.communities();
  });

  // ── Project name dropdown ─────────────────────────────
  projectNames       = signal<string[]>([]);
  projSearch         = signal('');
  projDropdownOpen   = signal(false);
  filteredProjects   = computed(() => {
    const q = this.projSearch().toLowerCase();
    return q ? this.projectNames().filter(n => n.toLowerCase().includes(q)) : this.projectNames();
  });

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
      const av = a[sf] ?? '';
      const bv = b[sf] ?? '';
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
    await this.auth.waitForSession();
    await Promise.all([this.loadProperties(), this.loadAgents(), this.loadProjectNames()]);
  }

  async loadProperties(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const uniqueNames = [...new Set(data.map((p: any) => p.agent_name).filter(Boolean))] as string[];
      const avatarMap: Record<string, string> = {};
      if (uniqueNames.length) {
        const { data: profiles } = await this.sb
          .from('profiles')
          .select('name, avatar_url')
          .in('name', uniqueNames)
          .eq('role', 'agent');
        if (profiles) {
          for (const pr of profiles) {
            const av = (pr.avatar_url ?? '').split('?')[0];
            avatarMap[pr.name] = /\/avatars\/[^/]+$/.test(av) ? (pr.avatar_url ?? '') : '';
          }
        }
      }
      this.properties.set(data.map((p: any) => ({
        ...p,
        agent_name:   p.agent_name || '—',
        agent_avatar: avatarMap[p.agent_name] ?? '',
        created_by:   p.created_by || p.agent_name || 'Admin',
        faqs:         Array.isArray(p.faqs) ? p.faqs : [],
      })));
    }
    this.loading.set(false);
  }

  async loadProjectNames(): Promise<void> {
    const { data } = await this.sb.from('projects').select('title').order('title');
    if (data) this.projectNames.set(data.map((p: any) => p.title).filter(Boolean));
  }

  async loadAgents(): Promise<void> {
    const { data } = await this.sb
      .from('profiles')
      .select('name')
      .eq('role', 'agent')
      .order('name');
    if (data) this.agents.set(data.map((a: any) => ({ name: a.name })));
  }

  // ── Sorting / Filtering ───────────────────────────────
  sort(field: keyof Property): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set(field === 'created_at' ? 'desc' : 'asc');
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

  // ── Modal ─────────────────────────────────────────────
  openAdd(): void {
    this.draft = EMPTY_FORM();
    this.form.set(this.draft);
    this.faqs.set([]);
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set([]);
    this.previewImages.set([]);
    this.amenityDropdownOpen.set(false);
    this.locSearch.set('');
    this.commSearch.set('');
    this.projSearch.set('');
    this.videoTab.set('url');
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: Property): void {
    this.draft = { ...p };
    this.form.set(this.draft);
    this.faqs.set((p as any).faqs?.length ? (p as any).faqs.map((f: PropertyFaq) => ({ ...f })) : []);
    this.formErrors.set({});
    this.saveError.set('');
    this.uploadedImages.set(p.images ?? []);
    this.previewImages.set(p.images ?? []);
    this.locSearch.set(p.location ?? '');
    this.commSearch.set(p.community ?? '');
    this.projSearch.set(p.project_name ?? '');
    this.amenityDropdownOpen.set(false);
    this.videoTab.set(p.video_url ? 'url' : 'url');
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
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    for (const file of files) {
      if (!allowed.includes(file.type)) { this.toast.error(`"${file.name}" is not a supported image type. Use JPG, PNG, WebP, or GIF.`); return; }
      if (file.size > maxSize)          { this.toast.error(`"${file.name}" exceeds the 5 MB size limit.`); return; }
    }

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
          this.toast.error(`Image ${i + 1} failed: ${error.message}`);
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


  onVideoFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadVideoFile(file);
  }

  onVideoDrop(event: DragEvent): void {
    event.preventDefault();
    this.videoDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadVideoFile(file);
  }

  private async uploadVideoFile(file: File): Promise<void> {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 200 * 1024 * 1024; // 200 MB
    if (!allowed.includes(file.type)) { this.toast.error('Unsupported video format. Use MP4, WebM, MOV, or AVI.'); return; }
    if (file.size > maxSize) { this.toast.error('Video exceeds the 200 MB size limit.'); return; }

    this.uploadingVideo.set(true);
    this.saveError.set('');
    try {
      const ext  = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await this.sb.storage
        .from('imagesFolder')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: true });
      if (error) { this.toast.error('Video upload failed: ' + error.message); return; }
      if (data) {
        const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
        this.patchForm('video_url', pub.publicUrl);
        this.toast.success('Video uploaded successfully.');
      }
    } catch (e: any) {
      this.toast.error('Upload error: ' + (e?.message ?? 'Unknown error'));
    } finally {
      this.uploadingVideo.set(false);
    }
  }

  isAmenitySelected(name: string): boolean {
    return (this.draft.amenities ?? []).includes(name);
  }

  toggleAmenity(name: string): void {
    const current = this.draft.amenities ?? [];
    this.draft.amenities = current.includes(name) ? current.filter(x => x !== name) : [...current, name];
  }

  getAmenityIconSvg(iconKey: string): SafeHtml {
    const iconDef = AMENITY_ICONS.find(i => i.key === iconKey);
    const svg = iconDef?.svg ?? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  trackByIndex(i: number): number { return i; }

  addFaq(): void { this.faqs.update(list => [...list, { question: '', answer: '' }]); }

  removeFaq(i: number): void { this.faqs.update(list => list.filter((_, idx) => idx !== i)); }

  patchFaqQuestion(i: number, value: string): void {
    this.faqs.update(list => { const next = [...list]; next[i] = { ...next[i], question: value }; return next; });
  }

  patchFaqAnswer(i: number, value: string): void {
    this.faqs.update(list => { const next = [...list]; next[i] = { ...next[i], answer: value }; return next; });
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.previewImages.set([]);
    this.uploadedImages.set([]);
    this.amenityDropdownOpen.set(false);
  }

  async saveProperty(): Promise<void> {
    const errs = this.validateForm();
    this.formErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.saveError.set('');
    const f = this.draft;

    const payload: any = {
      title:           f.title?.trim(),
      type:            f.type            || 'Apartment',
      listing_type:    f.listing_type    || 'Sale',
      status:          f.status          || 'Draft',
      price:           Number(f.price)    || 0,
      area_sqft:       Number(f.area_sqft) || 0,
      bedrooms:        Number(f.bedrooms)  || 0,
      bathrooms:       Number(f.bathrooms) || 1,
      location:        f.location?.trim()  || '',
      community:       f.community?.trim() || '',
      project_name:    f.project_name?.trim() || '',
      address:         f.address?.trim()   || '',
      description:     f.description?.trim() || '',
      furnishing:      f.furnishing    || 'Unfurnished',
      agent_name:      f.agent_name    || null,
      agent_id:        null,
      is_featured:     f.is_featured   ?? false,
      is_luxury:       f.is_luxury     ?? false,
      images:          this.uploadedImages().length > 0 ? this.uploadedImages() : (f.images ?? []),
      amenities:       f.amenities ?? [],
      video_url:       f.video_url?.trim() || null,
      faqs:            this.faqs().filter(q => q.question.trim()),
    };

    try {
      let error: any;

      if (this.editingId() !== null) {
        ({ error } = await this.sb.from('properties').update(payload).eq('id', this.editingId()));
      } else {
        const adminName = this.auth.currentUser()?.name || 'Admin';
        ({ error } = await this.sb.from('properties').insert({ ...payload, created_by: adminName }));
      }

      if (error) {
        console.error('Supabase save error:', error);
        this.toast.error(`Error: ${error.message || error.code || 'Unknown error'}`);
        this.saving.set(false);
        return;
      }

      this.saving.set(false);
      const editingId = this.editingId();
      this.closeModal();
      this.toast.success(editingId !== null ? 'Property updated successfully.' : 'Property added successfully.');
      if (editingId !== null) {
        this.properties.update(list => list.map(p =>
          p.id === editingId ? { ...p, ...payload } : p
        ));
      }
      await this.loadProperties();

    } catch (e: any) {
      console.error('Save exception:', e);
      this.toast.error('Unexpected error: ' + (e?.message || 'Please try again.'));
      this.saving.set(false);
    }
  }

  private validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    const f = this.draft;
    if (!f.title?.trim())    errs['title']    = 'Title is required.';
    if (!f.location?.trim()) errs['location'] = 'Location is required.';
    if (!f.price || f.price <= 0) errs['price'] = 'Price must be greater than 0.';
    if (!f.area_sqft || f.area_sqft <= 0) errs['area_sqft'] = 'Area must be greater than 0.';
    if (f.bedrooms  !== undefined && (f.bedrooms  < 0 || f.bedrooms  > 50)) errs['bedrooms']  = 'Bedrooms must be between 0 and 50.';
    if (f.bathrooms !== undefined && (f.bathrooms < 0 || f.bathrooms > 50)) errs['bathrooms'] = 'Bathrooms must be between 0 and 50.';
    return errs;
  }

  patchForm(field: string, value: any): void {
    (this.draft as any)[field] = value;
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
    const previous = p.status;
    // ngModel already updated p.status on the object — also update the signal array
    this.properties.update(list => list.map(x => x.id === p.id ? { ...x, status } : x));
    const { error } = await this.sb.from('properties').update({ status }).eq('id', p.id);
    if (error) {
      // Revert on failure
      this.properties.update(list => list.map(x => x.id === p.id ? { ...x, status: previous } : x));
      this.toast.error('Status update failed: ' + error.message);
    }
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
      'Luxury':       (p as any).is_luxury ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, `livwell-properties-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  downloadSampleExcel(): void {
    const sample = [
      { 'Title': 'Marina Heights Apartment', 'Type': 'Apartment', 'Category': 'Sale', 'Status': 'Published', 'Price (AED)': 1500000, 'Area (sqft)': 1200, 'Bedrooms': 2, 'Bathrooms': 2, 'Location': 'Dubai Marina, Dubai', 'Community': 'Dubai Marina', 'Address': 'Marina Walk, Tower A', 'Furnishing': 'Furnished', 'Description': 'Stunning marina-view apartment', 'Featured': 'No' },
      { 'Title': 'Business Bay Office Space', 'Type': 'Office', 'Category': 'Rent', 'Status': 'Published', 'Price (AED)': 350000, 'Area (sqft)': 2500, 'Bedrooms': 0, 'Bathrooms': 2, 'Location': 'Business Bay, Dubai', 'Community': 'Business Bay', 'Address': 'Opus Tower, Floor 12', 'Furnishing': 'Unfurnished', 'Description': 'Premium office with city views', 'Featured': 'Yes' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, 'livwell-properties-sample.xlsx');
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
      this.toast.error('No data found in the file.');
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
      is_luxury:    r['Luxury'] === 'Yes',
      images:       [],
    })).filter(r => r.title.trim());

    const { error } = await this.sb.from('properties').insert(records);

    if (error) {
      this.toast.error('Import failed: ' + error.message);
    } else {
      this.toast.success(`${records.length} properties imported successfully.`);
      await this.loadProperties();
    }

    this.importing.set(false);
    input.value = '';
  }

  // Read from master data service — updates when admin adds new items in Master
  get statusList()   { return this.dataSvc.propStatuses().map(s => s.name) as PropStatus[]; }
  get typeList()     { return this.dataSvc.propTypes() as PropType[]; }
  get categoryList() { return this.dataSvc.categories() as PropCategory[]; }
  readonly furnishingList = ['Furnished', 'Unfurnished', 'Partly Furnished'];

  // MsSelect option arrays
  categoryOpts   = computed<MsOption[]>(() => this.dataSvc.categories().map(c => ({ value: c, label: c })));
  typeOpts       = computed<MsOption[]>(() => this.dataSvc.propTypes().map(t => ({ value: t, label: t })));
  statusOpts     = computed<MsOption[]>(() => this.dataSvc.propStatuses().map(s => ({ value: s.name, label: s.name })));
  furnishingOpts = computed<MsOption[]>(() => this.furnishingList.map(f => ({ value: f, label: f })));
  locationOpts   = computed<MsOption[]>(() => this.dataSvc.locations().map(l => ({ value: l, label: l })));
  agentOpts      = computed<MsOption[]>(() => [{ value: '', label: '— Unassigned —' }, ...this.agents().map(a => ({ value: a.name, label: a.name }))]);
  amenityOpts    = computed<MsOption[]>(() => this.masterAmenities().map(a => ({
    value: a.name, label: a.name,
    iconHtml: this.getAmenityIconSvg(a.icon),
  })));

  onCategoryChange(vals: string[])  { this.draft.listing_type = (vals[0] ?? 'Sale') as any; }
  onTypeChange(vals: string[])      { this.draft.type = (vals[0] ?? '') as any; }
  onStatusChange(vals: string[])    { this.draft.status = (vals[0] ?? 'Draft') as any; }
  onFurnishingChange(vals: string[]){ this.draft.furnishing = vals[0] ?? ''; }
  onLocationChange(vals: string[])  { this.draft.location = vals[0] ?? ''; this.locSearch.set(vals[0] ?? ''); }
  onAgentChange(vals: string[])     { this.draft.agent_name = vals[0] ?? ''; }
  onAmenitiesChange(vals: string[]) { this.draft.amenities = vals; }
}
