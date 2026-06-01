import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

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
          <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="Enter new password" required minlength="6" />
        </div>
        <div class="cp-pw-field">
          <label>Confirm Password</label>
          <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required />
        </div>
        <button type="submit" class="cp-pw-btn">Update Password</button>
      </form>
    </div>
  `,
  styles: [`
    .cp-pw-wrap { max-width: 480px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; }
    .cp-pw-title { font-size: 1.2rem; font-weight: 700; color: #111827; margin: 0 0 1.5rem; }
    .cp-pw-form { display: flex; flex-direction: column; gap: 1rem; }
    .cp-pw-field { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.85rem; font-weight: 600; color: #374151; } input { padding: 0.6rem 0.85rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem; outline: none; &:focus { border-color: #1a5c3a; } } }
    .cp-pw-btn { padding: 0.65rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; &:hover { background: #154d31; } }
    .cp-pw-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
    .cp-pw-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  `]
})
export class CustomerChangePasswordComponent {
  private auth = inject(AuthService);
  newPassword = '';
  confirmPassword = '';
  success = signal(false);
  error = signal('');

  submit(): void {
    this.success.set(false);
    this.error.set('');
    if (this.newPassword.length < 6) { this.error.set('Password must be at least 6 characters.'); return; }
    if (this.newPassword !== this.confirmPassword) { this.error.set('Passwords do not match.'); return; }
    const email = this.auth.currentUser()?.email ?? '';
    this.auth.resetPassword(email, this.newPassword);
    this.success.set(true);
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
