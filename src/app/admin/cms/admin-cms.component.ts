import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, CmsBanner, CmsAnnouncement, CmsPage, BannerStatus, AnnouncementType } from '../../shared/services/admin-data.service';
import { AuthService } from '../../shared/services/auth.service';

type CmsTab = 'banners' | 'featured' | 'announcements' | 'pages';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent {
  private dataSvc = inject(AdminDataService);
  private auth    = inject(AuthService);

  activeTab   = signal<CmsTab>('banners');
  saveSuccess = signal('');
  saveError   = signal('');
  saving      = signal(false);

  // Live data from service
  banners       = this.dataSvc.banners;
  announcements = this.dataSvc.announcements;
  pages         = this.dataSvc.pages;
  loading       = this.dataSvc.cmsLoading;

  // ── Featured Properties (local — not yet in Supabase) ─
  featuredProperties = signal([
    { id: 1, name: 'Luxury 2BR in Downtown Dubai',       location: 'Downtown Dubai',    price: 'AED 2,800,000', type: 'Apartment', featured: true,  order: 1 },
    { id: 2, name: 'Spacious Villa in Arabian Ranches',  location: 'Arabian Ranches',   price: 'AED 6,500,000', type: 'Villa',     featured: true,  order: 2 },
    { id: 3, name: 'Penthouse in Palm Jumeirah',         location: 'Palm Jumeirah',     price: 'AED 18,000,000',type: 'Penthouse', featured: true,  order: 3 },
    { id: 4, name: 'Studio in JVC',                     location: 'Jumeirah Village Circle', price: 'AED 650,000', type: 'Studio', featured: false, order: 4 },
    { id: 5, name: 'Modern 1BR in Business Bay',         location: 'Business Bay',      price: 'AED 7,500/mo',  type: 'Apartment', featured: false, order: 5 },
    { id: 6, name: 'Townhouse in Dubai Hills',           location: 'Dubai Hills Estate',price: 'AED 3,200,000', type: 'Townhouse', featured: true,  order: 6 },
  ]);

  featuredCount = computed(() => this.featuredProperties().filter(p => p.featured).length);

  toggleFeatured(id: number): void {
    this.featuredProperties.update(list => list.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
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
