import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

interface Developer {
  id?: string;
  slug: string;
  name: string;
  logo: string;
  established: number | null;
  projects: number;
  delivered_projects: number;
  about: string;
  nationality: string;
  featured: boolean;
  sort_order: number;
}

const EMPTY = (): Developer => ({
  slug: '', name: '', logo: '', established: null,
  projects: 0, delivered_projects: 0, about: '',
  nationality: 'UAE', featured: false, sort_order: 0,
});

@Component({
  selector: 'app-admin-developers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-developers.component.html',
  styleUrl: './admin-developers.component.scss',
})
export class AdminDevelopersComponent implements OnInit {
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  developers  = signal<Developer[]>([]);
  loading     = signal(true);
  saving      = signal(false);
  search      = signal('');
  modalOpen   = signal(false);
  editingId   = signal<string | null>(null);
  form        = signal<Developer>(EMPTY());
  deleteTarget = signal<Developer | null>(null);
  logoPreview = signal<string>('');

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
    if (!error && data) this.developers.set(data);
    this.loading.set(false);
  }

  openAdd(): void {
    this.form.set(EMPTY());
    this.editingId.set(null);
    this.logoPreview.set('');
    this.modalOpen.set(true);
  }

  openEdit(d: Developer): void {
    this.form.set({ ...d });
    this.editingId.set(d.id!);
    this.logoPreview.set(d.logo || '');
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  patch(field: keyof Developer, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    if (field === 'logo') this.logoPreview.set(value);
    if (field === 'name' && !this.editingId()) {
      this.form.update(f => ({
        ...f,
        slug: (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
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
      logo:               f.logo?.trim() || null,
      established:        f.established ? Number(f.established) : null,
      projects:           Number(f.projects) || 0,
      delivered_projects: Number(f.delivered_projects) || 0,
      about:              f.about?.trim() || null,
      nationality:        f.nationality,
      featured:           f.featured,
      sort_order:         Number(f.sort_order) || 0,
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
