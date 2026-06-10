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
          <div class="cp-pw-input-wrap">
            <input [type]="showNew() ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPassword" placeholder="Min 8 chars, 1 uppercase, 1 number" required />
            <button type="button" class="cp-pw-toggle" (click)="showNew.update(v => !v)" tabindex="-1">
              <svg *ngIf="!showNew()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <svg *ngIf="showNew()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>
          </div>
        </div>
        <div class="cp-pw-field">
          <label>Confirm Password</label>
          <div class="cp-pw-input-wrap">
            <input [type]="showConfirm() ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required />
            <button type="button" class="cp-pw-toggle" (click)="showConfirm.update(v => !v)" tabindex="-1">
              <svg *ngIf="!showConfirm()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <svg *ngIf="showConfirm()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>
          </div>
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
    .cp-pw-field { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.85rem; font-weight: 600; color: #374151; } }
    .cp-pw-input-wrap { position: relative; display: flex; align-items: center;
      input { width: 100%; padding: 0.6rem 2.5rem 0.6rem 0.85rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem; outline: none; box-sizing: border-box; &:focus { border-color: #1a5c3a; } }
    }
    .cp-pw-toggle { position: absolute; right: 0.65rem; background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #9ca3af; &:hover { color: #374151; } svg { width: 1.1rem; height: 1.1rem; } }
    .cp-pw-btn { padding: 0.65rem; background: #1a5c3a; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; &:hover { background: #154d31; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .cp-pw-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
    .cp-pw-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  `]
})
export class CustomerChangePasswordComponent {
  private sb = inject(SupabaseService).client;
  newPassword     = '';
  confirmPassword = '';
  showNew     = signal(false);
  showConfirm = signal(false);
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
