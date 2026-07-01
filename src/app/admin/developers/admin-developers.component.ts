import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

interface Developer {
  id?: string;
  slug: string;
  name: string;
  logo: string;
  cover_image: string;
  established: number | null;
  projects: number;
  delivered_projects: number;
  units: number;
  sales_volume: string;
  sales_value: string;
  capital_gain: string;
  about: string;
  nationality: string;
  featured: boolean;
  sort_order: number;
}

const EMPTY = (): Developer => ({
  slug: '', name: '', logo: '', cover_image: '', established: null,
  projects: 0, delivered_projects: 0, units: 0,
  sales_volume: '', sales_value: '', capital_gain: '',
  about: '', nationality: 'UAE', featured: false, sort_order: 0,
});

@Component({
  selector: 'app-admin-developers',
  standalone: true,
  imports: [CommonModule, FormsModule, RichEditorComponent],
  templateUrl: './admin-developers.component.html',
  styleUrl: './admin-developers.component.scss',
})
export class AdminDevelopersComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  developers   = signal<Developer[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  search       = signal('');
  modalOpen    = signal(false);
  editingId    = signal<string | null>(null);
  form         = signal<Developer>(EMPTY());
  deleteTarget = signal<Developer | null>(null);

  // Logo upload
  logoPreview      = signal<string>('');
  logoDragOver     = signal(false);
  uploadingLogo    = signal(false);

  // Cover image upload
  coverPreview     = signal<string>('');
  coverDragOver    = signal(false);
  uploadingCover   = signal(false);

  readonly nationalities = ['UAE', 'International'];

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.developers();
    return this.developers().filter(d =>
      d.name.toLowerCase().includes(q) || d.nationality.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.sb
      .from('developers')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) this.developers.set(data.map((d: any) => ({
      ...d,
      units:        d.units        ?? 0,
      sales_volume: d.sales_volume ?? '',
      sales_value:  d.sales_value  ?? '',
      capital_gain: d.capital_gain ?? '',
    })));
    this.loading.set(false);
  }

  openAdd(): void {
    this.form.set(EMPTY());
    this.editingId.set(null);
    this.logoPreview.set('');
    this.coverPreview.set('');
    this.modalOpen.set(true);
  }

  openEdit(d: Developer): void {
    this.form.set({ ...d });
    this.editingId.set(d.id!);
    this.logoPreview.set(d.logo || '');
    this.coverPreview.set(d.cover_image || '');
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  patch(field: keyof Developer, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    if (field === 'name' && !this.editingId()) {
      this.form.update(f => ({
        ...f,
        slug: (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  }

  // ── Logo upload ──────────────────────────────────────────────────
  onLogoDrop(e: DragEvent): void {
    e.preventDefault();
    this.logoDragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadImage(file, 'logo');
  }
  onLogoFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadImage(file, 'logo');
    (e.target as HTMLInputElement).value = '';
  }
  removeLogo(): void {
    this.logoPreview.set('');
    this.patch('logo', '');
  }

  // ── Cover image upload ───────────────────────────────────────────
  onCoverDrop(e: DragEvent): void {
    e.preventDefault();
    this.coverDragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadImage(file, 'cover');
  }
  onCoverFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadImage(file, 'cover');
    (e.target as HTMLInputElement).value = '';
  }
  removeCover(): void {
    this.coverPreview.set('');
    this.patch('cover_image', '');
  }

  private async uploadImage(file: File, type: 'logo' | 'cover'): Promise<void> {
    if (!file.type.startsWith('image/')) { this.toast.error('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.toast.error('Image must be under 5MB.'); return; }

    const uploading = type === 'logo' ? this.uploadingLogo : this.uploadingCover;
    uploading.set(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = ev.target?.result as string;
      if (type === 'logo') this.logoPreview.set(preview);
      else this.coverPreview.set(preview);
    };
    reader.readAsDataURL(file);

    const ext  = file.name.split('.').pop();
    const path = `developers/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (error) { this.toast.error('Upload failed: ' + error.message); uploading.set(false); return; }

    const { data: pub } = this.sb.storage.from('imagesFolder').getPublicUrl(data.path);
    const url = pub.publicUrl;

    if (type === 'logo') { this.logoPreview.set(url); this.patch('logo', url); }
    else                 { this.coverPreview.set(url); this.patch('cover_image', url); }

    uploading.set(false);
  }

  async save(): Promise<void> {
    const f = this.form();
    if (!f.name.trim() || !f.slug.trim()) {
      this.toast.error('Name and slug are required.');
      return;
    }
    this.saving.set(true);
    const payload = {
      slug:               f.slug.trim(),
      name:               f.name.trim(),
      logo:               f.logo?.trim()         || null,
      cover_image:        f.cover_image?.trim()  || null,
      established:        f.established ? Number(f.established) : null,
      projects:           Number(f.projects)           || 0,
      delivered_projects: Number(f.delivered_projects) || 0,
      units:              Number(f.units)              || 0,
      sales_volume:       f.sales_volume?.trim()  || null,
      sales_value:        f.sales_value?.trim()   || null,
      capital_gain:       f.capital_gain?.trim()  || null,
      about:              f.about?.trim()          || null,
      nationality:        f.nationality,
      featured:           f.featured,
      sort_order:         Number(f.sort_order)    || 0,
    };

    if (this.editingId()) {
      const { error } = await this.sb.from('developers').update(payload).eq('id', this.editingId()!);
      if (error) { this.toast.error(error.message); }
      else { this.toast.success('Developer updated.'); this.closeModal(); await this.load(); }
    } else {
      const { error } = await this.sb.from('developers').insert(payload);
      if (error) { this.toast.error(error.message); }
      else { this.toast.success('Developer added.'); this.closeModal(); await this.load(); }
    }
    this.saving.set(false);
  }

  confirmDelete(d: Developer): void { this.deleteTarget.set(d); }
  cancelDelete(): void { this.deleteTarget.set(null); }

  async doDelete(): Promise<void> {
    const d = this.deleteTarget();
    if (!d?.id) return;
    const { error } = await this.sb.from('developers').delete().eq('id', d.id);
    if (error) { this.toast.error(error.message); }
    else { this.toast.success(`"${d.name}" deleted.`); await this.load(); }
    this.deleteTarget.set(null);
  }

  async toggleFeatured(d: Developer): Promise<void> {
    const { error } = await this.sb.from('developers').update({ featured: !d.featured }).eq('id', d.id!);
    if (!error) {
      this.developers.update(list => list.map(x => x.id === d.id ? { ...x, featured: !x.featured } : x));
    }
  }
}
