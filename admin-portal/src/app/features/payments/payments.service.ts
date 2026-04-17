import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly idempotency = inject(IdempotencyService);

  createCheckout(reservationId: string, amount: number): Observable<unknown> {
    const headers = new HttpHeaders({ 'Idempotency-Key': this.idempotency.nextKey() });
    return this.http.post(
      `${this.apiUrl}/payments/create`,
      { reservation_id: reservationId, amount },
      { headers },
    );
  }
}
