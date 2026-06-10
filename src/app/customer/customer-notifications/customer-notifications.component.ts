import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  date: string;
}

type Tab = 'inbox' | 'preferences';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notif-page">

      <!-- Tab bar -->
      <div class="notif-tabs">
        <button class="notif-tab" [class.active]="activeTab() === 'inbox'" (click)="activeTab.set('inbox')">
          Inbox
          @if (unreadCount() > 0) {
            <span class="notif-badge">{{ unreadCount() }}</span>
          }
        </button>
        <button class="notif-tab" [class.active]="activeTab() === 'preferences'" (click)="activeTab.set('preferences')">
          Preferences
        </button>
      </div>

      <!-- ── INBOX TAB ── -->
      @if (activeTab() === 'inbox') {
        <div class="notif-inbox">
          @if (loading()) {
            <div class="notif-empty"><p>Loading notifications…</p></div>
          } @else if (notifications().length === 0) {
            <div class="notif-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>No notifications yet.</p>
            </div>
          } @else {
            <div class="notif-actions-row">
              @if (unreadCount() > 0) {
                <button class="notif-mark-all" (click)="markAllRead()">Mark all as read</button>
              }
            </div>
            <div class="notif-list">
              @for (n of notifications(); track n.id) {
                <div class="notif-item" [class.unread]="!n.read" (click)="markRead(n)">
                  <div class="notif-dot" [class.visible]="!n.read"></div>
                  <div class="notif-item-body">
                    <div class="notif-item-top">
                      <span class="notif-item-title">{{ n.title }}</span>
                      <span class="notif-item-date">{{ n.date }}</span>
                    </div>
                    <p class="notif-item-msg">{{ n.message }}</p>
                    @if (n.type) {
                      <span class="notif-type-tag">{{ n.type }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ── PREFERENCES TAB ── -->
      @if (activeTab() === 'preferences') {
        <div class="notif-prefs">

          <div class="notif-section">
            <div class="notif-row">
              <span class="notif-label">I am</span>
              <div class="notif-checks">
                @for (role of roles; track role) {
                  <label class="notif-check-item">
                    <input type="checkbox" [(ngModel)]="selectedRoles[role]" />
                    {{ role }}
                  </label>
                }
              </div>
            </div>
          </div>

          <div class="notif-divider"></div>

          <div class="notif-section">
            <div class="notif-row">
              <span class="notif-label">Notify me about</span>
              <div class="notif-checks">
                @for (n of notifOptions; track n) {
                  <label class="notif-check-item">
                    <input type="checkbox" [(ngModel)]="selectedNotifs[n]" />
                    {{ n }}
                  </label>
                }
              </div>
            </div>
          </div>

          <div class="notif-save-row">
            <button class="notif-save-btn" (click)="savePrefs()">Save Preferences</button>
            @if (prefsSaved()) {
              <span class="notif-saved-msg">Saved successfully.</span>
            }
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    $accent: #1a5c3a; $border: #e5e7eb; $muted: #9ca3af; $text: #111827; $sub: #6b7280;
    .notif-page { padding: 0; }

    .notif-tabs { display: flex; gap: 0; border-bottom: 2px solid $border; margin-bottom: 1.5rem; }
    .notif-tab { background: none; border: none; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 500; color: $sub; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 0.5rem; transition: color 0.15s;
      &.active { color: $accent; border-bottom-color: $accent; font-weight: 700; }
      &:hover:not(.active) { color: $text; }
    }
    .notif-badge { background: #ef4444; color: #fff; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 999px; }

    .notif-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; gap: 0.75rem; color: $muted; text-align: center; p { font-size: 0.875rem; margin: 0; } }

    .notif-actions-row { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }
    .notif-mark-all { background: none; border: none; font-size: 0.8rem; color: $accent; font-weight: 600; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } }

    .notif-list { display: flex; flex-direction: column; gap: 0; border: 1px solid $border; border-radius: 0.75rem; overflow: hidden; }
    .notif-item { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid $border; cursor: pointer; transition: background 0.15s; align-items: flex-start;
      &:last-child { border-bottom: none; }
      &.unread { background: #f0fdf4; }
      &:hover { background: #f9fafb; }
    }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: $accent; flex-shrink: 0; margin-top: 6px; opacity: 0; &.visible { opacity: 1; } }
    .notif-item-body { flex: 1; min-width: 0; }
    .notif-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.3rem; }
    .notif-item-title { font-size: 0.875rem; font-weight: 600; color: $text; }
    .notif-item-date { font-size: 0.75rem; color: $muted; white-space: nowrap; flex-shrink: 0; }
    .notif-item-msg { font-size: 0.825rem; color: $sub; margin: 0 0 0.4rem; line-height: 1.4; }
    .notif-type-tag { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: $sub; }

    .notif-prefs { max-width: 860px; }
    .notif-section { padding: 1.5rem 0; }
    .notif-row { display: flex; gap: 3rem; align-items: flex-start; }
    .notif-label { min-width: 140px; font-size: 0.9rem; color: #374151; font-weight: 500; padding-top: 0.2rem; }
    .notif-checks { display: flex; flex-direction: column; gap: 0.65rem; }
    .notif-check-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; color: $text; cursor: pointer;
      input[type=checkbox] { width: 16px; height: 16px; accent-color: $accent; cursor: pointer; }
    }
    .notif-divider { height: 1px; background: $border; }
    .notif-save-row { margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .notif-save-btn { padding: 0.6rem 1.5rem; background: $accent; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { background: #154d31; } }
    .notif-saved-msg { font-size: 0.85rem; color: #16a34a; }
  `]
})
export class CustomerNotificationsComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  private readonly STORAGE_KEY = 'lw_notif_prefs';

  activeTab     = signal<Tab>('inbox');
  loading       = signal(true);
  notifications = signal<Notification[]>([]);
  prefsSaved    = signal(false);

  unreadCount = () => this.notifications().filter(n => !n.read).length;

  roles = [
    'Buyer', 'Seller', 'Landlord', 'Tenant', 'Landlord Rep',
    'Real Estate Agent', 'Real Estate Developer', 'Real-estate agency', 'POA Holder',
  ];

  notifOptions = [
    'Property Tech Tools',
    'Sales Transactions In Dubai Land Dept',
    'Distressed Sale',
    'Offers Notification',
    'New Project Launch Notification',
    'Project Construction Progress Notification',
    'Project Handover/Completion Notification',
    'Real Estate Market Update',
    'I Am Not Interested. Do Not Send Me Any Kind Of Notification.',
  ];

  selectedRoles:  Record<string, boolean> = {};
  selectedNotifs: Record<string, boolean> = {};

  constructor() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.selectedRoles  = parsed.roles  ?? {};
        this.selectedNotifs = parsed.notifs ?? {};
      }
    } catch {}
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    const { data } = await this.sb
      .from('notifications')
      .select('id, title, message, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      this.notifications.set(data.map((n: any) => ({
        id:         n.id,
        title:      n.title   || 'Notification',
        message:    n.message || '',
        type:       n.type    || '',
        read:       n.read    ?? false,
        created_at: n.created_at,
        date:       new Date(n.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }),
      })));
    }
    this.loading.set(false);
  }

  async markRead(notif: Notification): Promise<void> {
    if (notif.read) return;
    notif.read = true;
    this.notifications.update(list => [...list]);
    await this.sb.from('notifications').update({ read: true }).eq('id', notif.id);
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    await this.sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }

  savePrefs(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        roles:  this.selectedRoles,
        notifs: this.selectedNotifs,
      }));
    } catch {}
    this.prefsSaved.set(true);
    setTimeout(() => this.prefsSaved.set(false), 3000);
  }
}
