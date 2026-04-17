import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listRooms(params: { include_deleted?: boolean; q?: string } = {}): Observable<unknown> {
    let hp = new HttpParams();
    if (params.include_deleted) hp = hp.set('include_deleted', '1');
    if (params.q) hp = hp.set('q', params.q);
    return this.http.get(`${this.apiUrl}/rooms`, { params: hp });
  }

  createRoom(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/rooms`, body);
  }

  patchRoom(id: string, body: unknown): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/rooms/${id}`, body);
  }
}
