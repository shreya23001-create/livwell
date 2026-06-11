import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

type Tab = 'profile' | 'password';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private sb   = inject(SupabaseService).client;

  activeTab = signal<Tab>('profile');
  loading   = signal(true);

  profile = { name: '', email: '', phone: '', photoUrl: '' };

  profileSaved  = signal(false);
  profileError  = signal('');
  profileErrors = signal<Record<string, string>>({});

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

  async ngOnInit(): Promise<void> {
    await this.auth.waitForSession();
    const user = this.auth.currentUser();
    if (user) {
      const { data } = await this.sb
        .from('profiles')
        .select('name, email, phone, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        this.profile.name     = data.name      ?? user.name  ?? '';
        this.profile.email    = data.email     ?? user.email ?? '';
        this.profile.phone    = data.phone     ?? user.phone ?? '';
        this.profile.photoUrl = data.avatar_url ?? '';
      } else {
        this.profile.name  = user.name  ?? '';
        this.profile.email = user.email ?? '';
        this.profile.phone = user.phone ?? '';
      }
    }
    this.loading.set(false);
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.profileSaved.set(false); this.profileError.set('');
    this.pwSaved.set(false);      this.pwError.set('');
  }

  onPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      this.profileError.set('Only JPG, PNG or WebP images allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { this.profileError.set('Image must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => { this.profile.photoUrl = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removePhoto(): void { this.profile.photoUrl = ''; }

  initials(): string {
    return this.profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'A';
  }

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

    if (error) { this.profileError.set('Failed to save: ' + error.message); return; }
    await this.auth.refreshProfile();
    this.profileSaved.set(true);
    setTimeout(() => this.profileSaved.set(false), 3000);
  }

  async changePassword(): Promise<void> {
    const errs: Record<string, string> = {};
    if (!this.pwForm.newPw)                               errs['newPw']  = 'New password is required.';
    else if (this.pwForm.newPw.length < 8)                errs['newPw']  = 'At least 8 characters.';
    else if (!/[A-Z]/.test(this.pwForm.newPw))            errs['newPw']  = 'Must contain one uppercase letter.';
    else if (!/[0-9]/.test(this.pwForm.newPw))            errs['newPw']  = 'Must contain one number.';
    if (!this.pwForm.confirm)                             errs['confirm'] = 'Please confirm your new password.';
    else if (this.pwForm.confirm !== this.pwForm.newPw)   errs['confirm'] = 'Passwords do not match.';
    this.pwErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.pwError.set('');
    const { error } = await this.sb.auth.updateUser({ password: this.pwForm.newPw });
    if (error) { this.pwError.set('Failed to update: ' + error.message); return; }
    this.pwForm = { newPw: '', confirm: '' };
    this.pwSaved.set(true);
    setTimeout(() => this.pwSaved.set(false), 3000);
  }

  clearErr(f: string): void { this.profileErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
  clearPwErr(f: string): void { this.pwErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
}
