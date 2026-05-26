import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type CmsTab = 'banners' | 'featured' | 'announcements' | 'pages';
type BannerStatus = 'active' | 'inactive';
type AnnouncementType = 'info' | 'success' | 'warning';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  status: BannerStatus;
  order: number;
}

interface FeaturedProperty {
  id: number;
  name: string;
  location: string;
  price: string;
  type: string;
  featured: boolean;
  order: number;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  type: AnnouncementType;
  active: boolean;
  expiresOn: string;
}

interface PageContent {
  id: string;
  label: string;
  heading: string;
  subheading: string;
  body: string;
}

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent {
  activeTab = signal<CmsTab>('banners');

  saveSuccess = signal('');
  showBannerModal = signal(false);
  showAnnModal    = signal(false);
  editingBannerId = signal<number | null>(null);
  editingAnnId    = signal<number | null>(null);
  deleteBannerId  = signal<number | null>(null);
  deleteAnnId     = signal<number | null>(null);

  // ── Banners ──────────────────────────────────────────
  banners = signal<Banner[]>([
    { id: 1, title: 'Find Your Dream Home in Dubai', subtitle: 'Browse 500+ exclusive properties across prime locations', ctaText: 'Browse Properties', ctaLink: '/properties', status: 'active', order: 1 },
    { id: 2, title: 'Exclusive Off-Plan Launches', subtitle: 'Be the first to access new development projects in Dubai', ctaText: 'View Off-Plan', ctaLink: '/off-plan', status: 'active', order: 2 },
    { id: 3, title: 'Work With Top Agents', subtitle: 'Connect with certified real estate experts across the UAE', ctaText: 'Meet Our Agents', ctaLink: '/agents', status: 'inactive', order: 3 },
  ]);

  bannerForm = signal({ title: '', subtitle: '', ctaText: '', ctaLink: '', status: 'active' as BannerStatus, order: 1 });
  bannerErrors = signal<Record<string, string>>({});

  openAddBanner(): void {
    this.editingBannerId.set(null);
    this.bannerForm.set({ title: '', subtitle: '', ctaText: 'Learn More', ctaLink: '/', status: 'active', order: this.banners().length + 1 });
    this.bannerErrors.set({});
    this.showBannerModal.set(true);
  }

  openEditBanner(b: Banner): void {
    this.editingBannerId.set(b.id);
    this.bannerForm.set({ title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink, status: b.status, order: b.order });
    this.bannerErrors.set({});
    this.showBannerModal.set(true);
  }

  saveBanner(): void {
    const f = this.bannerForm();
    const errs: Record<string, string> = {};
    if (!f.title.trim())   errs['title']   = 'Title is required.';
    if (!f.ctaText.trim()) errs['ctaText'] = 'Button text is required.';
    if (!f.ctaLink.trim()) errs['ctaLink'] = 'Button link is required.';
    this.bannerErrors.set(errs);
    if (Object.keys(errs).length) return;

    const id = this.editingBannerId();
    if (id !== null) {
      this.banners.update(list => list.map(b => b.id === id ? { ...b, ...f } : b));
    } else {
      this.banners.update(list => [...list, { id: Date.now(), ...f }]);
    }
    this.showBannerModal.set(false);
    this.flash('Banner saved successfully.');
  }

  toggleBannerStatus(id: number): void {
    this.banners.update(list => list.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
  }

  deleteBanner(): void {
    const id = this.deleteBannerId();
    if (id !== null) this.banners.update(list => list.filter(b => b.id !== id));
    this.deleteBannerId.set(null);
  }

  // ── Featured Properties ───────────────────────────────
  featuredProperties = signal<FeaturedProperty[]>([
    { id: 1, name: 'Luxury 2BR in Downtown Dubai', location: 'Downtown Dubai', price: 'AED 2,800,000', type: 'Apartment', featured: true, order: 1 },
    { id: 2, name: 'Spacious Villa in Arabian Ranches', location: 'Arabian Ranches', price: 'AED 6,500,000', type: 'Villa', featured: true, order: 2 },
    { id: 3, name: 'Penthouse in Palm Jumeirah', location: 'Palm Jumeirah', price: 'AED 18,000,000', type: 'Penthouse', featured: true, order: 3 },
    { id: 4, name: 'Studio in JVC', location: 'Jumeirah Village Circle', price: 'AED 650,000', type: 'Studio', featured: false, order: 4 },
    { id: 5, name: 'Modern 1BR in Business Bay', location: 'Business Bay', price: 'AED 7,500/mo', type: 'Apartment', featured: false, order: 5 },
    { id: 6, name: 'Townhouse in Dubai Hills', location: 'Dubai Hills Estate', price: 'AED 3,200,000', type: 'Townhouse', featured: true, order: 6 },
  ]);

  featuredCount = computed(() => this.featuredProperties().filter(p => p.featured).length);

  toggleFeatured(id: number): void {
    this.featuredProperties.update(list => list.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
    this.flash('Featured properties updated.');
  }

  // ── Announcements ─────────────────────────────────────
  announcements = signal<Announcement[]>([
    { id: 1, title: 'New Off-Plan Projects Available', body: 'We have just added 12 new off-plan projects from top developers. Check them out now!', type: 'info', active: true, expiresOn: '2026-06-30' },
    { id: 2, title: 'Ramadan Office Hours', body: 'Our offices will operate from 9am to 3pm during the holy month of Ramadan.', type: 'warning', active: false, expiresOn: '2026-04-10' },
    { id: 3, title: 'Livwell App Now Available', body: 'Download our mobile app on iOS and Android for a seamless property search experience.', type: 'success', active: true, expiresOn: '2026-12-31' },
  ]);

  annForm = signal({ title: '', body: '', type: 'info' as AnnouncementType, active: true, expiresOn: '' });
  annErrors = signal<Record<string, string>>({});

  openAddAnn(): void {
    this.editingAnnId.set(null);
    this.annForm.set({ title: '', body: '', type: 'info', active: true, expiresOn: '' });
    this.annErrors.set({});
    this.showAnnModal.set(true);
  }

  openEditAnn(a: Announcement): void {
    this.editingAnnId.set(a.id);
    this.annForm.set({ title: a.title, body: a.body, type: a.type, active: a.active, expiresOn: a.expiresOn });
    this.annErrors.set({});
    this.showAnnModal.set(true);
  }

  saveAnn(): void {
    const f = this.annForm();
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs['title'] = 'Title is required.';
    if (!f.body.trim())  errs['body']  = 'Body is required.';
    this.annErrors.set(errs);
    if (Object.keys(errs).length) return;

    const id = this.editingAnnId();
    if (id !== null) {
      this.announcements.update(list => list.map(a => a.id === id ? { ...a, ...f } : a));
    } else {
      this.announcements.update(list => [...list, { id: Date.now(), ...f }]);
    }
    this.showAnnModal.set(false);
    this.flash('Announcement saved.');
  }

  toggleAnn(id: number): void {
    this.announcements.update(list => list.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  deleteAnn(): void {
    const id = this.deleteAnnId();
    if (id !== null) this.announcements.update(list => list.filter(a => a.id !== id));
    this.deleteAnnId.set(null);
  }

  // ── Page Content ──────────────────────────────────────
  pages = signal<PageContent[]>([
    { id: 'home-hero', label: 'Home — Hero Section', heading: 'Find Your Dream Home in Dubai', subheading: 'Browse 500+ exclusive properties across prime locations in the UAE', body: '' },
    { id: 'about-hero', label: 'About Us — Hero', heading: 'Dubai\'s Premier Real Estate Platform', subheading: 'Connecting buyers, sellers and investors with verified properties since 2018', body: 'Livwell Real Estate is a leading property platform in the UAE...' },
    { id: 'contact-info', label: 'Contact — Office Info', heading: 'Get In Touch', subheading: 'Our team is available 7 days a week', body: 'Office: Al-Barsha Business Centre, 3rd Floor, Office 311-B, Dubai\nPhone: +971 52 520 9703\nEmail: contact@livwelldubai.com' },
  ]);

  editingPageId = signal<string | null>(null);
  pageForm = signal({ heading: '', subheading: '', body: '' });

  editPage(page: PageContent): void {
    this.editingPageId.set(page.id);
    this.pageForm.set({ heading: page.heading, subheading: page.subheading, body: page.body });
  }

  savePage(): void {
    const id = this.editingPageId();
    if (!id) return;
    const f = this.pageForm();
    this.pages.update(list => list.map(p => p.id === id ? { ...p, ...f } : p));
    this.editingPageId.set(null);
    this.flash('Page content saved.');
  }

  private flash(msg: string): void {
    this.saveSuccess.set(msg);
    setTimeout(() => this.saveSuccess.set(''), 3000);
  }

  annTypeLabel(t: AnnouncementType): string {
    return { info: 'Info', success: 'Success', warning: 'Warning' }[t];
  }
}
