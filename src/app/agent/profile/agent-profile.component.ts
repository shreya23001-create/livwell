import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ToastService } from '../../shared/services/toast.service';

type Tab = 'profile' | 'password' | 'notifications';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [PhoneInputComponent, CommonModule, FormsModule],
  templateUrl: './agent-profile.component.html',
  styleUrl: './agent-profile.component.scss',
})
export class AgentProfileComponent implements OnInit {
  private auth  = inject(AuthService);
  private sb    = inject(SupabaseService).client;
  private toast = inject(ToastService);

  activeTab = signal<Tab>('profile');
  loading   = signal(true);

  // ── Profile fields ───────────────────────────────────
  profile = signal({
    name:        '',
    email:       '',
    phone:       '',
    designation: '',
    bio:         '',
    photoUrl:    '',
  });

  profileSaved  = signal(false);
  profileError  = signal('');
  profileErrors = signal<Record<string, string>>({});

  // ── Password reset ───────────────────────────────────
  pwResetSent   = signal(false);
  pwResetError  = signal('');

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

    // waitForSession can resolve while the profile row is still being fetched
    // (race between auth.getSession() and profiles SELECT). Retry up to 3s.
    let user = this.auth.currentUser();
    if (!user) {
      for (let i = 0; i < 6 && !user; i++) {
        await new Promise(r => setTimeout(r, 500));
        user = this.auth.currentUser();
      }
    }

    if (user) {
      this.profile.set({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '', designation: '', bio: '', photoUrl: '' });

      const { data } = await this.sb
        .from('profiles')
        .select('name, email, phone, avatar_url, bio, designation')
        .eq('id', user.id)
        .single();
      if (data) {
        const av = data.avatar_url ?? '';
        this.profile.set({
          name:        data.name        ?? user.name  ?? '',
          email:       data.email       ?? user.email ?? '',
          phone:       data.phone       ?? user.phone ?? '',
          photoUrl:    (av && !av.startsWith('data:') && /\/avatars\/[^/]+/.test(av)) ? av : '',
          bio:         data.bio         ?? '',
          designation: data.designation ?? '',
        });
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
    this.pwResetSent.set(false);  this.pwResetError.set('');
    this.notifSaved.set(false);
  }

  uploadingPhoto = signal(false);
  photoError     = signal('');

  async onPhotoChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { this.photoError.set('Only JPG, PNG, WebP or GIF allowed.'); return; }
    if (file.size > 5 * 1024 * 1024)  { this.photoError.set('Image must be under 5 MB.'); return; }
    this.photoError.set('');
    this.uploadingPhoto.set(true);
    const user = this.auth.currentUser();
    if (!user?.id) { this.uploadingPhoto.set(false); return; }
    const ext  = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await this.sb.storage.from('imagesFolder').upload(path, file, { upsert: true });
    if (upErr) { this.photoError.set('Upload failed: ' + upErr.message); this.toast.error('Photo upload failed.'); this.uploadingPhoto.set(false); return; }
    const { data } = this.sb.storage.from('imagesFolder').getPublicUrl(path);
    this.profile.update(p => ({ ...p, photoUrl: data.publicUrl + '?t=' + Date.now() }));
    this.uploadingPhoto.set(false);
    this.toast.success('Photo uploaded. Save changes to apply.');
  }

  async removePhoto(): Promise<void> { this.profile.update(p => ({ ...p, photoUrl: '' })); }

  async saveProfile(): Promise<void> {
    const p = this.profile();
    const errs: Record<string, string> = {};
    if (!p.name.trim())  errs['name']  = 'Name is required.';
    if (!p.phone.trim()) errs['phone'] = 'Phone is required.';
    else if (!/^\+?[\d\s\-()]+$/.test(p.phone) || (p.phone.replace(/\D/g, '').length < 7 || p.phone.replace(/\D/g, '').length > 15)) errs['phone'] = 'Enter a valid phone number (7–15 digits).';
    this.profileErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.profileError.set('');
    const user = this.auth.currentUser();
    if (!user?.id) return;

    const { error } = await this.sb.from('profiles').update({
      name:        p.name.trim(),
      phone:       p.phone.trim(),
      avatar_url:  p.photoUrl || null,
      bio:         p.bio.trim() || null,
      designation: p.designation.trim() || null,
    }).eq('id', user.id);

    if (error) { this.toast.error('Failed to save: ' + error.message); return; }
    await this.auth.refreshProfile();
    this.toast.success('Profile updated successfully.');
  }

  async sendPasswordResetEmail(): Promise<void> {
    const email = this.profile().email;
    if (!email) { this.pwResetError.set('No email address found for your account.'); return; }
    this.pwResetError.set('');
    const { error } = await this.sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/agent/login?reset=true`,
    });
    if (error) { this.pwResetError.set('Failed to send reset email. Please try again.'); return; }
    this.pwResetSent.set(true);
  }

  saveNotifications(): void {
    localStorage.setItem('agent_notif_prefs', JSON.stringify(this.notifications));
    this.notifSaved.set(true);
    setTimeout(() => this.notifSaved.set(false), 3000);
  }

  clearProfileError(f: string): void { this.profileErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
}
