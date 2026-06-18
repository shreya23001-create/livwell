import { Component, OnInit, signal, computed, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { AuthService } from '../../shared/services/auth.service';
import * as XLSX from 'xlsx';

interface Project {
  id: number;
  title: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: string;
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
  agent_name: string;
  video_url: string | null;
  created_at: string;
}

interface ProjectForm {
  title: string;
  developer: string;
  location: string;
  community: string;
  type: string;
  status: 'Draft' | 'Pending Review' | 'Published' | 'Archived' | 'Sold' | 'Rented';
  price_from: number;
  price_label: string;
  beds: string;
  bathrooms: number;
  area_sqft: number;
  completion_date: string;
  payment_plan: string;
  description: string;
  amenities: string[];
  images: string[];
  badge: string;
  is_featured: boolean;
  is_luxury: boolean;
  is_ultra_luxury: boolean;
  video_url: string;
  video_type: 'url' | 'file';
}

const BLANK: ProjectForm = {
  title: '', developer: '', location: '', community: '', type: 'Apartment',
  status: 'Draft', price_from: 0, price_label: '', beds: '', bathrooms: 0,
  area_sqft: 0, completion_date: '', payment_plan: '', description: '',
  amenities: [], images: [], badge: '',
  is_featured: false, is_luxury: false, is_ultra_luxury: false,
  video_url: '', video_type: 'url',
};

@Component({
  selector: 'app-agent-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agent-projects.component.html',
  styleUrl: './agent-projects.component.scss',
})
export class AgentProjectsComponent implements OnInit {
  private sb         = inject(SupabaseService).client;
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  projects     = signal<Project[]>([]);
  loading      = signal(true);
  search       = signal('');
  filterStatus = signal('');

  showForm      = signal(false);
  editMode      = signal(false);
  editingId     = signal<number | null>(null);
  saving        = signal(false);
  deleting      = signal<number | null>(null);
  importing     = signal(false);
  saveError     = signal('');
  saveSuccess   = signal(false);
  form          = signal<ProjectForm>({ ...BLANK });
  amenityInput  = signal('');

  // Images — drag-and-drop
  uploadingImg  = signal(false);
  imgDragOver   = signal(false);

  // Video
  uploadingVideo = signal(false);
  videoFileName  = signal('');

  readonly types  = ['Apartment','Villa','Townhouse','Penthouse','Home','Mixed','Duplex'];
  readonly badges = ['','New Launch','Featured','Hot','Exclusive','Trending','Luxury','Ultra Luxury','Limited Units'];
  readonly plans  = ['40/60','50/50','60/40','30/70','20/80','1% Monthly','Post Handover'];

  filtered = computed(() => {
    let list = this.projects();
    const q  = this.search().toLowerCase().trim();
    if (q)  list = list.filter(p => p.title.toLowerCase().includes(q) || (p.developer ?? '').toLowerCase().includes(q));
    if (this.filterStatus()) list = list.filter(p => p.status === this.filterStatus());
    return list;
  });

  stats = computed(() => ({
    total:     this.projects().length,
    published: this.projects().filter(p => p.status === 'Published').length,
    luxury:    this.projects().filter(p => p.is_luxury || p.is_ultra_luxury).length,
  }));

  async ngOnInit() {
    const agentName = this.auth.currentUser()?.name;
    if (!agentName) { this.loading.set(false); return; }
    const { data } = await this.sb
      .from('projects').select('*').eq('agent_name', agentName)
      .order('created_at', { ascending: false });
    const projects = (data as Project[]) ?? [];
    projects.forEach(p => { p.images = (p.images ?? []).filter(u => u && !u.includes('unsplash.com')); });
    this.projects.set(projects);
    this.loading.set(false);
  }

  openForm() {
    this.form.set({ ...BLANK });
    this.amenityInput.set('');
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.videoFileName.set('');
    this.editMode.set(false);
    this.editingId.set(null);
    this.showForm.set(true);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = 'hidden';
  }

  openEdit(p: Project) {
    this.form.set({
      title:           p.title,
      developer:       p.developer,
      location:        p.location,
      community:       p.community,
      type:            p.type,
      status:          p.status as 'Draft' | 'Pending Review' | 'Published' | 'Archived' | 'Sold' | 'Rented',
      price_from:      p.price_from,
      price_label:     p.price_label,
      beds:            p.beds,
      bathrooms:       p.bathrooms,
      area_sqft:       p.area_sqft,
      completion_date: p.completion_date,
      payment_plan:    p.payment_plan,
      description:     p.description,
      amenities:       [...(p.amenities ?? [])],
      images:          [...(p.images ?? [])],
      badge:           p.badge,
      is_featured:     p.is_featured,
      is_luxury:       p.is_luxury,
      is_ultra_luxury: p.is_ultra_luxury,
      video_url:       p.video_url ?? '',
      video_type:      'url',
    });
    this.amenityInput.set('');
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.videoFileName.set('');
    this.editMode.set(true);
    this.editingId.set(p.id);
    this.showForm.set(true);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = 'hidden';
  }

  closeForm() {
    this.showForm.set(false);
    this.editMode.set(false);
    this.editingId.set(null);
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  async deleteProject(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    this.deleting.set(p.id);
    await this.sb.from('projects').delete().eq('id', p.id);
    this.projects.update(list => list.filter(x => x.id !== p.id));
    this.deleting.set(null);
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.showForm()) this.closeForm(); }

  // ── Amenities ─────────────────────────────────────────
  addAmenity() {
    const v = this.amenityInput().trim();
    if (!v) return;
    this.form.update(f => ({ ...f, amenities: [...f.amenities, v] }));
    this.amenityInput.set('');
  }

  removeAmenity(i: number) {
    this.form.update(f => ({ ...f, amenities: f.amenities.filter((_, idx) => idx !== i) }));
  }

  // ── Images — drag and drop ────────────────────────────
  onImgDragOver(e: DragEvent) { e.preventDefault(); this.imgDragOver.set(true); }
  onImgDragLeave()             { this.imgDragOver.set(false); }

  onImgDrop(e: DragEvent) {
    e.preventDefault();
    this.imgDragOver.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) this.uploadImageFiles(files);
  }

  onImgFileChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    (e.target as HTMLInputElement).value = '';
    if (files.length) this.uploadImageFiles(files);
  }

  private async uploadImageFiles(files: File[]) {
    this.uploadingImg.set(true);
    const urls: string[] = [];
    for (const file of files) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `projects/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
        if (pub?.publicUrl) urls.push(pub.publicUrl);
      }
    }
    this.form.update(f => ({ ...f, images: [...f.images, ...urls] }));
    this.uploadingImg.set(false);
  }

  removeImage(i: number) {
    this.form.update(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }

  // ── Video ─────────────────────────────────────────────
  async onVideoFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!file) return;
    this.uploadingVideo.set(true);
    this.videoFileName.set(file.name);
    const ext  = file.name.split('.').pop() ?? 'mp4';
    const path = `videos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
      this.form.update(f => ({ ...f, video_url: pub.publicUrl }));
    }
    this.uploadingVideo.set(false);
  }

  // ── Save ──────────────────────────────────────────────
  async save() {
    const f = this.form();
    if (!f.title.trim())    { this.saveError.set('Title is required.'); return; }
    if (!f.location.trim()) { this.saveError.set('Location is required.'); return; }

    this.saving.set(true);
    this.saveError.set('');
    const agentName = this.auth.currentUser()?.name ?? '';

    const payload = {
      title:           f.title.trim(),
      developer:       f.developer.trim(),
      location:        f.location.trim(),
      community:       f.community.trim(),
      type:            f.type,
      status:          f.status,
      price_from:      f.price_from || 0,
      price_label:     f.price_label.trim(),
      beds:            f.beds.trim(),
      bathrooms:       f.bathrooms || 0,
      area_sqft:       f.area_sqft || 0,
      completion_date: f.completion_date.trim(),
      payment_plan:    f.payment_plan.trim(),
      description:     f.description.trim(),
      amenities:       f.amenities,
      images:          f.images,
      badge:           f.badge,
      is_featured:     f.is_featured,
      is_luxury:       f.is_luxury,
      is_ultra_luxury: f.is_ultra_luxury,
      video_url:       f.video_url.trim() || null,
      agent_name:      agentName,
    };

    if (this.editMode() && this.editingId()) {
      const { error } = await this.sb.from('projects').update(payload).eq('id', this.editingId()!);
      this.saving.set(false);
      if (error) { this.saveError.set('Failed to save. Please try again.'); return; }
      this.projects.update(list => list.map(p => p.id === this.editingId() ? { ...p, ...payload } as Project : p));
    } else {
      const { data, error } = await this.sb.from('projects').insert(payload).select().single();
      this.saving.set(false);
      if (error) { this.saveError.set('Failed to save. Please try again.'); return; }
      this.projects.update(list => [data as Project, ...list]);
    }
    this.saveSuccess.set(true);
    setTimeout(() => this.closeForm(), 1500);
  }

  // ── Excel import / export ─────────────────────────────
  formatPrice(n: number) {
    if (!n) return '—';
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
    return `AED ${n.toLocaleString()}`;
  }

  statusClass(s: string) {
    return ({
      'Published':      'badge--green',
      'Draft':          'badge--grey',
      'Pending Review': 'badge--gold',
      'Archived':       'badge--red',
      'Sold':           'badge--purple',
      'Rented':         'badge--blue',
    } as Record<string,string>)[s] ?? '';
  }

  exportToExcel(): void {
    const rows = this.projects().map(p => ({
      'Title':            p.title,
      'Developer':        p.developer,
      'Location':         p.location,
      'Community':        p.community,
      'Type':             p.type,
      'Status':           p.status,
      'Price From (AED)': p.price_from,
      'Price Label':      p.price_label,
      'Beds':             p.beds,
      'Bathrooms':        p.bathrooms,
      'Area (sqft)':      p.area_sqft,
      'Completion':       p.completion_date,
      'Payment Plan':     p.payment_plan,
      'Description':      p.description,
      'Amenities':        (p.amenities ?? []).join(', '),
      'Badge':            p.badge,
      'Featured':         p.is_featured ? 'Yes' : 'No',
      'Luxury':           p.is_luxury   ? 'Yes' : 'No',
      'Ultra Luxury':     p.is_ultra_luxury ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Projects');
    XLSX.writeFile(wb, `my-projects-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async importFromExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.importing.set(true);
    const buffer = await input.files[0].arrayBuffer();
    const wb     = XLSX.read(buffer, { type: 'array' });
    const rows   = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    if (!rows.length) { alert('No data found in the file.'); this.importing.set(false); input.value = ''; return; }

    const agentName = this.auth.currentUser()?.name ?? '';
    const records = rows.map(r => ({
      title:           r['Title']            || '',
      developer:       r['Developer']        || '',
      location:        r['Location']         || '',
      community:       r['Community']        || '',
      type:            r['Type']             || 'Apartment',
      status:          r['Status']           || 'Draft',
      price_from:      Number(r['Price From (AED)']) || 0,
      price_label:     r['Price Label']      || '',
      beds:            r['Beds']             || '',
      bathrooms:       Number(r['Bathrooms'])|| 0,
      area_sqft:       Number(r['Area (sqft)']) || 0,
      completion_date: r['Completion']       || '',
      payment_plan:    r['Payment Plan']     || '',
      description:     r['Description']      || '',
      amenities:       r['Amenities'] ? String(r['Amenities']).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      badge:           r['Badge']            || '',
      is_featured:     r['Featured']      === 'Yes',
      is_luxury:       r['Luxury']        === 'Yes',
      is_ultra_luxury: r['Ultra Luxury']  === 'Yes',
      agent_name:      agentName,
      images:          [],
    })).filter(r => r.title.trim());

    const { error } = await this.sb.from('projects').insert(records);
    this.importing.set(false);
    input.value = '';
    if (error) { alert('Import failed: ' + error.message); return; }

    alert(`${records.length} project(s) imported successfully.`);
    const { data } = await this.sb.from('projects').select('*').eq('agent_name', agentName).order('created_at', { ascending: false });
    const reloaded = (data as Project[]) ?? [];
    reloaded.forEach(p => { p.images = (p.images ?? []).filter(u => u && !u.includes('unsplash.com')); });
    this.projects.set(reloaded);
  }
}
