import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class OptionalActivitiesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/optional-activities`);
  }

  create(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/optional-activities`, body);
  }

  patch(id: string, body: unknown): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/optional-activities/${id}`, body);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/optional-activities/${id}`);
  }
}
