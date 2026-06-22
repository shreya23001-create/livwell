import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';
import { EmailService } from '../../shared/services/email.service';

type Tab = 'signin' | 'signup';
type ForgotStep = 'email' | 'otp' | 'reset';

@Component({
  selector: 'app-customer-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SocialLoginModule, GoogleSigninButtonModule],
  templateUrl: './customer-auth.component.html',
  styleUrl: './customer-auth.component.scss',
})
export class CustomerAuthComponent {

  activeTab = signal<Tab>('signin');
  loading   = signal(false);
  showSignInPw  = signal(false);
  showSignUpPw  = signal(false);
  showConfirmPw = signal(false);

  // Sign In
  signInForm = { email: '', password: '', remember: false };
  signInErrors      = signal<Record<string, string>>({});
  signInServerError = signal('');
  attemptsLeft      = signal<number | null>(null);

  // Sign Up
  signUpForm = { name: '', email: '', phone: '', password: '', confirmPassword: '', agreePolicy: false };
  signUpErrors      = signal<Record<string, string>>({});
  signUpServerError = signal('');

  passwordStrength = computed(() => {
    const p = this.signUpForm.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });

  readonly strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  readonly strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'];

  googleError = signal('');

  // ── Forgot Password ──────────────────────────────────
  forgotMode  = signal(false);
  forgotStep  = signal<ForgotStep>('email');
  forgotEmail = signal('');
  forgotOtp   = signal('');
  private _generatedOtp = '';

  showFpNewPw     = signal(false);
  showFpConfirmPw = signal(false);
  fpNewPassword   = signal('');
  fpConfirmPassword = signal('');
  forgotError   = signal('');
  forgotSuccess = signal('');

  otpResendCountdown = signal(0);
  private _countdownTimer: ReturnType<typeof setInterval> | null = null;

  fpPasswordStrength = computed(() => {
    const pw = this.fpNewPassword();
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });

  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  constructor(private auth: AuthService, private socialAuth: SocialAuthService, private emailSvc: EmailService) {
    this.socialAuth.authState.subscribe((user: SocialUser | null) => {
      if (user) {
        this.auth.loginWithGoogle({
          name:     user.name     || user.email || 'Google User',
          email:    user.email    || '',
          photoUrl: user.photoUrl || undefined,
        });
      }
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.signInErrors.set({});      this.signInServerError.set('');
    this.signUpErrors.set({});      this.signUpServerError.set('');
    this.attemptsLeft.set(null);
  }

  async submitSignIn(): Promise<void> {
    const errs: Record<string, string> = {};
    const { email, password } = this.signInForm;
    if (!email.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs['email'] = 'Enter a valid email.';
    if (!password) errs['password'] = 'Password is required.';
    this.signInErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    this.signInServerError.set('');
    this.attemptsLeft.set(null);

    const result = await this.auth.login(this.signInForm.email, this.signInForm.password);
    this.loading.set(false);

    if (result.success) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl) { this.router.navigateByUrl(returnUrl); return; }
      const user = this.auth.currentUser();
      if (user) this.auth.redirectByRole(user.role);
    } else {
      switch (result.error) {
        case 'invalid_credentials':
          this.signInServerError.set('Invalid email or password.');
          break;
        case 'account_locked':
          this.signInServerError.set('Account locked. Try again later.');
          break;
        case 'account_suspended':
          this.signInServerError.set('Your account has been suspended. Please contact support.');
          break;
        case 'pending_verification':
          this.signInServerError.set('Please verify your email before signing in.');
          break;
        default:
          this.signInServerError.set('Something went wrong. Please try again.');
      }
    }
  }

  async submitSignUp(): Promise<void> {
    const errs: Record<string, string> = {};
    const { name, email, phone, password, confirmPassword, agreePolicy } = this.signUpForm;

    if (!name.trim()) errs['name'] = 'Full name is required.';
    else if (name.trim().length < 2) errs['name'] = 'Name must be at least 2 characters.';

    if (!email.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs['email'] = 'Enter a valid email.';

    if (!phone.trim()) errs['phone'] = 'Phone number is required.';
    else if (!/^\+?[\d\s\-()]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) errs['phone'] = 'Enter a valid phone number (7–15 digits).';

    if (!password) errs['password'] = 'Password is required.';
    else if (password.length < 8) errs['password'] = 'At least 8 characters.';
    else if (!/[A-Z]/.test(password)) errs['password'] = 'Must contain one uppercase letter.';
    else if (!/[0-9]/.test(password)) errs['password'] = 'Must contain one number.';

    if (!confirmPassword) errs['confirmPassword'] = 'Please confirm your password.';
    else if (confirmPassword !== password) errs['confirmPassword'] = 'Passwords do not match.';

    if (!agreePolicy) errs['agreePolicy'] = 'You must agree to the Privacy Policy.';

    this.signUpErrors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    this.signUpServerError.set('');

    const result = await this.auth.register(name, email, phone, password);
    this.loading.set(false);

    if (result.success) {
      this.emailSvc.send('signup_welcome', {
        to_email: email.trim(),
        name:     name.trim(),
        email:    email.trim(),
      });
      const user = this.auth.currentUser();
      if (user) this.auth.redirectByRole(user.role);
    } else if (result.error === 'email_exists') {
      this.signUpErrors.update(e => ({ ...e, email: 'An account with this email already exists.' }));
    } else if (result.error === 'pending_verification') {
      this.signUpServerError.set('Account created! Please check your email and click the confirmation link to activate your account.');
    } else {
      this.signUpServerError.set('Something went wrong. Please try again.');
    }
  }

  clearSignInError(field: string): void {
    this.signInErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
    this.signInServerError.set('');
  }

  clearSignUpError(field: string): void {
    this.signUpErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }

  // ── Forgot password steps ────────────────────────────
  openForgot(): void {
    this.forgotMode.set(true);
    this.forgotStep.set('email');
    this.forgotEmail.set('');
    this.forgotOtp.set('');
    this.fpNewPassword.set('');
    this.fpConfirmPassword.set('');
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
    const pw = this.fpNewPassword();
    const confirm = this.fpConfirmPassword();
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
      this.signInForm.password = '';
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
