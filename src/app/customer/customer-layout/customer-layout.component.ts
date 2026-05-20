import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
})
export class CustomerLayoutComponent {
  menuOpen = signal(false);

  readonly navItems = [
    { route: '/my/dashboard',   label: 'Dashboard',           icon: 'grid' },
    { route: '/my/properties',  label: 'Saved Properties',    icon: 'heart' },
    { route: '/my/enquiries',   label: 'My Enquiries',        icon: 'mail' },
    { route: '/my/profile',     label: 'Profile & Settings',  icon: 'user' },
  ];

  constructor(public auth: AuthService) {}

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  logout(): void { this.auth.logout(); }

  initials(): string {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
