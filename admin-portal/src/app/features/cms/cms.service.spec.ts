import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CmsService } from './cms.service';
import { API_URL } from '../../core/tokens';
import { IdempotencyService } from '../../core/idempotency/idempotency.service';

describe('CmsService', () => {
  let svc: CmsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' },
        { provide: IdempotencyService, useValue: { nextKey: () => 'idem-cms' } },
      ],
    });
    svc = TestBed.inject(CmsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('putSection envía Idempotency-Key', () => {
    svc.putSection('hero', [{ key: 'title', value: 'Hola', type: 'text' }]).subscribe();
    const req = http.expectOne('/api/v1/site-content/hero');
    expect(req.request.headers.get('Idempotency-Key')).toBe('idem-cms');
    req.flush({ data: [] });
  });

  afterEach(() => http.verify());
});
