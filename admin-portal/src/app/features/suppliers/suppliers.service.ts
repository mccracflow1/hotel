import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/suppliers`);
  }

  create(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/suppliers`, body);
  }

  update(id: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/suppliers/${id}`, body);
  }
}
