import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard = (roles: UserRole[], loginUrl: string): CanActivateFn => {
  return async (): Promise<boolean | UrlTree> => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    await auth.waitForSession();

    if (!auth.isLoggedIn()) {
      return router.createUrlTree([loginUrl]);
    }

    if (roles.length && !auth.hasRole(roles)) {
      return router.createUrlTree(['/']);
    }

    return true;
  };
};

export const adminGuard: CanActivateFn      = authGuard(['admin', 'super_admin'], '/admin/login');
export const agentGuard: CanActivateFn      = authGuard(['agent', 'admin', 'super_admin'], '/agent/login');
export const superAdminGuard: CanActivateFn = authGuard(['super_admin'], '/admin/login');
export const customerGuard: CanActivateFn   = authGuard(['customer', 'admin', 'super_admin', 'agent'], '/customer');
