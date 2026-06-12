import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as string[] | undefined) || [];

  if (allowedRoles.length === 0) {
    return true;
  }

  if (allowedRoles.some((role) => auth.hasRole(role))) {
    return true;
  }

  return router.createUrlTree(['/browse']);
};
