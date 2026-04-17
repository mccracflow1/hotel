import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

export interface ReportRange {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  fetchOccupancyReport(range: ReportRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/occupancy`, { params });
  }

  fetchRevenueReport(range: ReportRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/revenue`, { params });
  }

  fetchInventoryReport(range: ReportRange): Observable<unknown> {
    const params = new HttpParams().set('from', range.from).set('to', range.to);
    return this.http.get(`${this.apiUrl}/reports/inventory`, { params });
  }

  fetchReservationsPage(params: Record<string, string | number>): Observable<unknown> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      hp = hp.set(k, String(v));
    }
    return this.http.get(`${this.apiUrl}/reservations`, { params: hp });
  }
}
