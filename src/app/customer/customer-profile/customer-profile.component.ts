import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

type Tab = 'profile' | 'security' | 'preferences';
type NotifTab = 'inbox' | 'preferences';

interface NotifItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  date: string;
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss',
})
export class CustomerProfileComponent implements OnInit {
  auth          = inject(AuthService);
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  private readonly NOTIF_PREFS_KEY = 'lw_notif_prefs';

  activeTab    = signal<Tab>('profile');
  saving       = signal(false);
  saveSuccess  = signal('');
  saveError    = signal('');
  avatarUrl       = signal('');
  uploadingAvatar = signal(false);
  showDeleteModal = signal(false);
  deleting        = signal(false);

  profileForm = { name: '', email: '', phone: '', nationality: '', budget: '', lookingFor: 'buy' };
  passwordForm = { newPw: '', confirmPw: '' };

  showNewPw     = signal(false);
  showConfirmPw = signal(false);

  // ── Notification inbox ───────────────────────────────────
  notifTab       = signal<NotifTab>('inbox');
  notifLoading   = signal(false);
  notifications  = signal<NotifItem[]>([]);
  prefsSaved     = signal(false);
  unreadCount    = () => this.notifications().filter(n => !n.read).length;

  readonly notifRoles = [
    'Buyer', 'Seller', 'Landlord', 'Tenant', 'Landlord Rep',
    'Real Estate Agent', 'Real Estate Developer', 'Real-estate agency', 'POA Holder',
  ];
  readonly notifOptions = [
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

  preferences = {
    emailEnquiryReplies: true,
    emailNewListings:    false,
    emailWeeklyDigest:   true,
    smsViewingReminders: true,
    smsAgentMessages:    false,
  };

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.name  = user.name  ?? '';
      this.profileForm.email = user.email ?? '';
      this.profileForm.phone = user.phone ?? '';
    }
    if (user?.id) {
      const { data } = await this.sb.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
      const av = data?.avatar_url ?? '';
      if (av && !av.startsWith('data:') && /\/avatars\/[^/]+/.test(av)) this.avatarUrl.set(av);
    }
    // Load saved notification preferences from localStorage
    try {
      const stored = localStorage.getItem(this.NOTIF_PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.selectedRoles  = parsed.roles  ?? {};
        this.selectedNotifs = parsed.notifs ?? {};
      }
    } catch {}
    // Load notifications inbox
    await this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.notifLoading.set(true);
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
    this.notifLoading.set(false);
  }

  async markNotifRead(n: NotifItem): Promise<void> {
    if (n.read) return;
    n.read = true;
    this.notifications.update(list => [...list]);
    await this.sb.from('notifications').update({ read: true }).eq('id', n.id);
  }

  async markAllNotifsRead(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    await this.sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }

  async onAvatarChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `avatars/${userId}.${ext}`;

    this.uploadingAvatar.set(true);
    const { error: upErr } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (upErr) { this.toast.error('Upload failed: ' + upErr.message); this.uploadingAvatar.set(false); return; }

    const { data: urlData } = this.sb.storage.from('imagesFolder').getPublicUrl(path);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();

    const { error: dbErr } = await this.sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
    if (dbErr) { this.toast.error('Failed to save avatar.'); this.uploadingAvatar.set(false); return; }

    this.avatarUrl.set(publicUrl);
    await this.auth.refreshProfile();
    this.uploadingAvatar.set(false);
    this.toast.success('Profile photo updated.');
  }

  initials(): string {
    return this.profileForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  async saveProfile(): Promise<void> {
    this.saveSuccess.set(''); this.saveError.set('');
    if (!this.profileForm.name.trim()) { this.saveError.set('Name is required.'); return; }
    const ph = this.profileForm.phone.trim();
    if (ph && (!/^\+?[\d\s\-()]+$/.test(ph) || ph.replace(/\D/g, '').length < 7 || ph.replace(/\D/g, '').length > 15)) {
      this.saveError.set('Enter a valid phone number (7–15 digits, e.g. +971 50 123 4567).'); return;
    }
    this.saving.set(true);
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      const { error } = await this.sb.from('profiles').update({
        name:  this.profileForm.name.trim(),
        phone: this.profileForm.phone.trim() || null,
      }).eq('id', userId);
      if (error) { this.toast.error('Failed to save. Please try again.'); this.saving.set(false); return; }
    }
    await this.auth.refreshProfile();
    this.saving.set(false);
    this.toast.success('Profile updated successfully.');
  }

  async savePassword(): Promise<void> {
    this.saveSuccess.set(''); this.saveError.set('');
    if (this.passwordForm.newPw.length < 8) { this.saveError.set('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(this.passwordForm.newPw)) { this.saveError.set('Must contain one uppercase letter.'); return; }
    if (!/[0-9]/.test(this.passwordForm.newPw)) { this.saveError.set('Must contain one number.'); return; }
    if (this.passwordForm.newPw !== this.passwordForm.confirmPw) { this.saveError.set('Passwords do not match.'); return; }
    this.saving.set(true);
    const { error } = await this.sb.auth.updateUser({ password: this.passwordForm.newPw });
    this.saving.set(false);
    if (error) { this.toast.error('Failed to update password. Please try again.'); return; }
    this.toast.success('Password changed successfully.');
    this.passwordForm = { newPw: '', confirmPw: '' };
  }

  async removeAvatar(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    await this.sb.from('profiles').update({ avatar_url: null }).eq('id', userId);
    this.avatarUrl.set('');
    await this.auth.refreshProfile();
    this.toast.success('Profile photo removed.');
  }

  async deleteAccount(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.deleting.set(true);
    // Delete profile data then sign out — actual auth user deletion requires admin API
    await this.sb.from('profiles').delete().eq('id', userId);
    await this.auth.logout();
    this.deleting.set(false);
  }

  savePreferences(): void {
    try {
      localStorage.setItem(this.NOTIF_PREFS_KEY, JSON.stringify({
        roles:  this.selectedRoles,
        notifs: this.selectedNotifs,
      }));
    } catch {}
    this.prefsSaved.set(true);
    setTimeout(() => this.prefsSaved.set(false), 3000);
    this.toast.success('Notification preferences saved.');
  }
}
