import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthService, GoogleLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';

type Tab = 'signin' | 'signup';

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

  constructor(private auth: AuthService, private socialAuth: SocialAuthService) {
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

  submitSignIn(): void {
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

    setTimeout(() => {
      const result = this.auth.login(this.signInForm.email, this.signInForm.password);
      this.loading.set(false);

      if (result.success) {
        const user = this.auth.currentUser();
        if (user) this.auth.redirectByRole(user.role);
      } else {
        switch (result.error) {
          case 'invalid_credentials':
            if (result.attemptsLeft !== undefined && result.attemptsLeft <= 2) this.attemptsLeft.set(result.attemptsLeft);
            this.signInServerError.set('Invalid email or password.');
            break;
          case 'account_locked':
            this.signInServerError.set('Account locked after too many failed attempts. Try again in 30 minutes.');
            break;
          case 'account_suspended':
            this.signInServerError.set('Your account has been suspended. Please contact support.');
            break;
          case 'pending_verification':
            this.signInServerError.set('Please verify your email before signing in.');
            break;
        }
      }
    }, 600);
  }

  submitSignUp(): void {
    const errs: Record<string, string> = {};
    const { name, email, phone, password, confirmPassword, agreePolicy } = this.signUpForm;

    if (!name.trim()) errs['name'] = 'Full name is required.';
    else if (name.trim().length < 2) errs['name'] = 'Name must be at least 2 characters.';

    if (!email.trim()) errs['email'] = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs['email'] = 'Enter a valid email.';

    if (!phone.trim()) errs['phone'] = 'Phone number is required.';
    else if (!/^\+?[0-9\s\-()]{7,15}$/.test(phone)) errs['phone'] = 'Enter a valid phone (e.g. +971501234567).';

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

    setTimeout(() => {
      const result = this.auth.register(name, email, phone, password);
      this.loading.set(false);

      if (result.success) {
        const user = this.auth.currentUser();
        if (user) this.auth.redirectByRole(user.role);
      } else if (result.error === 'email_exists') {
        this.signUpErrors.update(e => ({ ...e, email: 'An account with this email already exists.' }));
      }
    }, 700);
  }

  clearSignInError(field: string): void {
    this.signInErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
    this.signInServerError.set('');
  }

  clearSignUpError(field: string): void {
    this.signUpErrors.update(e => { const n = { ...e }; delete n[field]; return n; });
  }
}
