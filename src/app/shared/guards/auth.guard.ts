import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard = (roles: UserRole[], loginUrl: string): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate([loginUrl]);
      return false;
    }

    if (roles.length && !auth.hasRole(roles)) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
};

export const adminGuard: CanActivateFn      = authGuard(['admin', 'super_admin'], '/admin/login');
export const agentGuard: CanActivateFn      = authGuard(['agent', 'admin', 'super_admin'], '/agent/login');
export const superAdminGuard: CanActivateFn = authGuard(['super_admin'], '/admin/login');
export const customerGuard: CanActivateFn   = authGuard(['customer'], '/customer');
