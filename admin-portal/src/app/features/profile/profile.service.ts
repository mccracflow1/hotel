import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  patchMe(body: {
    name?: string;
    avatar_url?: string | null;
    current_password?: string | null;
    new_password?: string | null;
  }): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/users/me`, body);
  }
}
