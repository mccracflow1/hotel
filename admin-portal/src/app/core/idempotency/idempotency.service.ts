import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdempotencyService {
  /** UUID v4 para cabecera `Idempotency-Key` en mutaciones idempotentes del API. */
  nextKey(): string {
    const c = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
