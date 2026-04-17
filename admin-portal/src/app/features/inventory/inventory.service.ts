import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  listItems(includeInactive = false): Observable<unknown> {
    const params = new HttpParams().set('include_inactive', includeInactive ? 'true' : 'false');
    return this.http.get(`${this.apiUrl}/inventory/items`, { params });
  }

  createItem(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/inventory/items`, body);
  }

  updateItem(id: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/inventory/items/${id}`, body);
  }

  getMovements(
    itemId: string,
    query?: { page?: number; limit?: number; type?: string; date_from?: string; date_to?: string },
  ): Observable<unknown> {
    let hp = new HttpParams();
    if (query?.page) hp = hp.set('page', String(query.page));
    if (query?.limit) hp = hp.set('limit', String(query.limit));
    if (query?.type) hp = hp.set('type', query.type);
    if (query?.date_from) hp = hp.set('date_from', query.date_from);
    if (query?.date_to) hp = hp.set('date_to', query.date_to);
    return this.http.get(`${this.apiUrl}/inventory/items/${itemId}/movements`, { params: hp });
  }

  postMovement(body: unknown): Observable<unknown> {
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.post(`${this.apiUrl}/inventory/movements`, body, { headers });
  }

  getAlerts(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/inventory/alerts`);
  }
}
