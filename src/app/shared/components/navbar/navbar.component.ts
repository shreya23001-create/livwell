import { Component, HostListener, signal, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { filter } from 'rxjs/operators';

// Pages where the navbar should always be white (no hero behind it)
const ALWAYS_WHITE_ROUTES = ['/properties', '/off-plan', '/projects', '/about', '/contact', '/agents', '/privacy-policy', '/terms-of-use', '/luxury-projects', '/ultra-luxury-projects', '/luxury-properties-for-sale', '/luxury-properties-for-rent', '/luxury-project/', '/luxury-property/', '/blog', '/guides', '/faq', '/news', '/careers', '/why-invest', '/branded-residences', '/branded-residence/', '/services', '/commercial', '/commercial/', '/areas', '/areas/', '/developers', '/developers/'];

// Types that appear in the Luxe section (ordered for display)
const LUXE_TYPES_ORDER = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Home'];

// Project types for the Projects dropdown flyout
const PROJECT_TYPES_ORDER = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Mixed', 'Duplex'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  isScrolled    = signal(false);
  isAlwaysWhite = signal(false);
  mobileMenuOpen = signal(false);

  // Luxe flyout types loaded from DB
  luxeSaleTypes = signal<string[]>(['Apartment', 'Villa', 'Penthouse', 'Home']);
  luxeRentTypes = signal<string[]>(['Apartment', 'Villa', 'Penthouse', 'Home']);

  // Projects dropdown flyout types
  projectTypes = signal<string[]>(PROJECT_TYPES_ORDER);
  hasLuxuryProjects     = signal(false);
  hasUltraLuxuryProjects = signal(false);

  navbarWhite = computed(() => this.isScrolled() || this.isAlwaysWhite());

  navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Properties', path: '/properties' },
    { label: 'Projects', path: '/projects' },
    { label: 'Agents', path: '/agents' },
    { label: 'About Us', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  currentYear = new Date().getFullYear();

  whatsappNumber = signal('');
  socialLinks = signal({ facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' });

  get whatsappHref(): string {
    const digits = this.whatsappNumber().replace(/[^\d]/g, '');
    return digits
      ? `https://wa.me/${digits}?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20on%20Livwell.`
      : 'https://wa.me/971500000000?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20on%20Livwell.';
  }

  private sb = inject(SupabaseService).client;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.checkRoute(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => this.checkRoute(e.urlAfterRedirects));

    this.loadLuxeTypes();
    this.loadProjectFlags();
    this.loadSiteSettings();
  }

  private async loadSiteSettings(): Promise<void> {
    const { data } = await this.sb.from('site_settings')
      .select('key, value')
      .in('key', ['whatsapp_number', 'social_links']);
    if (!data) return;
    for (const row of data) {
      if (row.key === 'whatsapp_number') this.whatsappNumber.set(row.value ?? '');
      if (row.key === 'social_links') {
        try { this.socialLinks.set({ ...this.socialLinks(), ...JSON.parse(row.value) }); } catch {}
      }
    }
  }

  private async loadLuxeTypes(): Promise<void> {
    const { data } = await this.sb
      .from('properties')
      .select('type, listing_type')
      .eq('status', 'Published')
      .eq('is_luxury', true);

    if (data && data.length > 0) {
      const saleTypes = [...new Set((data as any[]).filter(r => r.listing_type === 'Sale').map(r => r.type).filter(Boolean))];
      const rentTypes = [...new Set((data as any[]).filter(r => r.listing_type === 'Rent').map(r => r.type).filter(Boolean))];
      const orderedSale = LUXE_TYPES_ORDER.filter(t => saleTypes.includes(t));
      const orderedRent = LUXE_TYPES_ORDER.filter(t => rentTypes.includes(t));
      if (orderedSale.length > 0) this.luxeSaleTypes.set(orderedSale);
      if (orderedRent.length > 0) this.luxeRentTypes.set(orderedRent);
    }
  }

  private async loadProjectFlags(): Promise<void> {
    const { data: types } = await this.sb
      .from('projects')
      .select('type')
      .eq('status', 'Published');

    if (types && types.length > 0) {
      const found = [...new Set((types as any[]).map(r => r.type).filter(Boolean))];
      const ordered = PROJECT_TYPES_ORDER.filter(t => found.includes(t));
      if (ordered.length > 0) this.projectTypes.set(ordered);
    }

    const { count: luxCount } = await this.sb
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Published')
      .eq('is_luxury', true);
    this.hasLuxuryProjects.set((luxCount ?? 0) > 0);

    const { count: ultraCount } = await this.sb
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Published')
      .eq('is_ultra_luxury', true);
    this.hasUltraLuxuryProjects.set((ultraCount ?? 0) > 0);
  }

  private checkRoute(url: string): void {
    this.isAlwaysWhite.set(ALWAYS_WHITE_ROUTES.some(r => url.startsWith(r)));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  mobileOpenSection = signal<string | null>(null);

  toggleMobileMenu(): void {
    const next = !this.mobileMenuOpen();
    this.mobileMenuOpen.set(next);
    // Lock/unlock body scroll
    if (next) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      this.mobileOpenSection.set(null);
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    document.body.style.overflow = '';
    this.mobileOpenSection.set(null);
  }

  toggleSection(key: string): void {
    this.mobileOpenSection.update(v => v === key ? null : key);
  }
}
