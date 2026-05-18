import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard = (roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (roles.length && !auth.hasRole(roles)) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
};

export const adminGuard: CanActivateFn = authGuard(['admin', 'super_admin']);
export const agentGuard: CanActivateFn = authGuard(['agent', 'admin', 'super_admin']);
export const superAdminGuard: CanActivateFn = authGuard(['super_admin']);
