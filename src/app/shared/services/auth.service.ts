import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';

// SocialUser shape — only the fields we use, avoids importing SocialAuthService here
interface GoogleUser { name: string; email: string; photoUrl?: string; role?: UserRole; }

export interface LoginResult {
  success: boolean;
  error?: 'invalid_credentials' | 'account_locked' | 'account_suspended' | 'pending_verification';
  attemptsLeft?: number;
  lockedUntil?: Date;
}

export interface RegisterResult {
  success: boolean;
  error?: 'email_exists' | 'phone_exists';
}

// Demo accounts simulating a backend store
const DEMO_ACCOUNTS: (User & { password: string })[] = [
  { id: 1, name: 'Super Admin', email: 'superadmin@livwell.ae', phone: '+971501111111', role: 'super_admin', status: 'active', password: 'Admin@123' },
  { id: 2, name: 'Admin User',  email: 'admin@livwell.ae',      phone: '+971502222222', role: 'admin',       status: 'active', password: 'Admin@123' },
  { id: 3, name: 'Sarah Al-Mansouri', email: 'agent@livwell.ae', phone: '+971503333333', role: 'agent',      status: 'active', password: 'Agent@123', firstLogin: false },
  { id: 4, name: 'Demo Customer',     email: 'customer@livwell.ae', phone: '+971504444444', role: 'customer', status: 'active', password: 'Customer@123' },
];

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 30 * 60 * 1000; // 30 min

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);

  currentUser  = this._currentUser.asReadonly();
  isLoggedIn   = computed(() => !!this._currentUser());
  userRole     = computed(() => this._currentUser()?.role ?? null);
  isAdmin      = computed(() => ['admin', 'super_admin'].includes(this._currentUser()?.role ?? ''));
  isAgent      = computed(() => this._currentUser()?.role === 'agent');
  isSuperAdmin = computed(() => this._currentUser()?.role === 'super_admin');
  isCustomer   = computed(() => this._currentUser()?.role === 'customer');

  private _failedAttempts: Record<string, { count: number; lockedUntil?: Date }> = {};
  private _customers: (User & { password: string })[] = [];

  constructor(private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('livwell_user');
    if (stored) {
      this._currentUser.set(JSON.parse(stored));
    }
    const customers = localStorage.getItem('livwell_customers');
    if (customers) {
      this._customers = JSON.parse(customers);
    }
  }

  private saveCustomers(): void {
    localStorage.setItem('livwell_customers', JSON.stringify(this._customers));
  }

  // ── LOGIN ────────────────────────────────────────────
  login(email: string, password: string): LoginResult {
    const key = email.toLowerCase().trim();

    // Check lockout
    const lockState = this._failedAttempts[key];
    if (lockState?.lockedUntil && new Date() < lockState.lockedUntil) {
      return { success: false, error: 'account_locked', lockedUntil: lockState.lockedUntil };
    }

    // Find account (demo + registered customers)
    const allAccounts = [...DEMO_ACCOUNTS, ...this._customers];
    const account = allAccounts.find(a => a.email.toLowerCase() === key);

    if (!account || account.password !== password) {
      // Increment failed attempts
      const current = this._failedAttempts[key] ?? { count: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        current.count = 0;
      }
      this._failedAttempts[key] = current;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - current.count);
      return { success: false, error: 'invalid_credentials', attemptsLeft };
    }

    // Check status
    if (account.status === 'locked') {
      return { success: false, error: 'account_locked' };
    }
    if (account.status === 'suspended') {
      return { success: false, error: 'account_suspended' };
    }
    if (account.status === 'pending_verification') {
      return { success: false, error: 'pending_verification' };
    }

    // Reset failed attempts on success
    delete this._failedAttempts[key];

    const { password: _pw, ...user } = account;
    this._currentUser.set(user);
    localStorage.setItem('livwell_user', JSON.stringify(user));
    return { success: true };
  }

  // ── REGISTER (Customer only) ─────────────────────────
  register(name: string, email: string, phone: string, password: string): RegisterResult {
    const key = email.toLowerCase().trim();
    const allAccounts = [...DEMO_ACCOUNTS, ...this._customers];

    if (allAccounts.some(a => a.email.toLowerCase() === key)) {
      return { success: false, error: 'email_exists' };
    }

    const newCustomer: User & { password: string } = {
      id: Date.now(),
      name: name.trim(),
      email: key,
      phone: phone.trim(),
      role: 'customer',
      status: 'active', // skipping email verification for demo
      password,
    };
    this._customers.push(newCustomer);
    this.saveCustomers();

    const { password: _pw, ...user } = newCustomer;
    this._currentUser.set(user);
    localStorage.setItem('livwell_user', JSON.stringify(user));
    return { success: true };
  }

  // ── LOGIN WITH USER OBJECT (legacy / direct use) ─────
  loginDirect(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem('livwell_user', JSON.stringify(user));
    this.redirectByRole(user.role);
  }

  logout(): void {
    const role = this._currentUser()?.role;
    this._currentUser.set(null);
    localStorage.removeItem('livwell_user');
    if (role === 'admin' || role === 'super_admin') {
      this.router.navigate(['/admin/login']);
    } else if (role === 'agent') {
      this.router.navigate(['/agent/login']);
    } else {
      this.router.navigate(['/customer']);
    }
  }

  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'super_admin':
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'agent':
        this.router.navigate(['/agent/dashboard']);
        break;
      case 'customer':
        this.router.navigate(['/my/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  // ── GOOGLE LOGIN ─────────────────────────────────────
  loginWithGoogle(googleUser: GoogleUser): void {
    const role = googleUser.role ?? 'customer';
    const user: User = {
      id:     Date.now(),
      name:   googleUser.name || googleUser.email || 'Google User',
      email:  googleUser.email || '',
      avatar: googleUser.photoUrl ?? undefined,
      role,
      status: 'active',
    };
    this._currentUser.set(user);
    localStorage.setItem('livwell_user', JSON.stringify(user));
    this.redirectByRole(role);
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  isLocked(email: string): boolean {
    const state = this._failedAttempts[email.toLowerCase()];
    return !!(state?.lockedUntil && new Date() < state.lockedUntil);
  }
}
