import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

export interface SiteContentEntry {
  section?: string;
  key: string;
  value: string | null;
  type?: string;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  getPublicBundle(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/site-content/public`);
  }

  getSection(section: string): Observable<{ data: SiteContentEntry[] }> {
    return this.http.get<{ data: SiteContentEntry[] }>(`${this.apiUrl}/site-content/${section}`);
  }

  putSection(section: string, entries: SiteContentEntry[]): Observable<{ data: SiteContentEntry[] }> {
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.put<{ data: SiteContentEntry[] }>(`${this.apiUrl}/site-content/${section}`, { entries }, { headers });
  }

  listFaqsManage(): Observable<{ data: FaqRow[] }> {
    return this.http.get<{ data: FaqRow[] }>(`${this.apiUrl}/faqs/manage`);
  }

  createFaq(body: Partial<FaqRow>): Observable<{ data: FaqRow }> {
    return this.http.post<{ data: FaqRow }>(`${this.apiUrl}/faqs`, body);
  }

  patchFaq(id: string, body: Partial<FaqRow>): Observable<{ data: FaqRow }> {
    return this.http.put<{ data: FaqRow }>(`${this.apiUrl}/faqs/${id}`, body);
  }

  deleteFaq(id: string): Observable<void> {
    return this.http.delete(`${this.apiUrl}/faqs/${id}`, { observe: 'response' }).pipe(map(() => undefined));
  }

  reorderFaqs(ids: string[]): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/faqs/reorder`, { ids });
  }
}
