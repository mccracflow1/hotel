import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

describe('SettingsService', () => {
  let svc: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' },
        { provide: IdempotencyService, useValue: { nextKey: () => 'idem-settings' } },
      ],
    });
    svc = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('put envía Idempotency-Key', () => {
    svc.put({ hotel_name: 'X' }).subscribe();
    const req = http.expectOne('/api/v1/business-config');
    expect(req.request.headers.get('Idempotency-Key')).toBe('idem-settings');
    req.flush({});
  });

  afterEach(() => http.verify());
});
