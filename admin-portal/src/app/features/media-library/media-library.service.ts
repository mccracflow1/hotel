import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

export interface MediaRow {
  id: string;
  filename: string;
  file_type: string;
  mime_type: string;
  original_url: string;
  thumbnail_url: string | null;
  size_bytes: number;
}

@Injectable({ providedIn: 'root' })
export class MediaLibraryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  list(query: { q?: string; file_type?: string; page?: number; limit?: number }): Observable<{ data: MediaRow[]; meta: { page: number; limit: number; total: number } }> {
    let p = new HttpParams();
    if (query.q) p = p.set('q', query.q);
    if (query.file_type) p = p.set('file_type', query.file_type);
    if (query.page) p = p.set('page', String(query.page));
    if (query.limit) p = p.set('limit', String(query.limit));
    return this.http.get(`${this.apiUrl}/media`, { params: p }) as Observable<{
      data: MediaRow[];
      meta: { page: number; limit: number; total: number };
    }>;
  }

  upload(file: File): Observable<{ data: MediaRow }> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.post<{ data: MediaRow }>(`${this.apiUrl}/media/upload`, fd, { headers });
  }

  uploadWithProgress(file: File): Observable<HttpEvent<unknown>> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.post(`${this.apiUrl}/media/upload`, fd, {
      headers,
      reportProgress: true,
      observe: 'events',
    });
  }

  getUsage(id: string): Observable<{ data: unknown }> {
    return this.http.get(`${this.apiUrl}/media/${id}/usage`);
  }

  patchRename(id: string, filename: string): Observable<{ data: MediaRow }> {
    return this.http.patch(`${this.apiUrl}/media/${id}`, { filename }) as Observable<{ data: MediaRow }>;
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/media/${id}`, { observe: 'response' }).pipe(map(() => undefined));
  }
}
