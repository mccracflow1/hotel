import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getCalendar(year: number, month: number): Observable<unknown> {
    const params = new HttpParams().set('year', String(year)).set('month', String(month));
    return this.http.get(`${this.apiUrl}/availability/calendar`, { params });
  }

  blockDates(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/availability/block`, body);
  }

  listSeasons(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/seasons`);
  }
}
