import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

export interface ReservationListParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  room_id?: string;
  plan_id?: string;
  q?: string;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  listReservations(params: ReservationListParams): Observable<unknown> {
    let hp = new HttpParams()
      .set('page', String(params.page))
      .set('limit', String(params.limit));
    if (params.status) hp = hp.set('status', params.status);
    if (params.date_from) hp = hp.set('date_from', params.date_from);
    if (params.date_to) hp = hp.set('date_to', params.date_to);
    if (params.room_id) hp = hp.set('room_id', params.room_id);
    if (params.plan_id) hp = hp.set('plan_id', params.plan_id);
    if (params.q?.trim()) hp = hp.set('q', params.q.trim());
    return this.http.get(`${this.apiUrl}/reservations`, { params: hp });
  }

  getById(id: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/reservations/${id}`);
  }

  getByNumber(n: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/reservations/by-number/${encodeURIComponent(n)}`);
  }

  getPolicy(id: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/reservations/${id}/policy`);
  }

  listRoomsForFilter(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/rooms`);
  }

  listPlansForFilter(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/plans`);
  }

  private idempHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
  }

  createReservation(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reservations`, body, { headers: this.idempHeaders() });
  }

  updateReservationDates(id: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/reservations/${id}`, body, { headers: this.idempHeaders() });
  }

  cancelReservation(id: string, body: { cancellation_reason: string }): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/reservations/${id}`, {
      headers: this.idempHeaders(),
      body,
    });
  }

  patchReservationStatus(id: string, body: { status: string }): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/reservations/${id}/status`, body);
  }

  addOptionalToReservation(id: string, body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reservations/${id}/optional-activities`, body, {
      headers: this.idempHeaders(),
    });
  }
}
