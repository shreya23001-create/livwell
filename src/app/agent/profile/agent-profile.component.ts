import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

type Tab = 'profile' | 'password' | 'notifications';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-profile.component.html',
  styleUrl: './agent-profile.component.scss',
})
export class AgentProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  activeTab = signal<Tab>('profile');
  loading   = signal(true);

  // ── Profile fields ───────────────────────────────────
  profile = {
    name:        '',
    email:       '',
    phone:       '',
    designation: '',
    bio:         '',
    photoUrl:    '',
  };

  profileSaved  = signal(false);
  profileError  = signal('');
  profileErrors = signal<Record<string, string>>({});

  // ── Password fields ──────────────────────────────────
  pwForm        = { newPw: '', confirm: '' };
  showNewPw     = signal(false);
  showConfirmPw = signal(false);
  pwSaved       = signal(false);
  pwError       = signal('');
  pwErrors      = signal<Record<string, string>>({});

  passwordStrength = computed(() => {
    const p = this.pwForm.newPw;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });
  readonly strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  readonly strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  // ── Notification preferences (localStorage) ─────────
  notifications = {
    emailNewLead:       true,
    emailStatusChange:  true,
    emailViewingRemind: true,
    emailWeeklyDigest:  false,
    smsNewLead:         true,
    smsViewingRemind:   true,
    portalNewLead:      true,
    portalReminders:    true,
    portalAdminMsg:     true,
  };
  notifSaved = signal(false);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (user) {
      this.profile.name        = user.name  ?? '';
      this.profile.email       = user.email ?? '';
      this.profile.phone       = user.phone ?? '';
      this.profile.designation = '';
      this.profile.bio         = '';
      this.profile.photoUrl    = '';

      // fetch extended fields from profiles table
      const { data } = await this.sb
        .from('profiles')
        .select('name, email, phone, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        this.profile.name     = data.name     ?? this.profile.name;
        this.profile.email    = data.email    ?? this.profile.email;
        this.profile.phone    = data.phone    ?? this.profile.phone;
        this.profile.photoUrl = data.avatar_url ?? '';
      }
    }

    const saved = localStorage.getItem('agent_notif_prefs');
    if (saved) {
      try { Object.assign(this.notifications, JSON.parse(saved)); } catch { /* ignore */ }
    }
    this.loading.set(false);
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.profileSaved.set(false); this.profileError.set('');
    this.pwSaved.set(false);      this.pwError.set('');
    this.notifSaved.set(false);
  }

  onPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.profile.photoUrl = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removePhoto(): void { this.profile.photoUrl = ''; }

  async saveProfile(): Promise<void> {
    const errs: Record<string, string> = {};
    if (!this.profile.name.trim())  errs['name']  = 'Name is required.';
    if (!this.profile.phone.trim()) errs['phone'] = 'Phone is required.';
    else if (!/^\+?[0-9\s\-()\d]{7,15}$/.test(this.profile.phone)) errs['phone'] = 'Enter a valid phone number.';
    this.profileErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.profileError.set('');
    const user = this.auth.currentUser();
    if (!user?.id) return;

    const { error } = await this.sb.from('profiles').update({
      name:       this.profile.name.trim(),
      phone:      this.profile.phone.trim(),
      avatar_url: this.profile.photoUrl || null,
    }).eq('id', user.id);

    if (error) { this.profileError.set('Failed to save. Please try again.'); return; }
    this.profileSaved.set(true);
    setTimeout(() => this.profileSaved.set(false), 3000);
  }

  async changePassword(): Promise<void> {
    const errs: Record<string, string> = {};
    if (!this.pwForm.newPw)                          errs['newPw']  = 'New password is required.';
    else if (this.pwForm.newPw.length < 8)           errs['newPw']  = 'At least 8 characters.';
    else if (!/[A-Z]/.test(this.pwForm.newPw))       errs['newPw']  = 'Must contain one uppercase letter.';
    else if (!/[0-9]/.test(this.pwForm.newPw))       errs['newPw']  = 'Must contain one number.';
    if (!this.pwForm.confirm)                        errs['confirm'] = 'Please confirm your new password.';
    else if (this.pwForm.confirm !== this.pwForm.newPw) errs['confirm'] = 'Passwords do not match.';
    this.pwErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.pwError.set('');
    const { error } = await this.sb.auth.updateUser({ password: this.pwForm.newPw });
    if (error) { this.pwError.set('Failed to update password. Please try again.'); return; }
    this.pwForm = { newPw: '', confirm: '' };
    this.pwSaved.set(true);
    setTimeout(() => this.pwSaved.set(false), 3000);
  }

  saveNotifications(): void {
    localStorage.setItem('agent_notif_prefs', JSON.stringify(this.notifications));
    this.notifSaved.set(true);
    setTimeout(() => this.notifSaved.set(false), 3000);
  }

  clearProfileError(f: string): void { this.profileErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
  clearPwError(f: string): void      { this.pwErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
}
