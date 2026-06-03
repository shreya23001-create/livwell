import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, CmsBanner, CmsAnnouncement, CmsPage, BannerStatus, AnnouncementType } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

type CmsTab = 'banners' | 'featured' | 'announcements' | 'pages';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent implements OnInit {

  ngOnInit(): void {
    this.loadFeaturedProperties();
  }
  private dataSvc = inject(AdminDataService);
  private auth    = inject(AuthService);
  private sb      = inject(SupabaseService).client;

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
    this.flash('Featured properties updated.');
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
    if (err) { this.saveError.set(err); return; }
    this.showBannerModal.set(false);
    this.flash('Banner saved.');
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
    this.flash('Banner deleted.');
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
    if (err) { this.saveError.set(err); return; }
    this.showAnnModal.set(false);
    this.flash('Announcement saved.');
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
    this.flash('Announcement deleted.');
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
    if (err) { this.saveError.set(err); return; }
    this.editingPageId.set(null);
    this.flash('Page content saved.');
    const actor = this.auth.currentUser()?.email ?? 'admin';
    const role  = (this.auth.currentUser()?.role ?? 'admin') as any;
    this.dataSvc.log(actor, role, 'Update CMS Page', 'cms', `Page "${id}" content updated`);
  }

  cancelPageEdit(): void { this.editingPageId.set(null); }

  // ── Helpers ───────────────────────────────────────────
  annTypeLabel(t: AnnouncementType): string {
    return { info: 'Info', success: 'Success', warning: 'Warning' }[t];
  }

  private flash(msg: string): void {
    this.saveSuccess.set(msg);
    this.saveError.set('');
    setTimeout(() => this.saveSuccess.set(''), 3000);
  }
}
