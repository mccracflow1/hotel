import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { API_URL } from '../tokens';
import type { AuthUser, LoginRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly router = inject(Router);

  private readonly accessToken = signal<string | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessToken());

  private refreshInFlight: Observable<string> | null = null;

  accessTokenValue(): string | null {
    return this.accessToken();
  }

  login(body: LoginRequest): Observable<void> {
    return this.http
      .post<{ accessToken: string; user: AuthUser; expiresIn: number }>(`${this.apiUrl}/auth/login`, body, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
          this.userSignal.set(res.user);
        }),
        map(() => undefined),
      );
  }

  logout(): Observable<void> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true, observe: 'response' }).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      map(() => undefined),
      finalize(() => void this.router.navigateByUrl('/admin/login')),
    );
  }

  forceLocalLogout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/admin/login');
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.userSignal.set(null);
  }

  refreshAccessToken(): Observable<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<{ accessToken: string; expiresIn: number }>(
          `${this.apiUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        .pipe(
          map((r) => r.accessToken),
          tap((t) => this.accessToken.set(t)),
          finalize(() => {
            this.refreshInFlight = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshInFlight;
  }

  handleAuthError(err: unknown): Observable<never> {
    this.clearSession();
    void this.router.navigateByUrl('/admin/login');
    return throwError(() => err);
  }
}
