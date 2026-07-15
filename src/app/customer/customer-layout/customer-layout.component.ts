import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface CustNotif {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  menuOpen   = signal(false);
  notifOpen  = signal(false);
  private _notifs = signal<CustNotif[]>([]);
  private timer: any;

  notifs      = this._notifs.asReadonly();
  unreadCount = computed(() => this._notifs().filter(n => !n.read).length);

  private sb     = inject(SupabaseService).client;
  private router = inject(Router);

  readonly navItems = [
    { route: '/my/dashboard',       label: 'Dashboard',              icon: 'grid' },
    { route: '/my/properties',      label: 'Saved Properties',       icon: 'heart' },
    { route: '/my/enquiries',       label: 'My Enquiries',           icon: 'mail' },
    { route: '/my/notifications',   label: 'Notifications',          icon: 'bell' },
    { route: '/my/value-tracker',   label: 'Property Value Tracker', icon: 'tracker' },
    { route: '/my/future-interest', label: 'Future Interest',        icon: 'calendar' },
    { route: '/my/ratings',         label: 'My Project Ratings',     icon: 'star' },
    { route: '/my/profile',         label: 'Profile & Settings',     icon: 'user' },
  ];

  constructor(public auth: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    await this.fetchNotifs();
    this.timer = setInterval(() => this.fetchNotifs(), 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async fetchNotifs(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const { data } = await this.sb
      .from('notifications')
      .select('id, title, message, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) this._notifs.set(data as CustNotif[]);
  }

  toggleNotif(): void {
    const opening = !this.notifOpen();
    this.notifOpen.set(opening);
    if (opening) this.fetchNotifs();
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this._notifs.update(list => list.map(n => ({ ...n, read: true })));
    await this.sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }

  openNotifPage(): void {
    this.notifOpen.set(false);
    this.markAllRead();
    this.router.navigate(['/my/notifications']);
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  logout(): void { this.auth.logout().catch(() => {}); }

  initials(): string {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
