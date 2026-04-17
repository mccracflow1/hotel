import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { UserRole } from './auth.models';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as UserRole[] | undefined;
  const role = auth.user()?.role;
  if (!role || !allowed?.length) {
    return router.parseUrl('/admin/forbidden');
  }
  if (allowed.includes(role)) {
    return true;
  }
  return router.parseUrl('/admin/forbidden');
};
