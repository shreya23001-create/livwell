import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';

@Component({
  selector: 'app-customer-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cp-pw-wrap">
      <h2 class="cp-pw-title">Change Your Password</h2>
      @if (success()) {
        <div class="cp-pw-success">Password changed successfully.</div>
      }
      @if (error()) {
        <div class="cp-pw-error">{{ error() }}</div>
      }
      <form class="cp-pw-form" (ngSubmit)="submit()">
        <div class="cp-pw-field">
          <label>New Password</label>
          <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="Min 8 chars, 1 uppercase, 1 number" required />
        </div>
        <div class="cp-pw-field">
          <label>Confirm Password</label>
          <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required />
        </div>
        <button type="submit" class="cp-pw-btn" [disabled]="loading()">
          {{ loading() ? 'Updating…' : 'Update Password' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .cp-pw-wrap { max-width: 480px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; }
    .cp-pw-title { font-size: 1.2rem; font-weight: 700; color: #111827; margin: 0 0 1.5rem; }
    .cp-pw-form { display: flex; flex-direction: column; gap: 1rem; }
    .cp-pw-field { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.85rem; font-weight: 600; color: #374151; } input { padding: 0.6rem 0.85rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem; outline: none; &:focus { border-color: #1a5c3a; } } }
    .cp-pw-btn { padding: 0.65rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; &:hover { background: #154d31; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .cp-pw-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
    .cp-pw-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  `]
})
export class CustomerChangePasswordComponent {
  private sb = inject(SupabaseService).client;
  newPassword     = '';
  confirmPassword = '';
  success = signal(false);
  loading = signal(false);
  error   = signal('');

  async submit(): Promise<void> {
    this.success.set(false);
    this.error.set('');
    if (this.newPassword.length < 8)              { this.error.set('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(this.newPassword))           { this.error.set('Must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(this.newPassword))           { this.error.set('Must contain at least one number.'); return; }
    if (this.newPassword !== this.confirmPassword) { this.error.set('Passwords do not match.'); return; }
    this.loading.set(true);
    const { error } = await this.sb.auth.updateUser({ password: this.newPassword });
    this.loading.set(false);
    if (error) { this.error.set('Failed to update password. Please try again.'); return; }
    this.success.set(true);
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
