import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

export interface PortalUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<{ data: PortalUserRow[] }> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  create(body: { name: string; email: string; password: string; role: string }): Observable<{ data: PortalUserRow }> {
    return this.http.post(`${this.apiUrl}/users`, body);
  }

  update(
    id: string,
    body: { name?: string; email?: string; password?: string; role?: string; is_active?: boolean },
  ): Observable<{ data: PortalUserRow }> {
    return this.http.put(`${this.apiUrl}/users/${id}`, body);
  }

  patchStatus(id: string, is_active: boolean): Observable<{ data: PortalUserRow }> {
    return this.http.patch<{ data: PortalUserRow }>(`${this.apiUrl}/users/${id}/status`, { is_active });
  }
}
