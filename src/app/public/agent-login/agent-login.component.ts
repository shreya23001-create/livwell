import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

type ForgotStep = 'email' | 'sent' | 'reset';

@Component({
  selector: 'app-agent-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SocialLoginModule, GoogleSigninButtonModule],
  templateUrl: './agent-login.component.html',
  styleUrl: './agent-login.component.scss',
})
export class AgentLoginComponent {
  loading  = signal(false);
  showPw   = signal(false);

  form = { email: 'agent@livwell.ae', password: 'Agent@123', remember: false };
  errors       = signal<Record<string, string>>({});
  serverError  = signal('');
  attemptsLeft = signal<number | null>(null);

  private sb = inject(SupabaseService).client;

  // ── Forgot Password ──────────────────────────────────
  forgotMode    = signal(false);
  forgotStep    = signal<ForgotStep>('email');
  forgotEmail   = signal('');
  forgotError   = signal('');
  forgotSuccess = signal('');
  isRecoveryMode = signal(false);

  // Set new password fields (recovery mode)
  showNewPw       = signal(false);
  showConfirmPw   = signal(false);
  newPassword     = signal('');
  confirmPassword = signal('');

  constructor(private auth: AuthService, private socialAuth: SocialAuthService) {
    this.socialAuth.authState.subscribe((user: SocialUser | null) => {
      if (user) {
        this.auth.loginWithGoogle({
          name:     user.name     || user.email || 'Google User',
          email:    user.email    || '',
          photoUrl: user.photoUrl || undefined,
          role:     'agent',
        });
      }
    });

    // Detect Supabase password recovery redirect (hash contains type=recovery)
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      this.isRecoveryMode.set(true);
      this.forgotMode.set(true);
      this.forgotStep.set('reset');
    }
  }

  async submit(): Promise<void> {
    const errs: Record<string, string> = {};
    if (!this.form.email.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) errs['email'] = 'Enter a valid email.';
    if (!this.form.password) errs['password'] = 'Password is required.';
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    this.serverError.set('');
    this.attemptsLeft.set(null);

    const result = await this.auth.login(this.form.email, this.form.password);
    this.loading.set(false);

    if (result.success) {
      const user = this.auth.currentUser();
      if (user) this.auth.redirectByRole(user.role);
    } else {
      switch (result.error) {
        case 'invalid_credentials':
          this.serverError.set('Invalid email or password.');
          break;
        case 'account_locked':
          this.serverError.set('Your account has been locked by the admin. Please contact support to unlock it.');
          break;
        case 'account_suspended':
          this.serverError.set('Your account has been deactivated by the admin. Please contact support.');
          break;
        case 'pending_verification':
          this.serverError.set('Your account is pending approval. Please contact the admin.');
          break;
        default:
          this.serverError.set('Something went wrong. Please try again.');
      }
    }
  }

  clearError(field: string): void {
    this.errors.update(e => { const n = { ...e }; delete n[field]; return n; });
    this.serverError.set('');
  }

  openForgot(): void {
    this.forgotMode.set(true);
    this.forgotStep.set('email');
    this.forgotEmail.set('');
    this.forgotError.set('');
    this.forgotSuccess.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  closeForgot(): void {
    this.forgotMode.set(false);
    this.isRecoveryMode.set(false);
  }

  async submitForgotEmail(): Promise<void> {
    const email = this.forgotEmail().trim();
    if (!email) { this.forgotError.set('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.forgotError.set('Enter a valid email address.'); return; }
    this.loading.set(true);
    this.forgotError.set('');
    const sent = await this.auth.requestAgentPasswordReset(email);
    this.loading.set(false);
    if (!sent) { this.forgotError.set('Could not send reset email. Please try again.'); return; }
    this.forgotStep.set('sent');
  }

  async submitResetPassword(): Promise<void> {
    const pw      = this.newPassword();
    const confirm = this.confirmPassword();
    if (!pw) { this.forgotError.set('Please enter a new password.'); return; }
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
      this.forgotError.set('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (pw !== confirm) { this.forgotError.set('Passwords do not match.'); return; }
    this.loading.set(true);
    this.forgotError.set('');
    const { error } = await this.sb.auth.updateUser({ password: pw });
    this.loading.set(false);
    if (error) { this.forgotError.set('Failed to reset password. The link may have expired — please request a new one.'); return; }
    this.forgotSuccess.set('Password reset successfully! You can now sign in with your new password.');
    this.isRecoveryMode.set(false);
    this.forgotMode.set(false);
    this.forgotStep.set('email');
  }
}
