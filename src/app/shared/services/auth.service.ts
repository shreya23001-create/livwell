import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());
  userRole = computed(() => this._currentUser()?.role ?? null);

  isAdmin = computed(() =>
    this._currentUser()?.role === 'admin' || this._currentUser()?.role === 'super_admin'
  );
  isAgent = computed(() => this._currentUser()?.role === 'agent');
  isSuperAdmin = computed(() => this._currentUser()?.role === 'super_admin');

  constructor(private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('livwell_user');
    if (stored) {
      this._currentUser.set(JSON.parse(stored));
    }
  }

  login(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem('livwell_user', JSON.stringify(user));
    this.redirectByRole(user.role);
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('livwell_user');
    this.router.navigate(['/']);
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
      default:
        this.router.navigate(['/']);
    }
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return role ? roles.includes(role) : false;
  }
}
