import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_URL } from '../tokens';
import { AuthService } from './auth.service';

/** Marca que esta petición ya pasó por reintento post-refresh (un solo replay). */
export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

function touchesApi(url: string, apiUrl: string): boolean {
  if (url.startsWith('http')) {
    try {
      return new URL(url).pathname.startsWith(apiUrl);
    } catch {
      return false;
    }
  }
  return url.startsWith(apiUrl);
}

function isAnonymousAuthPath(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiUrl = inject(API_URL);

  if (!touchesApi(req.url, apiUrl)) {
    return next(req);
  }

  let nextReq = req;
  const token = auth.accessTokenValue();
  if (token && !isAnonymousAuthPath(req.url)) {
    nextReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(nextReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (isAnonymousAuthPath(req.url)) {
        return throwError(() => err);
      }
      if (req.context.get(AUTH_RETRY)) {
        auth.forceLocalLogout();
        return throwError(() => err);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((newToken) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              context: req.context.set(AUTH_RETRY, true),
            }),
          ),
        ),
        catchError(() => auth.handleAuthError(err)),
      );
    }),
  );
};
