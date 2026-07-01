import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, CmsBanner, CmsAnnouncement, CmsPage, BannerStatus, AnnouncementType } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';

type CmsTab = 'banners' | 'featured' | 'announcements' | 'pages' | 'success-stories';

export interface SuccessStory {
  id?: number;
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
  sort_order: number;
  active: boolean;
}

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule, RichEditorComponent],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent implements OnInit {

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    this.loadFeaturedProperties();
    this.loadSuccessStories();
  }
  private dataSvc = inject(AdminDataService);
  private auth    = inject(AuthService);
  private sb      = inject(SupabaseService).client;
  private toast   = inject(ToastService);

  activeTab   = signal<CmsTab>('banners');
  saveSuccess = signal('');
  saveError   = signal('');
  saving      = signal(false);

  // Live data from service
  banners       = this.dataSvc.banners;
  announcements = this.dataSvc.announcements;
  pages         = this.dataSvc.pages;
  loading       = this.dataSvc.cmsLoading;

  // ── Featured Properties (from Supabase properties table) ─
  featuredProperties = signal<{ id: number; name: string; location: string; price: string; type: string; featured: boolean }[]>([]);
  featuredPropsLoading = signal(true);

  featuredCount = computed(() => this.featuredProperties().filter(p => p.featured).length);

  async loadFeaturedProperties(): Promise<void> {
    this.featuredPropsLoading.set(true);
    const { data } = await this.sb
      .from('properties')
      .select('id, title, location, price, type, is_featured')
      .order('created_at', { ascending: false });
    if (data) {
      this.featuredProperties.set(data.map((p: any) => ({
        id:       p.id,
        name:     p.title,
        location: p.location || '',
        price:    `AED ${Number(p.price).toLocaleString()}`,
        type:     p.type,
        featured: p.is_featured,
      })));
    }
    this.featuredPropsLoading.set(false);
  }

  async toggleFeatured(id: number): Promise<void> {
    const prop = this.featuredProperties().find(p => p.id === id);
    if (!prop) return;
    await this.sb.from('properties').update({ is_featured: !prop.featured }).eq('id', id);
    await this.loadFeaturedProperties();
    this.toast.success('Featured properties updated.');
  }

  // ── Banner modal ──────────────────────────────────────
  showBannerModal = signal(false);
  editingBannerId = signal<number | null>(null);
  deleteBannerId  = signal<number | null>(null);
  bannerForm      = signal({ title: '', subtitle: '', ctaText: 'Learn More', ctaLink: '/', status: 'active' as BannerStatus, order: 1 });
  bannerErrors    = signal<Record<string, string>>({});

  openAddBanner(): void {
    this.editingBannerId.set(null);
    this.bannerForm.set({ title: '', subtitle: '', ctaText: 'Learn More', ctaLink: '/', status: 'active', order: this.banners().length + 1 });
    this.bannerErrors.set({});
    this.showBannerModal.set(true);
  }

  openEditBanner(b: CmsBanner): void {
    this.editingBannerId.set(b.id);
    this.bannerForm.set({ title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink, status: b.status, order: b.order });
    this.bannerErrors.set({});
    this.showBannerModal.set(true);
  }

  async saveBanner(): Promise<void> {
    const f = this.bannerForm();
    const errs: Record<string, string> = {};
    if (!f.title.trim())   errs['title']   = 'Title is required.';
    if (!f.ctaText.trim()) errs['ctaText'] = 'Button text is required.';
    if (!f.ctaLink.trim()) errs['ctaLink'] = 'Button link is required.';
    this.bannerErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    const err = await this.dataSvc.saveBanner(f, this.editingBannerId());
    this.saving.set(false);
    if (err) { this.toast.error(err); return; }
    this.showBannerModal.set(false);
    this.toast.success('Banner saved.');
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.log(actor, role, this.editingBannerId() ? 'Edit CMS Banner' : 'Add CMS Banner', 'cms', `Banner "${f.title}" ${this.editingBannerId() ? 'updated' : 'created'}`);
  }

  async toggleBannerStatus(id: number): Promise<void> {
    const b = this.banners().find(x => x.id === id);
    if (!b) return;
    await this.dataSvc.toggleBannerStatus(id, b.status);
  }

  async deleteBanner(): Promise<void> {
    const id = this.deleteBannerId();
    if (id === null) return;
    await this.dataSvc.deleteBanner(id);
    this.deleteBannerId.set(null);
    this.toast.success('Banner deleted.');
  }

  // ── Announcement modal ────────────────────────────────
  showAnnModal    = signal(false);
  editingAnnId    = signal<number | null>(null);
  deleteAnnId     = signal<number | null>(null);
  annForm         = signal({ title: '', body: '', type: 'info' as AnnouncementType, active: true, expiresOn: '' });
  annErrors       = signal<Record<string, string>>({});

  openAddAnn(): void {
    this.editingAnnId.set(null);
    this.annForm.set({ title: '', body: '', type: 'info', active: true, expiresOn: '' });
    this.annErrors.set({});
    this.showAnnModal.set(true);
  }

  openEditAnn(a: CmsAnnouncement): void {
    this.editingAnnId.set(a.id);
    this.annForm.set({ title: a.title, body: a.body, type: a.type, active: a.active, expiresOn: a.expiresOn });
    this.annErrors.set({});
    this.showAnnModal.set(true);
  }

  async saveAnn(): Promise<void> {
    const f = this.annForm();
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs['title'] = 'Title is required.';
    if (!f.body.trim())  errs['body']  = 'Body is required.';
    this.annErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    const err = await this.dataSvc.saveAnnouncement(f, this.editingAnnId());
    this.saving.set(false);
    if (err) { this.toast.error(err); return; }
    this.showAnnModal.set(false);
    this.toast.success('Announcement saved.');
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.log(actor, role, 'Update CMS Announcement', 'cms', `Announcement "${f.title}" saved`);
  }

  async toggleAnn(id: number): Promise<void> {
    const a = this.announcements().find(x => x.id === id);
    if (!a) return;
    await this.dataSvc.toggleAnnouncement(id, a.active);
  }

  async deleteAnn(): Promise<void> {
    const id = this.deleteAnnId();
    if (id === null) return;
    await this.dataSvc.deleteAnnouncement(id);
    this.deleteAnnId.set(null);
    this.toast.success('Announcement deleted.');
  }

  // ── Page content ──────────────────────────────────────
  editingPageId = signal<string | null>(null);
  pageForm      = signal({ heading: '', subheading: '', body: '' });

  editPage(page: CmsPage): void {
    this.editingPageId.set(page.id);
    this.pageForm.set({ heading: page.heading, subheading: page.subheading, body: page.body });
  }

  async savePage(): Promise<void> {
    const id = this.editingPageId();
    if (!id) return;
    this.saving.set(true);
    const err = await this.dataSvc.savePage(id, this.pageForm());
    this.saving.set(false);
    if (err) { this.toast.error(err); return; }
    this.editingPageId.set(null);
    this.toast.success('Page content saved.');
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.log(actor, role, 'Update CMS Page', 'cms', `Page "${id}" content updated`);
  }

  cancelPageEdit(): void { this.editingPageId.set(null); }

  // ── Helpers ───────────────────────────────────────────
  annTypeLabel(t: AnnouncementType): string {
    return { info: 'Info', success: 'Success', warning: 'Warning' }[t];
  }

  // ── Success Stories ───────────────────────────────────
  successStories     = signal<SuccessStory[]>([]);
  storiesLoading     = signal(false);
  showStoryModal     = signal(false);
  editingStoryId     = signal<number | null>(null);
  deleteStoryId      = signal<number | null>(null);
  storyForm          = signal<Omit<SuccessStory, 'id'>>({ name: '', role: '', text: '', rating: 5, avatar: '', sort_order: 1, active: true });
  storyErrors        = signal<Record<string, string>>({});
  avatarDragging     = signal(false);
  avatarUploading    = signal(false);

  async loadSuccessStories(): Promise<void> {
    this.storiesLoading.set(true);
    const { data, error } = await this.sb.from('success_stories').select('*').order('sort_order');
    if (error) {
      this.toast.error('Could not load success stories: ' + error.message);
    } else if (data && data.length > 0) {
      this.successStories.set(data as SuccessStory[]);
    } else if (data && data.length === 0) {
      await this.seedSuccessStories();
    }
    this.storiesLoading.set(false);
  }

  private async seedSuccessStories(): Promise<void> {
    const seeds = [
      {
        name: 'James & Emily Carter',
        role: 'Purchased Villa in Palm Jumeirah',
        text: 'Livwell made our dream of owning a home in Dubai a reality. The team was incredibly professional, transparent through every step, and found us the perfect villa within our budget. Could not be happier.',
        rating: 5,
        avatar: '',
        sort_order: 1,
        active: true,
      },
      {
        name: 'Fatima Al-Rashidi',
        role: 'Sold Apartment in Downtown Dubai',
        text: 'I was amazed by how quickly my apartment sold and at a price above my expectations. The marketing was exceptional and my agent kept me informed at every stage. Truly a stress-free experience.',
        rating: 5,
        avatar: '',
        sort_order: 2,
        active: true,
      },
      {
        name: 'Raj Patel',
        role: 'Investment Portfolio – 5 Properties',
        text: "As an investor I need data-driven advice. Livwell's team provided in-depth market analysis that helped me build a portfolio with consistent returns across Dubai Marina and Business Bay. Highly recommend.",
        rating: 5,
        avatar: '',
        sort_order: 3,
        active: true,
      },
      {
        name: 'Sophie Lefebvre',
        role: 'Rented Studio in Dubai Marina',
        text: 'Relocating from Paris was daunting, but Livwell handled everything remotely. They shortlisted properties matching my exact requirements and I signed the tenancy agreement before even landing in Dubai.',
        rating: 5,
        avatar: '',
        sort_order: 4,
        active: true,
      },
      {
        name: 'Ahmed Al-Mansoori',
        role: 'Off-Plan Investor – Creek Harbour',
        text: 'Livwell guided me through my first off-plan purchase with complete transparency on payment plans and developer credibility. My unit has already appreciated 18% since handover. Exceptional team.',
        rating: 5,
        avatar: '',
        sort_order: 5,
        active: true,
      },
    ];
    const { data } = await this.sb.from('success_stories').insert(seeds).select();
    if (data) this.successStories.set(data as SuccessStory[]);
  }

  openAddStory(): void {
    this.editingStoryId.set(null);
    this.storyForm.set({ name: '', role: '', text: '', rating: 5, avatar: '', sort_order: this.successStories().length + 1, active: true });
    this.storyErrors.set({});
    this.avatarDragging.set(false);
    this.showStoryModal.set(true);
  }

  openEditStory(s: SuccessStory): void {
    this.editingStoryId.set(s.id!);
    this.storyForm.set({ name: s.name, role: s.role, text: s.text, rating: s.rating, avatar: s.avatar, sort_order: s.sort_order, active: s.active });
    this.storyErrors.set({});
    this.avatarDragging.set(false);
    this.showStoryModal.set(true);
  }

  onAvatarDragOver(e: DragEvent): void { e.preventDefault(); this.avatarDragging.set(true); }
  onAvatarDragLeave(): void            { this.avatarDragging.set(false); }
  onAvatarDrop(e: DragEvent): void {
    e.preventDefault();
    this.avatarDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.uploadAvatar(file);
  }
  onAvatarFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadAvatar(file);
  }

  private async uploadAvatar(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) { this.toast.error('Please select an image file.'); return; }
    this.avatarUploading.set(true);
    const ext  = file.name.split('.').pop();
    const path = `avatars/${Date.now()}.${ext}`;
    const { error } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (error) { this.toast.error('Upload failed: ' + error.message); this.avatarUploading.set(false); return; }
    const { data } = this.sb.storage.from('imagesFolder').getPublicUrl(path);
    this.storyForm.update(f => ({ ...f, avatar: data.publicUrl }));
    this.avatarUploading.set(false);
  }

  removeAvatar(): void { this.storyForm.update(f => ({ ...f, avatar: '' })); }

  async saveStory(): Promise<void> {
    const f = this.storyForm();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs['name'] = 'Name is required.';
    if (!f.text.trim()) errs['text'] = 'Story text is required.';
    this.storyErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    const id = this.editingStoryId();
    const payload = { name: f.name.trim(), role: f.role.trim(), text: f.text.trim(), rating: f.rating, avatar: f.avatar.trim(), sort_order: f.sort_order, active: f.active };
    const { error } = id
      ? await this.sb.from('success_stories').update(payload).eq('id', id)
      : await this.sb.from('success_stories').insert(payload);
    this.saving.set(false);
    if (error) { this.toast.error(error.message); return; }
    this.showStoryModal.set(false);
    this.toast.success('Success story saved.');
    await this.loadSuccessStories();
  }

  async toggleStoryActive(s: SuccessStory): Promise<void> {
    await this.sb.from('success_stories').update({ active: !s.active }).eq('id', s.id!);
    await this.loadSuccessStories();
  }

  async deleteStory(): Promise<void> {
    const id = this.deleteStoryId();
    if (id === null) return;
    await this.sb.from('success_stories').delete().eq('id', id);
    this.deleteStoryId.set(null);
    this.toast.success('Story deleted.');
    await this.loadSuccessStories();
  }

  storyRatingOptions = [1, 2, 3, 4, 5];

}
