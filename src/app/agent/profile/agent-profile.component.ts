import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

type Tab = 'profile' | 'password' | 'notifications';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-profile.component.html',
  styleUrl: './agent-profile.component.scss',
})
export class AgentProfileComponent {
  private auth = inject(AuthService);

  activeTab = signal<Tab>('profile');

  // ── Profile fields ───────────────────────────────────
  profile = {
    name:           'Sarah Al-Mansouri',
    email:          'agent@livwell.ae',
    phone:          '+971503333333',
    whatsapp:       '+971503333333',
    designation:    'Senior Sales Agent',
    specialization: 'Residential & Off-Plan',
    languages:      'English, Arabic',
    bio:            'Experienced real estate professional with 7+ years in Dubai\'s luxury residential and off-plan market. Specializing in Palm Jumeirah, Downtown Dubai, and Dubai Hills Estate.',
    areas:          'Palm Jumeirah, Downtown Dubai, Dubai Hills',
    photoUrl:       '',
  };

  profileSaved   = signal(false);
  profileError   = signal('');
  profileErrors  = signal<Record<string, string>>({});

  // ── Password fields ──────────────────────────────────
  pwForm = { current: '', newPw: '', confirm: '' };
  showCurrentPw = signal(false);
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

  // ── Notification preferences ─────────────────────────
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

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.profileSaved.set(false);  this.profileError.set('');
    this.pwSaved.set(false);       this.pwError.set('');
    this.notifSaved.set(false);
  }

  // ── Photo upload (demo) ──────────────────────────────
  onPhotoChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.profile.photoUrl = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removePhoto() { this.profile.photoUrl = ''; }

  // ── Save profile ─────────────────────────────────────
  saveProfile() {
    const errs: Record<string, string> = {};
    if (!this.profile.name.trim())  errs['name']  = 'Name is required.';
    if (!this.profile.phone.trim()) errs['phone'] = 'Phone is required.';
    else if (!/^\+?[0-9\s\-()\d]{7,15}$/.test(this.profile.phone)) errs['phone'] = 'Enter a valid phone number.';
    this.profileErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.profileError.set('');
    this.profileSaved.set(true);
    setTimeout(() => this.profileSaved.set(false), 3000);
  }

  // ── Change password ──────────────────────────────────
  changePassword() {
    const errs: Record<string, string> = {};
    if (!this.pwForm.current) errs['current'] = 'Current password is required.';
    else if (this.pwForm.current !== 'Agent@123') errs['current'] = 'Current password is incorrect.';

    if (!this.pwForm.newPw) errs['newPw'] = 'New password is required.';
    else if (this.pwForm.newPw.length < 8)         errs['newPw'] = 'At least 8 characters.';
    else if (!/[A-Z]/.test(this.pwForm.newPw))     errs['newPw'] = 'Must contain one uppercase letter.';
    else if (!/[0-9]/.test(this.pwForm.newPw))     errs['newPw'] = 'Must contain one number.';

    if (!this.pwForm.confirm) errs['confirm'] = 'Please confirm your new password.';
    else if (this.pwForm.confirm !== this.pwForm.newPw) errs['confirm'] = 'Passwords do not match.';

    this.pwErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.pwError.set('');
    this.pwForm = { current: '', newPw: '', confirm: '' };
    this.pwSaved.set(true);
    setTimeout(() => this.pwSaved.set(false), 3000);
  }

  // ── Save notifications ───────────────────────────────
  saveNotifications() {
    this.notifSaved.set(true);
    setTimeout(() => this.notifSaved.set(false), 3000);
  }

  clearProfileError(f: string) { this.profileErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
  clearPwError(f: string)      { this.pwErrors.update(e => { const n = {...e}; delete n[f]; return n; }); }
}
