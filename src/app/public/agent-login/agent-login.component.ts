import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';

type ForgotStep = 'email' | 'otp' | 'reset';

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

  // ── Forgot Password ──────────────────────────────────
  forgotMode  = signal(false);
  forgotStep  = signal<ForgotStep>('email');
  forgotEmail = signal('');
  forgotOtp   = signal('');
  private _generatedOtp = '';

  showNewPw     = signal(false);
  showConfirmPw = signal(false);
  newPassword   = signal('');
  confirmPassword = signal('');
  forgotError   = signal('');
  forgotSuccess = signal('');

  otpResendCountdown = signal(0);
  private _countdownTimer: ReturnType<typeof setInterval> | null = null;

  passwordStrength = computed(() => {
    const pw = this.newPassword();
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });
  strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

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
  }

  submit(): void {
    const errs: Record<string, string> = {};
    if (!this.form.email.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) errs['email'] = 'Enter a valid email.';
    if (!this.form.password) errs['password'] = 'Password is required.';
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    this.serverError.set('');
    this.attemptsLeft.set(null);

    setTimeout(() => {
      const result = this.auth.login(this.form.email, this.form.password);
      this.loading.set(false);

      if (result.success) {
        const user = this.auth.currentUser();
        if (user) this.auth.redirectByRole(user.role);
      } else {
        switch (result.error) {
          case 'invalid_credentials':
            if (result.attemptsLeft !== undefined && result.attemptsLeft <= 2) this.attemptsLeft.set(result.attemptsLeft);
            this.serverError.set('Invalid email or password.');
            break;
          case 'account_locked':
            this.serverError.set('Account locked after too many failed attempts. Try again in 30 minutes.');
            break;
          case 'account_suspended':
            this.serverError.set('Your account has been suspended. Please contact support.');
            break;
        }
      }
    }, 600);
  }

  clearError(field: string): void {
    this.errors.update(e => { const n = { ...e }; delete n[field]; return n; });
    this.serverError.set('');
  }

  openForgot(): void {
    this.forgotMode.set(true);
    this.forgotStep.set('email');
    this.forgotEmail.set('');
    this.forgotOtp.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.forgotError.set('');
    this.forgotSuccess.set('');
  }

  closeForgot(): void {
    this.forgotMode.set(false);
    this._clearCountdown();
  }

  submitForgotEmail(): void {
    const email = this.forgotEmail().trim();
    if (!email) { this.forgotError.set('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.forgotError.set('Enter a valid email address.'); return; }
    this.loading.set(true);
    this.forgotError.set('');
    setTimeout(() => {
      const exists = this.auth.requestPasswordReset(email);
      this.loading.set(false);
      if (!exists) { this.forgotError.set('No account found with that email address.'); return; }
      this._generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.info(`[Demo OTP for ${email}]: ${this._generatedOtp}`);
      this.forgotStep.set('otp');
      this._startCountdown(60);
    }, 700);
  }

  submitOtp(): void {
    const entered = this.forgotOtp().trim();
    if (!entered) { this.forgotError.set('Please enter the OTP code.'); return; }
    if (entered !== this._generatedOtp) { this.forgotError.set('Incorrect OTP. Please try again.'); return; }
    this.forgotError.set('');
    this.forgotStep.set('reset');
    this._clearCountdown();
  }

  resendOtp(): void {
    this._generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.info(`[Demo OTP resend for ${this.forgotEmail()}]: ${this._generatedOtp}`);
    this.forgotOtp.set('');
    this.forgotError.set('');
    this._startCountdown(60);
  }

  submitResetPassword(): void {
    const pw = this.newPassword();
    const confirm = this.confirmPassword();
    if (!pw) { this.forgotError.set('Please enter a new password.'); return; }
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
      this.forgotError.set('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (pw !== confirm) { this.forgotError.set('Passwords do not match.'); return; }
    this.loading.set(true);
    this.forgotError.set('');
    setTimeout(() => {
      this.auth.resetPassword(this.forgotEmail().trim(), pw);
      this.loading.set(false);
      this.forgotSuccess.set('Password reset successfully! You can now sign in with your new password.');
      this.form.password = '';
    }, 600);
  }

  private _startCountdown(seconds: number): void {
    this._clearCountdown();
    this.otpResendCountdown.set(seconds);
    this._countdownTimer = setInterval(() => {
      const current = this.otpResendCountdown();
      if (current <= 1) { this.otpResendCountdown.set(0); this._clearCountdown(); }
      else { this.otpResendCountdown.set(current - 1); }
    }, 1000);
  }

  private _clearCountdown(): void {
    if (this._countdownTimer) { clearInterval(this._countdownTimer); this._countdownTimer = null; }
  }
}
