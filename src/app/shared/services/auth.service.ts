import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, UserRole } from '../models/user.model';

export interface LoginResult {
  success: boolean;
  error?: 'invalid_credentials' | 'account_locked' | 'account_suspended' | 'pending_verification' | 'unknown';
  attemptsLeft?: number;
  lockedUntil?: Date;
}

export interface RegisterResult {
  success: boolean;
  error?: 'email_exists' | 'phone_exists' | 'pending_verification' | 'unknown';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router   = inject(Router);

  private _currentUser  = signal<User | null>(null);
  private _sessionReady = false;
  private _sessionPromise: Promise<void> | null = null;

  currentUser  = this._currentUser.asReadonly();
  isLoggedIn   = computed(() => !!this._currentUser());
  userRole     = computed(() => this._currentUser()?.role ?? null);
  isAdmin      = computed(() => ['admin', 'super_admin'].includes(this._currentUser()?.role ?? ''));
  isAgent      = computed(() => this._currentUser()?.role === 'agent');
  isSuperAdmin = computed(() => this._currentUser()?.role === 'super_admin');
  isCustomer   = computed(() => this._currentUser()?.role === 'customer');

  constructor() {
    this._sessionPromise = this.loadSession();
  }

  // Guards call this to wait for session restore before checking isLoggedIn
  waitForSession(): Promise<void> {
    return this._sessionPromise ?? Promise.resolve();
  }

  private async loadSession(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) await this.loadProfile(session.user.id);
    this._sessionReady = true;

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) await this.loadProfile(session.user.id);
      else this._currentUser.set(null);
    });
  }

  private async loadProfile(userId: string, retries = 3): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      this._currentUser.set({
        id:     data.id,
        name:   data.name,
        email:  data.email,
        phone:  data.phone,
        role:   data.role as UserRole,
        status: data.status,
        avatar: data.avatar_url,
      });
    } else if (error?.code === 'PGRST116' && retries > 0) {
      // Profile not created yet by trigger — wait and retry
      await new Promise(r => setTimeout(r, 800));
      await this.loadProfile(userId, retries - 1);
    }
  }

  // ── LOGIN ────────────────────────────────────────────────
  async login(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid')) return { success: false, error: 'invalid_credentials' };
      return { success: false, error: 'unknown' };
    }
    if (data.user) {
      await this.loadProfile(data.user.id);
      return { success: true };
    }
    return { success: false, error: 'unknown' };
  }

  // ── REGISTER ─────────────────────────────────────────────
  async register(name: string, email: string, phone: string, password: string): Promise<RegisterResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, role: 'customer' } }
    });
    if (error) {
      if (error.message.toLowerCase().includes('already')) return { success: false, error: 'email_exists' };
      return { success: false, error: 'unknown' };
    }
    if (data.user) {
      // If session exists immediately — email confirmation is disabled
      if (data.session) {
        await this.loadProfile(data.user.id);
        this._newlyRegistered.set({ name, email });
        return { success: true };
      }
      // Fallback: try explicit login (works when email confirmation is off)
      const loginResult = await this.supabase.auth.signInWithPassword({ email, password });
      if (loginResult.data.user) {
        await this.loadProfile(loginResult.data.user.id);
        this._newlyRegistered.set({ name, email });
        return { success: true };
      }
      // Email confirmation still on — account created but needs verification
      return { success: false, error: 'pending_verification' };
    }
    return { success: false, error: 'unknown' };
  }

  // Track newly registered user for welcome screen
  private _newlyRegistered = signal<{ name: string; email: string } | null>(null);
  newlyRegistered = this._newlyRegistered.asReadonly();
  clearNewlyRegistered(): void { this._newlyRegistered.set(null); }

  // ── LOGOUT ───────────────────────────────────────────────
  async logout(): Promise<void> {
    const role = this._currentUser()?.role;
    await this.supabase.auth.signOut();
    this._currentUser.set(null);
    if (role === 'admin' || role === 'super_admin') this.router.navigate(['/admin/login']);
    else if (role === 'agent') this.router.navigate(['/agent/login']);
    else this.router.navigate(['/customer']);
  }

  // ── PASSWORD ─────────────────────────────────────────────
  async requestPasswordReset(email: string): Promise<boolean> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/customer?reset=true`
    });
    return !error;
  }

  resetPassword(_email: string, newPassword: string): boolean {
    this.supabase.auth.updateUser({ password: newPassword });
    return true;
  }

  redirectByRole(role: UserRole): void {
    switch (role) {
      case 'super_admin':
      case 'admin':    this.router.navigate(['/admin/dashboard']); break;
      case 'agent':    this.router.navigate(['/agent/dashboard']); break;
      case 'customer': this.router.navigate(['/my/dashboard']); break;
      default:         this.router.navigate(['/']); break;
    }
  }

  loginWithGoogle(googleUser: { name: string; email: string; photoUrl?: string; role?: string }): void {
    // Google OAuth handled by Supabase — this is a fallback for the social auth library
    this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  loginDirect(user: User): void {
    this._currentUser.set(user);
    this.redirectByRole(user.role);
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  isLocked(_email: string): boolean { return false; }
}
