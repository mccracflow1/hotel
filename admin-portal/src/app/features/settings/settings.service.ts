import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

export interface CancellationRule {
  hours_before: number;
  penalty_pct: number;
}

export interface BusinessConfigPayload {
  hotel_name?: string;
  nit?: string | null;
  address?: string | null;
  checkin_time?: string;
  checkout_time?: string;
  cancellation_policy?: CancellationRule[];
  logo_url?: string | null;
  primary_color?: string | null;
  mp_public_key?: string | null;
  mp_access_token?: string | null;
  mp_webhook_secret?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  get(): Observable<{ data: Record<string, unknown> | null }> {
    return this.http.get<{ data: Record<string, unknown> | null }>(`${this.apiUrl}/business-config`);
  }

  put(body: BusinessConfigPayload): Observable<unknown> {
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.put(`${this.apiUrl}/business-config`, body, { headers });
  }
}
