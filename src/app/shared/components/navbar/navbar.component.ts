import { Component, HostListener, signal, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

// Pages where the navbar should always be white (no hero behind it)
const ALWAYS_WHITE_ROUTES = ['/properties', '/off-plan', '/about', '/contact', '/agents'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  isScrolled = signal(false);
  isAlwaysWhite = signal(false);
  mobileMenuOpen = signal(false);

  navbarWhite = computed(() => this.isScrolled() || this.isAlwaysWhite());

  navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Properties', path: '/properties' },
    { label: 'Off-Plan', path: '/off-plan' },
    { label: 'Agents', path: '/agents' },
    { label: 'About Us', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  currentYear = new Date().getFullYear();

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check initial route
    this.checkRoute(this.router.url);
    // Check on every navigation
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => this.checkRoute(e.urlAfterRedirects));
  }

  private checkRoute(url: string): void {
    this.isAlwaysWhite.set(ALWAYS_WHITE_ROUTES.some(r => url.startsWith(r)));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
