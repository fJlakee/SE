import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const apiBaseUrl = 'http://localhost:8080';
const authEndpoints = [`${apiBaseUrl}/auth/signin`, `${apiBaseUrl}/auth/signup`];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authorization = auth.authorizationHeader();
  const isApiRequest = request.url.startsWith(apiBaseUrl);
  const isAuthRequest = authEndpoints.some((url) => request.url.startsWith(url));

  const authorizedRequest = authorization && isApiRequest
    ? request.clone({
        setHeaders: {
          Authorization: authorization,
        },
      })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (isApiRequest && !isAuthRequest && shouldInvalidateSession(error)) {
        auth.logout();
        router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' },
        });
      }

      return throwError(() => error);
    })
  );
};

function shouldInvalidateSession(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  return extractErrorText(error).toLowerCase().includes('user not found');
}

function extractErrorText(error: HttpErrorResponse): string {
  if (typeof error.error === 'string') {
    return error.error;
  }

  if (error.error && typeof error.error === 'object') {
    const body = error.error as Record<string, unknown>;
    return [body['message'], body['error'], body['detail']]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }

  return error.message || '';
}
