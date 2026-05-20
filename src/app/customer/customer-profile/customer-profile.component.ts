import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

type Tab = 'profile' | 'security' | 'preferences';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss',
})
export class CustomerProfileComponent {
  activeTab = signal<Tab>('profile');

  profileForm = {
    name:        '',
    email:       '',
    phone:       '',
    nationality: '',
    budget:      '',
    lookingFor:  'buy',
  };

  passwordForm = {
    current:     '',
    newPw:       '',
    confirmPw:   '',
  };

  showCurrentPw = signal(false);
  showNewPw     = signal(false);
  showConfirmPw = signal(false);
  saveSuccess   = signal('');
  saveError     = signal('');

  preferences = {
    emailEnquiryReplies:  true,
    emailNewListings:     false,
    emailWeeklyDigest:    true,
    smsViewingReminders:  true,
    smsAgentMessages:     false,
  };

  constructor(public auth: AuthService) {
    const user = auth.currentUser();
    if (user) {
      this.profileForm.name  = user.name ?? '';
      this.profileForm.email = user.email ?? '';
      this.profileForm.phone = user.phone ?? '';
    }
  }

  initials(): string {
    return this.profileForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  saveProfile(): void {
    this.saveSuccess.set('');
    this.saveError.set('');
    if (!this.profileForm.name.trim() || !this.profileForm.email.trim()) {
      this.saveError.set('Name and email are required.');
      return;
    }
    // In production: call API
    this.saveSuccess.set('Profile updated successfully.');
    setTimeout(() => this.saveSuccess.set(''), 3000);
  }

  savePassword(): void {
    this.saveSuccess.set('');
    this.saveError.set('');
    if (!this.passwordForm.current) { this.saveError.set('Enter your current password.'); return; }
    if (this.passwordForm.newPw.length < 8) { this.saveError.set('New password must be at least 8 characters.'); return; }
    if (this.passwordForm.newPw !== this.passwordForm.confirmPw) { this.saveError.set('Passwords do not match.'); return; }
    this.saveSuccess.set('Password changed successfully.');
    this.passwordForm = { current: '', newPw: '', confirmPw: '' };
    setTimeout(() => this.saveSuccess.set(''), 3000);
  }

  savePreferences(): void {
    this.saveSuccess.set('Notification preferences saved.');
    setTimeout(() => this.saveSuccess.set(''), 3000);
  }
}
