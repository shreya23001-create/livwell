import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialLoginModule, GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../shared/services/auth.service';

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

  // Pre-fill with agent demo credentials
  form = { email: 'agent@livwell.ae', password: 'Agent@123', remember: false };
  errors       = signal<Record<string, string>>({});
  serverError  = signal('');
  attemptsLeft = signal<number | null>(null);

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
}
