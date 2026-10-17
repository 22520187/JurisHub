import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If unauthorized (401) or forbidden (403), and not login/register/logout request
      if (
        (error.status === 401 || error.status === 403) &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/logout')
      ) {
        authService.handleSessionExpired();
      }

      return throwError(() => error);
    })
  );
};
