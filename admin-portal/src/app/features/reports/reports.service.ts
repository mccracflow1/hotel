import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

export type ReportDateRange = { from: string; to: string };

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  occupancy(range: ReportDateRange, granularity: 'day' | 'week' | 'month' = 'day'): Observable<unknown> {
    const params = new HttpParams()
      .set('from', range.from)
      .set('to', range.to)
      .set('granularity', granularity);
    return this.http.get(`${this.apiUrl}/reports/occupancy`, { params });
  }

  revenue(range: ReportDateRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/revenue`, { params });
  }

  reservations(range: ReportDateRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/reservations`, { params });
  }

  inventory(range: ReportDateRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/inventory`, { params });
  }

  /** Agregado de planes: el backend aún no lo expone — la UI debe degradar (FR-020). */
  planPerformance(range: ReportDateRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/plans-performance`, { params });
  }
}
