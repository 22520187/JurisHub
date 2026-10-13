import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  if (authService.isLoggedIn() && isAdmin) {
    return true;
  }

  // If user is not admin, redirect to home or login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
