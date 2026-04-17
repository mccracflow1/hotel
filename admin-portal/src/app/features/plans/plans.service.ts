import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listPlans(includeDeleted = false): Observable<unknown> {
    const q = includeDeleted ? '?include_deleted=1' : '';
    return this.http.get(`${this.apiUrl}/plans${q}`);
  }

  getPlan(id: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/plans/${id}`);
  }

  createPlan(body: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/plans`, body);
  }

  patchPlan(id: string, body: unknown): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/plans/${id}`, body);
  }

  postClone(id: string, name: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/plans/${id}/clone`, { name });
  }

  reorderActivities(planId: string, ordered_activity_ids: string[]): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/plans/${planId}/activities/reorder`, { ordered_activity_ids });
  }

  getDeleteImpact(planId: string, activityId: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/plans/${planId}/activities/${activityId}/delete-impact`);
  }

  deleteActivity(planId: string, activityId: string, confirmHeader?: string): Observable<unknown> {
    let headers = new HttpHeaders();
    if (confirmHeader) headers = headers.set('x-confirm-impact', confirmHeader);
    return this.http.delete(`${this.apiUrl}/plans/${planId}/activities/${activityId}`, { headers });
  }

  linkOptional(planId: string, body: { optional_activity_id: string; is_default?: boolean }): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/plans/${planId}/optional-links`, body);
  }

  removePlanOptionalLink(planId: string, optionalId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/plans/${planId}/optional-links/${optionalId}`);
  }

  linkMedia(planId: string, body: { media_id: string; is_cover?: boolean; sort_order?: number }): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/plans/${planId}/media`, body);
  }

  deleteMedia(planId: string, mediaId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/plans/${planId}/media/${mediaId}`);
  }
}
