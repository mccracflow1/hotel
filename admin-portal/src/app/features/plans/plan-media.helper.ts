import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

/** Enlaza un `media_id` existente en biblioteca CMS al plan (POST /plans/:id/media). */
export function linkPlanMedia$(
  http: HttpClient,
  apiUrl: string,
  planId: string,
  body: { media_id: string; is_cover?: boolean; sort_order?: number },
): Observable<unknown> {
  return http.post(`${apiUrl}/plans/${planId}/media`, body);
}

/** Helper con inyección para uso desde componentes. */
export function injectPlanMediaLinker(): (planId: string, body: { media_id: string; is_cover?: boolean }) => Observable<unknown> {
  const http = inject(HttpClient);
  const apiUrl = inject(API_URL);
  return (planId, body) => linkPlanMedia$(http, apiUrl, planId, body);
}
